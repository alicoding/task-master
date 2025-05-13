-- Remove file tracking tables and associated data
-- Drop tables in reverse order of dependencies

-- First drop the file change history table
DROP TABLE IF EXISTS file_changes;

-- Next drop the task-file relationship table
DROP TABLE IF EXISTS task_files;

-- Finally drop the files table
DROP TABLE IF EXISTS files;

-- Remove indexes
DROP INDEX IF EXISTS idx_files_path;
DROP INDEX IF EXISTS idx_task_files_task_id;
DROP INDEX IF EXISTS idx_task_files_file_id;
DROP INDEX IF EXISTS idx_file_changes_file_id;
DROP INDEX IF EXISTS idx_file_changes_task_id;