/**
 * nlp-distance.vitest.ts - Tests for NLP distance/similarity functions
 * 
 * Definition of Done:
 * ✅ Tests verify Levenshtein distance calculation
 * ✅ Tests verify fuzzy score calculation
 * ✅ Tests verify Jaccard similarity calculation
 * ✅ Tests handle edge cases (empty strings, identical strings)
 * ✅ Tests verify jaccardSimilarity alias function
 */

import { describe, it, expect } from 'vitest';
import { 
  levenshteinDistance, 
  fuzzyScore, 
  calculateJaccardSimilarity,
  jaccardSimilarity
} from '../../core/nlp/utils/distance';

describe('NLP Distance Utilities', () => {
  describe('levenshteinDistance', () => {
    it('should calculate correct edit distance', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });
    
    it('should handle edge cases', () => {
      expect(levenshteinDistance('', '')).toBe(0);
      expect(levenshteinDistance('test', '')).toBe(4);
      expect(levenshteinDistance('', 'test')).toBe(4);
      // @ts-ignore - intentionally testing null handling
      expect(levenshteinDistance(null, 'test')).toBe(4);
      // @ts-ignore - intentionally testing undefined handling
      expect(levenshteinDistance(undefined, 'test')).toBe(4);
    });
  });
  
  describe('fuzzyScore', () => {
    it('should calculate correct similarity scores', () => {
      expect(fuzzyScore('hello', 'hello')).toBe(1);
      expect(fuzzyScore('hello', 'helo')).toBeCloseTo(0.8, 1);
      expect(fuzzyScore('completely different', 'not the same at all')).toBeLessThan(0.5);
    });
    
    it('should normalize strings for comparison', () => {
      expect(fuzzyScore('Hello', 'hello')).toBe(1);
      expect(fuzzyScore(' test ', 'test')).toBe(1);
    });
    
    it('should handle edge cases', () => {
      expect(fuzzyScore('', '')).toBe(0);
      expect(fuzzyScore('test', '')).toBe(0);
      // @ts-ignore - intentionally testing null handling
      expect(fuzzyScore(null, 'test')).toBe(0);
      // @ts-ignore - intentionally testing undefined handling
      expect(fuzzyScore(undefined, 'test')).toBe(0);
    });
  });
  
  describe('calculateJaccardSimilarity', () => {
    it('should calculate correct Jaccard similarity', () => {
      expect(calculateJaccardSimilarity(
        ['this', 'is', 'a', 'test'],
        ['this', 'is', 'another', 'test']
      )).toBe(0.6);
      
      expect(calculateJaccardSimilarity(
        ['apple', 'banana', 'orange'],
        ['apple', 'banana', 'orange']
      )).toBe(1);
      
      expect(calculateJaccardSimilarity(
        ['apple', 'banana', 'orange'],
        ['grape', 'kiwi', 'melon']
      )).toBe(0);
    });
    
    it('should handle edge cases', () => {
      expect(calculateJaccardSimilarity([], [])).toBe(0);
      expect(calculateJaccardSimilarity(['test'], [])).toBe(0);
      // @ts-ignore - intentionally testing null handling
      expect(calculateJaccardSimilarity(null, ['test'])).toBe(0);
      // @ts-ignore - intentionally testing undefined handling
      expect(calculateJaccardSimilarity(undefined, ['test'])).toBe(0);
    });
  });
  
  describe('jaccardSimilarity', () => {
    it('should be an alias for calculateJaccardSimilarity', () => {
      const tokens1 = ['this', 'is', 'a', 'test'];
      const tokens2 = ['this', 'is', 'another', 'test'];
      
      expect(jaccardSimilarity(tokens1, tokens2)).toBe(calculateJaccardSimilarity(tokens1, tokens2));
    });
    
    it('should handle all the same edge cases', () => {
      expect(jaccardSimilarity([], [])).toBe(0);
      expect(jaccardSimilarity(['test'], [])).toBe(0);
      // @ts-ignore - intentionally testing null handling
      expect(jaccardSimilarity(null, ['test'])).toBe(0);
      // @ts-ignore - intentionally testing undefined handling
      expect(jaccardSimilarity(undefined, ['test'])).toBe(0);
    });
  });
});