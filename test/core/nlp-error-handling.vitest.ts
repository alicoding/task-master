/**
 * NLP Error Handling Tests
 * Verifies proper error handling in NLP processing components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NlpService } from '../../core/nlp-service.ts';
import * as distance from '../../core/nlp/utils/distance.ts';
import * as stemming from '../../core/nlp/utils/stemming.ts';
import * as tokenization from '../../core/nlp/utils/tokenization.ts';
import * as synonyms from '../../core/nlp/utils/synonyms.ts';

describe('NLP Error Handling', () => {
  let nlpService: NlpService;
  
  beforeEach(() => {
    nlpService = new NlpService();
  });
  
  describe('NLPService Error Handling', () => {
    it('handles null or undefined input gracefully', async () => {
      // @ts-ignore - Intentionally passing null for testing
      const result1 = await nlpService.extractSearchFilters(null);
      expect(result1).toBeDefined();
      expect(result1.query).toBe('');
      
      // @ts-ignore - Intentionally passing undefined for testing
      const result2 = await nlpService.extractSearchFilters(undefined);
      expect(result2).toBeDefined();
      expect(result2.query).toBe('');
    });
    
    it('handles empty string input gracefully', async () => {
      const result = await nlpService.extractSearchFilters('');
      expect(result).toBeDefined();
      expect(result.query).toBe('');
      expect(result.extractedTerms).toEqual([]);
    });
    
    it('handles malformed or extremely long input gracefully', async () => {
      // Very long input
      const longInput = 'a'.repeat(10000);
      const result1 = await nlpService.extractSearchFilters(longInput);
      
      expect(result1).toBeDefined();
      expect(result1.query).toBeDefined();
      
      // Malformed input with special characters
      const malformedInput = '!@#$%^&*()_+<>?:"{}|~`';
      const result2 = await nlpService.extractSearchFilters(malformedInput);
      
      expect(result2).toBeDefined();
      expect(result2.query).toBeDefined();
    });
    
    it('recovers from internal processing errors', async () => {
      // Mock a failing internal method
      const originalExtractMethod = nlpService['extractStatusAndReadiness'];
      
      // @ts-ignore - Accessing private method for testing
      nlpService['extractStatusAndReadiness'] = vi.fn().mockImplementation(() => {
        throw new Error('Simulated internal error');
      });
      
      // Service should still return a valid response
      const result = await nlpService.extractSearchFilters('find important tasks');
      
      expect(result).toBeDefined();
      expect(result.query).toBe('find important tasks');
      expect(Array.isArray(result.extractedTerms)).toBe(true);
      
      // Restore original method
      // @ts-ignore - Accessing private method for testing
      nlpService['extractStatusAndReadiness'] = originalExtractMethod;
    });
  });
  
  describe('NLP Utility Functions Error Handling', () => {
    describe('Distance Calculations', () => {
      it('handles null or undefined input in levenshteinDistance', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => distance.levenshteinDistance(null, 'test')).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => distance.levenshteinDistance('test', undefined)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => distance.levenshteinDistance(null, null)).not.toThrow();
      });
      
      it('handles edge cases in levenshteinDistance', () => {
        expect(distance.levenshteinDistance('', '')).toBe(0);
        expect(distance.levenshteinDistance('test', '')).toBe(4);
        expect(distance.levenshteinDistance('', 'test')).toBe(4);
      });
      
      it('handles null or undefined input in calculateJaccardSimilarity', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => distance.calculateJaccardSimilarity(null, ['test'])).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => distance.calculateJaccardSimilarity(['test'], undefined)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => distance.calculateJaccardSimilarity(null, null)).not.toThrow();
      });
      
      it('handles empty arrays in calculateJaccardSimilarity', () => {
        expect(distance.calculateJaccardSimilarity([], [])).toBe(0);
        expect(distance.calculateJaccardSimilarity(['test'], [])).toBe(0);
        expect(distance.calculateJaccardSimilarity([], ['test'])).toBe(0);
      });
    });
    
    describe('Stemming Functions', () => {
      it('handles null or undefined input in stemWord', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => stemming.stemWord(null)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => stemming.stemWord(undefined)).not.toThrow();
      });
      
      it('handles empty string in stemWord', () => {
        expect(stemming.stemWord('')).toBe('');
      });
      
      it('handles non-string input in stemWord', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => stemming.stemWord(123)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => stemming.stemWord({})).not.toThrow();
      });
      
      it('handles null or undefined input in stemTokens', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => stemming.stemTokens(null)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => stemming.stemTokens(undefined)).not.toThrow();
      });
      
      it('handles empty array in stemTokens', () => {
        expect(stemming.stemTokens([])).toEqual([]);
      });
    });
    
    describe('Tokenization Functions', () => {
      it('handles null or undefined input in tokenizeAndNormalize', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => tokenization.tokenizeAndNormalize(null)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => tokenization.tokenizeAndNormalize(undefined)).not.toThrow();
      });
      
      it('handles empty string in tokenizeAndNormalize', () => {
        expect(tokenization.tokenizeAndNormalize('')).toEqual([]);
      });
      
      it('handles non-string input in tokenizeAndNormalize', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => tokenization.tokenizeAndNormalize(123)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => tokenization.tokenizeAndNormalize({})).not.toThrow();
      });
      
      it('handles null or undefined input in normalizeText', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => tokenization.normalizeText(null)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => tokenization.normalizeText(undefined)).not.toThrow();
      });
      
      it('handles empty string in normalizeText', () => {
        expect(tokenization.normalizeText('')).toBe('');
      });
    });
    
    describe('Synonym Functions', () => {
      it('handles null or undefined input in getSynonyms', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => synonyms.getSynonyms(null)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => synonyms.getSynonyms(undefined)).not.toThrow();
      });
      
      it('handles empty string in getSynonyms', () => {
        expect(synonyms.getSynonyms('')).toEqual([]);
      });
      
      it('handles null or undefined input in expandWithSynonyms', () => {
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => synonyms.expandWithSynonyms(null)).not.toThrow();
        // @ts-ignore - Intentionally passing invalid inputs for testing
        expect(() => synonyms.expandWithSynonyms(undefined)).not.toThrow();
      });
      
      it('handles empty string in expandWithSynonyms', () => {
        expect(synonyms.expandWithSynonyms('')).toEqual([]);
      });
    });
  });
});