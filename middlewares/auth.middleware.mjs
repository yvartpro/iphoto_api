import jwt from "jsonwebtoken";
import db from "../models/index.mjs";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token non fourni" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await db.Admin.findByPk(decoded.id);

    if (!admin) return res.status(401).json({ message: "Administrateur non trouvé" });

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Accès refusé" });
  }
};