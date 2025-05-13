-- Remove Terminal Sessions Migration
-- Drop terminal session related tables in reverse order of dependencies

-- First, drop tables with foreign key references to terminal_sessions
DROP TABLE IF EXISTS retroactive_assignments;
DROP TABLE IF EXISTS time_windows;
DROP TABLE IF EXISTS file_session_mapping;
DROP TABLE IF EXISTS session_tasks;

-- Finally, drop the terminal_sessions table itself
DROP TABLE IF EXISTS terminal_sessions;

-- Remove indexes if they still exist
DROP INDEX IF EXISTS idx_terminal_sessions_status;
DROP INDEX IF EXISTS idx_terminal_sessions_tty;
DROP INDEX IF EXISTS idx_terminal_sessions_pid;
DROP INDEX IF EXISTS idx_session_tasks_task_id;
DROP INDEX IF EXISTS idx_file_session_mapping_session_id;
DROP INDEX IF EXISTS idx_file_session_mapping_file_id;
DROP INDEX IF EXISTS idx_terminal_sessions_recovery;
DROP INDEX IF EXISTS idx_time_windows_session;
DROP INDEX IF EXISTS idx_retroactive_assignments_session;
DROP INDEX IF EXISTS idx_retroactive_assignments_task;