import db from "../models/index.mjs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const PLANS = {
    MONTHLY: { price: 0.1, months: 1 },
    SEMI_ANNUAL: { price: 0.4, months: 6 },
    ANNUAL: { price: 0.6, months: 12 }
};

export const createPayment = async (req, res) => {
    const { deviceId, planKey, cardNumber } = req.body;
    console.log("Create Payment Request:", { deviceId, planKey, cardNumber: "****" });

    if (!PLANS[planKey]) {
        return res.status(400).json({ success: false, message: "Plan invalide" });
    }

    if (!cardNumber || cardNumber.length !== 15) {
        return res.status(400).json({ success: false, message: "Numéro de carte VovoTapesa invalide (15 chiffres requis)" });
    }

    try {
        const amount = PLANS[planKey].price;
        const reference = `IPH-${uuidv4().substring(0, 8).toUpperCase()}`;

        // Call VovoTapesa API to initiate Card Payment
        const vovotapesaUrl = `${process.env.VOVOTAPESA_BASE_URL}/merchant/api/pay`;

        const payload = {
            card_number: cardNumber,
            amount: amount.toString(),
            currency: "USDT",
            reference: reference,
            description: `Subscription ${planKey} iPhoto`
        };

        console.log("Calling VovoTapesa API...");
        const response = await fetch(vovotapesaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': process.env.VOVOTAPESA_API_KEY,
                'X-Secret-Key': process.env.VOVOTAPESA_SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("VovoTapesa Raw Response:", text);
console.log(JSON.parse(text))
        let vtData;
        try {
            vtData = JSON.parse(text);
        } catch (e) {
            throw new Error(`VovoTapesa returned non-JSON response: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: JSON.stringify(vtData),
                error: vtData
            });
        }

        if (!vtData.payment_id) {
            console.error("VovoTapesa response missing payment_id:", vtData);
            throw new Error(`VovoTapesa API Error: Missing payment_id in response. Raw: ${JSON.stringify(vtData)}`);
        }

        if (!deviceId) {
            console.warn("Device ID missing in request, using 'unknown'");
        }

        // Create a pending payment record using VovoTapesa's payment_id
        console.log("Saving payment to database...");
        try {
            await db.Payment.create({
                device_id: deviceId || "unknown",
                transaction_id: vtData.payment_id,
                amount: amount,
                plan_key: planKey,
                status: "PENDING"
            });
        } catch (dbError) {
            console.error("Database Error saving payment:", dbError);
            throw new Error(`Database Error: ${dbError.message}`);
        }

        console.log("Payment initiated successfully:", vtData.payment_id);
        res.json({
            success: true,
            data: {
                paymentId: vtData.payment_id,
                status: "PENDING",
                message: "Veuillez approuver le paiement dans votre application VovoTapesa."
            }
        });
    } catch (error) {
        console.error("Create Payment Error:", error);
        res.status(500).json({
            success: false,
            message: `Erreur serveur: ${error.message}`,
            details: error.toString()
        });
    }
};

export const handleWebhook = async (req, res) => {
    const signature = req.headers['x-vovotapesa-signature'];
    const payload = JSON.stringify(req.body);

    if (process.env.VOVOTAPESA_WEBHOOK_SECRET && signature) {
        // VovoTapesa signature format is sha256=<hmac_hex>
        const expectedSignature = `sha256=${crypto
            .createHmac('sha256', process.env.VOVOTAPESA_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex')}`;

        if (signature !== expectedSignature) {
            return res.status(401).json({ success: false, message: "Signature invalide" });
        }
    }

    const { payment_id, status } = req.body;

    try {
        const payment = await db.Payment.findOne({ where: { transaction_id: payment_id } });

        if (!payment) return res.status(404).json({ success: false });

        if (status === "APPROVED" && payment.status !== "COMPLETED") {
            payment.status = "COMPLETED";
            await payment.save();

            const [device] = await db.Device.findOrCreate({
                where: { device_id: payment.device_id }
            });

            const monthsToAdd = PLANS[payment.plan_key].months;
            let currentExpiry = device.expires_at ? new Date(device.expires_at) : new Date();
            if (currentExpiry < new Date()) currentExpiry = new Date();

            currentExpiry.setMonth(currentExpiry.getMonth() + monthsToAdd);

            device.plan = payment.plan_key;
            device.expires_at = currentExpiry;
            await device.save();
        } else if (["CANCELLED", "EXPIRED", "FAILED"].includes(status)) {
            payment.status = "FAILED";
            await payment.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

export const getSubscriptionStatus = async (req, res) => {
    const { device_id } = req.params;
    console.log("Checking subscription status for device:", device_id);
    try {
        const device = await db.Device.findOne({ where: { device_id } });
        if (!device) {
            console.log("Device not found in DB, returning FREE status");
            return res.json({ success: true, data: { plan: "FREE", isActive: false, expiryDate: 0 } });
        }

        const now = new Date();
        const isActive = device.expires_at && new Date(device.expires_at) > now;

        console.log(`Device status: ${device.plan}, Active: ${isActive}, Expiry: ${device.expires_at}`);
        res.json({
            success: true,
            data: {
                plan: isActive ? device.plan : "FREE",
                expiryDate: device.expires_at ? new Date(device.expires_at).getTime() : 0,
                isActive: isActive
            }
        });
    } catch (error) {
        console.error("Get Status Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
