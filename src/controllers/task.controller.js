import { db } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";
import { decorateTask } from "../decorators/task.decorator.js";
import { decorateCategory } from "../decorators/category.decorator.js";
import { decorateTagList } from "../decorators/tag.decorator.js";

const populateTaskRelations = async (tasks) => {
  if (tasks.length === 0) {
    return [];
  }

  const taskIds = tasks.map(t => t.id);
  const categoryIds = [...new Set(tasks.map(t => t.category_id).filter(Boolean))];

  const [tags] = await db.query(
    `SELECT tags.id, tags.name, tags.created_at, tags.updated_at, tags_tasks.task_id 
     FROM tags 
     JOIN tags_tasks ON tags.id = tags_tasks.tag_id 
     WHERE tags_tasks.task_id IN (?)`,
    [taskIds]
  );

  let categories = [];
  if (categoryIds.length > 0) {
    const [catRows] = await db.query(
      "SELECT * FROM categories WHERE id IN (?)",
      [categoryIds]
    );
    categories = catRows;
  }

  const tagsByTaskId = new Map();
  tags.forEach(tag => {
    const list = tagsByTaskId.get(tag.task_id) || [];
    list.push(tag);
    tagsByTaskId.set(tag.task_id, list);
  });

  const categoriesById = new Map(categories.map(cat => [cat.id, cat]));

  return tasks.map(task => {
    const taskTags = tagsByTaskId.get(task.id) || [];
    const taskCategory = categoriesById.get(task.category_id) || null;
    return decorateTask(task, taskTags, taskCategory);
  });
};


export const create = async (req, res) => {
  const { title, description, status, category_id, tags, user_id } = req.body;

  if (!title || !user_id) {
    return res.status(422).json({ message: "Title and user_id are required" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const id = uuidv4();
    await connection.query(
      "INSERT INTO tasks (id, title, description, status, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, description || null, status || "pendiente", category_id || null, user_id]
    );

    if (Array.isArray(tags) && tags.length > 0) {
      const tagsValues = tags.map(tag_id => [tag_id, id]);
      await connection.query("INSERT INTO tags_tasks (tag_id, task_id) VALUES ?", [tagsValues]);
    }

    await connection.commit();

    const [taskRows] = await connection.query("SELECT * FROM tasks WHERE id = ?", [id]);
    const populatedTask = await populateTaskRelations(taskRows);

    return res.status(201).json(populatedTask[0]);

  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Error creating task" });
  } finally {
    connection.release();
  }
};

export const index = async (req, res) => {
  const { user_id } = req.query;

  try {
    const [tasks] = await db.query("SELECT * FROM tasks WHERE user_id = ?", [user_id]);
    const populatedTasks = await populateTaskRelations(tasks);
    return res.json(populatedTasks);
  } catch (error) {
    return res.status(500).json({ message: "Error listing tasks" });
  }
};

export const show = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  try {
    const [taskRows] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
    if (taskRows.length === 0) return res.status(404).json({ message: "Task not found or does not belong to user." });

    const populatedTask = await populateTaskRelations(taskRows);

    return res.json(populatedTask[0]);
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving task" });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, category_id, tags, user_id } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "UPDATE tasks SET title=?, description=?, status=?, category_id=? WHERE id=? AND user_id=?",
      [title, description, status, category_id, id, user_id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Task not found or does not belong to user." });
    }

    await connection.query("DELETE FROM tags_tasks WHERE task_id=?", [id]);

    if (Array.isArray(tags) && tags.length > 0) {
      const tagsValues = tags.map(tag_id => [tag_id, id]);
      await connection.query("INSERT INTO tags_tasks (tag_id, task_id) VALUES ?", [tagsValues]);
    }

    await connection.commit();

    const [taskRows] = await connection.query("SELECT * FROM tasks WHERE id=?", [id]);
    const populatedTask = await populateTaskRelations(taskRows);

    return res.json(populatedTask[0]);

  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Error updating task" });
  } finally {
    connection.release();
  }
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    const [taskRows] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);

    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task not found or does not belong to user." });
    }

    await db.query("DELETE FROM tasks WHERE id=? AND user_id=?", [id, user_id]);

    return res.status(204).send();

  } catch (error) {
    return res.status(500).json({ message: "Error deleting task" });
  }
};