/**
 * Tests for metadata display formatting
 */

import { expect } from 'chai';
import { formatMetadata } from '../../core/graph/formatters/metadata-formatter.ts';

// First, we need to create the metadata formatter module
// This requires extracting the formatMetadata function from polished-task.ts to a separate file

describe('Metadata Display Formatting', () => {
  describe('Simple values', () => {
    it('should format primitive values correctly', () => {
      const metadata = {
        string: 'This is a string',
        number: 42,
        boolean: true,
        nullValue: null
      };
      
      const formatted = formatMetadata(metadata, false);
      
      expect(formatted).to.include('"string": "This is a string"');
      expect(formatted).to.include('"number": 42');
      expect(formatted).to.include('"boolean": true');
      expect(formatted).to.include('"nullValue": null');
    });
    
    it('should handle empty objects', () => {
      const metadata = {
        emptyObject: {}
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"emptyObject": {}');
    });
    
    it('should handle empty arrays', () => {
      const metadata = {
        emptyArray: []
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"emptyArray": []');
    });
  });
  
  describe('Arrays', () => {
    it('should format simple arrays on one line', () => {
      const metadata = {
        simpleArray: [1, 2, 3, 4, 5]
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"simpleArray": [1, 2, 3, 4, 5]');
    });
    
    it('should format arrays of strings correctly', () => {
      const metadata = {
        stringArray: ['a', 'b', 'c']
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"stringArray": ["a", "b", "c"]');
    });
    
    it('should format complex arrays with multi-line formatting', () => {
      const metadata = {
        complexArray: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
          { id: 3, name: 'Item 3' }
        ]
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"complexArray": [');
      expect(formatted).to.include('"id": 1');
      expect(formatted).to.include('"name": "Item 1"');
    });
  });
  
  describe('Nested objects', () => {
    it('should format nested objects with proper indentation', () => {
      const metadata = {
        config: {
          enabled: true,
          settings: {
            theme: 'dark',
            fontSize: 14
          }
        }
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"config": {');
      expect(formatted).to.include('"enabled": true');
      expect(formatted).to.include('"settings": {');
      expect(formatted).to.include('"theme": "dark"');
      expect(formatted).to.include('"fontSize": 14');
    });
    
    it('should handle deeply nested structures', () => {
      const metadata = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"level1": {');
      expect(formatted).to.include('"level2": {');
      expect(formatted).to.include('"level3": {');
      expect(formatted).to.include('"level4": {');
      expect(formatted).to.include('"value": "deep"');
    });
    
    it('should handle mixed complex structures', () => {
      const metadata = {
        config: {
          features: ['a', 'b', 'c'],
          options: {
            enabled: true,
            items: [
              { id: 1, active: true },
              { id: 2, active: false }
            ]
          }
        }
      };
      
      const formatted = formatMetadata(metadata, false);
      
      // Just verify it doesn't throw exceptions
      expect(formatted).to.be.a('string');
      expect(formatted).to.include('"config":');
      expect(formatted).to.include('"features":');
      expect(formatted).to.include('"options":');
      expect(formatted).to.include('"items":');
    });
  });
  
  describe('Edge cases', () => {
    it('should handle special characters in strings', () => {
      const metadata = {
        special: 'String with "quotes" and \nnewlines and emoji 😊'
      };
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.include('"special": "String with \\"quotes\\" and \\nnewlines and emoji 😊"');
    });
    
    it('should display an empty object as "No metadata"', () => {
      const metadata = {};
      
      const formatted = formatMetadata(metadata, false);
      expect(formatted).to.equal('No metadata');
    });
    
    it('should handle null metadata', () => {
      const formatted = formatMetadata(null, false);
      expect(formatted).to.equal('No metadata');
    });
  });
});