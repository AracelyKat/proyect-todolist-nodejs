import express from "express";
import { create, list, retrieve, update, remove } from "../controllers/tag.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", list);
router.get("/:id", retrieve);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;