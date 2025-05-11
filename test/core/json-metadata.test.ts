/**
 * Tests for JSON metadata parsing and handling
 */

import { expect } from 'chai';
import { TaskRepository } from '../../core/repo.ts';
import { validateMetadata } from '../../core/types.ts';
import { setupTestDb, cleanupTestDb } from './test-helpers.ts';

describe('JSON Metadata Handling', () => {
  let repo: TaskRepository;
  
  // Set up a test database before each test
  beforeEach(async () => {
    const { db, sqlite } = await setupTestDb();
    repo = new TaskRepository(db, sqlite);
  });
  
  // Clean up after each test
  afterEach(async () => {
    repo.close();
    await cleanupTestDb();
  });
  
  describe('validateMetadata function', () => {
    it('should validate correct metadata object', () => {
      const validMetadata = {
        priority: 1,
        tags: ['important', 'urgent'],
        custom: 'value'
      };
      
      expect(validateMetadata(validMetadata)).to.be.true;
    });
    
    it('should reject non-object metadata', () => {
      expect(validateMetadata('string')).to.be.false;
      expect(validateMetadata(123)).to.be.false;
      expect(validateMetadata(null)).to.be.false;
      expect(validateMetadata(undefined)).to.be.false;
    });
  });
  
  describe('Array handling in metadata', () => {
    it('should preserve array structure in metadata', async () => {
      // Create a task with array in metadata
      const createResult = await repo.createTask({
        title: 'Test Array Metadata',
        metadata: {
          items: ['item1', 'item2', 'item3']
        }
      });
      
      expect(createResult.success).to.be.true;
      expect(createResult.data).to.exist;
      
      if (createResult.success && createResult.data) {
        const taskId = createResult.data.id;
        
        // Retrieve the task and check metadata
        const taskResult = await repo.getTask(taskId);
        expect(taskResult.success).to.be.true;
        expect(taskResult.data).to.exist;
        
        if (taskResult.success && taskResult.data) {
          const task = taskResult.data;
          expect(task.metadata).to.be.an('object');
          expect(task.metadata.items).to.be.an('array');
          expect(task.metadata.items).to.have.lengthOf(3);
          expect(task.metadata.items[0]).to.equal('item1');
          expect(task.metadata.items[1]).to.equal('item2');
          expect(task.metadata.items[2]).to.equal('item3');
        }
      }
    });
  });
  
  describe('Nested object handling in metadata', () => {
    it('should preserve nested object structure in metadata', async () => {
      // Create a task with nested object in metadata
      const createResult = await repo.createTask({
        title: 'Test Nested Object Metadata',
        metadata: {
          config: {
            enabled: true,
            options: {
              color: 'blue',
              size: 'medium'
            }
          }
        }
      });
      
      expect(createResult.success).to.be.true;
      expect(createResult.data).to.exist;
      
      if (createResult.success && createResult.data) {
        const taskId = createResult.data.id;
        
        // Retrieve the task and check metadata
        const taskResult = await repo.getTask(taskId);
        expect(taskResult.success).to.be.true;
        expect(taskResult.data).to.exist;
        
        if (taskResult.success && taskResult.data) {
          const task = taskResult.data;
          expect(task.metadata).to.be.an('object');
          expect(task.metadata.config).to.be.an('object');
          expect(task.metadata.config.enabled).to.be.true;
          expect(task.metadata.config.options).to.be.an('object');
          expect(task.metadata.config.options.color).to.equal('blue');
          expect(task.metadata.config.options.size).to.equal('medium');
        }
      }
    });
  });
  
  describe('Metadata updates', () => {
    it('should correctly update existing metadata', async () => {
      // Create a task with initial metadata
      const createResult = await repo.createTask({
        title: 'Test Metadata Updates',
        metadata: {
          priority: 1,
          tags: ['initial']
        }
      });
      
      expect(createResult.success).to.be.true;
      expect(createResult.data).to.exist;
      
      if (createResult.success && createResult.data) {
        const taskId = createResult.data.id;
        
        // Update the metadata
        const updateResult = await repo.updateTask({
          id: taskId,
          metadata: {
            priority: 2,
            tags: ['updated'],
            newField: 'value'
          }
        });
        
        expect(updateResult.success).to.be.true;
        expect(updateResult.data).to.exist;
        
        if (updateResult.success && updateResult.data) {
          const updatedTask = updateResult.data;
          expect(updatedTask.metadata).to.be.an('object');
          expect(updatedTask.metadata.priority).to.equal(2);
          expect(updatedTask.metadata.tags).to.be.an('array');
          expect(updatedTask.metadata.tags[0]).to.equal('updated');
          expect(updatedTask.metadata.newField).to.equal('value');
        }
      }
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty arrays in metadata', async () => {
      // Create a task with empty array in metadata
      const createResult = await repo.createTask({
        title: 'Test Empty Array Metadata',
        metadata: {
          emptyArray: []
        }
      });
      
      expect(createResult.success).to.be.true;
      
      if (createResult.success && createResult.data) {
        const taskId = createResult.data.id;
        
        // Retrieve the task and check metadata
        const taskResult = await repo.getTask(taskId);
        expect(taskResult.success).to.be.true;
        
        if (taskResult.success && taskResult.data) {
          const task = taskResult.data;
          expect(task.metadata.emptyArray).to.be.an('array');
          expect(task.metadata.emptyArray).to.have.lengthOf(0);
        }
      }
    });
    
    it('should handle deeply nested objects in metadata', async () => {
      // Create a task with deeply nested object in metadata
      const deeplyNested = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value'
              }
            }
          }
        }
      };
      
      const createResult = await repo.createTask({
        title: 'Test Deeply Nested Metadata',
        metadata: deeplyNested
      });
      
      expect(createResult.success).to.be.true;
      
      if (createResult.success && createResult.data) {
        const taskId = createResult.data.id;
        
        // Retrieve the task and check metadata
        const taskResult = await repo.getTask(taskId);
        expect(taskResult.success).to.be.true;
        
        if (taskResult.success && taskResult.data) {
          const task = taskResult.data;
          expect(task.metadata.level1.level2.level3.level4.level5).to.equal('deep value');
        }
      }
    });
    
    it('should handle special characters in metadata', async () => {
      // Create a task with special characters in metadata
      const createResult = await repo.createTask({
        title: 'Test Special Characters in Metadata',
        metadata: {
          specialChars: 'Test with "quotes", \'apostrophes\', new\nlines, and emoji 😊'
        }
      });
      
      expect(createResult.success).to.be.true;
      
      if (createResult.success && createResult.data) {
        const taskId = createResult.data.id;
        
        // Retrieve the task and check metadata
        const taskResult = await repo.getTask(taskId);
        expect(taskResult.success).to.be.true;
        
        if (taskResult.success && taskResult.data) {
          const task = taskResult.data;
          expect(task.metadata.specialChars).to.equal('Test with "quotes", \'apostrophes\', new\nlines, and emoji 😊');
        }
      }
    });
  });
});