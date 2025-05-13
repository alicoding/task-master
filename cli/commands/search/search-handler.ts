/**
 * Search Command Handler
 *
 * Provides modular functionality for the search command,
 * breaking down complex search operations into manageable functions.
 *
 * Modified version with terminal session dependencies removed.
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '@/core/repo';
import { NlpService } from '@/core/nlp-service';
import { SearchFilters, OutputFormat, Task } from '@/core/types';
import { ExtractedSearchFilters } from '@/core/nlp/types';
import { getColorFunctions } from './color-utils';

import { asTaskStatus, asTaskReadiness } from '@/core/utils/type-safety';

/**
 * Interface for search command options
 */
export interface SearchCommandOptions {
  query?: string;
  similar?: string;
  status?: string;
  readiness?: string;
  tag?: string[];
  filter?: string[];
  metadata?: string;
  format?: OutputFormat;
  sort?: string;
  explain?: boolean;
  color?: boolean;
  fuzzy?: boolean;
}

/**
 * Main search handler that orchestrates the search process
 * @param options Search command options
 */
export async function handleSearchCommand(options: SearchCommandOptions): Promise<void> {
  try {
    const repo = new TaskRepository();
    const format = options.format as OutputFormat || 'text';
    const nlpService = new NlpService();
    const useFuzzy = options.fuzzy !== undefined ? options.fuzzy !== false : true;
    
    try {
      // Check if we're doing a similarity search
      if (options.similar) {
        await performSimilaritySearch(repo, nlpService, options);
        return;
      }
      
      // Build filters from options
      const filters = buildSearchFilters(options);
      
      // Process search query and get results
      const { tasks, extractedInfo } = await executeSearch(
        repo, 
        nlpService,
        filters, 
        options.query,
        options.explain,
        useFuzzy
      );
      
      // Sort results if requested
      const sortedTasks = sortSearchResults(tasks, options.sort);
      
      // Handle no results case
      if (sortedTasks.length === 0) {
        console.log('No tasks found matching the criteria');
        return;
      }
      
      // Display results in requested format
      displaySearchResults(
        sortedTasks, 
        format, 
        options.explain ? extractedInfo : undefined,
        options.query,
        useFuzzy,
        options.color
      );
    } finally {
      // Ensure repository is closed even if there's an error
      repo.close();
    }
  } catch (error) {
    console?.error('Error searching tasks:', error);
    process.exit(1);
  }
}

/**
 * Build search filters from command options
 * @param options Search command options
 * @returns Search filters object
 */
export function buildSearchFilters(options: SearchCommandOptions): SearchFilters {
  const filters: SearchFilters = {};
  
  // Direct filter options
  if (options.status) {
    filters.status = asTaskStatus(options.status);
  }
  
  if (options.readiness) {
    filters.readiness = asTaskReadiness(options.readiness);
  }
  
  if (options.tag && options.tag.length > 0) {
    filters.tags = options.tag;
  }
  
  // Parse traditional key:value filters
  if (options.filter && options.filter.length > 0) {
    parseKeyValueFilters(filters, options.filter);
  }
  
  // Parse metadata JSON if provided
  if (options.metadata) {
    parseMetadataFilter(filters, options.metadata);
  }
  
  return filters;
}

/**
 * Parse key:value filter strings into search filters
 * @param filters Search filters object to update
 * @param filterStrings Array of key:value filter strings
 */
function parseKeyValueFilters(filters: SearchFilters, filterStrings: string[]): void {
  for (const filter of filterStrings) {
    const [key, value] = filter.split(':');
    
    if (!key || !value) continue;
    
    if (key === 'tag' || key === 'tags') {
      filters.tags = filters.tags || [];
      filters.tags.push(value);
    } else if (key === 'status' && !filters.status) {
      filters.status = asTaskStatus(value);
    } else if (key === 'readiness' && !filters.readiness) {
      filters.readiness = asTaskReadiness(value);
    } else if (key.startsWith('meta.')) {
      filters.metadata = filters.metadata || {};
      const metaKey = key.substring(5);
      filters.metadata[metaKey] = value;
    }
  }
}

/**
 * Parse metadata JSON string into search filters
 * @param filters Search filters object to update
 * @param metadataJson JSON string containing metadata
 */
function parseMetadataFilter(filters: SearchFilters, metadataJson: string): void {
  try {
    const metadataObj = JSON.parse(metadataJson);
    filters.metadata = filters.metadata || {};
    Object.assign(filters.metadata, metadataObj);
  } catch (e) {
    console?.error('Invalid JSON for metadata:', e);
  }
}

/**
 * Execute search based on filters and query
 * @param repo Task repository
 * @param nlpService NLP service
 * @param filters Search filters
 * @param query Optional search query
 * @param explain Whether to extract and explain search filters
 * @param useFuzzy Whether to use fuzzy matching
 * @returns Search results and extracted info
 */
export async function executeSearch(
  repo: TaskRepository,
  nlpService: NlpService,
  filters: SearchFilters,
  query?: string,
  explain?: boolean,
  useFuzzy?: boolean
): Promise<{ tasks: Task[], extractedInfo?: ExtractedSearchFilters }> {
  let tasks: Task[] = [];
  let extractedInfo: ExtractedSearchFilters | undefined;

  if (query) {
    // Get extracted filter information if explain is enabled
    if (explain) {
      extractedInfo = await nlpService.extractSearchFilters(query);
    }

    // If we're using the natural language search
    if (useFuzzy && typeof repo.naturalLanguageSearch === 'function') {
      // Use the naturalLanguageSearch method
      const searchResults = await repo.naturalLanguageSearch(query, {
        ...filters
      });
      tasks = searchResults || [];
    } else {
      // Use traditional search approach
      filters.query = query;
      const result = await repo.searchTasks(filters);
      tasks = result?.data || [];
    }
  } else {
    // Standard search with filters
    const result = await repo.searchTasks(filters);
    tasks = result?.data || [];
  }

  return { tasks, extractedInfo };
}

/**
 * Sort search results by the specified field
 * @param tasks Tasks to sort
 * @param sortField Optional field to sort by
 * @returns Sorted tasks
 */
export function sortSearchResults(tasks: Task[], sortField?: string): Task[] {
  if (!sortField || sortField === 'id') {
    return tasks;
  }
  
  return [...tasks].sort((a, b) => {
    // Handle dates specially
    if (sortField === 'createdAt' || sortField === 'updatedAt') {
      const aDate = sortField === 'createdAt' ? a.createdAt : a.updatedAt;
      const bDate = sortField === 'createdAt' ? b.createdAt : b.updatedAt;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    }

    // Handle specific fields directly
    if (sortField === 'id') return String(a.id || '').localeCompare(String(b.id || ''));
    if (sortField === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
    if (sortField === 'status') return String(a.status || '').localeCompare(String(b.status || ''));
    if (sortField === 'readiness') return String(a.readiness || '').localeCompare(String(b.readiness || ''));

    // For any other fields, use string comparison with safe access
    const aVal = String(a[sortField as keyof typeof a] || '');
    const bVal = String(b[sortField as keyof typeof b] || '');
    return aVal.localeCompare(bVal);
  });
}

/**
 * Display search results in the requested format
 * @param tasks Tasks to display
 * @param format Output format (text or json)
 * @param extractedInfo Optional extracted search info for explanation
 * @param query Original search query
 * @param useFuzzy Whether fuzzy matching was used
 * @param useColor Whether to use colored output
 */
export function displaySearchResults(
  tasks: Task[],
  format: OutputFormat,
  extractedInfo?: ExtractedSearchFilters,
  query?: string,
  useFuzzy?: boolean,
  useColor?: boolean
): void {
  if (format === 'json') {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }
  
  // Text output
  // If explanation is requested, show it first
  if (extractedInfo && query) {
    displaySearchExplanation(extractedInfo, query, !!useFuzzy, useColor);
  }
  
  console.log(`Found ${tasks.length} matching tasks:`);
  
  // Display each task
  tasks.forEach(task => displayTaskDetails(task, useColor));
}

/**
 * Display explanation of search query processing
 * @param extractedInfo Extracted search info
 * @param query Original search query
 * @param useFuzzy Whether fuzzy matching was used
 * @param useColor Whether to use colored output
 */
function displaySearchExplanation(
  extractedInfo: ExtractedSearchFilters,
  query: string,
  useFuzzy: boolean | undefined,
  useColor?: boolean
): void {
  const { colorize } = getColorFunctions(!!useColor);

  console.log(colorize('Search query analysis:', asChalkColor((asChalkColor((asChalkColor((asChalkColor('blue'))))))), asChalkColor('bold')));
  console.log(colorize(`Original query: "${query}"`, asChalkColor((asChalkColor((asChalkColor((asChalkColor('green')))))))));

  if (extractedInfo.extractedTerms && extractedInfo.extractedTerms.length > 0) {
    console.log(colorize('Extracted filters:', asChalkColor((asChalkColor((asChalkColor((asChalkColor('blue')))))))));
    for (const term of extractedInfo.extractedTerms) {
      console.log(`  - ${colorize(term, asChalkColor((asChalkColor((asChalkColor((asChalkColor('magenta'))))))))}`);
    }
  }

  if (extractedInfo.query !== query) {
    console.log(colorize('Cleaned query: ', asChalkColor((asChalkColor((asChalkColor((asChalkColor('blue')))))))) +
                colorize(`"${extractedInfo.query}"`, asChalkColor((asChalkColor((asChalkColor((asChalkColor('green')))))))));
  }

  console.log(colorize(`Fuzzy matching: ${useFuzzy ? 'enabled' : 'disabled'}`, asChalkColor((asChalkColor((asChalkColor((asChalkColor('blue')))))))));

  console.log(); // Empty line before results
}

/**
 * Display details of a single task
 * @param task Task to display
 * @param useColor Whether to use colored output
 */
function displayTaskDetails(task: Task, useColor?: boolean): void {
  // Parse metadata if it's a string
  const metadata = typeof task.metadata === 'string' 
    ? JSON.parse(task.metadata) 
    : task.metadata;
    
  // If tasks have similarity scores, show them
  const similarityScore = metadata?.similarityScore;
  let scoreDisplay = '';
  
  if (similarityScore !== undefined) {
    const percentage = Math.round(similarityScore * 100);
    const { colorize } = getColorFunctions(!!useColor);

    // Choose color based on score
    let scoreColor = asChalkColor('red');
    if (percentage >= 70) scoreColor = asChalkColor('green');
    else if (percentage >= 40) scoreColor = asChalkColor('yellow');

    // Add visual indicator
    scoreDisplay = ` ${colorize(`[${percentage}%]`, scoreColor)}`;
  }
  
  console.log(`${task.id}.${scoreDisplay} ${task.title} [${task.status}]`);
  console.log(`  Tags: ${task.tags?.join(', ') || 'none'}`);
  console.log(`  Readiness: ${task.readiness}`);
  
  if (metadata && Object.keys(metadata).length > 0) {
    // Don't show similarityScore in output
    const displayMetadata = { ...metadata };
    delete displayMetadata.similarityScore;
    
    if (Object.keys(displayMetadata).length > 0) {
      console.log(`  Metadata: ${JSON.stringify(displayMetadata)}`);
    }
  }
  console.log('');
}

/**
 * Perform similarity search based on a title
 * @param repo Task repository
 * @param nlpService NLP service
 * @param options Search options
 */
export async function performSimilaritySearch(
  repo: TaskRepository,
  nlpService: NlpService,
  options: SearchCommandOptions
): Promise<void> {
  const format = options.format as OutputFormat || 'text';
  const { colorize } = getColorFunctions(!!options.color);
  const useFuzzy = true; // Default to true if undefined or not explicitly false
  
  if (!options.similar) {
    console.log('Error: similar option is required for similarity search');
    return;
  }
  
  // Perform similarity search
  const similarTasksResult = await repo.findSimilarTasks(options.similar);
  const similarTasks = similarTasksResult?.data || [];
  
  if (similarTasks.length === 0) {
    console.log('No similar tasks found');
    return;
  }
  
  if (format === 'json') {
    console.log(JSON.stringify(similarTasks, null, 2));
    return;
  }
  
  console.log(colorize(`Tasks similar to "${options.similar}":\n`, asChalkColor((asChalkColor((asChalkColor((asChalkColor('blue'))))))), asChalkColor('bold')));
  console.log(colorize(`Fuzzy matching: ${useFuzzy ? 'enabled' : 'disabled'}`, asChalkColor((asChalkColor((asChalkColor((asChalkColor('blue')))))))));
  console.log('');

  similarTasks.forEach(task => {
    // Get similarity score from metadata
    const metadata = typeof task.metadata === 'string'
      ? JSON.parse(task.metadata)
      : task.metadata;

    const score = metadata?.similarityScore || 0;
    const percentage = Math.round(score * 100);

    // Generate a visual bar based on similarity
    const barLength = Math.round(percentage / 5);
    const bar = '█'.repeat(barLength);

    // Color the bar based on similarity
    let barColor = asChalkColor((asChalkColor((asChalkColor((asChalkColor('red')))))));
    if (percentage >= 70) barColor = asChalkColor((asChalkColor((asChalkColor((asChalkColor('green')))))));
    else if (percentage >= 40) barColor = asChalkColor((asChalkColor((asChalkColor((asChalkColor('yellow')))))));

    console.log(`${task.id}. ${task.title}`);
    console.log(`  ${colorize('Similarity: ', asChalkColor((asChalkColor((asChalkColor((asChalkColor('blue'))))))))}${colorize(`${percentage}%`, barColor)} ${colorize(bar, barColor)}`);
    console.log(`  Tags: ${task.tags?.join(', ') || 'none'}`);
    console.log(`  Status: ${task.status}, Readiness: ${task.readiness}`);
    console.log('');
  });
}