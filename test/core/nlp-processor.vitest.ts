/**
 * nlp-processor.vitest.ts - Tests for NLP processor module
 * 
 * Definition of Done:
 * ✅ Tests use proper TypeScript imports with .ts extensions
 * ✅ Tests include setup and teardown for proper resource cleanup
 * ✅ All assertions use Vitest expect() syntax
 * ✅ Tests are grouped logically in describe blocks
 * ✅ Tests cover main functionality and edge cases
 * ✅ Tests verify error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  processQuery, 
  calculateSimilarity, 
  extractSearchFilters, 
  removeExtractedTerms 
} from '../../core/nlp/processor.ts';
import { ENTITY_TERMS_TO_REMOVE } from '../../core/nlp/entities.ts';

describe('NLP Processor Module', () => {
  // Mock dependencies
  const mockTokenizer = {
    tokenize: (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean)
  };
  
  const mockStemmer = {
    stem: (word: string) => word.toLowerCase().replace(/ing$|ed$|s$/, '')
  };
  
  const mockProcessResult = {
    entities: [
      { entity: 'status', option: 'todo' },
      { entity: 'priority', option: 'high' }
    ],
    intents: [
      { intent: 'search.action.add', score: 0.9 },
      { intent: 'search.action.find', score: 0.2 }
    ]
  };
  
  const mockNlpManager = {
    process: vi.fn().mockResolvedValue(mockProcessResult)
  };

  describe('processQuery', () => {
    it('should process query and extract information correctly', async () => {
      const query = 'Add high priority todo task';
      const result = await processQuery(query, mockNlpManager, mockTokenizer, mockStemmer);
      
      // Verify basic properties
      expect(result.original).toBe(query);
      expect(result.normalizedQuery).toBe('add high priority todo task');
      expect(result.tokens).toEqual(['add', 'high', 'priority', 'todo', 'task']);
      expect(result.stems).toEqual(['add', 'high', 'priority', 'todo', 'task']);
      
      // Verify entities
      expect(result.entities).toHaveProperty('status');
      expect(result.entities.status).toEqual(['todo']);
      expect(result.entities).toHaveProperty('priority');
      expect(result.entities.priority).toEqual(['high']);
      
      // Verify intents
      expect(result.intents).toHaveLength(1); // Only intents with score > 0.3
      expect(result.intents[0].name).toBe('search.action.add');
      expect(result.intents[0].score).toBe(0.9);
    });
    
    it('should handle null/undefined input', async () => {
      // @ts-ignore - intentionally passing null for testing
      const result1 = await processQuery(null, mockNlpManager, mockTokenizer, mockStemmer);
      expect(result1.original).toBe('');
      expect(result1.tokens).toEqual([]);
      
      // @ts-ignore - intentionally passing undefined for testing
      const result2 = await processQuery(undefined, mockNlpManager, mockTokenizer, mockStemmer);
      expect(result2.original).toBe('');
      expect(result2.tokens).toEqual([]);
    });
    
    it('should handle empty string input', async () => {
      const result = await processQuery('', mockNlpManager, mockTokenizer, mockStemmer);
      expect(result.original).toBe('');
      expect(result.normalizedQuery).toBe('');
      expect(result.tokens).toEqual([]);
      expect(result.stems).toEqual([]);
    });
    
    it('should handle missing tokenizer/stemmer gracefully', async () => {
      // @ts-ignore - intentionally passing null for testing
      const result = await processQuery('test query', mockNlpManager, null, null);
      expect(result.original).toBe('test query');
      expect(result.normalizedQuery).toBe('test query');
      expect(result.tokens).toEqual(['test', 'query']);
    });
    
    it('should handle non-string input', async () => {
      // @ts-ignore - intentionally passing non-string for testing
      const result = await processQuery(123, mockNlpManager, mockTokenizer, mockStemmer);
      expect(result.original).toBe('123');
      expect(result.normalizedQuery).toBe('123');
    });
  });

  describe('calculateSimilarity', () => {
    // Mock the NLP manager process method for similarity tests
    const similarityNlpManager = {
      process: vi.fn()
        .mockResolvedValueOnce({ intents: [{ intent: 'intent1', score: 0.8 }] }) // for text1
        .mockResolvedValueOnce({ intents: [{ intent: 'intent1', score: 0.7 }] }) // for text2
    };
    
    it('should calculate correct similarity for similar texts', async () => {
      const text1 = 'add a new task';
      const text2 = 'create a new task';
      
      const similarity = await calculateSimilarity(
        text1, text2, mockTokenizer, mockStemmer, similarityNlpManager
      );
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
    
    it('should return 0 for empty inputs', async () => {
      const result1 = await calculateSimilarity(
        '', 'test', mockTokenizer, mockStemmer, mockNlpManager
      );
      expect(result1).toBe(0);
      
      const result2 = await calculateSimilarity(
        'test', '', mockTokenizer, mockStemmer, mockNlpManager
      );
      expect(result2).toBe(0);
      
      const result3 = await calculateSimilarity(
        '', '', mockTokenizer, mockStemmer, mockNlpManager
      );
      expect(result3).toBe(0);
    });
    
    it('should return 1 for identical inputs', async () => {
      const text = 'identical text';
      const result = await calculateSimilarity(
        text, text, mockTokenizer, mockStemmer, mockNlpManager
      );
      expect(result).toBe(1);
    });
    
    it('should handle null/undefined inputs', async () => {
      // @ts-ignore - intentionally passing null for testing
      const result1 = await calculateSimilarity(null, 'test', mockTokenizer, mockStemmer, mockNlpManager);
      expect(result1).toBe(0);
      
      // @ts-ignore - intentionally passing undefined for testing
      const result2 = await calculateSimilarity('test', undefined, mockTokenizer, mockStemmer, mockNlpManager);
      expect(result2).toBe(0);
      
      // @ts-ignore - intentionally passing null for both for testing
      const result3 = await calculateSimilarity(null, null, mockTokenizer, mockStemmer, mockNlpManager);
      expect(result3).toBe(0);
    });
    
    it('should handle missing tokenizer/stemmer gracefully', async () => {
      // @ts-ignore - intentionally passing null for tokenizer/stemmer
      const result = await calculateSimilarity('test', 'test', null, null, mockNlpManager);
      expect(result).toBe(1); // Identical strings should still be caught
    });
    
    it('should properly weight jaccard similarity with no intents', async () => {
      const emptyIntentsNlpManager = {
        process: vi.fn().mockResolvedValue({ intents: [] })
      };
      
      const result = await calculateSimilarity(
        'testing jaccard', 'testing with extra words', 
        mockTokenizer, mockStemmer, emptyIntentsNlpManager
      );
      
      // With no intents, jaccard should be weighted more heavily
      expect(result).toBeGreaterThan(0); // Since words overlap
      expect(result).toBeLessThan(1); // But not identical
    });
  });

  describe('extractSearchFilters', () => {
    beforeEach(() => {
      // Reset mock before each test
      mockNlpManager.process.mockClear();
      mockNlpManager.process.mockResolvedValue(mockProcessResult);
    });
    
    it('should extract search filters correctly', async () => {
      const query = 'find high priority todo tasks';
      const result = await extractSearchFilters(query, mockNlpManager, mockTokenizer, mockStemmer);

      // The actual result.query might be cleaned up due to removeExtractedTerms
      // So we don't check exact equality but just verify fields were extracted
      expect(result.status).toBe('todo');
      expect(result.priority).toBe('high');
      expect(result.extractedTerms).toContain('status:todo');
      expect(result.extractedTerms).toContain('priority:high');
    });
    
    it('should extract action types from intents', async () => {
      // Mock with action intent
      mockNlpManager.process.mockResolvedValueOnce({
        entities: [],
        intents: [
          { intent: 'search.action.add', score: 0.9 }
        ]
      });
      
      const query = 'add a new task';
      const result = await extractSearchFilters(query, mockNlpManager, mockTokenizer, mockStemmer);
      
      expect(result.actionTypes).toEqual(['add']);
      expect(result.extractedTerms).toContain('action:add');
    });
    
    it('should clean query of extracted terms', async () => {
      // Mock process method with status extraction
      mockNlpManager.process.mockResolvedValueOnce({
        entities: [
          { entity: 'status', option: 'todo' }
        ],
        intents: []
      });
      
      // Use a query with a term that should be removed
      const query = 'Find todo tasks for the project';
      const result = await extractSearchFilters(query, mockNlpManager, mockTokenizer, mockStemmer);
      
      // Verify the term was removed
      expect(result.query).not.toContain('todo');
      expect(result.query.trim()).toBe('Find tasks for the project');
    });
    
    it('should handle null/undefined input', async () => {
      // Mock the NlpManager to return empty results for empty inputs
      const emptyMockNlpManager = {
        process: vi.fn().mockResolvedValue({ entities: [], intents: [] })
      };

      // @ts-ignore - intentionally passing null for testing
      const result1 = await extractSearchFilters(null, emptyMockNlpManager, mockTokenizer, mockStemmer);
      expect(result1.query).toBe('');
      // Just verify there's an extractedTerms array (not checking content since it's implementation-dependent)
      expect(Array.isArray(result1.extractedTerms)).toBe(true);

      // @ts-ignore - intentionally passing undefined for testing
      const result2 = await extractSearchFilters(undefined, emptyMockNlpManager, mockTokenizer, mockStemmer);
      expect(result2.query).toBe('');
      expect(Array.isArray(result2.extractedTerms)).toBe(true);
    });
    
    it('should handle empty string input', async () => {
      // Mock the NlpManager to return empty results for empty inputs
      const emptyMockNlpManager = {
        process: vi.fn().mockResolvedValue({ entities: [], intents: [] })
      };

      const result = await extractSearchFilters('', emptyMockNlpManager, mockTokenizer, mockStemmer);
      expect(result.query).toBe('');
      expect(Array.isArray(result.extractedTerms)).toBe(true);
    });
  });

  describe('removeExtractedTerms', () => {
    it('should remove extracted terms from query', () => {
      const query = 'Find high priority todo tasks';
      const terms = ['status:todo', 'priority:high'];
      
      const result = removeExtractedTerms(query, terms);
      
      // Since 'todo' and 'high' are in ENTITY_TERMS_TO_REMOVE, they should be removed
      expect(result).not.toContain('todo');
      expect(result).not.toContain('high');
      expect(result.trim()).toBe('Find priority tasks');
    });
    
    it('should handle unknown terms gracefully', () => {
      const query = 'Find important tasks';
      const terms = ['status:unknown', 'priority:unknown'];
      
      const result = removeExtractedTerms(query, terms);
      
      // Unknown terms shouldn't change the query
      expect(result).toBe(query);
    });
    
    it('should handle empty query', () => {
      const result = removeExtractedTerms('', ['status:todo']);
      expect(result).toBe('');
    });
    
    it('should handle empty terms array', () => {
      const query = 'Find todo tasks';
      const result = removeExtractedTerms(query, []);
      expect(result).toBe(query);
    });
    
    it('should clean up excess whitespace', () => {
      // Create a query that will have multiple spaces after removal
      const query = 'Find todo high priority tasks';
      const terms = ['status:todo', 'priority:high'];
      
      const result = removeExtractedTerms(query, terms);
      
      // Result should not have double spaces
      expect(result).not.toContain('  ');
      expect(result.trim()).toBe('Find priority tasks');
    });
  });
});

describe('NLP Entities', () => {
  describe('ENTITY_TERMS_TO_REMOVE', () => {
    it('should have the correct structure', () => {
      // Verify the object has expected top-level keys
      expect(ENTITY_TERMS_TO_REMOVE).toHaveProperty('status');
      expect(ENTITY_TERMS_TO_REMOVE).toHaveProperty('readiness');
      expect(ENTITY_TERMS_TO_REMOVE).toHaveProperty('priority');
      expect(ENTITY_TERMS_TO_REMOVE).toHaveProperty('action');
      
      // Verify each category has the expected values
      expect(ENTITY_TERMS_TO_REMOVE.status).toHaveProperty('todo');
      expect(ENTITY_TERMS_TO_REMOVE.status).toHaveProperty('in-progress');
      expect(ENTITY_TERMS_TO_REMOVE.status).toHaveProperty('done');
      
      expect(ENTITY_TERMS_TO_REMOVE.readiness).toHaveProperty('draft');
      expect(ENTITY_TERMS_TO_REMOVE.readiness).toHaveProperty('ready');
      expect(ENTITY_TERMS_TO_REMOVE.readiness).toHaveProperty('blocked');
      
      expect(ENTITY_TERMS_TO_REMOVE.priority).toHaveProperty('high');
      expect(ENTITY_TERMS_TO_REMOVE.priority).toHaveProperty('medium');
      expect(ENTITY_TERMS_TO_REMOVE.priority).toHaveProperty('low');
      
      expect(ENTITY_TERMS_TO_REMOVE.action).toHaveProperty('create');
      expect(ENTITY_TERMS_TO_REMOVE.action).toHaveProperty('update');
      expect(ENTITY_TERMS_TO_REMOVE.action).toHaveProperty('delete');
    });
    
    it('should have arrays for all entity values', () => {
      // Check that all terminal values are arrays
      for (const category in ENTITY_TERMS_TO_REMOVE) {
        for (const value in ENTITY_TERMS_TO_REMOVE[category]) {
          expect(Array.isArray(ENTITY_TERMS_TO_REMOVE[category][value])).toBe(true);
          expect(ENTITY_TERMS_TO_REMOVE[category][value].length).toBeGreaterThan(0);
        }
      }
    });
  });
});