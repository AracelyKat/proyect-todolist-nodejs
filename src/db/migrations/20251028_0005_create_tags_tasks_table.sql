DROP TABLE IF EXISTS tags_tasks;
CREATE TABLE tags_tasks (
  tag_id CHAR(36) NOT NULL,
  task_id CHAR(36) NOT NULL,
  PRIMARY KEY (tag_id, task_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
