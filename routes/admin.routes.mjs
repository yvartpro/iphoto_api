import express from "express";
import { isAdmin } from "../middlewares/role.middleware.mjs";
import { authMiddleware } from "../middlewares/auth.middleware.mjs";
import {
  createUser,
  extendLicense,
  deactivateUser,
  getAllUsers
} from "../controllers/admin.controller.mjs";

const router = express.Router();

router.use(authMiddleware);
router.use(isAdmin);

router.post("/users", createUser);
router.post("/extend", extendLicense);
router.post("/deactivate", deactivateUser);
router.get("/users", getAllUsers);

export default router;