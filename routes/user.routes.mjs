import express from "express";
import { login, validateLicense } from "../controllers/user.controller.mjs";
import { authMiddleware } from "../middlewares/auth.middleware.mjs";

const router = express.Router();

router.post("/login", login);
router.post("/validate-license", authMiddleware, validateLicense);

export default router;