/**
 * Enhanced capability discovery module for TaskMaster
 * Provides more sophisticated capability discovery without requiring AI
 */

import { Task } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';
import { CapabilityNode } from './index.ts';

// Enhanced stopwords list for better keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 
  'by', 'with', 'in', 'out', 'of', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could', 'task', 'tasks', 'add', 'create', 
  'update', 'implement', 'support', 'test', 'fix', 'management', 'make', 'using',
  'use', 'get', 'set', 'this', 'that', 'these', 'those', 'it', 'its', 'their',
  'there', 'here', 'where', 'when', 'why', 'how', 'which', 'who', 'whom',
  'feature', 'features', 'issue', 'issues', 'more', 'less', 'new', 'old'
]);

// Common technical domains that might appear in tasks
const COMMON_DOMAINS = [
  {name: 'UI/UX', keywords: ['ui', 'ux', 'user', 'interface', 'experience', 'design', 'visual', 'layout', 'style']},
  {name: 'Frontend', keywords: ['frontend', 'client', 'browser', 'react', 'vue', 'angular', 'component', 'style']},
  {name: 'Backend', keywords: ['backend', 'server', 'api', 'database', 'storage', 'service', 'endpoint']},
  {name: 'Data', keywords: ['data', 'database', 'storage', 'sql', 'query', 'model', 'schema', 'field']},
  {name: 'Testing', keywords: ['test', 'testing', 'unit', 'integration', 'coverage', 'assert', 'mock', 'spec']},
  {name: 'DevOps', keywords: ['deploy', 'deployment', 'ci', 'cd', 'pipeline', 'build', 'release', 'container']},
  {name: 'Security', keywords: ['security', 'auth', 'authentication', 'authorization', 'permission', 'encrypt']},
  {name: 'Performance', keywords: ['performance', 'optimize', 'optimization', 'speed', 'memory', 'bottleneck']},
  {name: 'Documentation', keywords: ['doc', 'docs', 'document', 'documentation', 'readme', 'guide', 'tutorial']},
  {name: 'Integration', keywords: ['integration', 'connect', 'connector', 'interface', 'import', 'export']},
  {name: 'Refactoring', keywords: ['refactor', 'refactoring', 'restructure', 'rewrite', 'clean', 'improve']},
  {name: 'Analytics', keywords: ['analytics', 'report', 'reporting', 'dashboard', 'metric', 'tracking']},
  {name: 'CLI', keywords: ['cli', 'command', 'terminal', 'shell', 'console']},
  {name: 'API', keywords: ['api', 'rest', 'graphql', 'endpoint', 'request', 'response']},
  {name: 'Mobile', keywords: ['mobile', 'ios', 'android', 'app', 'responsive']},
  {name: 'Accessibility', keywords: ['accessibility', 'a11y', 'aria', 'screen reader']},
  {name: 'AI/ML', keywords: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'model', 'prediction']},
  {name: 'NLP', keywords: ['nlp', 'natural language', 'text', 'parsing', 'understanding']},
  {name: 'Core', keywords: ['core', 'foundation', 'base', 'essential', 'fundamental']},
  {name: 'Visualization', keywords: ['visualization', 'chart', 'graph', 'plot', 'display']},
];

/**
 * Enhanced task interface with additional data for analysis
 */
export interface EnrichedTask extends Task {
  allText: string;        // Combined text for analysis
  normalizedTitle: string;// Normalized title
  keywords: string[];     // Extracted keywords
  domains: string[];      // Inferred domains
  concepts: string[];     // Extracted concepts
}

/**
 * Advanced capability discovery without requiring AI
 * @param tasks Tasks to analyze
 * @returns Array of capability nodes
 */
export async function discoverCapabilitiesEnhanced(tasks: Task[]): Promise<CapabilityNode[]> {
  console.log('Using advanced capability discovery (non-AI based)...');
  
  // 1. Prepare data - extract all text and do basic preprocessing
  const enrichedTasks = enrichTasks(tasks);
  
  // 2. Create the capability clusters using multiple strategies
  const capabilities: CapabilityNode[] = [];
  
  // Method 1: Create domain-based capabilities
  const domainCapabilities = createDomainCapabilities(enrichedTasks);
  capabilities.push(...domainCapabilities);
  
  // Method 2: Create tag-based capabilities
  const tagCapabilities = createTagCapabilities(enrichedTasks);
  capabilities.push(...tagCapabilities);
  
  // Method 3: Create hierarchical capabilities
  const hierarchyCapabilities = createHierarchyCapabilities(enrichedTasks);
  capabilities.push(...hierarchyCapabilities);
  
  // Method 4: Create concept-based capabilities
  const conceptCapabilities = createConceptCapabilities(enrichedTasks);
  capabilities.push(...conceptCapabilities);
  
  // Method 5: Include status-based capabilities if we don't have many
  if (capabilities.length < 8) {
    const statusCapabilities = createStatusCapabilities(enrichedTasks);
    capabilities.push(...statusCapabilities);
  }
  
  // 3. Remove redundant capabilities and deduplicate
  const finalCapabilities = removeRedundantCapabilities(capabilities);
  
  return finalCapabilities;
}

/**
 * Enrich tasks with additional data for analysis
 * @param tasks Raw tasks
 * @returns Enriched tasks with additional data
 */
function enrichTasks(tasks: Task[]): EnrichedTask[] {
  return tasks.map(task => {
    // Combine all text from the task
    const allText = [
      task.title || '',
      task.description || '',
      task.body || '',
      ...(task.tags || [])
    ].join(' ').toLowerCase();
    
    // Normalize title by removing stopwords and special chars
    const normalizedTitle = task.title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word))
      .join(' ');
    
    // Extract keywords from all text
    const allWords = allText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !STOP_WORDS.has(word));
    
    // Count word frequency
    const wordCounts = new Map<string, number>();
    for (const word of allWords) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // Get top keywords by frequency
    const keywords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);
    
    // Infer domains from keywords and text
    const domains = COMMON_DOMAINS
      .filter(domain => 
        domain.keywords.some(kw => allText.includes(kw))
      )
      .map(domain => domain.name);
    
    // Extract potential concepts from bigrams and trigrams
    const words = allText.split(/\s+/).filter(w => w.length > 2);
    const bigrams = [];
    const trigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i+1])) {
        bigrams.push(`${words[i]} ${words[i+1]}`);
      }
      
      if (i < words.length - 2 && !STOP_WORDS.has(words[i]) && 
          !STOP_WORDS.has(words[i+2])) {
        trigrams.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
      }
    }
    
    // Prioritize longer phrases
    const phraseSet = new Set<string>();
    for (const phrase of [...trigrams, ...bigrams]) {
      if (phrase.length > 5) {
        phraseSet.add(phrase);
        if (phraseSet.size >= 5) break;
      }
    }
    
    // Final concepts list combines task tags, bigrams/trigrams, and top keywords
    const concepts = [
      ...(task.tags || []),
      ...Array.from(phraseSet),
      ...keywords.slice(0, 3)
    ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate
    
    return {
      ...task,
      allText,
      normalizedTitle,
      keywords,
      domains,
      concepts
    };
  });
}

/**
 * Create domain-based capabilities
 * @param tasks Enriched tasks
 * @returns Domain-based capability nodes
 */
function createDomainCapabilities(tasks: EnrichedTask[]): CapabilityNode[] {
  const capabilities: CapabilityNode[] = [];
  const domainTaskMap = new Map<string, EnrichedTask[]>();
  
  // Group tasks by domain
  for (const task of tasks) {
    if (task.domains.length > 0) {
      for (const domain of task.domains) {
        if (!domainTaskMap.has(domain)) {
          domainTaskMap.set(domain, []);
        }
        domainTaskMap.get(domain)!.push(task);
      }
    }
  }
  
  // Create domain capabilities
  for (const [domain, domainTasks] of domainTaskMap.entries()) {
    if (domainTasks.length > 0) {
      // Find common keywords across these tasks
      const keywordFrequency = new Map<string, number>();
      for (const task of domainTasks) {
        for (const keyword of task.keywords) {
          keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
        }
      }
      
      // Get most common keywords
      const topKeywords = Array.from(keywordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);
        
      capabilities.push({
        id: uuidv4(),
        name: domain,
        type: 'domain',
        description: `${domain} tasks focusing on ${topKeywords.join(', ')}`,
        confidence: 0.75,
        tasks: domainTasks.map(t => t.id),
        keywords: topKeywords,
        relatedNodes: [],
        metadata: {
          tasks: domainTasks.length,
          progress: calculateProgressForTasks(domainTasks),
          topKeywords
        },
      });
    }
  }
  
  return capabilities;
}

/**
 * Create tag-based capabilities
 * @param tasks Enriched tasks
 * @returns Tag-based capability nodes
 */
function createTagCapabilities(tasks: EnrichedTask[]): CapabilityNode[] {
  const capabilities: CapabilityNode[] = [];
  const tagGroups = new Map<string, EnrichedTask[]>();
  
  // Group tasks by tags
  for (const task of tasks) {
    if (task.tags && task.tags.length > 0) {
      for (const tag of task.tags) {
        // Skip very generic tags
        if (tag.length <= 3 || STOP_WORDS.has(tag)) continue;
        
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, []);
        }
        tagGroups.get(tag)!.push(task);
      }
    }
  }
  
  // Create capabilities from meaningful tags
  for (const [tag, tagTasks] of tagGroups.entries()) {
    if (tagTasks.length >= 2) {
      // Find distinctive keywords for this tag
      const allTagKeywords = tagTasks.flatMap(t => t.keywords);
      const keywordFrequency = new Map<string, number>();
      for (const keyword of allTagKeywords) {
        keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
      }
      
      // Get top keywords
      const topKeywords = Array.from(keywordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);
      
      // Create a more interesting name than just "tag management"
      let capabilityName = tag.charAt(0).toUpperCase() + tag.slice(1);
      if (topKeywords.length > 0 && !capabilityName.includes(topKeywords[0])) {
        capabilityName += ` ${topKeywords[0]}`;
      }
      
      capabilities.push({
        id: uuidv4(),
        name: capabilityName,
        type: 'feature-area',
        description: `Tasks related to ${tag} functionality`,
        confidence: 0.8,
        tasks: tagTasks.map(t => t.id),
        keywords: [tag, ...topKeywords],
        relatedNodes: [],
        metadata: {
          tasks: tagTasks.length,
          progress: calculateProgressForTasks(tagTasks),
          tag
        },
      });
    }
  }
  
  return capabilities;
}

/**
 * Create hierarchy-based capabilities
 * @param tasks Enriched tasks
 * @returns Hierarchy-based capability nodes
 */
function createHierarchyCapabilities(tasks: EnrichedTask[]): CapabilityNode[] {
  const capabilities: CapabilityNode[] = [];
  const hierarchyGroups = new Map<string, EnrichedTask[]>();
  const possibleParents: Record<string, EnrichedTask> = {};
  
  // Find all parent tasks
  tasks.forEach(task => {
    possibleParents[task.id] = task;
  });
  
  // Group tasks by parent
  for (const task of tasks) {
    if (task.parentId && possibleParents[task.parentId]) {
      if (!hierarchyGroups.has(task.parentId)) {
        hierarchyGroups.set(task.parentId, []);
      }
      hierarchyGroups.get(task.parentId)!.push(task);
    }
  }
  
  // Create capabilities from parent-child groups
  for (const [parentId, childTasks] of hierarchyGroups.entries()) {
    if (childTasks.length >= 2) {
      const parentTask = possibleParents[parentId];
      if (parentTask) {
        // Extract key terms from parent title
        const titleWords = parentTask.title
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 3 && !STOP_WORDS.has(word.toLowerCase()));
        
        // Create a reasonable name
        let capabilityName = titleWords.length > 0 
          ? titleWords[0].charAt(0).toUpperCase() + titleWords[0].slice(1)
          : parentTask.title.split(' ').slice(0, 2).join(' ');
          
        // If we have multiple words, use the key ones
        if (titleWords.length > 1) {
          capabilityName += ` ${titleWords[1]}`;
        }
        
        // Gather all keywords
        const allKeywords = [
          ...parentTask.keywords,
          ...childTasks.flatMap(t => t.keywords)
        ];
        
        // Count frequencies
        const keywordCounts = new Map<string, number>();
        for (const kw of allKeywords) {
          keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
        }
        
        // Get top keywords
        const topKeywords = Array.from(keywordCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([kw]) => kw);
          
        capabilities.push({
          id: uuidv4(),
          name: capabilityName,
          type: 'workflow',
          description: `${parentTask.title} with ${childTasks.length} sub-tasks`,
          confidence: 0.75,
          tasks: [parentId, ...childTasks.map(t => t.id)],
          keywords: topKeywords,
          relatedNodes: [],
          metadata: {
            parentTask: parentTask.title,
            childCount: childTasks.length,
            progress: calculateProgressForTasks([parentTask, ...childTasks]),
          },
        });
      }
    }
  }
  
  return capabilities;
}

/**
 * Create concept-based capabilities
 * @param tasks Enriched tasks
 * @returns Concept-based capability nodes
 */
function createConceptCapabilities(tasks: EnrichedTask[]): CapabilityNode[] {
  const capabilities: CapabilityNode[] = [];
  
  // First, gather all concepts
  const allConcepts = new Set<string>();
  tasks.forEach(task => {
    task.concepts.forEach(concept => {
      if (concept.length > 3) {
        allConcepts.add(concept);
      }
    });
  });
  
  // Find tasks for each concept
  const conceptGroups = new Map<string, EnrichedTask[]>();
  for (const concept of allConcepts) {
    const conceptTasks = tasks.filter(
      task => task.concepts.includes(concept) || 
              task.allText.includes(concept)
    );
    
    if (conceptTasks.length >= 2) {
      conceptGroups.set(concept, conceptTasks);
    }
  }
  
  // Sort by concept specificity and task count
  const rankedConcepts = Array.from(conceptGroups.entries())
    .sort((a, b) => {
      // Prefer more specific concepts (longer words)
      const lengthDiff = b[0].length - a[0].length;
      if (lengthDiff !== 0) return lengthDiff;
      
      // Then by number of tasks
      return b[1].length - a[1].length;
    })
    .slice(0, 8); // Limit to top concepts
  
  // Create capabilities from concepts
  for (const [concept, conceptTasks] of rankedConcepts) {
    // Clean up the concept name
    const cleanConcept = concept
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
      
    capabilities.push({
      id: uuidv4(),
      name: cleanConcept,
      type: 'concept',
      description: `Tasks involving ${concept}`,
      confidence: 0.65,
      tasks: conceptTasks.map(t => t.id),
      keywords: [concept, ...conceptTasks.flatMap(t => t.keywords).slice(0, 4)],
      relatedNodes: [],
      metadata: {
        tasks: conceptTasks.length,
        progress: calculateProgressForTasks(conceptTasks),
      },
    });
  }
  
  return capabilities;
}

/**
 * Create status-based capabilities
 * @param tasks Enriched tasks
 * @returns Status-based capability nodes
 */
function createStatusCapabilities(tasks: EnrichedTask[]): CapabilityNode[] {
  const capabilities: CapabilityNode[] = [];
  const statusGroups = new Map<string, EnrichedTask[]>();
  
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
      let type: string;
      
      switch (status) {
        case 'todo':
          statusName = 'Planned Work';
          statusDescription = 'Tasks in the planning phase';
          type = 'planning-phase';
          break;
        case 'in-progress':
          statusName = 'Active Development';
          statusDescription = 'Tasks currently being worked on';
          type = 'execution-phase';
          break;
        case 'done':
          statusName = 'Completed Features';
          statusDescription = 'Tasks that have been completed';
          type = 'completion-phase';
          break;
        default:
          statusName = `${status.charAt(0).toUpperCase() + status.slice(1)} Phase`;
          statusDescription = `Tasks with ${status} status`;
          type = 'custom-phase';
      }
      
      capabilities.push({
        id: uuidv4(),
        name: statusName,
        type,
        description: statusDescription,
        confidence: 0.6,
        tasks: statusTasks.map(t => t.id),
        keywords: extractKeywordsFromTasks(statusTasks),
        relatedNodes: [],
        metadata: {
          status,
          count: statusTasks.length
        },
      });
    }
  }
  
  return capabilities;
}

/**
 * Remove redundant capabilities
 * This handles cases where capabilities are too similar or completely overlapping
 * @param capabilities List of capability nodes
 * @returns Filtered list with redundancies removed
 */
function removeRedundantCapabilities(capabilities: CapabilityNode[]): CapabilityNode[] {
  if (capabilities.length <= 1) return capabilities;
  
  // Sort by confidence and task count (higher values first)
  const sortedCapabilities = [...capabilities].sort((a, b) => {
    // First by confidence
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
    
    // Then by task count
    return b.tasks.length - a.tasks.length;
  });
  
  const result: CapabilityNode[] = [];
  const processedTaskSets: Set<string>[] = [];
  const usedNames = new Set<string>();
  
  // Process each capability
  for (const capability of sortedCapabilities) {
    const capabilityTaskSet = new Set(capability.tasks);
    
    // Check overlap with existing capabilities
    let maxOverlap = 0;
    let isSubset = false;
    
    for (const existingTaskSet of processedTaskSets) {
      // Calculate overlap percentage
      const intersection = new Set(
        [...capabilityTaskSet].filter(id => existingTaskSet.has(id))
      );
      
      const overlapPercentage = 
        intersection.size / Math.min(capabilityTaskSet.size, existingTaskSet.size);
        
      maxOverlap = Math.max(maxOverlap, overlapPercentage);
      
      // Check if this is a subset of an existing capability
      if (intersection.size === capabilityTaskSet.size) {
        isSubset = true;
        break;
      }
    }
    
    // Check for name duplicates and adjust if needed
    let finalName = capability.name;
    if (usedNames.has(finalName.toLowerCase())) {
      // Try adding the type to make it unique
      finalName = `${capability.name} (${capability.type})`;
      
      // If still duplicate, add a number
      if (usedNames.has(finalName.toLowerCase())) {
        let counter = 2;
        while (usedNames.has(`${finalName.toLowerCase()} ${counter}`)) {
          counter++;
        }
        finalName = `${finalName} ${counter}`;
      }
    }
    
    // Only include if it's not too similar to existing capabilities
    if (!isSubset && maxOverlap < 0.8) {
      result.push({
        ...capability,
        name: finalName
      });
      processedTaskSets.push(capabilityTaskSet);
      usedNames.add(finalName.toLowerCase());
    }
  }
  
  return result;
}

/**
 * Calculate progress percentage for a set of tasks
 * @param tasks Tasks to calculate progress for
 * @returns Progress percentage (0-100)
 */
function calculateProgressForTasks(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  
  const statusCounts = {
    'todo': 0,
    'in-progress': 0,
    'done': 0
  };
  
  // Count tasks by status
  for (const task of tasks) {
    if (task.status in statusCounts) {
      statusCounts[task.status]++;
    }
  }
  
  // Calculate weighted progress
  // todo = 0%, in-progress = 50%, done = 100%
  const totalTasks = tasks.length;
  const progressPoints = 
    (statusCounts['in-progress'] * 50) + 
    (statusCounts['done'] * 100);
    
  return Math.round(progressPoints / totalTasks);
}

/**
 * Extract keywords from a set of tasks
 * @param tasks Tasks to analyze
 * @returns Array of keywords
 */
function extractKeywordsFromTasks(tasks: Task[]): string[] {
  // Combine all text
  const allText = tasks
    .map(t => `${t.title} ${t.description || ''} ${t.body || ''} ${(t.tags || []).join(' ')}`)
    .join(' ')
    .toLowerCase();
  
  // Split into words
  const words = allText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.has(word));
  
  // Count frequency
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }
  
  // Return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}