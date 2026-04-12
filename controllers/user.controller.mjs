import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.mjs";

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await db.User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "Compte non trouvé" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

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
    return res.json({ allowed: false, message: "Expiré" });
  }

  if (!user.device_id) {
    user.device_id = device_id;
    await user.save();
  } else if (user.device_id !== device_id) {
    return res.json({ allowed: false, message: "Appareil non autorisé" });
  }

  return res.json({ allowed: true, message: "Autorisé" });
};