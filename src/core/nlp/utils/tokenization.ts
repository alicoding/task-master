/**
 * Tokenization utilities for NLP processing
 *
 * This module provides functions for tokenizing and normalizing text input
 * for natural language processing operations. These utilities are essential
 * for preparing text for search, matching, and analysis operations within
 * the Task Master application.
 *
 * The module includes functions for:
 * - Basic tokenization (splitting text into words)
 * - Normalization (removing special characters, standardizing case)
 * - Combined tokenization and normalization for search operations
 *
 * @module NlpTokenizationUtils
 */

/**
 * Tokenize and normalize a string for search operations
 *
 * This function processes text by:
 * 1. Converting to lowercase
 * 2. Replacing non-alphanumeric characters with spaces
 * 3. Splitting on whitespace
 * 4. Filtering out tokens shorter than 3 characters
 * 5. Removing duplicate tokens
 *
 * This is particularly useful for preparing text for search operations
 * where we want to match on significant terms while ignoring case,
 * punctuation, and common short words.
 *
 * @param {string} text - The input text to tokenize and normalize
 * @returns {string[]} An array of unique, normalized tokens
 * @example
 * // Returns ['hello', 'world']
 * tokenizeAndNormalize('Hello, world!')
 *
 * @example
 * // Returns ['example', 'duplicate', 'removal']
 * tokenizeAndNormalize('Example of duplicate removal, duplicate example')
 */
export function tokenizeAndNormalize(text: string): string[] {
  // Handle null/undefined inputs
  if (text == null) return [];
  if (typeof text !== 'string') return [];

  // Lowercase and split on non-alphanumeric characters
  const tokens = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2); // Filter out short tokens
    
  // Remove duplicates
  return [...new Set(tokens)];
}

/**
 * Simple tokenizer that splits text into words
 *
 * A more basic tokenization function that:
 * 1. Converts text to lowercase
 * 2. Replaces non-alphanumeric characters with spaces
 * 3. Splits on whitespace
 * 4. Removes empty tokens
 *
 * Unlike tokenizeAndNormalize, this function:
 * - Preserves short words (1-2 characters)
 * - Does not remove duplicates
 *
 * This is useful for cases where you need all tokens, including short ones
 * and repeated occurrences.
 *
 * @param {string} text - The input text to tokenize
 * @returns {string[]} An array of all tokens in the text
 * @example
 * // Returns ['hello', 'world']
 * tokenize('Hello, world!')
 *
 * @example
 * // Returns ['this', 'is', 'an', 'example', 'with', 'short', 'words']
 * tokenize('This is an example with short words')
 *
 * @example
 * // Returns ['duplicate', 'duplicate', 'words', 'are', 'preserved']
 * tokenize('Duplicate duplicate words are preserved')
 */
export function tokenize(text: string): string[] {
  // Handle null/undefined inputs
  if (text == null) return [];
  if (typeof text !== 'string') return [];

  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.trim().length > 0);
}

/**
 * Normalize text for comparison by removing special characters and extra whitespace
 *
 * This function standardizes text by:
 * 1. Converting to lowercase
 * 2. Replacing non-alphanumeric characters with spaces
 * 3. Collapsing multiple whitespace characters into a single space
 * 4. Trimming leading and trailing whitespace
 *
 * Unlike the tokenization functions, this preserves the text as a single string
 * rather than splitting it into tokens. This is useful for text comparison
 * and preparing text for further processing where you want to maintain
 * word order and proximity.
 *
 * @param {string} text - The input text to normalize
 * @returns {string} The normalized text as a single string
 * @example
 * // Returns "hello world"
 * normalizeText('Hello, world!')
 *
 * @example
 * // Returns "multiple spaces collapsed"
 * normalizeText('Multiple    spaces    collapsed')
 *
 * @example
 * // Returns "special characters removed"
 * normalizeText('Special-characters & (removed)!')
 */
export function normalizeText(text: string): string {
  // Handle null/undefined inputs
  if (text == null) return '';
  if (typeof text !== 'string') return String(text);

  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}