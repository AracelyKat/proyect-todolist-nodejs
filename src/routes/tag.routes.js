import express from "express";
import { create, index, show, update, destroy } from "../controllers/tag.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", index);
router.get("/:id", show);
router.put("/:id", update);
router.delete("/:id", destroy);

export default router;