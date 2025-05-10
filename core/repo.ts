/**
 * Task Repository
 * This file re-exports the TaskRepository class from the modular implementation
 */

import { TaskRepository } from './repository/index.js';

// Export the main TaskRepository class
export { TaskRepository };

// Also export the specialized repositories for advanced usage
export * from './repository/base.js';
export * from './repository/creation.js';
export * from './repository/search.js';
export * from './repository/metadata.js';
export * from './repository/hierarchy.js';