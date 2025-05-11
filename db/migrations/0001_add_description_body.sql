-- Migration to add description and body columns to tasks table
ALTER TABLE tasks ADD COLUMN description TEXT;
ALTER TABLE tasks ADD COLUMN body TEXT;