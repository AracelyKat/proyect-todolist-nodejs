import { db } from "../db/connection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export const register = async (req, res) => {
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

    const token = jwt.sign(
      { id, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || 86400 }
    );

    return res.status(201).json({
      message: "Usuario creado exitosamente.",
      user: { id, name, email },
      token
    });

  } catch (error) {
    return res.status(500).json({ message: "Error del servidor." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || 86400 }
    );

    return res.status(200).json({
      message: "Login exitoso.",
      user: { id: user.id, name: user.name, email: user.email },
      token
    });

  } catch (error) {
    return res.status(500).json({ message: "Error del servidor." });
  }
};