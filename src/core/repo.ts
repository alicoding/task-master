/**
 * Task Repository
 * This file re-exports the TaskRepository class from the modular implementation
 */

import { TaskRepository } from '@/core/repository/index';

// Export the main TaskRepository class
export { TaskRepository };

// Also export the specialized repositories for advanced usage
export * from '@/core/repository/base';
export * from '@/core/repository/creation';
export * from '@/core/repository/search';
export * from '@/core/repository/metadata';
export * from '@/core/repository/hierarchy';