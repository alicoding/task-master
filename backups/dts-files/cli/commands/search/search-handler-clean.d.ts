/**
 * Search Command Handler
 *
 * Provides modular functionality for the search command,
 * breaking down complex search operations into manageable functions.
 *
 * Modified version with terminal session dependencies removed.
 */
import { TaskRepository } from '../../../core/repo';
import { NlpService } from '../../../core/nlp-service';
import { SearchFilters, OutputFormat, Task } from '../../../core/types';
import { ExtractedSearchFilters } from '../../../core/nlp/types';
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
export declare function handleSearchCommand(options: SearchCommandOptions): Promise<void>;
/**
 * Build search filters from command options
 * @param options Search command options
 * @returns Search filters object
 */
export declare function buildSearchFilters(options: SearchCommandOptions): SearchFilters;
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
export declare function executeSearch(repo: TaskRepository, nlpService: NlpService, filters: SearchFilters, query?: string, explain?: boolean, useFuzzy?: boolean): Promise<{
    tasks: Task[];
    extractedInfo?: ExtractedSearchFilters;
}>;
/**
 * Sort search results by the specified field
 * @param tasks Tasks to sort
 * @param sortField Optional field to sort by
 * @returns Sorted tasks
 */
export declare function sortSearchResults(tasks: Task[], sortField?: string): Task[];
/**
 * Display search results in the requested format
 * @param tasks Tasks to display
 * @param format Output format (text or json)
 * @param extractedInfo Optional extracted search info for explanation
 * @param query Original search query
 * @param useFuzzy Whether fuzzy matching was used
 * @param useColor Whether to use colored output
 */
export declare function displaySearchResults(tasks: Task[], format: OutputFormat, extractedInfo?: ExtractedSearchFilters, query?: string, useFuzzy?: boolean, useColor?: boolean): void;
/**
 * Perform similarity search based on a title
 * @param repo Task repository
 * @param nlpService NLP service
 * @param options Search options
 */
export declare function performSimilaritySearch(repo: TaskRepository, nlpService: NlpService, options: SearchCommandOptions): Promise<void>;
