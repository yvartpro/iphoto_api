import express from "express";
import {
    createPayment,
    handleWebhook,
    getSubscriptionStatus
} from "../controllers/iphoto.controller.mjs";

const router = express.Router();

router.post("/payment/create", createPayment);
router.post("/webhook", handleWebhook);
router.get("/subscription/status/:device_id", getSubscriptionStatus);

export default router;