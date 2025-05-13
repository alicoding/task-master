/**
 * Synonym expansion utilities for NLP processing
 *
 * This module provides functions for expanding search terms with synonyms
 * to improve search recall in task management contexts. It uses a predefined
 * mapping of common task management terminology and their synonyms to enhance
 * search queries.
 *
 * The module includes:
 * - A static mapping of common task management terms and their synonyms
 * - Functions to retrieve synonyms for specific words
 * - Query expansion functionality to automatically include synonyms in searches
 *
 * This is particularly useful for natural language interfaces where users
 * might use different terminology than what's used in the system.
 *
 * @module NlpSynonymUtils
 */

import { tokenizeAndNormalize } from './tokenization';

/**
 * A mapping of common task management terms and their synonyms
 *
 * This dictionary provides synonyms for:
 * - Task status terms (todo, in-progress, done)
 * - Task readiness states (draft, ready, blocked)
 * - Common action verbs used in tasks (create, update, remove, fix, review)
 *
 * The map uses the canonical term as the key and provides an array of
 * alternative terms (synonyms) as values.
 *
 * This constant is used by the synonym expansion functions to enhance
 * search capabilities by recognizing different ways users might express
 * the same concept.
 *
 * @type {Record<string, string[]>}
 */
export const synonymMap: Record<string, string[]> = {
  // Status synonyms
  'todo': ['pending', 'new', 'backlog', 'later', 'upcoming'],
  'in-progress': ['doing', 'working', 'ongoing', 'active', 'current', 'wip'],
  'done': ['completed', 'finished', 'resolved', 'closed'],
  
  // Readiness synonyms
  'draft': ['planning', 'idea', 'concept', 'proposed'],
  'ready': ['actionable', 'prepared', 'available', 'good-to-go'],
  'blocked': ['stuck', 'waiting', 'dependent', 'halted'],
  
  // Common action verbs in tasks
  'create': ['make', 'build', 'develop', 'implement', 'add'],
  'update': ['modify', 'change', 'edit', 'revise', 'improve'],
  'remove': ['delete', 'eliminate', 'destroy', 'drop', 'uninstall'],
  'fix': ['repair', 'resolve', 'correct', 'debug'],
  'review': ['examine', 'analyze', 'check', 'inspect', 'audit']
};

/**
 * Look up synonyms for a word
 *
 * This function searches for synonyms of a given word in two ways:
 * 1. If the word is a key in the synonym map, it returns all its synonyms
 * 2. If the word is a value in the synonym map, it returns the key and all other
 *    synonyms for that key
 *
 * The function is case-insensitive, converting all inputs to lowercase
 * for consistent matching.
 *
 * @param {string} word - The word to find synonyms for
 * @returns {string[]} An array of synonyms (empty if none found)
 * @example
 * // Returns ['pending', 'new', 'backlog', 'later', 'upcoming']
 * getSynonyms('todo')
 *
 * @example
 * // Returns ['todo', 'pending', 'backlog', 'later', 'upcoming']
 * getSynonyms('new')
 *
 * @example
 * // Returns []
 * getSynonyms('unrelated')
 */
export function getSynonyms(word: string): string[] {
  // Handle null/undefined inputs
  if (word == null) return [];
  if (typeof word !== 'string') return [];

  word = word.toLowerCase();
  
  // Check if the word is a key in the map
  if (word in synonymMap) {
    return synonymMap[word];
  }
  
  // Check if the word is a synonym in the map
  for (const [key, synonyms] of Object.entries(synonymMap)) {
    if (synonyms.includes(word)) {
      return [key, ...synonyms.filter(s => s !== word)];
    }
  }
  
  return [];
}

/**
 * Expand a search query with synonyms to improve search results
 *
 * This function takes a search query string, tokenizes it, and then expands
 * each token with its synonyms from the synonym map. The expansion process:
 *
 * 1. Tokenizes and normalizes the input query
 * 2. For each token, checks if it's a key or value in the synonym map
 * 3. If found, adds the canonical term and all its synonyms to the result
 * 4. Removes duplicates from the final result
 *
 * This is particularly useful for improving search recall by allowing
 * matches on synonymous terms that weren't explicitly mentioned in the
 * original query.
 *
 * @param {string} query - The original search query
 * @returns {string[]} An expanded array of tokens including the original terms
 *                     and their synonyms
 * @example
 * // Returns ['todo', 'pending', 'new', 'backlog', 'later', 'upcoming']
 * // when synonymMap contains the appropriate mappings
 * expandWithSynonyms('todo')
 *
 * @example
 * // Returns ['create', 'api', 'make', 'build', 'develop', 'implement', 'add']
 * // when synonymMap contains synonyms for 'create'
 * expandWithSynonyms('create api')
 */
export function expandWithSynonyms(query: string): string[] {
  // Handle null/undefined inputs
  if (query == null) return [];
  if (typeof query !== 'string') return [];

  // Tokenize query and normalize
  const tokens = tokenizeAndNormalize(query);
  const expanded = [...tokens];
  
  // Add synonyms for each token
  for (const token of tokens) {
    // Look for direct matches in the synonym map
    for (const [word, synonyms] of Object.entries(synonymMap)) {
      if (token === word || synonyms.includes(token)) {
        // Add the main word and all its synonyms
        expanded.push(word);
        expanded.push(...synonyms);
      }
    }
  }
  
  // Remove duplicates and return
  return [...new Set(expanded)];
}