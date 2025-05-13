/**
 * Capability Map - A dynamic, self-learning system for visualizing TaskMaster capabilities
 *
 * This module provides a completely dynamic way to discover, analyze, and visualize
 * capabilities based on task data without any hardcoded categories or relationships.
 * It uses AI/NLP to organically derive feature categories, relationships, and insights
 * from task content itself, adapting as the tasks evolve.
 *
 * Modified to remove dependencies on file tracking functionality.
 */
import { TaskRepository } from '../repo';
import { AiProvider } from '../ai/types';
export interface CapabilityNode {
    id: string;
    name: string;
    type: string;
    description: string;
    confidence: number;
    tasks: string[];
    keywords: string[];
    relatedNodes: string[];
    metadata: Record<string, any>;
}
export interface CapabilityEdge {
    source: string;
    target: string;
    type: string;
    strength: number;
    description: string;
    confidence: number;
}
export interface CapabilityMap {
    id: string;
    created: Date;
    updated: Date;
    nodes: CapabilityNode[];
    edges: CapabilityEdge[];
    metadata: {
        taskCount: number;
        discoveredCapabilities: number;
        relationshipCount: number;
        confidence: number;
        lastUpdated: Date;
        generationStats: Record<string, any>;
    };
}
export interface CapabilityDiscoveryOptions {
    confidenceThreshold?: number;
    maxNodes?: number;
    maxEdges?: number;
    clusteringMethod?: 'semantic' | 'task-relationship' | 'hybrid';
    includeCompletedTasks?: boolean;
    includeMetadata?: boolean;
    visualizationFormat?: 'mermaid' | 'dot' | 'json' | 'text';
    aiModel?: string;
    enableProgressiveRefinement?: boolean;
}
/**
 * Class that dynamically discovers and visualizes capabilities from tasks
 */
export declare class CapabilityMapGenerator {
    private repository;
    private aiProvider;
    /**
     * Create a new CapabilityMapGenerator
     * @param repository Repository to get tasks from
     * @param aiProvider Optional AI provider (will create one if not provided)
     */
    constructor(repository: TaskRepository, aiProvider?: AiProvider);
    /**
     * Generate a capability map from all tasks
     * @param options Discovery options
     * @returns Generated capability map
     */
    generateCapabilityMap(options?: CapabilityDiscoveryOptions): Promise<CapabilityMap>;
    /**
     * Fetch all relevant tasks based on options
     * @param options Discovery options
     * @returns Array of tasks
     */
    private getAllRelevantTasks;
    /**
     * Discover capabilities from a set of tasks
     * @param tasks Tasks to analyze
     * @param options Discovery options
     * @returns Array of discovered capability nodes
     */
    private discoverCapabilities;
    /**
     * Fallback method for discovering capabilities if AI fails
     * @param tasks Tasks to analyze
     * @returns Array of discovered capability nodes
     */
    private fallbackCapabilityDiscovery;
    /**
     * Extract keywords from a set of tasks using basic NLP techniques
     * @param tasks Tasks to analyze
     * @returns Array of extracted keywords
     */
    private extractKeywordsFromTasks;
    /**
     * Construct the final capability map
     * @param nodes Capability nodes
     * @param edges Capability edges
     * @param stats Generation statistics
     * @param options Discovery options
     * @returns Complete capability map
     */
    private constructCapabilityMap;
}
