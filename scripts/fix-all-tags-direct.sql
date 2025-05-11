-- Fix all task tags to properly formatted JSON
UPDATE tasks SET tags = '["refactoring","maintenance"]' WHERE id = '18';
UPDATE tasks SET tags = '["refactoring","ui"]' WHERE id = '18.1';
UPDATE tasks SET tags = '["refactoring","ui"]' WHERE id = '18.1.1';
UPDATE tasks SET tags = '["refactoring","ui"]' WHERE id = '18.1.2';
UPDATE tasks SET tags = '["refactoring","ui"]' WHERE id = '18.1.3';
UPDATE tasks SET tags = '["refactoring","ui"]' WHERE id = '18.1.4';
UPDATE tasks SET tags = '["refactoring","capability-map"]' WHERE id = '18.2';
UPDATE tasks SET tags = '["refactoring","triage"]' WHERE id = '18.3';
UPDATE tasks SET tags = '["refactoring","capability-map"]' WHERE id = '18.4';
UPDATE tasks SET tags = '["refactoring","capability-map"]' WHERE id = '18.5';
UPDATE tasks SET tags = '["refactoring","capability-map"]' WHERE id = '18.6';
UPDATE tasks SET tags = '["refactoring","deduplicate"]' WHERE id = '18.7';
UPDATE tasks SET tags = '["refactoring","repository"]' WHERE id = '18.8';
UPDATE tasks SET tags = '["refactoring","capability-map"]' WHERE id = '18.9';
UPDATE tasks SET tags = '["tooling","maintenance"]' WHERE id = '18.10';