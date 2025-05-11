/**
 * Capability Map - A dynamic, self-learning system for visualizing TaskMaster capabilities
 * 
 * This module provides a completely dynamic way to discover, analyze, and visualize
 * capabilities based on task data without any hardcoded categories or relationships.
 * It uses AI/NLP to organically derive feature categories, relationships, and insights
 * from task content itself, adapting as the tasks evolve.
 */

import { Task } from '../../db/schema.ts';
import { TaskRepository } from '../repo.ts';
import { AiProvider } from '../ai/types.ts';
import { AiProviderFactory } from '../ai/factory.ts';
import { calculateSimilarity } from '../nlp/processor.ts';
import { v4 as uuidv4 } from 'uuid';
import { discoverCapabilitiesEnhanced } from './enhanced-discovery.ts';
import { discoverEnhancedRelationships } from './enhanced-relationships.ts';

// Dynamic capability node discovered from task content
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

// Edge between capability nodes
export interface CapabilityEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
  description: string;
  confidence: number;
}

// Complete capability map
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

// Capability discovery options
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
export class CapabilityMapGenerator {
  private repository: TaskRepository;
  private aiProvider: AiProvider;

  /**
   * Create a new CapabilityMapGenerator
   * @param repository Repository to get tasks from
   * @param aiProvider Optional AI provider (will create one if not provided)
   */
  constructor(repository: TaskRepository, aiProvider?: AiProvider) {
    this.repository = repository;
    
    if (aiProvider) {
      this.aiProvider = aiProvider;
    } else {
      // Create a suitable AI provider
      try {
        this.aiProvider = AiProviderFactory.createProvider({
          type: 'openai',
          model: 'gpt-4', // Use most capable model for knowledge extraction
        });
      } catch (error) {
        console.warn('Failed to create AI provider for capability map:', error);
        // Fall back to mock provider
        this.aiProvider = AiProviderFactory.createProvider({
          type: 'mock'
        });
      }
    }
  }

  /**
   * Generate a capability map from all tasks
   * @param options Discovery options
   * @returns Generated capability map
   */
  public async generateCapabilityMap(
    options: CapabilityDiscoveryOptions = {}
  ): Promise<CapabilityMap> {
    // Start tracking generation time and stats
    const startTime = Date.now();
    const stats: Record<string, any> = {
      startTime,
      processingTimeMs: 0,
      tasksFetched: 0,
      tasksAnalyzed: 0,
      capabilitiesDiscovered: 0,
      relationshipsDiscovered: 0,
    };

    try {
      // 1. Fetch all tasks
      const tasks = await this.getAllRelevantTasks(options);
      stats.tasksFetched = tasks.length;

      // Guard against having no tasks
      if (tasks.length === 0) {
        console.warn('No tasks available for capability mapping. Create some tasks first with: tm add');
        return {
          id: uuidv4(),
          created: new Date(),
          updated: new Date(),
          nodes: [],
          edges: [],
          metadata: {
            taskCount: 0,
            discoveredCapabilities: 0,
            relationshipCount: 0,
            confidence: 0,
            lastUpdated: new Date(),
            generationStats: { error: 'No tasks available for analysis' },
          }
        };
      }

      // 2. Try to generate the capability map with AI
      try {
        // Initialize the AI provider
        await this.aiProvider.initialize();

        // Only proceed with AI-based discovery if the provider is properly initialized
        // and is not a mock provider
        if (!this.aiProvider.getName().toLowerCase().includes('mock')) {
          console.log('Using AI-based capability discovery...');

          // 2a. Extract embedded capabilities from tasks using AI
          const capabilities = await this.discoverCapabilities(tasks, options);
          stats.capabilitiesDiscovered = capabilities.length;

          if (capabilities.length === 0) {
            throw new Error('AI discovery found no capabilities, falling back to heuristic methods');
          }

          // 3a. Discover relationships between capabilities using AI
          // Fall back to enhanced discovery even for AI path to ensure consistent quality
          const relationships = discoverEnhancedRelationships(capabilities, tasks, options);
          stats.relationshipsDiscovered = relationships.length;

          // 4a. Organize into a coherent map
          const map = this.constructCapabilityMap(capabilities, relationships, stats, options);

          // Calculate total processing time
          stats.processingTimeMs = Date.now() - startTime;
          map.metadata.generationStats = stats;

          return map;
        } else {
          // Use fallback for mock provider
          throw new Error('Using fallback methods for mock provider');
        }
      } catch (error) {
        // If AI-based discovery fails, fall back to traditional methods
        console.log('Using fallback capability generation (non-AI based)...');
        if (error instanceof Error) {
          console.log(`Reason: ${error.message}`);
        }

        // 2b. Use enhanced capability discovery (non-AI based)
        const capabilities = await discoverCapabilitiesEnhanced(tasks);
        stats.capabilitiesDiscovered = capabilities.length;

        if (capabilities.length === 0) {
          console.warn('No capabilities could be discovered from the available tasks');
          // Return an empty map rather than throwing an error
          return {
            id: uuidv4(),
            created: new Date(),
            updated: new Date(),
            nodes: [],
            edges: [],
            metadata: {
              taskCount: tasks.length,
              discoveredCapabilities: 0,
              relationshipCount: 0,
              confidence: 0,
              lastUpdated: new Date(),
              generationStats: {
                ...stats,
                error: 'No capabilities could be discovered'
              },
            }
          };
        }

        // 3b. Discover relationships with enhanced methods
        const relationships = discoverEnhancedRelationships(capabilities, tasks, options);
        stats.relationshipsDiscovered = relationships.length;

        // 4b. Organize into a coherent map
        const map = this.constructCapabilityMap(capabilities, relationships, stats, options);

        // Calculate total processing time
        stats.processingTimeMs = Date.now() - startTime;
        map.metadata.generationStats = stats;

        return map;
      }
    } catch (error) {
      console.error('Error generating capability map:', error);

      // Provide detailed error information
      if (error instanceof Error) {
        if (error.message.includes('parameter values')) {
          console.error('Database error: Too many parameter values provided to a query.');
          console.error('This may be due to an issue with the search filters. Try using --ai-model mock.');
        } else if (error.message.includes('API key')) {
          console.error('AI provider error: Missing API key.');
          console.error('Try using --ai-model mock to use capability mapping without an API key.');
        }
      }

      // Return an empty map in case of error instead of throwing
      return {
        id: uuidv4(),
        created: new Date(),
        updated: new Date(),
        nodes: [],
        edges: [],
        metadata: {
          taskCount: 0,
          discoveredCapabilities: 0,
          relationshipCount: 0,
          confidence: 0,
          lastUpdated: new Date(),
          generationStats: {
            startTime,
            processingTimeMs: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
        }
      };
    }
  }

  /**
   * Fetch all relevant tasks based on options
   * @param options Discovery options
   * @returns Array of tasks
   */
  private async getAllRelevantTasks(
    options: CapabilityDiscoveryOptions
  ): Promise<Task[]> {
    try {
      let tasks: Task[];

      // Get all tasks or filter by completion status
      if (options.includeCompletedTasks === false) {
        console.log('Fetching in-progress and todo tasks...');

        try {
          // First try with the array syntax
          tasks = await this.repository.searchTasks({
            status: ['todo', 'in-progress']
          });
        } catch (error) {
          console.warn('Error using array syntax for status filter, trying alternative approach:', error);

          // Fall back to getting all tasks and filtering manually
          const allTasks = await this.repository.getAllTasks();
          tasks = allTasks.filter(task =>
            task.status === 'todo' || task.status === 'in-progress'
          );

          console.log(`Filtered ${tasks.length} active tasks from ${allTasks.length} total tasks`);
        }
      } else {
        console.log('Fetching all tasks...');
        tasks = await this.repository.getAllTasks();
      }

      console.log(`Retrieved ${tasks.length} tasks for capability analysis`);
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks for capability map:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Discover capabilities from a set of tasks
   * @param tasks Tasks to analyze
   * @param options Discovery options
   * @returns Array of discovered capability nodes
   */
  private async discoverCapabilities(
    tasks: Task[],
    options: CapabilityDiscoveryOptions
  ): Promise<CapabilityNode[]> {
    // Set up the confidence threshold
    const confidenceThreshold = options.confidenceThreshold || 0.7;
    
    // Build task corpus for analysis
    const taskCorpus = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      body: task.body || '',
      tags: task.tags || [],
      status: task.status,
      readiness: task.readiness,
    }));

    // Create the system prompt for capability discovery
    const systemPrompt = `You are an expert system architect that can identify capabilities, features, and technical domains from task descriptions. 
    
Your job is to discover inherent capabilities from the provided task data without using any predefined categories or taxonomies. 
    
Analyze the tasks holistically and extract:
1. Core capabilities - major functional areas or features
2. Technical domains - technology areas or specialties
3. Cross-cutting concerns - aspects that span multiple areas

For each capability you identify:
- Provide a clear name (2-4 words)
- Categorize its type (e.g., 'core-feature', 'technical-domain', 'cross-cutting-concern')
- Write a brief description
- List related keywords found in the tasks
- Provide a confidence score between 0 and 1
- List the IDs of tasks that relate to this capability

Avoid using generic categories like "task management" or "user interface" unless specifically evidenced in the tasks. Each capability should emerge organically from the task data.

Return your analysis as a valid JSON array of capability objects with these fields:
- name: string (the capability name)
- type: string (the capability type)
- description: string (brief description) 
- confidence: number (between 0 and 1)
- tasks: string[] (array of task IDs that relate to this capability)
- keywords: string[] (array of related keywords found in the tasks)`;

    // Create the user prompt with task data
    const userPrompt = `Please analyze these ${taskCorpus.length} tasks and dynamically discover the inherent capabilities present in them without using predefined categories:

${JSON.stringify(taskCorpus, null, 2)}

Remember, I need you to discover capabilities directly from this data without relying on predefined categories or taxonomies.`;

    try {
      // Get completion from AI
      const completion = await this.aiProvider.createCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 4000,
      });

      // Extract JSON from response
      const jsonMatch = completion.text.match(/\[\s*{[\s\S]*}\s*\]/);
      if (!jsonMatch) {
        // If no JSON is found, use a fallback approach
        return this.fallbackCapabilityDiscovery(tasks);
      }

      // Parse the capabilities
      const extractedCapabilities = JSON.parse(jsonMatch[0]) as Array<{
        name: string;
        type: string;
        description: string;
        confidence: number;
        tasks: string[];
        keywords: string[];
      }>;

      // Filter by confidence threshold and convert to internal format
      return extractedCapabilities
        .filter(cap => cap.confidence >= confidenceThreshold)
        .map(cap => ({
          id: uuidv4(),
          name: cap.name,
          type: cap.type,
          description: cap.description,
          confidence: cap.confidence,
          tasks: cap.tasks,
          keywords: cap.keywords,
          relatedNodes: [],
          metadata: {},
        }));
    } catch (error) {
      console.error('Error discovering capabilities:', error);
      return this.fallbackCapabilityDiscovery(tasks);
    }
  }

  /**
   * Fallback method for discovering capabilities if AI fails
   * @param tasks Tasks to analyze
   * @returns Array of discovered capability nodes
   */
  private async fallbackCapabilityDiscovery(tasks: Task[]): Promise<CapabilityNode[]> {
    console.log('Using fallback capability discovery (non-AI based)...');
    const capabilities: CapabilityNode[] = [];

    // Method 1: Perform basic clustering by tags
    const tagClusters = new Map<string, Task[]>();

    // Group tasks by tags
    for (const task of tasks) {
      if (task.tags && task.tags.length > 0) {
        for (const tag of task.tags) {
          if (!tagClusters.has(tag)) {
            tagClusters.set(tag, []);
          }
          tagClusters.get(tag)!.push(task);
        }
      }
    }

    // Create capabilities from tag clusters
    for (const [tag, clusterTasks] of tagClusters.entries()) {
      if (clusterTasks.length > 0) {
        capabilities.push({
          id: uuidv4(),
          name: `${tag} management`,
          type: 'tag-based-capability',
          description: `Tasks related to ${tag}`,
          confidence: 0.7,
          tasks: clusterTasks.map(t => t.id),
          keywords: [tag, ...this.extractKeywordsFromTasks(clusterTasks)],
          relatedNodes: [],
          metadata: {},
        });
      }
    }

    // Method 2: Group by status
    const statusGroups = new Map<string, Task[]>();

    // Group tasks by status
    for (const task of tasks) {
      if (!statusGroups.has(task.status)) {
        statusGroups.set(task.status, []);
      }
      statusGroups.get(task.status)!.push(task);
    }

    // Create capabilities from status groups
    for (const [status, statusTasks] of statusGroups.entries()) {
      if (statusTasks.length > 0) {
        let statusName: string;
        let statusDescription: string;

        switch (status) {
          case 'todo':
            statusName = 'Planned work';
            statusDescription = 'Tasks that are planned but not yet started';
            break;
          case 'in-progress':
            statusName = 'Active development';
            statusDescription = 'Tasks currently being worked on';
            break;
          case 'done':
            statusName = 'Completed features';
            statusDescription = 'Tasks that have been completed';
            break;
          default:
            statusName = `${status} tasks`;
            statusDescription = `Tasks with ${status} status`;
        }

        capabilities.push({
          id: uuidv4(),
          name: statusName,
          type: 'status-based-capability',
          description: statusDescription,
          confidence: 0.6,
          tasks: statusTasks.map(t => t.id),
          keywords: this.extractKeywordsFromTasks(statusTasks),
          relatedNodes: [],
          metadata: {},
        });
      }
    }

    // Method 3: Group by parent-child relationships
    const parentChildMap = new Map<string, Task[]>();

    // Group tasks by parent
    for (const task of tasks) {
      if (task.parentId) {
        if (!parentChildMap.has(task.parentId)) {
          parentChildMap.set(task.parentId, []);
        }
        parentChildMap.get(task.parentId)!.push(task);
      }
    }

    // Create capabilities from parent-child groups
    for (const [parentId, childTasks] of parentChildMap.entries()) {
      if (childTasks.length > 0) {
        // Try to find the parent task
        const parentTask = tasks.find(t => t.id === parentId);

        if (parentTask) {
          capabilities.push({
            id: uuidv4(),
            name: `${parentTask.title} area`,
            type: 'hierarchical-capability',
            description: `Tasks related to ${parentTask.title}`,
            confidence: 0.65,
            tasks: [parentId, ...childTasks.map(t => t.id)],
            keywords: this.extractKeywordsFromTasks([parentTask, ...childTasks]),
            relatedNodes: [],
            metadata: {},
          });
        }
      }
    }

    // Method 4: Text similarity based on titles
    // Group tasks by common words in titles (simplified approach)
    const wordGroups = new Map<string, Task[]>();
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from',
      'by', 'with', 'in', 'out', 'task', 'tasks', 'add', 'create', 'update', 'implement'
    ]);

    // Extract significant words from titles
    for (const task of tasks) {
      const words = task.title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      for (const word of words) {
        if (!wordGroups.has(word)) {
          wordGroups.set(word, []);
        }
        wordGroups.get(word)!.push(task);
      }
    }

    // Create capabilities from word groups
    for (const [word, wordTasks] of wordGroups.entries()) {
      if (wordTasks.length > 2) { // Only create if 3+ tasks share the word
        capabilities.push({
          id: uuidv4(),
          name: `${word.charAt(0).toUpperCase() + word.slice(1)} functionality`,
          type: 'text-similarity-capability',
          description: `Tasks related to ${word}`,
          confidence: 0.5,
          tasks: wordTasks.map(t => t.id),
          keywords: [word, ...this.extractKeywordsFromTasks(wordTasks)],
          relatedNodes: [],
          metadata: {},
        });
      }
    }

    // Method 5: Include uncategorized tasks
    const allCategorizedTaskIds = new Set<string>();

    // Collect all tasks that are part of a capability
    for (const capability of capabilities) {
      for (const taskId of capability.tasks) {
        allCategorizedTaskIds.add(taskId);
      }
    }

    // Find uncategorized tasks
    const uncategorizedTasks = tasks.filter(t => !allCategorizedTaskIds.has(t.id));

    if (uncategorizedTasks.length > 0) {
      capabilities.push({
        id: uuidv4(),
        name: 'Miscellaneous tasks',
        type: 'misc-capability',
        description: 'Tasks without specific categorization',
        confidence: 0.5,
        tasks: uncategorizedTasks.map(t => t.id),
        keywords: this.extractKeywordsFromTasks(uncategorizedTasks),
        relatedNodes: [],
        metadata: {},
      });
    }

    return capabilities;
  }

  /**
   * Extract keywords from a set of tasks using basic NLP techniques
   * @param tasks Tasks to analyze
   * @returns Array of extracted keywords
   */
  private extractKeywordsFromTasks(tasks: Task[]): string[] {
    // Combine all text
    const allText = tasks
      .map(t => `${t.title} ${t.description || ''} ${t.body || ''} ${(t.tags || []).join(' ')}`)
      .join(' ')
      .toLowerCase();

    // Split into words
    const words = allText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count frequency
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Filter out common words
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'task', 'this', 'that', 'will', 'from', 'have',
      'should', 'would', 'could', 'when', 'what', 'where', 'why', 'how', 'not',
      'todo', 'done', 'add', 'update', 'management', 'feature', 'implement',
      'make', 'using', 'use', 'get', 'set', 'create'
    ]);

    // Return top keywords
    return Array.from(wordFreq.entries())
      .filter(([word]) => !stopWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Note: The internal discoverRelationships method has been replaced by the enhanced
  // implementation in enhanced-relationships.ts

  // Note: The calculateKeywordSimilarity method has been replaced by the implementation
  // in enhanced-relationships.ts

  /**
   * Construct the final capability map
   * @param nodes Capability nodes
   * @param edges Capability edges
   * @param stats Generation statistics
   * @param options Discovery options
   * @returns Complete capability map
   */
  private constructCapabilityMap(
    nodes: CapabilityNode[],
    edges: CapabilityEdge[],
    stats: Record<string, any>,
    options: CapabilityDiscoveryOptions
  ): CapabilityMap {
    // Apply node limits if specified
    let finalNodes = nodes;
    if (options.maxNodes && nodes.length > options.maxNodes) {
      finalNodes = nodes
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, options.maxNodes);
    }

    // Filter edges to only include nodes in the final set
    const finalNodeIds = new Set(finalNodes.map(n => n.id));
    const finalEdges = edges.filter(
      e => finalNodeIds.has(e.source) && finalNodeIds.has(e.target)
    );

    // Calculate overall confidence
    const averageNodeConfidence = finalNodes.reduce((sum, node) => sum + node.confidence, 0) / finalNodes.length;
    const averageEdgeConfidence = finalEdges.length > 0
      ? finalEdges.reduce((sum, edge) => sum + edge.confidence, 0) / finalEdges.length
      : 0;
    const overallConfidence = (averageNodeConfidence * 0.7) + (averageEdgeConfidence * 0.3);

    // Create the final map
    return {
      id: uuidv4(),
      created: new Date(),
      updated: new Date(),
      nodes: finalNodes,
      edges: finalEdges,
      metadata: {
        taskCount: stats.tasksFetched || 0,
        discoveredCapabilities: finalNodes.length,
        relationshipCount: finalEdges.length,
        confidence: overallConfidence,
        lastUpdated: new Date(),
        generationStats: stats,
      },
    };
  }
}