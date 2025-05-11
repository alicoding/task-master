/**
 * Setup Test Database
 * 
 * This file provides utilities for test database setup and migration to ensure
 * all tests run with the current database schema.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { createDb } from '../db/init.ts';

/**
 * Create and initialize a test database with the current schema
 * 
 * @param inMemory Whether to create an in-memory database (default true)
 * @param dbPath Path to the database file if not in-memory
 * @returns The database connection
 */
export function setupTestDatabase(inMemory: boolean = true, dbPath: string = './test.db') {
  // Create the database with the current schema
  const { db, sqlite } = createDb(dbPath, inMemory);
  
  // Return the connection
  return { db, sqlite };
}

/**
 * Close and cleanup a test database
 * 
 * @param sqlite The SQLite database connection to close
 */
export function cleanupTestDatabase(sqlite: Database.Database) {
  // Close the connection
  if (sqlite) {
    sqlite.close();
  }
}