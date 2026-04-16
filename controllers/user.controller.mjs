import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.mjs";

export const login = async (req, res) => {
  const { email, phone, device_id } = req.body;

  if (!email && !phone) return res.status(400).json({ message: "Email ou téléphone requis" });

  const whereClause = email ? { email } : { phone };
  const user = await db.User.findOne({ where: whereClause });

  try {
    if (!user) throw new Error("Compte non trouvé");
    if (!user.is_active) throw new Error("Compte désactivé");
    if (user.device_id !== device_id) throw new Error("Appareil non autorisé");
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    message: "Connexion réussie",
    data: {
      token: token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active
      }
    }
  });
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
