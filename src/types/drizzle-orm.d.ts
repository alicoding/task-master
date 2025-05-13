/**
 * Type augmentation for Drizzle ORM to add missing properties
 */

// Augment the BetterSQLite3Database type to include DB operations properties
declare module 'drizzle-orm/better-sqlite3' {
  interface BetterSQLite3Database<TSchema extends Record<string, unknown>> {
    // Core DB connection properties
    connection: any;
    query: any;
    sqlite: any;

    // Database operations
    select: <T = any>(query: string, params?: any) => T[];
    insert: <T = any>(table: string, data: any, params?: any) => T;
    update: <T = any>(table: string, data: any, where?: any, params?: any) => T;
    delete: <T = any>(table: string, where?: any, params?: any) => T;
  }

  // Export the drizzle function to fix TS2305 error
  export function drizzle<TSchema extends Record<string, unknown>>(
    client: any,
    options?: { schema?: TSchema }
  ): BetterSQLite3Database<TSchema>;
}

// Add missing schema table types if needed
declare module '@/db/schema' {
  import { sqliteTable } from 'drizzle-orm/sqlite-core';

  // Export core tables referenced in the codebase
  export const tasks: any;
  export const dependencies: any;

  // Tables that may be referenced in check-schema.ts and elsewhere
  export const files: any;
  export const taskFiles: any;
  export const fileChanges: any;
}