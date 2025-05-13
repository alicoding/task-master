/**
 * Optimized processor module for NLP service
 * Enhanced version of the processor with caching and performance improvements
 */
import { NlpManager } from '../types';
import { ProcessedQuery, ExtractedSearchFilters } from '../types';
import { ENTITY_TERMS_TO_REMOVE } from './entities';
import { jaccardSimilarity } from '../utils/distance';
import { tokenizeAndNormalize, normalizeText } from '../utils/tokenization';
import { stemTokens } from '../utils/stemming';
import { getNlpProfiler } from '../utils/profiler';

// Import the original processor functions for fallback
import {
  processQuery as originalProcessQuery,
  calculateSimilarity as originalCalculateSimilarity,
  extractSearchFilters as originalExtractSearchFilters,
  Tokenizer,
  Stemmer
} from './processor';

// Cache for processed queries
interface QueryCacheEntry {
  processed: ProcessedQuery;
  timestamp: number;
}

// Cache for similarity calculations
interface SimilarityCacheEntry {
  score: number;
  timestamp: number;
}

// Cache for extracted search filters
interface FiltersCacheEntry {
  filters: ExtractedSearchFilters;
  timestamp: number;
}

/**
 * Cache manager for NLP operations
 */
class NlpCache {
  private static instance: NlpCache;
  private queryCache = new Map<string, QueryCacheEntry>();
  private similarityCache = new Map<string, SimilarityCacheEntry>();
  private filtersCache = new Map<string, FiltersCacheEntry>();
  private ttl = 5 * 60 * 1000; // 5 minutes default TTL
  private maxEntries = 1000; // Maximum cache entries before cleanup

  /**
   * Get the singleton cache instance
   */
  public static getInstance(): NlpCache {
    if (!this.instance) {
      this.instance = new NlpCache();
    }
    return this.instance;
  }

  /**
   * Set the TTL for cache entries
   * @param milliseconds TTL in milliseconds
   */
  public setTtl(milliseconds: number): void {
    this.ttl = milliseconds;
  }

  /**
   * Set the maximum number of cache entries before cleanup
   * @param count Maximum number of entries
   */
  public setMaxEntries(count: number): void {
    this.maxEntries = count;
  }

  /**
   * Get a processed query from cache or null if not found
   * @param query Query string
   */
  public getProcessedQuery(query: string): ProcessedQuery | null {
    const key = this.getNormalizedKey(query);
    const entry = this.queryCache.get(key);
    
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.processed;
    }
    
    // Remove expired entry
    if (entry) {
      this.queryCache.delete(key);
    }
    
    return null;
  }

  /**
   * Store a processed query in cache
   * @param query Query string
   * @param processed Processed query
   */
  public setProcessedQuery(query: string, processed: ProcessedQuery): void {
    const key = this.getNormalizedKey(query);
    this.queryCache.set(key, {
      processed,
      timestamp: Date.now()
    });
    
    this.performCacheCleanupIfNeeded(this.queryCache);
  }

  /**
   * Get a similarity score from cache or null if not found
   * @param text1 First text
   * @param text2 Second text
   */
  public getSimilarity(text1: string, text2: string): number | null {
    // Ensure consistent order for caching
    const [first, second] = [text1, text2].sort();
    const key = `${this.getNormalizedKey(first)}:${this.getNormalizedKey(second)}`;
    
    const entry = this.similarityCache.get(key);
    
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.score;
    }
    
    // Remove expired entry
    if (entry) {
      this.similarityCache.delete(key);
    }
    
    return null;
  }

  /**
   * Store a similarity score in cache
   * @param text1 First text
   * @param text2 Second text
   * @param score Similarity score
   */
  public setSimilarity(text1: string, text2: string, score: number): void {
    // Ensure consistent order for caching
    const [first, second] = [text1, text2].sort();
    const key = `${this.getNormalizedKey(first)}:${this.getNormalizedKey(second)}`;
    
    this.similarityCache.set(key, {
      score,
      timestamp: Date.now()
    });
    
    this.performCacheCleanupIfNeeded(this.similarityCache);
  }

  /**
   * Get extracted search filters from cache or null if not found
   * @param query Query string
   */
  public getExtractedFilters(query: string): ExtractedSearchFilters | null {
    const key = this.getNormalizedKey(query);
    const entry = this.filtersCache.get(key);
    
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.filters;
    }
    
    // Remove expired entry
    if (entry) {
      this.filtersCache.delete(key);
    }
    
    return null;
  }

  /**
   * Store extracted search filters in cache
   * @param query Query string
   * @param filters Extracted search filters
   */
  public setExtractedFilters(query: string, filters: ExtractedSearchFilters): void {
    const key = this.getNormalizedKey(query);
    this.filtersCache.set(key, {
      filters,
      timestamp: Date.now()
    });
    
    this.performCacheCleanupIfNeeded(this.filtersCache);
  }

  /**
   * Clear all caches
   */
  public clearAll(): void {
    this.queryCache.clear();
    this.similarityCache.clear();
    this.filtersCache.clear();
  }

  /**
   * Clear a specific cache
   * @param cacheType Type of cache to clear
   */
  public clear(cacheType: 'query' | 'similarity' | 'filters'): void {
    switch (cacheType) {
      case 'query':
        this.queryCache.clear();
        break;
      case 'similarity':
        this.similarityCache.clear();
        break;
      case 'filters':
        this.filtersCache.clear();
        break;
    }
  }

  /**
   * Get cache statistics
   * @returns Object with cache counts
   */
  public getStats(): { query: number, similarity: number, filters: number } {
    return {
      query: this.queryCache.size,
      similarity: this.similarityCache.size,
      filters: this.filtersCache.size
    };
  }

  /**
   * Clean up expired entries in a cache
   * @param cache Cache to clean up
   */
  private cleanExpiredEntries<T>(cache: Map<string, { timestamp: number } & T>): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        cache.delete(key);
      }
    }
  }

  /**
   * Normalize a key for cache storage
   * @param text Text to normalize
   * @returns Normalized key
   */
  private getNormalizedKey(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * Perform cache cleanup if needed
   * @param cache Cache to clean up
   */
  private performCacheCleanupIfNeeded<T>(cache: Map<string, { timestamp: number } & T>): void {
    if (cache.size > this.maxEntries) {
      this.cleanExpiredEntries(cache);
      
      // If still too large, remove oldest entries
      if (cache.size > this.maxEntries) {
        const entries = Array.from(cache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp);
        
        // Remove oldest 20% of entries
        const removeCount = Math.ceil(cache.size * 0.2);
        for (let i = 0; i < removeCount && i < entries.length; i++) {
          cache.delete(entries[i][0]);
        }
      }
    }
  }
}

/**
 * Get the NLP cache instance
 * @returns The NlpCache instance
 */
export function getNlpCache(): NlpCache {
  return NlpCache.getInstance();
}

/**
 * Optimized version of processQuery with caching and performance improvements
 * @param query User's search query
 * @param nlpManager NLP manager instance
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @returns Processed query with extracted information
 */
export async function processQuery(
  query: string,
  nlpManager: NlpManager,
  tokenizer: Tokenizer | null,
  stemmer: Stemmer | null
): Promise<ProcessedQuery> {
  const profiler = getNlpProfiler();
  const cache = getNlpCache();
  
  // Check cache first
  const cachedResult = cache.getProcessedQuery(query);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Process the query with profiling
  const result = await profiler.profileAsync(
    'processQuery',
    originalProcessQuery,
    query,
    nlpManager,
    tokenizer,
    stemmer
  );
  
  // Store in cache
  cache.setProcessedQuery(query, result);
  
  return result;
}

/**
 * Optimized version of calculateSimilarity with caching and performance improvements
 * @param text1 First text
 * @param text2 Second text
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @param nlpManager NLP manager instance
 * @returns Similarity score between 0 and 1
 */
export async function calculateSimilarity(
  text1: string,
  text2: string,
  tokenizer: Tokenizer | null,
  stemmer: Stemmer | null,
  nlpManager: NlpManager
): Promise<number> {
  const profiler = getNlpProfiler();
  const cache = getNlpCache();
  
  // Check cache first
  const cachedScore = cache.getSimilarity(text1, text2);
  if (cachedScore !== null) {
    return cachedScore;
  }
  
  // Quick check for identical or empty texts
  const norm1 = text1.toLowerCase().trim();
  const norm2 = text2.toLowerCase().trim();
  
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1;
  
  // Fast path for very different lengths
  const lengthRatio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
  if (lengthRatio < 0.3) {
    const score = lengthRatio * 0.5; // At most 0.15 similarity for very different lengths
    cache.setSimilarity(text1, text2, score);
    return score;
  }
  
  // For short texts, use a more efficient approach first
  if (norm1.length < 100 && norm2.length < 100) {
    // Tokenize both texts
    const tokens1 = profiler.profileSync(
      'tokenize',
      () => tokenizer?.tokenize ? tokenizer.tokenize(norm1) : norm1.split(/\s+/)
    );
    
    const tokens2 = profiler.profileSync(
      'tokenize',
      () => tokenizer?.tokenize ? tokenizer.tokenize(norm2) : norm2.split(/\s+/)
    );
    
    // Get jaccard similarity on tokens
    const jaccardScore = profiler.profileSync(
      'jaccardSimilarity',
      jaccardSimilarity,
      tokens1,
      tokens2
    );
    
    // If very dissimilar, don't run expensive NLP processing
    if (jaccardScore < 0.1) {
      cache.setSimilarity(text1, text2, jaccardScore);
      return jaccardScore;
    }
  }
  
  // Fallback to the complete similarity calculation for complex cases
  const score = await profiler.profileAsync(
    'fullSimilarityCalculation',
    originalCalculateSimilarity,
    text1,
    text2,
    tokenizer,
    stemmer,
    nlpManager
  );
  
  // Store in cache
  cache.setSimilarity(text1, text2, score);
  
  return score;
}

/**
 * Optimized version of extractSearchFilters with caching and performance improvements
 * @param query Search query in natural language
 * @param nlpManager NLP manager instance
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @returns Extracted search filters
 */
export async function extractSearchFilters(
  query: string,
  nlpManager: NlpManager,
  tokenizer: Tokenizer | null,
  stemmer: Stemmer | null
): Promise<ExtractedSearchFilters> {
  const profiler = getNlpProfiler();
  const cache = getNlpCache();
  
  // Check cache first
  const cachedFilters = cache.getExtractedFilters(query);
  if (cachedFilters) {
    return cachedFilters;
  }
  
  // Extract filters with profiling
  const result = await profiler.profileAsync(
    'extractSearchFilters',
    originalExtractSearchFilters,
    query,
    nlpManager,
    tokenizer,
    stemmer
  );
  
  // Store in cache
  cache.setExtractedFilters(query, result);
  
  return result;
}

/**
 * Calculate bulk similarity scores efficiently
 * @param target Target text to compare against
 * @param texts Array of texts to compare
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @param nlpManager NLP manager instance
 * @param threshold Minimum similarity threshold
 * @returns Array of [index, score] pairs for texts above threshold
 */
export async function bulkCalculateSimilarity(
  target: string,
  texts: string[],
  tokenizer: Tokenizer | null,
  stemmer: Stemmer | null,
  nlpManager: NlpManager,
  threshold: number = 0.1
): Promise<[number, number][]> {
  const profiler = getNlpProfiler();
  const cache = getNlpCache();
  
  // Normalize the target text
  const normalizedTarget = normalizeText(target);
  
  // First pass: Get quick estimates using tokenization and Jaccard similarity
  const firstPassResults = texts.map((text, index) => {
    // Check cache first
    const cachedScore = cache.getSimilarity(target, text);
    if (cachedScore !== null) {
      return [index, cachedScore] as [number, number];
    }
    
    // Normalize text
    const normalizedText = normalizeText(text);
    
    // If identical, score is 1
    if (normalizedTarget === normalizedText) {
      cache.setSimilarity(target, text, 1);
      return [index, 1] as [number, number];
    }
    
    // If either is empty, score is 0
    if (!normalizedTarget || !normalizedText) {
      cache.setSimilarity(target, text, 0);
      return [index, 0] as [number, number];
    }
    
    // Fast path for very different lengths
    const lengthRatio = Math.min(normalizedTarget.length, normalizedText.length) / 
                        Math.max(normalizedTarget.length, normalizedText.length);
    if (lengthRatio < 0.3) {
      const score = lengthRatio * 0.5; // At most 0.15 similarity for very different lengths
      cache.setSimilarity(target, text, score);
      return [index, score] as [number, number];
    }
    
    // Tokenize and calculate Jaccard similarity
    const targetTokens = tokenizeAndNormalize(normalizedTarget);
    const textTokens = tokenizeAndNormalize(normalizedText);
    
    // For even faster processing, use stemmed tokens
    const targetStems = profiler.profileSync('stemTokens', stemTokens, targetTokens);
    const textStems = profiler.profileSync('stemTokens', stemTokens, textTokens);
    
    const jaccardScore = profiler.profileSync(
      'jaccardSimilarity',
      jaccardSimilarity,
      targetStems,
      textStems
    );
    
    return [index, jaccardScore] as [number, number];
  });
  
  // Filter those that might meet the threshold
  const potentialMatches = firstPassResults
    .filter(([, score]) => score >= threshold * 0.7) // Be generous in first pass
    .sort(([, a], [, b]) => b - a); // Sort by descending score
  
  // Second pass: Calculate full similarity for potential matches
  const secondPassResults = await Promise.all(
    potentialMatches.map(async ([index, firstPassScore]) => {
      // If first pass score is very high, just use it
      if (firstPassScore > 0.8) {
        cache.setSimilarity(target, texts[index], firstPassScore);
        return [index, firstPassScore] as [number, number];
      }
      
      // Otherwise calculate full similarity
      const fullScore = await calculateSimilarity(
        target,
        texts[index],
        tokenizer,
        stemmer,
        nlpManager
      );
      
      return [index, fullScore] as [number, number];
    })
  );
  
  // Filter by threshold and sort by score
  return secondPassResults
    .filter(([, score]) => score >= threshold)
    .sort(([, a], [, b]) => b - a);
}