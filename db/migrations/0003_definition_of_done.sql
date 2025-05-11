-- Migration to add Definition of Done (DoD) support
-- This extends the task metadata functionality with specific DoD features

-- Since we're using the existing metadata field (JSON) to store DoD information,
-- we don't need to alter the schema, but we'll update the metadata in existing tasks
-- to include a dod field with the structure:
-- {
--   "dod": {
--     "enabled": boolean,
--     "items": [
--       { "id": string, "description": string, "completed": boolean }
--     ]
--   }
-- }

-- Create a migration marker to track that this has been applied
CREATE TABLE IF NOT EXISTS migration_dod_support (
  id INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

INSERT INTO migration_dod_support (id) VALUES (1);