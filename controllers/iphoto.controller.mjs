import db from "../models/index.mjs";
import { v4 as uuidv4 } from "uuid";

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

        // Here you would normally call VovoTapesa API to initiate payment
        // Example:
        // const response = await fetch('https://vovotapesa.vmgburundi.com/api/v1/payment/initiate', {
        //     method: 'POST',
        //     headers: { 'Authorization': `Bearer ${process.env.VOVOTAPESA_SECRET}` },
        //     body: JSON.stringify({ amount, currency: 'USDT', callback_url: process.env.WEBHOOK_URL, transaction_id: transactionId })
        // });
        // const vtData = await response.json();

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
                usdtAddress: process.env.USDT_RECIPIENT_ADDRESS || "TXYZ1234567890...", // Placeholder
                message: "Veuillez envoyer le montant en USDT (TRC20) à l'adresse indiquée."
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const handleWebhook = async (req, res) => {
    const { transaction_id, status } = req.body;

    // TODO: Verify signature from VovoTapesa

    try {
        const payment = await db.Payment.findOne({ where: { transaction_id } });

        if (!payment) {
            return res.status(404).json({ success: false, message: "Transaction non trouvée" });
        }

        if (status === "COMPLETED" && payment.status !== "COMPLETED") {
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
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubscriptionStatus = async (req, res) => {
    const { device_id } = req.params;

    try {
        const [device] = await db.Device.findOrCreate({
            where: { device_id: device_id },
            defaults: { plan: "FREE" }
        });

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
