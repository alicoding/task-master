-- 
-- Database schema migrations for Task 17.8: Session Recovery
--

-- Add recovery-related fields to terminal_sessions table
ALTER TABLE terminal_sessions ADD COLUMN
  recovery_count INTEGER DEFAULT 0;
  
ALTER TABLE terminal_sessions ADD COLUMN
  last_recovery DATETIME;
  
ALTER TABLE terminal_sessions ADD COLUMN
  recovery_source TEXT;

-- Add a time_windows table for grouping activities in time ranges
CREATE TABLE IF NOT EXISTS time_windows (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES terminal_sessions(id),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  name TEXT,
  type TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT DEFAULT '{}'
);

-- Add a retroactive_assignments table for tracking after-the-fact assignments
CREATE TABLE IF NOT EXISTS retroactive_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES terminal_sessions(id),
  task_id TEXT NOT NULL REFERENCES tasks(id),
  assigned_at DATETIME NOT NULL,
  effective_time DATETIME NOT NULL,
  assigned_by TEXT,
  reason TEXT,
  metadata TEXT DEFAULT '{}'
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_recovery
ON terminal_sessions(recovery_count, last_recovery);

CREATE INDEX IF NOT EXISTS idx_time_windows_session
ON time_windows(session_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_retroactive_assignments_session
ON retroactive_assignments(session_id, effective_time);

CREATE INDEX IF NOT EXISTS idx_retroactive_assignments_task
ON retroactive_assignments(task_id, effective_time);