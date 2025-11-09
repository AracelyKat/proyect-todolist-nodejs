import { db } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";
import { decorateTask, decorateTaskList } from "../decorators/task.decorator.js";

export const create = async (req, res) => {
  const { title, description, status, category_id, tags, user_id } = req.body;

  if (!title || !user_id) {
    return res.status(422).json({ message: "title y user_id son obligatorios" });
  }

  try {
    const id = uuidv4();
    await db.query(
      "INSERT INTO tasks (id, title, description, status, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, description || "", status || "pendiente", category_id || null, user_id]
    );

    if (Array.isArray(tags)) {
      for (const tag_id of tags) {
        await db.query("INSERT INTO tags_tasks (tag_id, task_id) VALUES (?, ?)", [tag_id, id]);
      }
    }

    const [taskRows] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
    const [tagRows] = await db.query(
      `SELECT tags.id, tags.name FROM tags 
       INNER JOIN tags_tasks ON tags.id = tags_tasks.tag_id 
       WHERE tags_tasks.task_id = ?`,
      [id]
    );

    return res.status(201).json(decorateTask(taskRows[0], tagRows));

  } catch (error) {
    return res.status(500).json({ message: "Error creando la tarea" });
  }
};

export const index = async (req, res) => {
  const { user_id } = req.query;
  const [tasks] = await db.query("SELECT * FROM tasks WHERE user_id = ?", [user_id]);
  return res.json(decorateTaskList(tasks));
};

export const show = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  const [taskRows] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
  if (taskRows.length === 0) return res.status(404).json({ message: "No existe o no te pertenece." });

  const [tagRows] = await db.query(
    `SELECT tags.id, tags.name FROM tags 
     INNER JOIN tags_tasks ON tags.id = tags_tasks.tag_id 
     WHERE tags_tasks.task_id = ?`,
    [id]
  );

  return res.json(decorateTask(taskRows[0], tagRows));
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
    for (const tag_id of tags) {
      await db.query("INSERT INTO tags_tasks (tag_id, task_id) VALUES (?, ?)", [tag_id, id]);
    }
  }

  const [taskRows] = await db.query("SELECT * FROM tasks WHERE id=?", [id]);
  const [tagRows] = await db.query(
    `SELECT tags.id, tags.name FROM tags 
     INNER JOIN tags_tasks ON tags.id = tags_tasks.tag_id 
     WHERE tags_tasks.task_id = ?`,
    [id]
  );

  return res.json(decorateTask(taskRows[0], tagRows));
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  await db.query("DELETE FROM tasks WHERE id=? AND user_id=?", [id, user_id]);
  return res.status(204).send();
};
