/**
 * Task Repository
 * This file re-exports the TaskRepository class from the modular implementation
 */

import { TaskRepository } from './repository/index.ts';

// Export the main TaskRepository class
export { TaskRepository };

// Also export the specialized repositories for advanced usage
export * from './repository/base.ts';
export * from './repository/creation.ts';
export * from './repository/search.ts';
export * from './repository/metadata.ts';
export * from './repository/hierarchy.ts';