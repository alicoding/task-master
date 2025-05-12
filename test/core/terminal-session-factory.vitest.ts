/**
 * Tests for Terminal Session Factory Module
 * Tests for terminal-session-factory.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeSessionManagers,
  initializeSessionAdapters,
  initializeEventHandlers,
  initializeSessionState,
  initializeIntegration,
  initializeTerminalSessionCore,
  createTerminalSessionManager,
  createAndInitializeSessionManager,
  tryRecoverSession,
  enableSessionRecovery,
  updateSessionState,
  getDefaultConfig
} from '../../core/terminal/terminal-session-factory';
import { TerminalSessionManager } from '../../core/terminal/terminal-session-manager-index';
import { TerminalSessionConfiguration } from '../../core/terminal/terminal-session-configuration';
import { DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG } from '../../core/terminal/terminal-session-types';
import { EventEmitter } from 'events';
import { createDb } from '../../db/init';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

// Create test DB path
const createTestDbPath = () => join(os.tmpdir(), `test-tm-${Date.now()}.db`);

// Mock integration modules
vi.mock('../../core/terminal/terminal-session-manager-integration.ts', () => ({
  initializeManagers: vi.fn().mockReturnValue({
    recoveryManager: { id: 'mock-recovery-manager' },
    timeWindowManager: { id: 'mock-time-window-manager' }
  }),
  setupSessionEventHandlers: vi.fn(),
  updateSessionState: vi.fn()
}));

// Mock adapter classes
vi.mock('../../core/terminal/terminal-session-time-window-adapter.ts', () => ({
  TerminalSessionTimeWindowAdapter: vi.fn().mockImplementation(() => ({
    id: 'mock-time-window-adapter'
  }))
}));

vi.mock('../../core/terminal/terminal-session-recovery-adapter.ts', () => ({
  TerminalSessionRecoveryAdapter: vi.fn().mockImplementation(() => ({
    id: 'mock-recovery-adapter',
    tryRecoverSession: vi.fn().mockResolvedValue({ id: 'recovered-session' }),
    enableSessionRecovery: vi.fn().mockResolvedValue(true)
  }))
}));

vi.mock('../../core/terminal/terminal-session-activity-adapter.ts', () => ({
  TerminalSessionActivityAdapter: vi.fn().mockImplementation(() => ({
    id: 'mock-activity-adapter'
  }))
}));

vi.mock('../../core/terminal/terminal-session-status-adapter.ts', () => ({
  TerminalSessionStatusAdapter: vi.fn().mockImplementation(() => ({
    id: 'mock-status-adapter'
  }))
}));

vi.mock('../../core/terminal/terminal-session-lifecycle-adapter.ts', () => ({
  TerminalSessionLifecycleAdapter: vi.fn().mockImplementation(() => ({
    id: 'mock-lifecycle-adapter'
  }))
}));

describe('Terminal Session Factory', () => {
  let dbPath: string;
  let db: any;
  let mockSessionManager: any;
  
  beforeEach(() => {
    // Create a test database
    dbPath = createTestDbPath();
    const result = createDb(dbPath);
    db = result.db;
    
    // Create a mock session manager
    mockSessionManager = new EventEmitter();
    mockSessionManager.getCurrentSession = vi.fn().mockReturnValue({ id: 'test-session' });
    mockSessionManager.disconnectSession = vi.fn();
    mockSessionManager.updateSession = vi.fn();
    mockSessionManager.getConfigManager = vi.fn().mockReturnValue({
      getConfig: vi.fn().mockReturnValue(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG)
    });
    mockSessionManager.initialize = vi.fn().mockResolvedValue({ id: 'test-session' });
    mockSessionManager._db = db;
    
    // Mock TerminalSessionManager constructor
    vi.spyOn(global, 'TerminalSessionManager').mockImplementation(() => mockSessionManager);
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
  
  describe('initializeSessionManagers', () => {
    it('should initialize recovery and time window managers', () => {
      const { initializeManagers } = require('../../core/terminal/terminal-session-manager-integration.ts');
      
      const emitter = new EventEmitter();
      const result = initializeSessionManagers(
        db,
        DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG,
        emitter
      );
      
      expect(initializeManagers).toHaveBeenCalledWith(
        db,
        DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG,
        emitter
      );
      
      expect(result).toEqual({
        recoveryManager: { id: 'mock-recovery-manager' },
        timeWindowManager: { id: 'mock-time-window-manager' }
      });
    });
  });
  
  describe('initializeSessionAdapters', () => {
    it('should initialize all adapter instances', () => {
      const { 
        TerminalSessionTimeWindowAdapter 
      } = require('../../core/terminal/terminal-session-time-window-adapter.ts');
      
      const { 
        TerminalSessionRecoveryAdapter 
      } = require('../../core/terminal/terminal-session-recovery-adapter.ts');
      
      const { 
        TerminalSessionActivityAdapter 
      } = require('../../core/terminal/terminal-session-activity-adapter.ts');
      
      const { 
        TerminalSessionStatusAdapter 
      } = require('../../core/terminal/terminal-session-status-adapter.ts');
      
      const { 
        TerminalSessionLifecycleAdapter 
      } = require('../../core/terminal/terminal-session-lifecycle-adapter.ts');
      
      const managers = {
        recoveryManager: { id: 'mock-recovery-manager' },
        timeWindowManager: { id: 'mock-time-window-manager' }
      };
      
      const configManager = new TerminalSessionConfiguration(db);
      
      const result = initializeSessionAdapters(
        db,
        mockSessionManager,
        managers,
        configManager
      );
      
      // Verify all adapters were initialized
      expect(TerminalSessionTimeWindowAdapter).toHaveBeenCalled();
      expect(TerminalSessionRecoveryAdapter).toHaveBeenCalled();
      expect(TerminalSessionActivityAdapter).toHaveBeenCalled();
      expect(TerminalSessionStatusAdapter).toHaveBeenCalled();
      expect(TerminalSessionLifecycleAdapter).toHaveBeenCalled();
      
      // Verify the result contains all adapters
      expect(result).toEqual({
        timeWindowAdapter: { id: 'mock-time-window-adapter' },
        recoveryAdapter: { id: 'mock-recovery-adapter' },
        activityAdapter: { id: 'mock-activity-adapter' },
        statusAdapter: { id: 'mock-status-adapter' },
        lifecycleAdapter: { id: 'mock-lifecycle-adapter' }
      });
    });
  });
  
  describe('initializeEventHandlers', () => {
    it('should set up session event handlers', () => {
      const { setupSessionEventHandlers } = require('../../core/terminal/terminal-session-manager-integration.ts');
      
      initializeEventHandlers(mockSessionManager);
      
      expect(setupSessionEventHandlers).toHaveBeenCalledWith(
        mockSessionManager,
        mockSessionManager.disconnectSession
      );
    });
  });
  
  describe('initializeSessionState', () => {
    it('should initialize session state properties', () => {
      initializeSessionState(mockSessionManager);
      
      expect(mockSessionManager._currentSession).toBeNull();
      expect(mockSessionManager._detectingSession).toBe(false);
      expect(mockSessionManager._inactivityTimer).toBeNull();
    });
  });
  
  describe('initializeIntegration', () => {
    it('should set up all integration components', () => {
      // Create spies for functions called by initializeIntegration
      const initManagersSpy = vi.spyOn({ initializeSessionManagers }, 'initializeSessionManagers');
      const initAdaptersSpy = vi.spyOn({ initializeSessionAdapters }, 'initializeSessionAdapters');
      
      const configManager = new TerminalSessionConfiguration(db);
      
      // Call the function
      initializeIntegration(mockSessionManager, db, configManager);
      
      // Verify managers and adapters were initialized
      expect(initManagersSpy).toHaveBeenCalled();
      expect(initAdaptersSpy).toHaveBeenCalled();
      
      // Verify manager properties were set
      expect(mockSessionManager._recoveryManager).toBeDefined();
      expect(mockSessionManager._timeWindowManager).toBeDefined();
      expect(mockSessionManager._timeWindowAdapter).toBeDefined();
      expect(mockSessionManager._recoveryAdapter).toBeDefined();
      expect(mockSessionManager._activityAdapter).toBeDefined();
      expect(mockSessionManager._statusAdapter).toBeDefined();
      expect(mockSessionManager._lifecycleAdapter).toBeDefined();
    });
  });
  
  describe('initializeTerminalSessionCore', () => {
    it('should initialize all core components', () => {
      // Create spies for functions called by initializeTerminalSessionCore
      const initStateSpy = vi.spyOn({ initializeSessionState }, 'initializeSessionState');
      const initIntegrationSpy = vi.spyOn({ initializeIntegration }, 'initializeIntegration');
      const initEventsSpy = vi.spyOn({ initializeEventHandlers }, 'initializeEventHandlers');
      
      const configManager = new TerminalSessionConfiguration(db);
      
      // Call the function
      initializeTerminalSessionCore(mockSessionManager, db, configManager);
      
      // Verify all initialization functions were called
      expect(initStateSpy).toHaveBeenCalledWith(mockSessionManager);
      expect(initIntegrationSpy).toHaveBeenCalledWith(mockSessionManager, db, configManager);
      expect(initEventsSpy).toHaveBeenCalledWith(mockSessionManager);
    });
  });
  
  describe('createTerminalSessionManager', () => {
    it('should create and initialize a terminal session manager', () => {
      // Create spy for initializeTerminalSessionCore
      const initCoreSpy = vi.spyOn({ initializeTerminalSessionCore }, 'initializeTerminalSessionCore');
      
      // Call the function
      const result = createTerminalSessionManager(db, { inactivityTimeout: 30 });
      
      // Verify constructor and initialization was done
      expect(TerminalSessionManager).toHaveBeenCalled();
      expect(initCoreSpy).toHaveBeenCalled();
      
      // Verify the result is the session manager
      expect(result).toBe(mockSessionManager);
    });
  });
  
  describe('createAndInitializeSessionManager', () => {
    it('should create, initialize, and detect the current session', async () => {
      // Create spy for createTerminalSessionManager
      const createManagerSpy = vi.spyOn({ createTerminalSessionManager }, 'createTerminalSessionManager');
      
      // Call the function
      const result = await createAndInitializeSessionManager(db, { trackTaskUsage: false });
      
      // Verify manager was created
      expect(createManagerSpy).toHaveBeenCalledWith(db, { trackTaskUsage: false });
      
      // Verify initialize was called
      expect(mockSessionManager.initialize).toHaveBeenCalled();
      
      // Verify the result contains the manager and session
      expect(result).toEqual({
        sessionManager: mockSessionManager,
        currentSession: { id: 'test-session' }
      });
    });
    
    it('should handle initialization errors gracefully', async () => {
      // Make initialize throw an error
      mockSessionManager.initialize.mockRejectedValue(new Error('Initialization failed'));
      
      // Create spy for createTerminalSessionManager
      const createManagerSpy = vi.spyOn({ createTerminalSessionManager }, 'createTerminalSessionManager');
      
      // Call the function
      const result = await createAndInitializeSessionManager(db);
      
      // Verify manager was created twice (once initially and once after error)
      expect(createManagerSpy).toHaveBeenCalledTimes(2);
      
      // Verify the result contains the manager but no session
      expect(result).toEqual({
        sessionManager: mockSessionManager,
        currentSession: null
      });
    });
  });
  
  describe('tryRecoverSession', () => {
    it('should delegate to recovery adapter', async () => {
      // Setup mock recovery adapter
      const mockRecoveryAdapter = {
        tryRecoverSession: vi.fn().mockResolvedValue({ id: 'recovered-session' })
      };
      
      mockSessionManager._recoveryAdapter = mockRecoveryAdapter;
      
      // Call the function
      const result = await tryRecoverSession(mockSessionManager, { tty: '/dev/test' });
      
      // Verify adapter method was called
      expect(mockRecoveryAdapter.tryRecoverSession).toHaveBeenCalledWith({ tty: '/dev/test' });
      
      // Verify the result is the recovered session
      expect(result).toEqual({ id: 'recovered-session' });
    });
    
    it('should return null if no recovery adapter exists', async () => {
      // Remove recovery adapter
      mockSessionManager._recoveryAdapter = null;
      
      // Call the function
      const result = await tryRecoverSession(mockSessionManager);
      
      // Verify the result is null
      expect(result).toBeNull();
    });
  });
  
  describe('enableSessionRecovery', () => {
    it('should delegate to recovery adapter', async () => {
      // Setup mock recovery adapter
      const mockRecoveryAdapter = {
        enableSessionRecovery: vi.fn().mockResolvedValue(true)
      };
      
      mockSessionManager._recoveryAdapter = mockRecoveryAdapter;
      
      // Call the function
      const result = await enableSessionRecovery(mockSessionManager);
      
      // Verify adapter method was called
      expect(mockRecoveryAdapter.enableSessionRecovery).toHaveBeenCalled();
      
      // Verify the result
      expect(result).toBe(true);
    });
    
    it('should return false if no recovery adapter exists', async () => {
      // Remove recovery adapter
      mockSessionManager._recoveryAdapter = null;
      
      // Call the function
      const result = await enableSessionRecovery(mockSessionManager);
      
      // Verify the result is false
      expect(result).toBe(false);
    });
  });
  
  describe('updateSessionState', () => {
    it('should delegate to integration module', async () => {
      const { updateSessionState: integrationUpdateState } = require('../../core/terminal/terminal-session-manager-integration.ts');
      
      // Setup mock time window manager
      mockSessionManager._timeWindowManager = { id: 'mock-time-window-manager' };
      
      // Call the function
      await updateSessionState(mockSessionManager, { status: 'inactive' });
      
      // Verify integration function was called with correct parameters
      expect(integrationUpdateState).toHaveBeenCalledWith(
        mockSessionManager,
        db,
        { id: 'test-session' },
        { status: 'inactive' },
        {
          persistSessions: true,
          trackTaskUsage: true
        },
        { id: 'mock-time-window-manager' }
      );
    });
  });
  
  describe('getDefaultConfig', () => {
    it('should return a copy of the default configuration', () => {
      const config = getDefaultConfig();
      
      // Verify it's a copy and not the original
      expect(config).toEqual(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG);
      expect(config).not.toBe(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG);
      
      // Modifying the copy should not affect the original
      config.inactivityTimeout = 999;
      expect(DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.inactivityTimeout).not.toBe(999);
    });
  });
});