/**
 * Type definitions for the NLP system
 */

/**
 * Intent with confidence score
 */
export interface Intent {
  name: string;
  score: number;
}

/**
 * Named entity recognition result
 */
export interface Entity {
  entity: string;
  option: string;
  sourceText: string;
  utteranceText: string;
  accuracy: number;
  start: number;
  end: number;
  len: number;
}

/**
 * Processed query result with extracted information
 */
export interface ProcessedQuery {
  original: string;
  normalized: string;
  normalizedQuery: string;  // Added for backward compatibility with tests
  tokens: string[];
  stems: string[];
  intent: string | null;
  intents: Intent[];
  entities: Record<string, string[]>;
  tags?: string[];
  status?: string | null;
  readiness?: string | null;
}

/**
 * Search filters extracted from natural language query
 */
export interface ExtractedSearchFilters {
  status?: string;
  readiness?: string;
  tags?: string[];
  priority?: string;
  query?: string;
  actionTypes?: string[];     // Added for backward compatibility with tests
  extractedTerms?: string[];  // Added for backward compatibility with tests
}

/**
 * Task information for similarity search
 */
export interface TaskSearchInfo {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
}

/**
 * Task with similarity score
 */
export interface SimilarTask {
  id: string;
  title: string;
  similarity: number;
}

/**
 * Configuration for fuzzy search
 */
export interface FuzzySearchOptions {
  threshold?: number;
  keys?: string[];
  includeScore?: boolean;
  shouldSort?: boolean;
  ignoreLocation?: boolean;
  findAllMatches?: boolean;
}

/**
 * Cache statistics interface for optimized NLP
 */
export interface NlpCacheStats {
  query: number;
  similarity: number;
  filters: number;
}

/**
 * Base interface for NLP service implementations
 */
export interface NlpServiceInterface {
  train(): Promise<void>;
  processQuery(query: string): Promise<ProcessedQuery>;
  getSimilarity(text1: string, text2: string): Promise<number>;
  findSimilarTasks(
    tasks: TaskSearchInfo[],
    title: string,
    threshold?: number,
    useFuzzy?: boolean
  ): Promise<SimilarTask[]>;
  extractSearchFilters(query: string): Promise<ExtractedSearchFilters>;

  // These methods are required by the NLP profiling tool
  clearCache?: () => void;
  printProfilingResults?: () => void;
  getCacheStats?: () => NlpCacheStats;
}

/**
 * Options for the NLP manager
 */
export interface NlpManagerOptions {
  languages?: string[];
  forceNER?: boolean;
  [key: string]: unknown;
}

/**
 * Result of NLP processing
 */
export interface NlpProcessResult {
  locale: string;
  utterance: string;
  domain?: string;
  languageGuessed?: boolean;
  localeIso2?: string;
  language: string;
  explanation?: string[];
  classifications?: Array<{intent: string; score: number}>;
  intent?: string;
  score?: number;
  answers?: string[];
  answer?: string;
  entities?: Entity[];
  sourceEntities?: Array<{entity: string; source: string}>;
  intents?: Intent[];
  sentiment?: {
    score: number;
    numWords: number;
    numHits: number;
    average: number;
    type: string;
    locale: string;
    vote: string;
  };
}

/**
 * Container utilities and services
 */
export interface NlpContainer {
  get(name: string): unknown;
  use(plugin: unknown): void;
}

/**
 * Minimal NLP manager interface
 */
export interface NlpManager {
  addDocument(language: string, text: string, intent: string): void;
  addNamedEntityText(
    entity: string,
    option: string,
    languages: string[],
    texts: string[]
  ): void;
  train(): Promise<void>;
  process(language: string, text: string): Promise<NlpProcessResult>;
  save(filename: string): Promise<void>;
  load(filename: string): Promise<boolean>;
  container: NlpContainer;
}