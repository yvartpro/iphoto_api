import bcrypt from "bcrypt";
import db from "../models/index.mjs";

export const createUser = async (req, res) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ message: "Email ou numéro de téléphone requis" });
  }

  const userData = {
    email,
    phone,
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  if (password) {
    userData.password = await bcrypt.hash(password, 10);
  }

  const user = await db.User.create(userData);

  res.json(user);
};

export const extendLicense = async (req, res) => {
  const { userId } = req.body;

  const user = await db.User.findByPk(userId);
  if (!user) return res.status(404).json({ message: "Compte non trouvé" });

  user.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();

  res.json({ message: "Prolongé" });
};

export const deactivateUser = async (req, res) => {
  const { userId } = req.body;

  const user = await db.User.findByPk(userId);
  if (!user) return res.status(404).json({ message: "Compte non trouvé" });

  user.is_active = false;
  await user.save();

  res.json({ message: "Désactivé" });
};

export const getAllUsers = async (req, res) => {
  const users = await db.User.findAll();
  res.json(users);
};