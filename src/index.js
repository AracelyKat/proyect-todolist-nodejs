import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";

dotenv.config();
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.send("Servidor Express funcionando"));
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
