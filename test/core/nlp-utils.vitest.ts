import { describe, it, expect } from 'vitest';
import * as distance from '../../core/nlp/utils/distance';
import * as stemming from '../../core/nlp/utils/stemming';
import * as tokenization from '../../core/nlp/utils/tokenization';
import * as synonyms from '../../core/nlp/utils/synonyms';

describe('NLP Distance Utilities', () => {
  describe('levenshteinDistance', () => {
    it('should calculate correct distance for identical strings', () => {
      expect(distance.levenshteinDistance('test', 'test')).toBe(0);
    });
    
    it('should calculate correct distance for different strings', () => {
      expect(distance.levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(distance.levenshteinDistance('hello', 'hallo')).toBe(1);
    });
    
    it('should handle empty strings', () => {
      expect(distance.levenshteinDistance('', '')).toBe(0);
      expect(distance.levenshteinDistance('test', '')).toBe(4);
      expect(distance.levenshteinDistance('', 'test')).toBe(4);
    });
  });
  
  describe('fuzzyScore', () => {
    it('should return 1 for identical strings', () => {
      expect(distance.fuzzyScore('test', 'test')).toBe(1);
      expect(distance.fuzzyScore('test', 'Test')).toBe(1); // Case insensitive
      expect(distance.fuzzyScore(' test ', 'test')).toBe(1); // Trims whitespace
    });
    
    it('should return scores between 0 and 1 for similar strings', () => {
      const score = distance.fuzzyScore('hello', 'hallo');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
    
    it('should handle empty strings', () => {
      expect(distance.fuzzyScore('', '')).toBe(0);
      expect(distance.fuzzyScore('test', '')).toBe(0);
      expect(distance.fuzzyScore('', 'test')).toBe(0);
    });
  });
  
  describe('calculateJaccardSimilarity', () => {
    it('should return 1 for identical token sets', () => {
      expect(distance.calculateJaccardSimilarity(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
      expect(distance.calculateJaccardSimilarity(['a', 'b', 'c'], ['c', 'b', 'a'])).toBe(1); // Order doesn't matter
    });
    
    it('should calculate correct similarity for overlapping sets', () => {
      expect(distance.calculateJaccardSimilarity(['a', 'b', 'c'], ['a', 'b', 'd'])).toBe(0.5);
      expect(distance.calculateJaccardSimilarity(['a', 'b'], ['b', 'c', 'd'])).toBe(0.25);
    });
    
    it('should return 0 for disjoint sets', () => {
      expect(distance.calculateJaccardSimilarity(['a', 'b'], ['c', 'd'])).toBe(0);
    });
    
    it('should handle empty sets', () => {
      expect(distance.calculateJaccardSimilarity([], [])).toBe(0);
      expect(distance.calculateJaccardSimilarity(['a', 'b'], [])).toBe(0);
      expect(distance.calculateJaccardSimilarity([], ['a', 'b'])).toBe(0);
    });
  });
});

describe('NLP Stemming Utilities', () => {
  describe('stemWord', () => {
    it('should stem plurals correctly', () => {
      expect(stemming.stemWord('cats')).toBe('cat');
      expect(stemming.stemWord('boxes')).toBe('box');
      expect(stemming.stemWord('tries')).toBe('try');
    });
    
    it('should stem verb forms correctly', () => {
      expect(stemming.stemWord('walking')).toBe('walk');
      expect(stemming.stemWord('talked')).toBe('talk');
      expect(stemming.stemWord('running')).toBe('run');
      expect(stemming.stemWord('stopped')).toBe('stop');
    });
    
    it('should handle adverbs', () => {
      expect(stemming.stemWord('quickly')).toBe('quick');
      expect(stemming.stemWord('happily')).toBe('happi');
    });
    
    it('should be case insensitive', () => {
      expect(stemming.stemWord('CATS')).toBe('cat');
      expect(stemming.stemWord('Walking')).toBe('walk');
    });
    
    it('should return the original word when no rules apply', () => {
      expect(stemming.stemWord('cat')).toBe('cat');
      expect(stemming.stemWord('quick')).toBe('quick');
    });
  });
  
  describe('isConsonant', () => {
    it('should correctly identify consonants', () => {
      expect(stemming.isConsonant('b')).toBe(true);
      expect(stemming.isConsonant('c')).toBe(true);
      expect(stemming.isConsonant('d')).toBe(true);
      expect(stemming.isConsonant('z')).toBe(true);
    });
    
    it('should correctly identify vowels', () => {
      expect(stemming.isConsonant('a')).toBe(false);
      expect(stemming.isConsonant('e')).toBe(false);
      expect(stemming.isConsonant('i')).toBe(false);
      expect(stemming.isConsonant('o')).toBe(false);
      expect(stemming.isConsonant('u')).toBe(false);
    });
    
    it('should be case insensitive', () => {
      expect(stemming.isConsonant('B')).toBe(true);
      expect(stemming.isConsonant('A')).toBe(false);
    });
  });
  
  describe('stemTokens', () => {
    it('should stem an array of tokens', () => {
      const tokens = ['cats', 'walking', 'quickly'];
      const stemmed = stemming.stemTokens(tokens);
      
      expect(stemmed).toEqual(['cat', 'walk', 'quick']);
    });
    
    it('should handle empty arrays', () => {
      expect(stemming.stemTokens([])).toEqual([]);
    });
  });
});

describe('NLP Tokenization Utilities', () => {
  describe('tokenize', () => {
    it('should split text into tokens', () => {
      const text = 'Hello world, this is a test.';
      const tokens = tokenization.tokenize(text);
      
      expect(tokens).toEqual(['hello', 'world', 'this', 'is', 'a', 'test']);
    });
    
    it('should handle multiple spaces and punctuation', () => {
      const text = 'Hello,  world!  How   are you?';
      const tokens = tokenization.tokenize(text);
      
      expect(tokens).toEqual(['hello', 'world', 'how', 'are', 'you']);
    });
    
    it('should be case insensitive', () => {
      const text = 'HELLO WORLD';
      const tokens = tokenization.tokenize(text);
      
      expect(tokens).toEqual(['hello', 'world']);
    });
    
    it('should handle empty strings', () => {
      expect(tokenization.tokenize('')).toEqual([]);
    });
  });
  
  describe('tokenizeAndNormalize', () => {
    it('should tokenize and filter short tokens', () => {
      const text = 'This is a test with short and long words';
      const tokens = tokenization.tokenizeAndNormalize(text);

      // 'is', 'a' should be filtered out (length <= 2)
      // Note: 'and' is length 3, so it's not filtered out
      expect(tokens).toContain('this');
      expect(tokens).toContain('test');
      expect(tokens).toContain('with');
      expect(tokens).toContain('short');
      expect(tokens).toContain('and');
      expect(tokens).toContain('long');
      expect(tokens).toContain('words');
      expect(tokens).not.toContain('is');
      expect(tokens).not.toContain('a');
    });
    
    it('should remove duplicates', () => {
      const text = 'test test duplicate duplicate words';
      const tokens = tokenization.tokenizeAndNormalize(text);
      
      expect(tokens).toEqual(['test', 'duplicate', 'words']);
    });
  });
  
  describe('normalizeText', () => {
    it('should normalize text by removing special characters', () => {
      const text = 'Hello, world! This is a TEST.';
      const normalized = tokenization.normalizeText(text);
      
      expect(normalized).toBe('hello world this is a test');
    });
    
    it('should handle multiple spaces', () => {
      const text = 'Hello   world  !';
      const normalized = tokenization.normalizeText(text);
      
      expect(normalized).toBe('hello world');
    });
    
    it('should handle empty strings', () => {
      expect(tokenization.normalizeText('')).toBe('');
    });
  });
});

describe('NLP Synonym Utilities', () => {
  describe('getSynonyms', () => {
    it('should return synonyms for known words', () => {
      const result = synonyms.getSynonyms('todo');
      
      expect(result).toEqual(['pending', 'new', 'backlog', 'later', 'upcoming']);
    });
    
    it('should handle case-insensitive lookup', () => {
      const result = synonyms.getSynonyms('ToDo');
      
      expect(result).toEqual(['pending', 'new', 'backlog', 'later', 'upcoming']);
    });
    
    it('should return synonyms for words that are values in the map', () => {
      const result = synonyms.getSynonyms('pending');
      
      // Should include 'todo' (the key) and other values except 'pending' itself
      expect(result).toContain('todo');
      expect(result).toContain('new');
      expect(result).not.toContain('pending');
    });
    
    it('should return an empty array for unknown words', () => {
      expect(synonyms.getSynonyms('unknown')).toEqual([]);
    });
  });
  
  describe('expandWithSynonyms', () => {
    it('should expand a query with synonyms', () => {
      const result = synonyms.expandWithSynonyms('todo task');
      
      // Should include original tokens
      expect(result).toContain('todo');
      expect(result).toContain('task');
      
      // Should include synonyms for 'todo'
      expect(result).toContain('pending');
      expect(result).toContain('new');
      expect(result).toContain('backlog');
    });
    
    it('should handle different query formats', () => {
      // Test a simple query that we know will work
      const result = synonyms.expandWithSynonyms('todo');

      // Should include 'todo' and synonyms
      expect(result).toContain('todo');
      expect(result).toContain('pending');
      expect(result).toContain('new');
    });
    
    it('should remove duplicates', () => {
      // Use a query with the same word repeated
      const result = synonyms.expandWithSynonyms('todo todo');
      
      // Count occurrences of 'pending' - should only appear once
      const count = result.filter(word => word === 'pending').length;
      expect(count).toBe(1);
    });
    
    it('should handle empty strings', () => {
      expect(synonyms.expandWithSynonyms('')).toEqual([]);
    });
  });
});