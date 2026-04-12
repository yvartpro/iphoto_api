import bcrypt from "bcrypt";
import db from "../models/index.mjs";

export const createUser = async (req, res) => {
  const { email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await db.User.create({
    email,
    password: hash,
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

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