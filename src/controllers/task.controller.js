import { db } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";

export const create = async (req, res) => {
  try {
    const { title, description, status, category_id, tags, user_id } = req.body;
    
    if (!title || !user_id) {
      return res.status(422).json({ message: "title y user_id son obligatorios" });
    }

    const id = uuidv4();

    await db.query(
      "INSERT INTO tasks (id, title, description, status, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, description || "", status || "pendiente", category_id || null, user_id]
    );

    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        await db.query("INSERT INTO tags_tasks (tag_id, task_id) VALUES (?, ?)", [tagId, id]);
      }
    }

    const [task] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
    res.status(201).json(task[0]);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error creando la tarea" });
  }
};

export const index = async (req, res) => {
  const { user_id } = req.query;
  const [rows] = await db.query("SELECT * FROM tasks WHERE user_id = ?", [user_id]);
  res.json(rows);
};

export const show = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  const [rows] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
  if (rows.length === 0) return res.status(404).json({ message: "No existe o no pertenece al usuario." });
  res.json(rows[0]);
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, category_id, tags, user_id } = req.body;

  await db.query(
    "UPDATE tasks SET title=?, description=?, status=?, category_id=? WHERE id=? AND user_id=?",
    [title, description, status, category_id, id, user_id]
  );

  await db.query("DELETE FROM tags_tasks WHERE task_id=?", [id]);

  if (Array.isArray(tags)) {
    for (const tagId of tags) {
      await db.query("INSERT INTO tags_tasks (tag_id, task_id) VALUES (?, ?)", [tagId, id]);
    }
  }

  const [rows] = await db.query("SELECT * FROM tasks WHERE id=?", [id]);
  res.json(rows[0]);
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  await db.query("DELETE FROM tasks WHERE id=? AND user_id=?", [id, user_id]);
  res.status(204).send();
};
