/**
 * Tests for Terminal Session Event Handler Module
 * Tests for terminal-session-event-handler.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import {
  bindEvents,
  setupEventHandlers,
  setupRecoveryEventForwarding,
  setupInactivityTimer,
  checkSessionInactivity,
  emitSessionDetected,
  emitSessionUpdated,
  emitSessionDisconnected,
  emitSessionRecoveryEnabled,
  cleanupEventHandlers
} from '../../core/terminal/terminal-session-event-handler';
import { TerminalSessionState } from '../../core/terminal/terminal-session-types';
import { SessionRecoveryManager } from '../../core/terminal/session-recovery-manager';

// Mock the initialization module
vi.mock('../../core/terminal/terminal-session-initialization.ts', () => ({
  initializeEventListeners: vi.fn()
}));

describe('Terminal Session Event Handler', () => {
  let manager: EventEmitter;
  
  beforeEach(() => {
    manager = new EventEmitter();
    // Add mock methods to make the manager appear like a session manager
    (manager as any).detectSession = vi.fn();
    (manager as any).updateSession = vi.fn();
    (manager as any).disconnectSession = vi.fn();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('bindEvents', () => {
    it('should bind methods to preserve "this" context', () => {
      const originalDetectSession = (manager as any).detectSession;
      const originalUpdateSession = (manager as any).updateSession;
      const originalDisconnectSession = (manager as any).disconnectSession;
      
      bindEvents(manager);
      
      // Methods should be bound but still be the same reference
      expect((manager as any).detectSession).not.toBe(originalDetectSession);
      expect((manager as any).updateSession).not.toBe(originalUpdateSession);
      expect((manager as any).disconnectSession).not.toBe(originalDisconnectSession);
    });
    
    it('should handle missing methods gracefully', () => {
      const emitter = new EventEmitter();
      
      // This should not throw an error, even though the methods don't exist
      expect(() => bindEvents(emitter)).not.toThrow();
    });
  });
  
  describe('setupEventHandlers', () => {
    it('should call initializeEventListeners with the disconnect handler', () => {
      const { initializeEventListeners } = require('../../core/terminal/terminal-session-initialization.ts');
      const disconnectHandler = vi.fn();
      
      setupEventHandlers(disconnectHandler);
      
      expect(initializeEventListeners).toHaveBeenCalledWith(disconnectHandler);
    });
  });
  
  describe('setupRecoveryEventForwarding', () => {
    it('should forward events from recovery manager to main manager', () => {
      // Create a mock recovery manager
      const recoveryManager = new EventEmitter() as unknown as SessionRecoveryManager;
      
      // Set up spy on main manager's emit method
      const emitSpy = vi.spyOn(manager, 'emit');
      
      setupRecoveryEventForwarding(manager, recoveryManager as SessionRecoveryManager);
      
      // Test each event type
      const testData = { sessionId: 'test-session', timestamp: new Date() };
      
      // Emit events from recovery manager
      recoveryManager.emit('session:recovery:success', testData);
      recoveryManager.emit('session:recovery:failure', testData);
      recoveryManager.emit('session:recovery:warning', testData);
      recoveryManager.emit('window:created', testData);
      recoveryManager.emit('window:split', testData);
      recoveryManager.emit('window:merged', testData);
      recoveryManager.emit('session:recovery:window-created', testData);
      
      // Verify all events were forwarded
      expect(emitSpy).toHaveBeenCalledWith('session:recovery:success', testData);
      expect(emitSpy).toHaveBeenCalledWith('session:recovery:failure', testData);
      expect(emitSpy).toHaveBeenCalledWith('session:recovery:warning', testData);
      expect(emitSpy).toHaveBeenCalledWith('window:created', testData);
      expect(emitSpy).toHaveBeenCalledWith('window:split', testData);
      expect(emitSpy).toHaveBeenCalledWith('window:merged', testData);
      expect(emitSpy).toHaveBeenCalledWith('session:recovery:window-created', testData);
    });
  });
  
  describe('setupInactivityTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });
    
    it('should set up an interval that calls checkSessionInactivity', () => {
      const currentSession: TerminalSessionState = {
        id: 'test-session',
        fingerprint: { tty: '/dev/test' },
        status: 'active',
        lastActive: new Date(),
        startTime: new Date()
      };
      
      const getCurrentSession = vi.fn().mockReturnValue(currentSession);
      const updateHandler = vi.fn().mockResolvedValue(undefined);
      
      // Set up a spy on checkSessionInactivity
      const checkSpy = vi.spyOn({ checkSessionInactivity }, 'checkSessionInactivity');
      
      // Create inactivity timer with 5 minute timeout
      const timer = setupInactivityTimer(manager, getCurrentSession, 5, updateHandler);
      
      // Fast-forward time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      // Verify checkSessionInactivity was called with correct parameters
      expect(getCurrentSession).toHaveBeenCalled();
      expect(checkSpy).toHaveBeenCalled();
      
      // Clean up
      clearInterval(timer);
    });
    
    it('should not check inactivity if no current session exists', () => {
      const getCurrentSession = vi.fn().mockReturnValue(null);
      const updateHandler = vi.fn();
      
      // Set up a spy on checkSessionInactivity
      const checkSpy = vi.spyOn({ checkSessionInactivity }, 'checkSessionInactivity');
      
      // Create inactivity timer
      const timer = setupInactivityTimer(manager, getCurrentSession, 5, updateHandler);
      
      // Fast-forward time
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      // Verify getCurrentSession was called but checkSessionInactivity was not
      expect(getCurrentSession).toHaveBeenCalled();
      expect(checkSpy).not.toHaveBeenCalled();
      
      // Clean up
      clearInterval(timer);
    });
  });
  
  describe('checkSessionInactivity', () => {
    it('should update status to inactive if session is inactive for too long', async () => {
      // Create a last active time 10 minutes ago
      const lastActive = new Date(Date.now() - 10 * 60 * 1000);
      const updateHandler = vi.fn().mockResolvedValue(undefined);
      
      await checkSessionInactivity(
        'test-session',
        lastActive,
        'active',
        5, // 5 minute timeout
        updateHandler
      );
      
      // Verify updateHandler was called to mark session as inactive
      expect(updateHandler).toHaveBeenCalledWith({ status: 'inactive' });
    });
    
    it('should not update status if session is already inactive', async () => {
      const lastActive = new Date(Date.now() - 10 * 60 * 1000);
      const updateHandler = vi.fn().mockResolvedValue(undefined);
      
      await checkSessionInactivity(
        'test-session',
        lastActive,
        'inactive', // Already inactive
        5,
        updateHandler
      );
      
      // Verify updateHandler was not called
      expect(updateHandler).not.toHaveBeenCalled();
    });
    
    it('should not update status if session is not inactive for long enough', async () => {
      // Create a last active time 3 minutes ago
      const lastActive = new Date(Date.now() - 3 * 60 * 1000);
      const updateHandler = vi.fn().mockResolvedValue(undefined);
      
      await checkSessionInactivity(
        'test-session',
        lastActive,
        'active',
        5, // 5 minute timeout
        updateHandler
      );
      
      // Verify updateHandler was not called
      expect(updateHandler).not.toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      const lastActive = new Date(Date.now() - 10 * 60 * 1000);
      const updateHandler = vi.fn().mockImplementation(() => {
        throw new Error('Update failed');
      });
      
      // This should not throw
      await expect(checkSessionInactivity(
        'test-session',
        lastActive,
        'active',
        5,
        updateHandler
      )).resolves.not.toThrow();
      
      // Verify updateHandler was still called
      expect(updateHandler).toHaveBeenCalled();
    });
  });
  
  describe('Event emission functions', () => {
    it('emitSessionDetected should emit the correct event', () => {
      const emitSpy = vi.spyOn(manager, 'emit');
      const session: TerminalSessionState = {
        id: 'test-session',
        fingerprint: { tty: '/dev/test' },
        status: 'active',
        lastActive: new Date(),
        startTime: new Date()
      };
      
      emitSessionDetected(manager, session);
      
      expect(emitSpy).toHaveBeenCalledWith('session:detected', session);
    });
    
    it('emitSessionUpdated should emit the correct event', () => {
      const emitSpy = vi.spyOn(manager, 'emit');
      const session: TerminalSessionState = {
        id: 'test-session',
        fingerprint: { tty: '/dev/test' },
        status: 'active',
        lastActive: new Date(),
        startTime: new Date()
      };
      
      emitSessionUpdated(manager, session);
      
      expect(emitSpy).toHaveBeenCalledWith('session:updated', session);
    });
    
    it('emitSessionDisconnected should emit the correct event', () => {
      const emitSpy = vi.spyOn(manager, 'emit');
      const session: TerminalSessionState = {
        id: 'test-session',
        fingerprint: { tty: '/dev/test' },
        status: 'disconnected',
        lastActive: new Date(),
        startTime: new Date()
      };
      
      emitSessionDisconnected(manager, session);
      
      expect(emitSpy).toHaveBeenCalledWith('session:disconnected', session);
    });
    
    it('emitSessionRecoveryEnabled should emit the correct event', () => {
      const emitSpy = vi.spyOn(manager, 'emit');
      const sessionId = 'test-session';
      
      emitSessionRecoveryEnabled(manager, sessionId);
      
      expect(emitSpy).toHaveBeenCalledWith('session:recovery-enabled', {
        sessionId,
        timestamp: expect.any(Date)
      });
    });
  });
  
  describe('cleanupEventHandlers', () => {
    it('should clear the interval timer if provided', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const timer = setTimeout(() => {}, 1000) as unknown as NodeJS.Timeout;
      
      cleanupEventHandlers(timer);
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(timer);
    });
    
    it('should handle null timer gracefully', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      cleanupEventHandlers(null);
      
      expect(clearIntervalSpy).not.toHaveBeenCalled();
    });
  });
});