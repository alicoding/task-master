/**
 * Stemming utilities for NLP processing
 *
 * This module provides functions for stemming words in English text.
 * Stemming reduces words to their base or root form by removing suffixes,
 * which helps normalize different forms of the same word for search and
 * analysis purposes.
 *
 * The implementation is a simplified version of popular stemming algorithms
 * like Porter or Snowball, focusing on common English morphological patterns.
 * It handles:
 * - Plurals (-s, -es, -ies)
 * - Verb forms (-ing, -ed)
 * - Adverbs (-ly)
 *
 * @module NlpStemmingUtils
 */
/**
 * Simple stemmer that handles common English word endings
 *
 * This function reduces words to their root form by removing common English
 * suffixes. It handles:
 *
 * 1. Plural forms:
 *    - '-ies' → '-y' (e.g., 'stories' → 'story')
 *    - '-es' → '' (e.g., 'boxes' → 'box')
 *    - '-s' → '' (e.g., 'cats' → 'cat')
 *
 * 2. Verb forms:
 *    - '-ing' → '' (e.g., 'running' → 'run')
 *    - '-ed' → '' (e.g., 'walked' → 'walk')
 *
 * 3. Other:
 *    - '-ly' → '' (e.g., 'quickly' → 'quick')
 *
 * The function also handles doubled consonants in certain cases:
 *    - 'running' → 'run' (not 'runn')
 *    - 'stopped' → 'stop' (not 'stope')
 *
 * @param {string} word - The word to stem
 * @returns {string} The stemmed version of the word
 * @example
 * // Returns 'cat'
 * stemWord('cats')
 *
 * @example
 * // Returns 'story'
 * stemWord('stories')
 *
 * @example
 * // Returns 'run'
 * stemWord('running')
 */
export declare function stemWord(word: string): string;
/**
 * Helper function to check if a character is a consonant
 *
 * Determines if a given character is a consonant by checking if it's
 * not one of the English vowels (a, e, i, o, u). This is used by the
 * stemming algorithm to handle special cases like doubled consonants.
 *
 * @param {string} char - A single character to check
 * @returns {boolean} true if the character is a consonant, false if it's a vowel
 * @example
 * // Returns true
 * isConsonant('b')
 *
 * @example
 * // Returns false
 * isConsonant('a')
 *
 * @example
 * // Case insensitive - returns true
 * isConsonant('T')
 */
export declare function isConsonant(char: string): boolean;
/**
 * Apply stemming to an array of tokens
 *
 * This function applies the stemWord function to each token in an array,
 * converting a collection of words to their stemmed forms. This is particularly
 * useful for processing tokenized text in preparation for search or analysis.
 *
 * @param {string[]} tokens - Array of word tokens to stem
 * @returns {string[]} Array of stemmed tokens in the same order as the input
 * @example
 * // Returns ['cat', 'dog', 'run']
 * stemTokens(['cats', 'dogs', 'running'])
 *
 * @example
 * // Returns ['quick', 'brown', 'fox', 'jump']
 * stemTokens(['quickly', 'brown', 'foxes', 'jumping'])
 *
 * @see stemWord - The underlying function used to stem each individual token
 */
export declare function stemTokens(tokens: string[]): string[];
