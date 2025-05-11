/**
 * String distance and similarity utilities for NLP processing
 *
 * This module provides functions for calculating string similarity and distance metrics
 * used in natural language processing operations. These utilities are particularly useful
 * for fuzzy matching, search operations, and determining how similar strings or token sets are.
 *
 * @module NlpDistanceUtils
 */

/**
 * Calculate Levenshtein edit distance between two strings
 * @param s1 First string
 * @param s2 Second string
 * @returns Edit distance (lower is more similar)
 */
export function levenshteinDistance(s1: string, s2: string): number {
  // Handle null/undefined inputs
  if (s1 == null) s1 = '';
  if (s2 == null) s2 = '';

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i++) {
    track[0][i] = i;
  }

  for (let j = 0; j <= s2.length; j++) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return track[s2.length][s1.length];
}

/**
 * Calculate fuzzy similarity score between two strings
 * using normalized Levenshtein distance
 * @param s1 First string
 * @param s2 Second string
 * @returns Similarity score (0-1, with 1 being identical)
 */
export function fuzzyScore(s1: string, s2: string): number {
  // Handle null/undefined inputs
  if (s1 == null) s1 = '';
  if (s2 == null) s2 = '';

  // Normalize strings
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  
  // If either string is empty, return 0
  if (!s1.length || !s2.length) return 0;
  
  // If strings are identical, return 1
  if (s1 === s2) return 1;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  
  // Normalize by the length of the longer string
  const maxLength = Math.max(s1.length, s2.length);
  
  // Convert distance to a similarity score (0-1)
  return 1 - (distance / maxLength);
}

/**
 * Calculate Jaccard similarity between two sets of tokens
 * @param tokens1 First set of tokens
 * @param tokens2 Second set of tokens
 * @returns Similarity score (0-1, with 1 being identical)
 */
export function calculateJaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  // Handle null/undefined inputs
  if (tokens1 == null) tokens1 = [];
  if (tokens2 == null) tokens2 = [];

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  // For tests, empty arrays should return 0
  if (set1.size === 0 || set2.size === 0) return 0;
  
  // Calculate intersection size
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calculate union size
  const union = new Set([...set1, ...set2]);
  
  // Return Jaccard index
  return intersection.size / union.size;
}