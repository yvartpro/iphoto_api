import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.mjs";

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await db.User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};

export const validateLicense = async (req, res) => {
  const user = req.user;
  const { device_id } = req.body;

  if (!user.is_active) {
    return res.json({ allowed: false, message: "Inactive" });
  }

  if (user.expires_at && new Date(user.expires_at) < new Date()) {
    return res.json({ allowed: false, message: "Expired" });
  }

  if (!user.device_id) {
    user.device_id = device_id;
    await user.save();
  } else if (user.device_id !== device_id) {
    return res.json({ allowed: false, message: "Device mismatch" });
  }

  return res.json({ allowed: true, message: "OK" });
};