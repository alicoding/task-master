/**
 * Enhanced relationship discovery module for TaskMaster
 * Provides more intelligent relationship discovery without requiring AI
 */
import { Task } from '../types';
import { CapabilityNode, CapabilityEdge } from './index';
/**
 * Discover relationships between capabilities
 * @param capabilities Array of capability nodes
 * @param tasks All tasks
 * @param options Discovery options
 * @returns Array of capability edges
 */
export declare function discoverEnhancedRelationships(capabilities: CapabilityNode[], tasks: Task[], options?: any): CapabilityEdge[];
