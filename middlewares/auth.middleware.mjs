import jwt from "jsonwebtoken";
import db from "../models/index.mjs";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token non fourni" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(decoded.id);

    if (!user) return res.status(401).json({ message: "Compte non trouvé" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Accès refusé" });
  }
};