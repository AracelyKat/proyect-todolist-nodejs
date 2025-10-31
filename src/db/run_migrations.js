import fs from "fs";
import path from "path";
import { db } from "./connection.js";

const migrationsPath = path.join(process.cwd(), "src/db/migrations");

const runMigrations = async () => {
  try {
    const files = fs.readdirSync(migrationsPath).filter(file => file.endsWith(".sql"));

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsPath, file), "utf8");
      await db.query(sql);
      console.log(`Migración ejecutada: ${file}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error al ejecutar migraciones:", error);
    process.exit(1);
  }
};

runMigrations();
