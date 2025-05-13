/**
 * Enhanced capability discovery module for TaskMaster
 * Provides more sophisticated capability discovery without requiring AI
 */
import { Task } from '../types';
import { CapabilityNode } from './index';
/**
 * Enhanced task interface with additional data for analysis
 */
export interface EnrichedTask extends Task {
    allText: string;
    normalizedTitle: string;
    keywords: string[];
    domains: string[];
    concepts: string[];
}
/**
 * Advanced capability discovery without requiring AI
 * @param tasks Tasks to analyze
 * @returns Array of capability nodes
 */
export declare function discoverCapabilitiesEnhanced(tasks: Task[]): Promise<CapabilityNode[]>;
