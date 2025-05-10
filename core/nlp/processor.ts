/**
 * Processor module for NLP service
 * Handles processing queries and calculating similarity
 */
import { NlpManager } from 'node-nlp-typescript';
import { ProcessedQuery, ExtractedSearchFilters } from './types.js';
import { ENTITY_TERMS_TO_REMOVE } from './entities.js';

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
  tokenizer: any,
  stemmer: any
): Promise<ProcessedQuery> {
  // Normalize the query
  const normalizedQuery = query.toLowerCase().trim();
  
  // Tokenize the query
  const tokens = tokenizer.tokenize(normalizedQuery);
  
  // Get stems for each token
  const stems = tokens
    .filter(token => token.length > 2)
    .map(token => stemmer.stem(token));
  
  // Process the query with NLP manager
  const result = await nlpManager.process('en', normalizedQuery);
  
  // Extract entities by type
  const entities: Record<string, string[]> = {};
  for (const entity of result.entities) {
    const type = entity.entity;
    entities[type] = entities[type] || [];
    entities[type].push(entity.option);
  }
  
  // Extract intents
  const intents = result.intents
    .filter(intent => intent.score > 0.3)
    .map(intent => ({
      name: intent.intent,
      score: intent.score
    }));
  
  return {
    original: query,
    normalizedQuery,
    tokens,
    stems,
    entities,
    intents
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
  tokenizer: any,
  stemmer: any,
  nlpManager: NlpManager
): Promise<number> {
  // Normalize texts
  const norm1 = text1.toLowerCase().trim();
  const norm2 = text2.toLowerCase().trim();
  
  // If either is empty, similarity is 0
  if (!norm1 || !norm2) return 0;
  
  // If identical, similarity is 1
  if (norm1 === norm2) return 1;
  
  // Tokenize both texts
  const tokens1 = tokenizer.tokenize(norm1);
  const tokens2 = tokenizer.tokenize(norm2);
  
  // Get stems for both texts
  const stems1 = tokens1
    .filter(token => token.length > 2)
    .map(token => stemmer.stem(token));
  
  const stems2 = tokens2
    .filter(token => token.length > 2)
    .map(token => stemmer.stem(token));
  
  // Calculate Jaccard similarity on stems
  const intersection = stems1.filter(stem => stems2.includes(stem));
  const unionSet = new Set([...stems1, ...stems2]);
  const union = Array.from(unionSet);
  
  const jaccardSimilarity = intersection.length / union.length;
  
  // Process both texts with NLP manager to get cosine similarity
  const result1 = await nlpManager.process('en', norm1);
  const result2 = await nlpManager.process('en', norm2);
  
  // Extract intents and compare
  const intents1 = result1.intents.map(intent => intent.intent);
  const intents2 = result2.intents.map(intent => intent.intent);
  
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
  return (jaccardSimilarity * weight) + (intentSimilarity * (1 - weight));
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
  tokenizer: any,
  stemmer: any
): Promise<ExtractedSearchFilters> {
  // Process the query
  const processed = await processQuery(query, nlpManager, tokenizer, stemmer);
  
  // Initialize result
  const result: ExtractedSearchFilters = {
    query: processed.original,
    extractedTerms: []
  };
  
  // Extract status
  if (processed.entities.status && processed.entities.status.length > 0) {
    result.status = processed.entities.status[0];
    result.extractedTerms.push(`status:${result.status}`);
  }
  
  // Extract readiness
  if (processed.entities.readiness && processed.entities.readiness.length > 0) {
    result.readiness = processed.entities.readiness[0];
    result.extractedTerms.push(`readiness:${result.readiness}`);
  }
  
  // Extract priority
  if (processed.entities.priority && processed.entities.priority.length > 0) {
    result.priority = processed.entities.priority[0];
    result.extractedTerms.push(`priority:${result.priority}`);
  }
  
  // Extract action types from intents
  const actionIntents = processed.intents
    .filter(intent => intent.name.startsWith('search.action.'))
    .map(intent => intent.name.split('.')[2]);
  
  if (actionIntents.length > 0) {
    result.actionTypes = actionIntents;
    result.extractedTerms.push(...actionIntents.map(action => `action:${action}`));
  }
  
  // Clean query of extracted terms
  const cleanedQuery = removeExtractedTerms(processed.original, result.extractedTerms);
  
  // If we have a cleaned query that differs from the original, use it
  if (cleanedQuery !== processed.original) {
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