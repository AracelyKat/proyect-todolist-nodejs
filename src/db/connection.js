import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "todolist",
});
try {
  const [rows] = await db.query("SELECT 1");
  console.log("Conexion exitosa a la base de datos:", rows);
} catch (error) {
  console.error("Error al conectar con la base de datos:", error);
}
