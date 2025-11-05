export const decorateCategory = (category) => {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
};

export const decorateCategoryList = (categories) => {
  return categories.map(decorateCategory);
};