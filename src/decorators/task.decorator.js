import { decorateTagList } from "./tag.decorator.js";
import { decorateCategory } from "./category.decorator.js";

export const decorateTask = (task, tags = [], category = null) => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    user_id: task.user_id,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    tags: decorateTagList(tags),
    category: category ? decorateCategory(category) : null,
  };
};