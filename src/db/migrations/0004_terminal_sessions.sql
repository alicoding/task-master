-- Terminal Sessions Migration
-- Implements task 17.7: Terminal Integration

-- Terminal Sessions Table
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id TEXT PRIMARY KEY,
  tty TEXT,
  pid INTEGER,
  ppid INTEGER,
  window_columns INTEGER,
  window_rows INTEGER,
  user TEXT,
  shell TEXT,
  start_time DATETIME,
  last_active DATETIME,
  status TEXT,
  current_task_id TEXT,
  connection_count INTEGER,
  last_disconnect DATETIME,
  metadata TEXT
);

-- Session Tasks Table
CREATE TABLE IF NOT EXISTS session_tasks (
  session_id TEXT,
  task_id TEXT,
  access_time DATETIME,
  PRIMARY KEY (session_id, task_id),
  FOREIGN KEY (session_id) REFERENCES terminal_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- File Session Mapping Table
CREATE TABLE IF NOT EXISTS file_session_mapping (
  file_id INTEGER,
  session_id TEXT,
  first_seen DATETIME,
  last_modified DATETIME,
  PRIMARY KEY (file_id, session_id),
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES terminal_sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_status ON terminal_sessions(status);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_tty ON terminal_sessions(tty);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_pid ON terminal_sessions(pid);
CREATE INDEX IF NOT EXISTS idx_session_tasks_task_id ON session_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_file_session_mapping_session_id ON file_session_mapping(session_id);
CREATE INDEX IF NOT EXISTS idx_file_session_mapping_file_id ON file_session_mapping(file_id);