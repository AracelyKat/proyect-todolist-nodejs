export const decorateTask = (task, tags = []) => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    category_id: task.category_id,
    user_id: task.user_id,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    tags: tags.map(tag => ({
      id: tag.id,
      name: tag.name
    }))
  };
};

export const decorateTaskList = (taskList) => {
  return taskList.map(task => decorateTask(task));
};
