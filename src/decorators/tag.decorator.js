export const decorateTag = (row) => {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const decorateTagList = (rows) => {
  return rows.map(decorateTag);
};