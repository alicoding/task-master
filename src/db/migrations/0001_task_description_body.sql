-- Create a new migration for adding description and body fields
-- This assumes that the description and body fields already exist in schema.ts

-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN with constraints like NOT NULL
-- Without a default value. Since our fields are optional, we don't need to worry about this.

-- Add description column if it doesn't exist
ALTER TABLE tasks ADD COLUMN description TEXT;

-- Add body column if it doesn't exist
ALTER TABLE tasks ADD COLUMN body TEXT;