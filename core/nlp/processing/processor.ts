/**
 * Processor module for NLP service
 * Handles processing queries and calculating similarity
 */
import { NlpManager } from '../types.ts';
import { ProcessedQuery, ExtractedSearchFilters } from '../types.ts';
import { ENTITY_TERMS_TO_REMOVE } from './entities.ts';
import { calculateJaccardSimilarity } from '../utils/distance.ts';

/**
 * Interface for tokenizer
 */
export interface Tokenizer {
  tokenize(text: string): string[];
}

/**
 * Interface for stemmer
 */
export interface Stemmer {
  stem(word: string): string;
}

/**
 * Process a search query to extract intents and entities
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
  // Handle null/undefined inputs
  if (query == null) query = '';

  // Normalize the query
  const normalized = query.toLowerCase().trim();

  // Tokenize the query with fallback
  const tokens = tokenizer?.tokenize ? tokenizer.tokenize(normalized) : normalized.split(/\s+/);

  // Get stems for each token with fallback
  const stems = tokens
    .filter(token => token.length > 2)
    .map(token => stemmer?.stem ? stemmer.stem(token) : token.toLowerCase());

  // Process the query with NLP manager
  const result = await nlpManager.process('en', normalized);

  // Extract entities by type with safety check
  const entities: Record<string, string[]> = {};
  for (const entity of result?.entities || []) {
    const type = entity.entity;
    entities[type] = entities[type] || [];
    entities[type].push(entity.option);
  }

  // Extract intent
  const intent = result?.intents?.length > 0 ? result.intents[0].intent : null;

  // Extract intents for backward compatibility with tests
  const intents = result?.intents || [];

  // Add normalizedQuery for backward compatibility
  const normalizedQuery = normalized;

  // Extract specific attributes from entities
  const status = entities.status?.[0] || null;
  const readiness = entities.readiness?.[0] || null;
  const tags = entities.tag || [];

  return {
    original: query,
    normalized,
    normalizedQuery,
    tokens,
    stems,
    intent,
    intents,
    entities,
    tags,
    status,
    readiness
  };
}

/**
 * Calculate similarity score between two texts
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
  // Handle null/undefined inputs
  if (text1 == null) text1 = '';
  if (text2 == null) text2 = '';
  if (typeof text1 !== 'string') text1 = String(text1);
  if (typeof text2 !== 'string') text2 = String(text2);

  // Normalize texts
  const norm1 = text1.toLowerCase().trim();
  const norm2 = text2.toLowerCase().trim();
  
  // If either is empty, similarity is 0
  if (!norm1 || !norm2) return 0;
  
  // If identical, similarity is 1
  if (norm1 === norm2) return 1;
  
  // Tokenize both texts with fallback
  const tokens1 = tokenizer?.tokenize ? tokenizer.tokenize(norm1) : norm1.split(/\s+/);
  const tokens2 = tokenizer?.tokenize ? tokenizer.tokenize(norm2) : norm2.split(/\s+/);
  
  // Get stems for both texts with fallback
  const stems1 = tokens1
    .filter(token => token.length > 2)
    .map(token => stemmer?.stem ? stemmer.stem(token) : token.toLowerCase());

  const stems2 = tokens2
    .filter(token => token.length > 2)
    .map(token => stemmer?.stem ? stemmer.stem(token) : token.toLowerCase());
  
  // Calculate Jaccard similarity on stems
  const jaccardScore = calculateJaccardSimilarity(stems1, stems2);
  
  // Process both texts with NLP manager to get cosine similarity
  const result1 = await nlpManager.process('en', norm1);
  const result2 = await nlpManager.process('en', norm2);

  // Extract intents and compare - ensure they exist
  const intents1 = result1?.intents?.map(intent => intent.intent) || [];
  const intents2 = result2?.intents?.map(intent => intent.intent) || [];
  
  // Calculate intent similarity (if any intents were found)
  let intentSimilarity = 0;
  if (intents1.length > 0 && intents2.length > 0) {
    const intentIntersection = intents1.filter(intent => intents2.includes(intent));
    const intentUnion = [...new Set([...intents1, ...intents2])];
    intentSimilarity = intentIntersection.length / intentUnion.length;
  }
  
  // Combine jaccard and intent similarity for final score
  // Weight jaccard similarity more heavily if no intents were found
  const weight = (intents1.length > 0 && intents2.length > 0) ? 0.5 : 0.8;
  return (jaccardScore * weight) + (intentSimilarity * (1 - weight));
}

/**
 * Extract search filters from a natural language query
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
  // Process the query
  const processed = await processQuery(query, nlpManager, tokenizer, stemmer);

  // Initialize result
  const result: ExtractedSearchFilters = {};

  // Track extracted terms for test compatibility
  const extractedTerms: string[] = [];

  // Extract status
  if (processed.status) {
    result.status = processed.status;
    extractedTerms.push(`status:${processed.status}`);
  }

  // Extract readiness
  if (processed.readiness) {
    result.readiness = processed.readiness;
    extractedTerms.push(`readiness:${processed.readiness}`);
  }

  // Extract tags
  if (processed.tags && processed.tags.length > 0) {
    result.tags = processed.tags;
    for (const tag of processed.tags) {
      extractedTerms.push(`tag:${tag}`);
    }
  }

  // Extract priority if available
  if (processed.entities.priority && processed.entities.priority.length > 0) {
    result.priority = processed.entities.priority[0];
    extractedTerms.push(`priority:${result.priority}`);
  }

  // Extract action type for test compatibility
  if (processed.intent?.includes('search.action.')) {
    const action = processed.intent.split('.').pop();
    if (action) {
      result.actionTypes = [action];
      extractedTerms.push(`action:${action}`);
    }
  }

  // Add extracted terms for test compatibility
  result.extractedTerms = extractedTerms;

  // Set query with cleaned terms
  let cleanedQuery = processed.normalized;

  // Clean up multiple spaces and set query
  cleanedQuery = cleanedQuery.replace(/\s+/g, ' ').trim();

  if (cleanedQuery) {
    result.query = cleanedQuery;
  }

  return result;
}

/**
 * Remove extracted terms from the query string
 * @param query Original query
 * @param terms Terms to remove
 * @returns Cleaned query
 */
export function removeExtractedTerms(query: string, terms: string[]): string {
  // Create a list of words to remove
  const wordsToRemove = new Set<string>();
  
  // For each term, add related words to remove
  for (const term of terms) {
    const [type, value] = term.split(':');
    
    if (
      type in ENTITY_TERMS_TO_REMOVE && 
      value in ENTITY_TERMS_TO_REMOVE[type]
    ) {
      for (const word of ENTITY_TERMS_TO_REMOVE[type][value]) {
        wordsToRemove.add(word);
      }
    }
  }
  
  // Build regex to match whole words
  const wordBoundary = '\\b';
  const regexParts = Array.from(wordsToRemove)
    .map(word => wordBoundary + word + wordBoundary);
  
  if (regexParts.length === 0) {
    return query;
  }
  
  const regex = new RegExp(regexParts.join('|'), 'gi');
  
  // Replace all matches with empty string
  let cleanedQuery = query.replace(regex, '');
  
  // Clean up whitespace
  cleanedQuery = cleanedQuery.replace(/\s+/g, ' ').trim();
  
  return cleanedQuery;
}