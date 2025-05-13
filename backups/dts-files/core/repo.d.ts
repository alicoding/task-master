/**
 * Task Repository
 * This file re-exports the TaskRepository class from the modular implementation
 */
import { TaskRepository } from './repository/index';
export { TaskRepository };
export * from './repository/base';
export * from './repository/creation';
export * from './repository/search';
export * from './repository/metadata';
export * from './repository/hierarchy';
