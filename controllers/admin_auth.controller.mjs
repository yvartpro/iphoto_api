import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.mjs";

export const adminLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await db.Admin.findOne({ where: { username } });
        if (!admin) return res.status(401).json({ message: "Identifiants invalides" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Identifiants invalides" });

        const token = jwt.sign(
            { id: admin.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
