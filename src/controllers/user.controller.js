import { db } from "../db/connection.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "El email ya está registrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const id = uuidv4();
    await db.query(
      "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
      [id, name, email, hashedPassword]
    );

    return res.status(201).json({
      message: "Usuario creado exitosamente.",
      user: { id, name, email },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ message: "Error del servidor." });
  }
};
