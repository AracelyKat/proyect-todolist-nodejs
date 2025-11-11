import { db } from "../db/connection.js";
import { v4 as uuidv4 } from "uuid";
import { decorateTag, decorateTagList } from "../decorators/tag.decorator.js";

export const create = async (req, res) => {
  const { name, user_id } = req.body;
  if (!name || !user_id) return res.status(422).json({ message: 'Name and user_id are required' });

  try {
    const id = uuidv4();
    const [existing] = await db.query("SELECT id FROM tags WHERE name = ? AND user_id = ?", [name, user_id]);
    if (existing.length > 0) return res.status(422).json({ message: "Tag name already exists for this user." });

    await db.query("INSERT INTO tags (id, name, user_id) VALUES (?, ?, ?)", [id, name, user_id]);

    const now = new Date();
    const newTag = {
      id: id,
      name: name,
      created_at: now,
      updated_at: now
    };

    return res.status(201).json(decorateTag(newTag));
  } catch (error) {
    return res.status(500).json({ message: 'Error creating tag' });
  }
};

export const index = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(422).json({ message: 'user_id is required as query parameter' });

  try {
    const [rows] = await db.query("SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC", [user_id]);
    return res.status(200).json(decorateTagList(rows));
  } catch (error) {
    return res.status(500).json({ message: 'Error listing tags' });
  }
};

export const show = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;
  if (!user_id) return res.status(422).json({ message: 'user_id is required as query parameter' });

  try {
    const [rows] = await db.query("SELECT * FROM tags WHERE id = ? AND user_id = ?", [id, user_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Tag not found or does not belong to user.' });
    return res.status(200).json(decorateTag(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving tag' });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { name, user_id } = req.body;
  if (!name || !user_id) return res.status(422).json({ message: 'Name and user_id are required' });

  try {
    const [existing] = await db.query(
      "SELECT id FROM tags WHERE name = ? AND user_id = ? AND id != ?",
      [name, user_id, id]
    );
    if (existing.length > 0) return res.status(422).json({ message: "Another tag with that name already exists for this user." });

    const [result] = await db.query("UPDATE tags SET name = ? WHERE id = ? AND user_id = ?", [name, id, user_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Tag not found or does not belong to user.' });

    const updatedTag = {
      id: id,
      name: name,
      updated_at: new Date(),
      created_at: null
    };

    return res.status(200).json(decorateTag(updatedTag));
  } catch (error) {
    return res.status(500).json({ message: 'Error updating tag' });
  }
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(422).json({ message: 'user_id is required in body' });

  try {
    const [result] = await db.query("DELETE FROM tags WHERE id = ? AND user_id = ?", [id, user_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Tag not found or does not belong to user.' });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting tag' });
  }
};