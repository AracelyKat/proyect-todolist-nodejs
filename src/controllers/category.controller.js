import { db } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";
import { decorateCategory, decorateCategoryList } from "../decorators/category.decorator.js";

export const create = async (req, res) => {
  const { name } = req.body;
  const { id: user_id } = req.user;
  if (!name) return res.status(422).json({ message: 'Name is required' });

  try {
    const id = uuidv4();
    const [existing] = await db.query("SELECT id FROM categories WHERE name = ? AND user_id = ?", [name, user_id]);
    if (existing.length > 0) return res.status(422).json({ message: "Category name already exists for this user." });

    await db.query("INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)", [id, name, user_id]);

    const now = new Date();
    const newCategory = {
      id: id,
      name: name,
      created_at: now,
      updated_at: now
    };

    return res.status(201).json({ data: decorateCategory(newCategory) });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating category' });
  }
};

export const index = async (req, res) => {
  const { id: user_id } = req.user;

  try {
    const [rows] = await db.query("SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC", [user_id]);
    return res.status(200).json({ data: decorateCategoryList(rows) });
  } catch (error) {
    return res.status(500).json({ message: 'Error listing categories' });
  }
};

export const show = async (req, res) => {
  const { id } = req.params;
  const { id: user_id } = req.user;

  try {
    const [rows] = await db.query("SELECT * FROM categories WHERE id = ? AND user_id = ?", [id, user_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Category not found or does not belong to user.' });
    return res.status(200).json({ data: decorateCategory(rows[0]) });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving category' });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { id: user_id } = req.user;
  if (!name) return res.status(422).json({ message: 'Name is required' });

  try {
    const [existing] = await db.query(
      "SELECT id FROM categories WHERE name = ? AND user_id = ? AND id != ?",
      [name, user_id, id]
    );
    if (existing.length > 0) return res.status(422).json({ message: "Another category with that name already exists for this user." });

    const [result] = await db.query("UPDATE categories SET name = ? WHERE id = ? AND user_id = ?", [name, id, user_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found or does not belong to user.' });

    const updatedCategory = {
      id: id,
      name: name,
      updated_at: new Date(),
      created_at: null
    };

    return res.status(200).json({ data: decorateCategory(updatedCategory) });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating category' });
  }
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  const { id: user_id } = req.user;

  try {
    const [category] = await db.query('SELECT * FROM categories WHERE id = ? AND user_id = ?', [id, user_id]);
    if (category.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await db.query("DELETE FROM categories WHERE id = ? AND user_id = ?", [id, user_id]);
    const [backupCategory] = category;

    res.status(200).json({ data: decorateCategory(backupCategory) });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting category' });
  }
};