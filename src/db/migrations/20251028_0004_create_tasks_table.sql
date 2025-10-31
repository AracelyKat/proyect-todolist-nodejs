CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  status VARCHAR(50)
);
