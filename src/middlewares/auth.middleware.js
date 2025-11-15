import jwt from "jsonwebtoken";

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
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o expirado",
            error: error.message,
        });
    }
};