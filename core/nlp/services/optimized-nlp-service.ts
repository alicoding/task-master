/**
 * Optimized NLP Service for Task Master
 * Enhanced version with caching and performance improvements
 */

import { BaseNlpService } from './base-service.ts';
import {
  NlpManager as INlpManager,
  NlpManagerOptions,
  TaskSearchInfo,
  SimilarTask,
  ProcessedQuery,
  ExtractedSearchFilters
} from '../types.ts';
import { addTaskEntities } from '../processing/entities.ts';
import {
  tryLoadModel,
  addTrainingExamples,
  trainAndSaveModel,
  DEFAULT_MODEL_PATH
} from '../processing/trainer.ts';
import {
  Tokenizer,
  Stemmer
} from '../processing/processor.ts';
import {
  processQuery,
  calculateSimilarity,
  extractSearchFilters,
  bulkCalculateSimilarity,
  getNlpCache
} from '../processing/optimized-processor.ts';
import {
  fuzzySearch,
  combineSearchResults
} from '../matchers/fuzzy-matcher.ts';
import { getNlpProfiler, profileMethod } from '../utils/profiler.ts';

// Import the NlpManager from node-nlp-typescript
import { NlpManager } from 'node-nlp-typescript';

/**
 * Optimized NLP Service for Task Master
 * Provides enhanced NLP capabilities with better performance
 */
export class OptimizedNlpService extends BaseNlpService {
  private nlpManager: INlpManager;
  private tokenizer: Tokenizer | null;
  private stemmer: Stemmer | null;
  private modelPath: string;
  private initialized: boolean = false;

  /**
   * Create a new Optimized NLP Service
   * @param modelPath Path to NLP model (defaults to ./nlp-model.json)
   * @param enableProfiling Whether to enable performance profiling
   */
  constructor(modelPath: string = DEFAULT_MODEL_PATH, enableProfiling: boolean = false) {
    super();

    // Enable profiling if requested
    getNlpProfiler().setEnabled(enableProfiling);

    try {
      // Create NLP manager for English only
      const options: NlpManagerOptions = {
        languages: ['en'],
        forceNER: true
      };

      // Create a proper NLP manager using the node-nlp-typescript library
      const realNlpManager = new NlpManager({
        languages: ['en'],
        forceNER: true
      });

      // Convert to our interface format
      this.nlpManager = {
        addDocument: (language: string, text: string, intent: string) =>
          realNlpManager.addDocument(language, text, intent),
        addNamedEntityText: (entity: string, option: string, languages: string[], texts: string[]) =>
          realNlpManager.addNamedEntityText(entity, option, languages, texts),
        train: async () => await realNlpManager.train(),
        process: async (language: string, text: string) => await realNlpManager.process(language, text),
        save: async (filename: string) => await realNlpManager.save(filename),
        load: async (filename: string) => {
          try {
            await realNlpManager.load(filename);
            return true;
          } catch (e) {
            return false;
          }
        },
        container: realNlpManager.container
      };

      this.modelPath = modelPath;

      // Add task-related entities
      addTaskEntities(this.nlpManager);

      // Initialize tokenizer and stemmer using NlpUtil
      this.tokenizer = this.nlpManager.container.get('tokenizer-en') as Tokenizer;
      this.stemmer = this.nlpManager.container.get('stemmer-en') as Stemmer;
    } catch (error) {
      console.warn('Failed to load NLP manager, using mock implementation:', error);

      // Create a simple mock NLP manager as fallback
      this.nlpManager = {
        addDocument: () => {},
        addNamedEntityText: () => {},
        train: async () => {},
        process: async () => ({ locale: 'en', utterance: '', language: 'en' }),
        save: async () => {},
        load: async () => false,
        container: {
          get: () => ({}),
          use: () => {}
        }
      };

      this.modelPath = modelPath;
      this.tokenizer = null;
      this.stemmer = null;
    }
  }

  /**
   * Train the NLP manager with example task descriptions
   * This should be called before using the service for search and analysis
   */
  @profileMethod('NlpService')
  async train(): Promise<void> {
    const profiler = getNlpProfiler();
    
    if (!this.initialized) {
      profiler.startTimer('modelLoading');
      const modelLoaded = await tryLoadModel(this.nlpManager, this.modelPath);
      profiler.stopTimer('modelLoading');
      
      if (!modelLoaded) {
        // Add example documents to train the NLP manager
        profiler.startTimer('addTrainingExamples');
        addTrainingExamples(this.nlpManager);
        profiler.stopTimer('addTrainingExamples');

        // Train and save the model
        profiler.startTimer('trainAndSaveModel');
        await trainAndSaveModel(this.nlpManager, this.modelPath);
        profiler.stopTimer('trainAndSaveModel');
      }
      
      this.initialized = true;
    }
  }

  /**
   * Process a search query to extract intents and entities
   * @param query User's search query
   * @returns Processed query with extracted information
   */
  @profileMethod('NlpService')
  async processQuery(query: string): Promise<ProcessedQuery> {
    await this.ensureInitialized();
    return processQuery(query, this.nlpManager, this.tokenizer, this.stemmer);
  }

  /**
   * Calculate similarity score between two texts
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  @profileMethod('NlpService')
  async getSimilarity(text1: string, text2: string): Promise<number> {
    await this.ensureInitialized();
    return calculateSimilarity(
      text1,
      text2,
      this.tokenizer,
      this.stemmer,
      this.nlpManager
    );
  }

  /**
   * Calculate similarity scores for many texts in an optimized way
   * @param target Target text to compare
   * @param texts Array of texts to compare against
   * @param threshold Minimum similarity threshold
   * @returns Array of [index, score] pairs for texts above threshold
   */
  @profileMethod('NlpService')
  async bulkGetSimilarity(
    target: string,
    texts: string[],
    threshold: number = 0.3
  ): Promise<[number, number][]> {
    await this.ensureInitialized();
    return bulkCalculateSimilarity(
      target,
      texts,
      this.tokenizer,
      this.stemmer,
      this.nlpManager,
      threshold
    );
  }

  /**
   * Find tasks similar to a given title or description
   * Optimized version with bulk similarity calculation
   * @param tasks Array of tasks to search
   * @param title Title to find similar tasks for
   * @param threshold Similarity threshold (0-1)
   * @param useFuzzy Whether to also use fuzzy matching
   * @returns Array of tasks with similarity scores
   */
  @profileMethod('NlpService')
  async findSimilarTasks(
    tasks: TaskSearchInfo[],
    title: string,
    threshold: number = 0.3,
    useFuzzy: boolean = true
  ): Promise<SimilarTask[]> {
    await this.ensureInitialized();
    const profiler = getNlpProfiler();
    
    if (!tasks.length) return [];
    
    // Extract texts for similarity comparison
    const taskTexts = tasks.map(task => {
      // Prefer description + title if available (with more weight on title)
      if (task.description) {
        return `${task.title} ${task.title} ${task.description}`;
      }
      return task.title;
    });
    
    // Get bulk similarity scores
    profiler.startTimer('bulkSimilarityCalculation');
    const nlpSimilarities = await this.bulkGetSimilarity(title, taskTexts, threshold * 0.7);
    profiler.stopTimer('bulkSimilarityCalculation');
    
    // Convert to SimilarTask format
    const nlpResults = nlpSimilarities.map(([index, score]) => ({
      id: tasks[index].id,
      title: tasks[index].title,
      similarity: score
    }));
    
    // Filter by threshold
    const filteredNlpResults = nlpResults
      .filter(task => task.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
    
    // If not using fuzzy matching, return NLP results only
    if (!useFuzzy) {
      return filteredNlpResults;
    }
    
    // Perform fuzzy search
    profiler.startTimer('fuzzySearch');
    const fuzzyResults = fuzzySearch(tasks, title, {
      threshold: Math.min(threshold + 0.2, 0.8) // Higher threshold for fuzzy
    });
    profiler.stopTimer('fuzzySearch');
    
    // Combine results
    profiler.startTimer('combineResults');
    const combined = combineSearchResults(filteredNlpResults, fuzzyResults, 0.7);
    profiler.stopTimer('combineResults');
    
    return combined;
  }

  /**
   * Extract search filters from a natural language query
   * @param query Search query in natural language
   * @returns Extracted search filters
   */
  @profileMethod('NlpService')
  async extractSearchFilters(query: string): Promise<ExtractedSearchFilters> {
    await this.ensureInitialized();
    return extractSearchFilters(query, this.nlpManager, this.tokenizer, this.stemmer);
  }

  /**
   * Get the NLP cache statistics
   * @returns Object with cache statistics
   */
  getCacheStats(): { query: number, similarity: number, filters: number } {
    return getNlpCache().getStats();
  }

  /**
   * Clear the NLP cache
   * @param cacheType Type of cache to clear (or all if not specified)
   */
  clearCache(cacheType?: 'query' | 'similarity' | 'filters'): void {
    if (cacheType) {
      getNlpCache().clear(cacheType);
    } else {
      getNlpCache().clearAll();
    }
  }

  /**
   * Print performance profiling results
   */
  printProfilingResults(): void {
    getNlpProfiler().printSummary();
  }

  /**
   * Ensure the NLP service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.train();
    }
  }
}