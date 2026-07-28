import db from "../models/index.mjs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const PLANS = {
    MONTHLY: { price: 0.1, months: 1 },
    SEMI_ANNUAL: { price: 0.4, months: 6 },
    ANNUAL: { price: 0.6, months: 12 }
};

export const createPayment = async (req, res) => {
    const { deviceId, planKey } = req.body;

    if (!PLANS[planKey]) {
        return res.status(400).json({ success: false, message: "Plan invalide" });
    }

    try {
        const amount = PLANS[planKey].price;
        const transactionId = `VT-${uuidv4().substring(0, 8).toUpperCase()}`;

        // Call VovoTapesa API to initiate payment
        const vovotapesaUrl = `${process.env.VOVOTAPESA_BASE_URL}/api/v1/payment/create`;

        const payload = {
            amount: amount,
            currency: "USDT",
            network: "TRC20",
            external_reference: transactionId,
            callback_url: process.env.WEBHOOK_URL,
            description: `Subscription ${planKey} for device ${deviceId}`
        };

        const response = await fetch(vovotapesaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.VOVOTAPESA_API_KEY,
                'secret-key': process.env.VOVOTAPESA_SECRET_KEY,
                'X-API-KEY': process.env.VOVOTAPESA_API_KEY,
                'X-SECRET-KEY': process.env.VOVOTAPESA_SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const vtData = await response.json();

        if (!response.ok) {
            throw new Error(vtData.message || "Erreur lors de l'initialisation du paiement VovoTapesa");
        }

        // Create a pending payment record
        await db.Payment.create({
            device_id: deviceId,
            transaction_id: transactionId,
            amount: amount,
            plan_key: planKey,
            status: "PENDING"
        });

        res.json({
            success: true,
            data: {
                transactionId: transactionId,
                amount: amount,
                paymentUrl: vtData.payment_url,
                usdtAddress: vtData.address || vtData.usdt_address,
                message: "Paiement initialisé avec succès"
            }
        });
    } catch (error) {
        console.error("Create Payment Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const handleWebhook = async (req, res) => {
    const signature = req.headers['x-vovo-signature'];
    const payload = JSON.stringify(req.body);

    // Verify signature if webhook secret is provided
    if (process.env.VOVOTAPESA_WEBHOOK_SECRET && signature) {
        const hmac = crypto.createHmac('sha256', process.env.VOVOTAPESA_WEBHOOK_SECRET);
        const digest = hmac.update(payload).digest('hex');

        if (signature !== digest) {
            console.error("Invalid Webhook Signature");
            return res.status(401).json({ success: false, message: "Signature invalide" });
        }
    }

    const { external_reference, status } = req.body;

    try {
        const payment = await db.Payment.findOne({ where: { transaction_id: external_reference } });

        if (!payment) {
            console.error(`Transaction not found: ${external_reference}`);
            return res.status(404).json({ success: false, message: "Transaction non trouvée" });
        }

        if ((status === "COMPLETED" || status === "SUCCESS") && payment.status !== "COMPLETED") {
            payment.status = "COMPLETED";
            await payment.save();

            // Update or create device subscription
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

            console.log(`Subscription updated for device ${payment.device_id}: ${payment.plan_key} until ${device.expires_at}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Webhook Processing Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubscriptionStatus = async (req, res) => {
    const { device_id } = req.params;

    try {
        const device = await db.Device.findOne({
            where: { device_id: device_id }
        });

        if (!device) {
            return res.json({
                success: true,
                data: {
                    plan: "FREE",
                    expiryDate: 0,
                    isActive: false
                }
            });
        }

        const now = new Date();
        const isActive = device.expires_at && new Date(device.expires_at) > now;

        res.json({
            success: true,
            data: {
                plan: isActive ? device.plan : "FREE",
                expiryDate: device.expires_at ? new Date(device.expires_at).getTime() : 0,
                isActive: isActive
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
