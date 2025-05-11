/**
 * NLP Service for Task Master
 * This service provides natural language processing capabilities
 * for improved search and matching
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
  processQuery as processQueryImpl,
  calculateSimilarity,
  extractSearchFilters as extractSearchFiltersImpl,
  Tokenizer,
  Stemmer
} from '../processing/processor.ts';
import {
  fuzzySearch,
  combineSearchResults
} from '../matchers/fuzzy-matcher.ts';

// Import the NlpManager from node-nlp-typescript
import { NlpManager } from 'node-nlp-typescript';

/**
 * NLP Service for Task Master
 * Provides advanced NLP capabilities for search, similarity matching, and more
 */
export class NlpService extends BaseNlpService {
  private nlpManager: INlpManager;
  private tokenizer: Tokenizer | null;
  private stemmer: Stemmer | null;
  private modelPath: string;

  /**
   * Create a new NLP Service
   * @param modelPath Path to NLP model (defaults to ./nlp-model.json)
   */
  constructor(modelPath: string = DEFAULT_MODEL_PATH) {
    super();

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
  async train(): Promise<void> {
    if (!(await tryLoadModel(this.nlpManager, this.modelPath))) {
      // Add example documents to train the NLP manager
      addTrainingExamples(this.nlpManager);

      // Train and save the model
      await trainAndSaveModel(this.nlpManager, this.modelPath);
    }
  }

  /**
   * Process a search query to extract intents and entities
   * @param query User's search query
   * @returns Processed query with extracted information
   */
  async processQuery(query: string): Promise<ProcessedQuery> {
    return processQueryImpl(query, this.nlpManager, this.tokenizer, this.stemmer);
  }

  /**
   * Calculate similarity score between two texts
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  async getSimilarity(text1: string, text2: string): Promise<number> {
    return calculateSimilarity(
      text1,
      text2,
      this.tokenizer,
      this.stemmer,
      this.nlpManager
    );
  }

  /**
   * Find tasks similar to a given title or description
   * @param tasks Array of tasks to search
   * @param title Title to find similar tasks for
   * @param threshold Similarity threshold (0-1)
   * @param useFuzzy Whether to also use fuzzy matching
   * @returns Array of tasks with similarity scores
   */
  async findSimilarTasks(
    tasks: TaskSearchInfo[],
    title: string,
    threshold: number = 0.3,
    useFuzzy: boolean = true
  ): Promise<SimilarTask[]> {
    // Calculate NLP similarity scores for each task
    const nlpResults = await Promise.all(
      tasks.map(async task => {
        // Calculate similarity between titles
        const titleSimilarity = await this.getSimilarity(title, task.title);

        // If description exists, calculate similarity with that too
        let descriptionSimilarity = 0;
        if (task.description) {
          descriptionSimilarity = await this.getSimilarity(title, task.description);
        }

        // Use the higher of the two similarities
        const similarity = Math.max(titleSimilarity, descriptionSimilarity);

        return {
          id: task.id,
          title: task.title,
          similarity
        };
      })
    );

    // Filter by threshold and sort by descending similarity
    const filteredNlpResults = nlpResults
      .filter(task => task.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    // If not using fuzzy matching, return NLP results only
    if (!useFuzzy) {
      return filteredNlpResults;
    }

    // Perform fuzzy search
    const fuzzyResults = fuzzySearch(tasks, title, {
      threshold: Math.min(threshold + 0.2, 0.8) // Higher threshold for fuzzy
    });

    // Combine results
    return combineSearchResults(filteredNlpResults, fuzzyResults, 0.7);
  }

  /**
   * Extract search filters from a natural language query
   * @param query Search query in natural language
   * @returns Extracted search filters
   */
  async extractSearchFilters(query: string): Promise<ExtractedSearchFilters> {
    return extractSearchFiltersImpl(query, this.nlpManager, this.tokenizer, this.stemmer);
  }
}