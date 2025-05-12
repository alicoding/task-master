/**
 * Tests for Terminal Session Configuration Module
 * Tests for terminal-session-configuration.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TerminalSessionConfiguration,
  createTerminalConfiguration,
  TerminalSessionManagerConfig,
  DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG
} from '../../core/terminal/terminal-session-configuration';
import { createDb } from '../../db/init';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

// Create test DB path
const createTestDbPath = () => join(os.tmpdir(), `test-tm-${Date.now()}.db`);

describe('Terminal Session Configuration', () => {
  let dbPath: string;
  let db: any;
  
  beforeEach(() => {
    // Create a test database
    dbPath = createTestDbPath();
    const result = createDb(dbPath);
    db = result.db;
    
    // Add spies for database methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up test database
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  });
  
  describe('Constructor and initialization', () => {
    it('should initialize with default configuration when no config is provided', () => {
      const config = new TerminalSessionConfiguration(db);
      
      expect(config.getConfig()).toEqual(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG);
    });
    
    it('should merge provided configuration with defaults', () => {
      const customConfig: Partial<TerminalSessionManagerConfig> = {
        inactivityTimeout: 30,
        trackTaskUsage: false
      };
      
      const config = new TerminalSessionConfiguration(db, customConfig);
      
      expect(config.getConfig()).toEqual({
        ...DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG,
        inactivityTimeout: 30,
        trackTaskUsage: false
      });
    });
    
    it('should correct invalid configuration values', () => {
      const invalidConfig: Partial<TerminalSessionManagerConfig> = {
        inactivityTimeout: -10,
        maxSessionHistory: 0,
        persistSessions: 'yes' as any // Type error is intentional for test
      };
      
      const config = new TerminalSessionConfiguration(db, invalidConfig);
      
      // Should revert to defaults for invalid values
      expect(config.getConfig().inactivityTimeout).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.inactivityTimeout);
      expect(config.getConfig().maxSessionHistory).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.maxSessionHistory);
      expect(config.getConfig().persistSessions).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.persistSessions);
    });
    
    it('should be creatable through factory function', () => {
      const customConfig: Partial<TerminalSessionManagerConfig> = {
        inactivityTimeout: 15
      };
      
      const config = createTerminalConfiguration(db, customConfig);
      
      expect(config).toBeInstanceOf(TerminalSessionConfiguration);
      expect(config.getConfig().inactivityTimeout).toBe(15);
    });
  });
  
  describe('Configuration access and updates', () => {
    let config: TerminalSessionConfiguration;
    
    beforeEach(() => {
      config = new TerminalSessionConfiguration(db);
    });
    
    it('should provide a copy of the configuration via getConfig', () => {
      const configCopy = config.getConfig();
      
      // Modifying the copy should not affect the original
      configCopy.inactivityTimeout = 999;
      
      expect(config.getConfig().inactivityTimeout).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.inactivityTimeout);
    });
    
    it('should update configuration with valid values', () => {
      const updates: Partial<TerminalSessionManagerConfig> = {
        inactivityTimeout: 45,
        trackFileChanges: false,
        maxSessionHistory: 50
      };
      
      const updatedConfig = config.updateConfig(updates);
      
      expect(updatedConfig.inactivityTimeout).toBe(45);
      expect(updatedConfig.trackFileChanges).toBe(false);
      expect(updatedConfig.maxSessionHistory).toBe(50);
      
      // Original config should also be updated
      expect(config.getConfig().inactivityTimeout).toBe(45);
    });
    
    it('should validate values during update', () => {
      const updates: Partial<TerminalSessionManagerConfig> = {
        inactivityTimeout: -5,
        maxSessionHistory: 0
      };
      
      config.updateConfig(updates);
      
      // Invalid values should be rejected
      expect(config.getConfig().inactivityTimeout).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.inactivityTimeout);
      expect(config.getConfig().maxSessionHistory).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.maxSessionHistory);
    });
    
    it('should get individual configuration values', () => {
      expect(config.getValue('inactivityTimeout')).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.inactivityTimeout);
      expect(config.getValue('trackTaskUsage')).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.trackTaskUsage);
    });
    
    it('should set individual configuration values', () => {
      config.setValue('inactivityTimeout', 25);
      expect(config.getValue('inactivityTimeout')).toBe(25);
      
      config.setValue('enableReconnection', false);
      expect(config.getValue('enableReconnection')).toBe(false);
    });
    
    it('should validate individual value updates', () => {
      config.setValue('inactivityTimeout', -10);
      
      // Should reject the invalid value
      expect(config.getValue('inactivityTimeout')).toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.inactivityTimeout);
    });
  });
  
  describe('Database operations', () => {
    let config: TerminalSessionConfiguration;
    
    beforeEach(() => {
      config = new TerminalSessionConfiguration(db);
    });
    
    it('should return true for saveToDatabase (placeholder implementation)', async () => {
      const result = await config.saveToDatabase();
      expect(result).toBe(true);
    });
    
    it('should return true for loadFromDatabase (placeholder implementation)', async () => {
      const result = await config.loadFromDatabase();
      expect(result).toBe(true);
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock error in database operations
      vi.spyOn(config as any, 'saveToDatabase').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await config.saveToDatabase();
      expect(result).toBe(false);
    });
  });
});