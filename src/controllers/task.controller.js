import { db } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";
import { decorateTask } from "../decorators/task.decorator.js";

export const create = async (req, res) => {
  const { title, description, status, category_id, tags = [], user_id } = req.body;

  if (!title || !user_id) {
    return res.status(422).json({ message: "Title and user_id are required" });
  }

  const connection = await db.getConnection();
  try {
    const [[user]] = await connection.query("SELECT id FROM users WHERE id = ?", [user_id]);
    if (!user) return res.status(404).json({ message: "User not found" });

    let categoryRow = null;
    if (category_id) {
      const [[category]] = await connection.query(
        "SELECT * FROM categories WHERE id=? AND user_id=?",
        [category_id, user_id]
      );
      if (!category) return res.status(404).json({ message: "Invalid category" });
      categoryRow = category;
    }

    const id = uuidv4();
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO tasks (id, title, description, status, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, description || null, status || "pendiente", category_id || null, user_id]
    );

    if (tags.length) {
      const placeholders = tags.map(() => "(?, ?)").join(",");
      const values = tags.flatMap(tag => [tag, id]);
      await connection.query(`INSERT INTO tags_tasks (tag_id, task_id) VALUES ${placeholders}`, values);
    }

    await connection.commit();

    const [[task]] = await connection.query("SELECT * FROM tasks WHERE id=?", [id]);
    const [tagRows] = tags.length
      ? await connection.query(
          `SELECT * FROM tags WHERE id IN (${tags.map(() => "?").join(",")}) AND user_id=?`,
          [...tags, user_id]
        )
      : [[]];

    res.status(201).json({ data: decorateTask(task, tagRows, categoryRow) });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: "Error creating task", error: err.message });
  } finally {
    connection.release();
  }
};

export const index = async (req, res) => {
  const { user_id, category_id, status, tag_id } = req.query;

  if (!user_id) return res.status(422).json({ message: "user_id is required" });

  try {
    let query = "SELECT * FROM tasks WHERE user_id=?";
    const params = [user_id];

    if (category_id) { query += " AND category_id=?"; params.push(category_id); }
    if (status) { query += " AND status=?"; params.push(status); }
    if (tag_id) {
      query += " AND id IN (SELECT task_id FROM tags_tasks WHERE tag_id=?)";
      params.push(tag_id);
    }

    query += " ORDER BY created_at DESC";
    const [tasks] = await db.query(query, params);
    if (!tasks.length) return res.json({ data: [] });

    const taskIds = tasks.map(t => t.id);
    const categoryIds = [...new Set(tasks.map(t => t.category_id).filter(Boolean))];

    const [tagRows, categoryRows] = await Promise.all([
      db.query(
        `SELECT tags.*, tags_tasks.task_id FROM tags
         JOIN tags_tasks ON tags.id=tags_tasks.tag_id
         WHERE tags_tasks.task_id IN (${taskIds.map(() => "?").join(",")})`,
        taskIds
      ),
      categoryIds.length
        ? db.query(
            `SELECT * FROM categories WHERE id IN (${categoryIds.map(() => "?").join(",")})`,
            categoryIds
          )
        : [[]],
    ]);

    const tagsByTask = {};
    tagRows[0].forEach(t => {
      (tagsByTask[t.task_id] ||= []).push(t);
    });

    const categoriesById = {};
    categoryRows[0].forEach(c => (categoriesById[c.id] = c));

    const result = tasks.map(t =>
      decorateTask(t, tagsByTask[t.id] || [], categoriesById[t.category_id] || null)
    );

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: "Error listing tasks", error: err.message });
  }
};

export const show = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (!user_id) return res.status(422).json({ message: "user_id is required" });

  try {
    const [[task]] = await db.query("SELECT * FROM tasks WHERE id=? AND user_id=?", [id, user_id]);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const [tags, categories] = await Promise.all([
      db.query(
        `SELECT tags.* FROM tags JOIN tags_tasks ON tags.id=tags_tasks.tag_id WHERE tags_tasks.task_id=?`,
        [id]
      ),
      task.category_id
        ? db.query("SELECT * FROM categories WHERE id=?", [task.category_id])
        : [[]],
    ]);

    res.json({ data: decorateTask(task, tags[0], categories[0][0] || null) });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving task", error: err.message });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, category_id, tags = [], user_id } = req.body;

  if (!user_id) return res.status(422).json({ message: "user_id is required" });

  const connection = await db.getConnection();
  try {
    const [[task]] = await connection.query("SELECT * FROM tasks WHERE id=? AND user_id=?", [id, user_id]);
    if (!task) return res.status(404).json({ message: "Task not found" });

    await connection.beginTransaction();
    await connection.query(
      "UPDATE tasks SET title=?, description=?, status=?, category_id=? WHERE id=?",
      [title, description, status, category_id, id]
    );

    await connection.query("DELETE FROM tags_tasks WHERE task_id=?", [id]);
    if (tags.length) {
      const placeholders = tags.map(() => "(?, ?)").join(",");
      const values = tags.flatMap(tag => [tag, id]);
      await connection.query(`INSERT INTO tags_tasks (tag_id, task_id) VALUES ${placeholders}`, values);
    }

    await connection.commit();

    const [[updatedTask]] = await connection.query("SELECT * FROM tasks WHERE id=?", [id]);
    const [tagRows] = tags.length
      ? await connection.query(
          `SELECT * FROM tags WHERE id IN (${tags.map(() => "?").join(",")}) AND user_id=?`,
          [...tags, user_id]
        )
      : [[]];

    let categoryRow = null;
    if (category_id) {
      const [[category]] = await connection.query("SELECT * FROM categories WHERE id=?", [category_id]);
      categoryRow = category;
    }

    res.json({ data: decorateTask(updatedTask, tagRows, categoryRow) });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: "Error updating task", error: err.message });
  } finally {
    connection.release();
  }
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) return res.status(422).json({ message: "user_id is required" });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[task]] = await connection.query("SELECT * FROM tasks WHERE id=? AND user_id=?", [id, user_id]);
    if (!task) {
      await connection.rollback();
      return res.status(404).json({ message: "Task not found or not owned by user" });
    }

    const [tags] = await connection.query(
      "SELECT tags.* FROM tags JOIN tags_tasks ON tags.id=tags_tasks.tag_id WHERE tags_tasks.task_id=?",
      [id]
    );

    await connection.query("DELETE FROM tags_tasks WHERE task_id=?", [id]);
    await connection.query("DELETE FROM tasks WHERE id=? AND user_id=?", [id, user_id]);

    await connection.commit();

    let categoryRow = null;
    if (task.category_id) {
      const [[category]] = await connection.query("SELECT * FROM categories WHERE id=?", [task.category_id]);
      categoryRow = category;
    }

    res.status(200).json({ data: decorateTask(task, tags, categoryRow) });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: "Error deleting task", error: err.message });
  } finally {
    connection.release();
  }
};
