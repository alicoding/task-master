/**
 * String distance and similarity utilities for NLP processing
 *
 * This module provides functions for calculating string similarity and distance metrics
 * used in natural language processing operations. These utilities are particularly useful
 * for fuzzy matching, search operations, and determining how similar strings or token sets are.
 *
 * The module includes:
 * - Levenshtein edit distance for character-level string comparison
 * - Fuzzy scoring based on normalized Levenshtein distance
 * - Jaccard similarity for token set comparison
 *
 * @module NlpDistanceUtils
 */
/**
 * Calculate Levenshtein edit distance between two strings
 * @param s1 First string
 * @param s2 Second string
 * @returns Edit distance (lower is more similar)
 */
export declare function levenshteinDistance(s1: string, s2: string): number;
/**
 * Calculate fuzzy similarity score between two strings
 * using normalized Levenshtein distance
 * @param s1 First string
 * @param s2 Second string
 * @returns Similarity score (0-1, with 1 being identical)
 */
export declare function fuzzyScore(s1: string, s2: string): number;
/**
 * Calculate Jaccard similarity between two sets of tokens
 * @param tokens1 First set of tokens
 * @param tokens2 Second set of tokens
 * @returns Similarity score (0-1, with 1 being identical)
 */
export declare function calculateJaccardSimilarity(tokens1: string[], tokens2: string[]): number;
/**
 * Alias for calculateJaccardSimilarity for backward compatibility
 * @param tokens1 First set of tokens
 * @param tokens2 Second set of tokens
 * @returns Similarity score (0-1, with 1 being identical)
 */
export declare const jaccardSimilarity: typeof calculateJaccardSimilarity;
