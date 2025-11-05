import express from "express";
import { create, list, retrieve, update, remove } from "../controllers/category.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", index);
router.get("/:id", show);
router.put("/:id", update);
router.delete("/:id", destroy);

export default router;