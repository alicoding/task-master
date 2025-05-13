/**
 * Task Repository
 * This file re-exports the TaskRepository class from the modular implementation
 */

import { TaskRepository } from './repository/index';

// Export the main TaskRepository class
export { TaskRepository };

// Also export the specialized repositories for advanced usage
export * from './repository/base';
export * from './repository/creation';
export * from './repository/search';
export * from './repository/metadata';
export * from './repository/hierarchy';