import jwt from "jsonwebtoken";
import { db } from "../db/connection.js";

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({
            message: "No se proporcionó el token de autenticación.",
        });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Formato de token inválido.",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [userRows] = await db.query(
            "SELECT id, name, email FROM users WHERE id = ?",
            [decoded.id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        req.user = userRows[0];
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o expirado",
            error: error.message,
        });
    }
};