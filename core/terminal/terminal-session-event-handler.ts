/**
 * Terminal Session Event Handler for Task Master CLI
 * Implements Task 17.7: Terminal Integration
 * 
 * This module provides event handling functionality for terminal sessions,
 * extracted from TerminalSessionManager to improve modularity.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import { TerminalSessionState } from './terminal-session-types.ts';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';
import { initializeEventListeners } from './terminal-session-initialization.ts';

// Create logger for terminal event handling
const logger = createLogger('TerminalSessionEventHandler');

/**
 * Bind event handling methods for a terminal session manager
 * @param manager The terminal session manager instance
 */
export function bindEvents(manager: EventEmitter): void {
  // Methods that need binding to preserve 'this' context
  if ('detectSession' in manager) {
    (manager as any).detectSession = (manager as any).detectSession.bind(manager);
  }
  
  if ('updateSession' in manager) {
    (manager as any).updateSession = (manager as any).updateSession.bind(manager);
  }
  
  if ('disconnectSession' in manager) {
    (manager as any).disconnectSession = (manager as any).disconnectSession.bind(manager);
  }
}

/**
 * Setup event listeners for process exit and termination
 * @param disconnectHandler Function to handle session disconnection on exit
 */
export function setupEventHandlers(disconnectHandler: () => void): void {
  initializeEventListeners(disconnectHandler);
}

/**
 * Set up event forwarding from recovery manager to the main event emitter
 * @param manager The main event emitter (terminal session manager)
 * @param recoveryManager The session recovery manager
 */
export function setupRecoveryEventForwarding(
  manager: EventEmitter,
  recoveryManager: SessionRecoveryManager
): void {
  // Forward recovery events
  recoveryManager.on('session:recovery:success', (data) => {
    manager.emit('session:recovery:success', data);
  });

  recoveryManager.on('session:recovery:failure', (data) => {
    manager.emit('session:recovery:failure', data);
  });

  recoveryManager.on('session:recovery:warning', (data) => {
    manager.emit('session:recovery:warning', data);
  });

  // Forward time window events
  recoveryManager.on('window:created', (data) => {
    manager.emit('window:created', data);
  });

  recoveryManager.on('window:split', (data) => {
    manager.emit('window:split', data);
  });

  recoveryManager.on('window:merged', (data) => {
    manager.emit('window:merged', data);
  });

  recoveryManager.on('session:recovery:window-created', (data) => {
    manager.emit('session:recovery:window-created', data);
  });

  logger.debug('Recovery event forwarding setup complete');
}

/**
 * Set up inactivity timer for a terminal session
 * @param manager The event emitter (terminal session manager)
 * @param currentSession The current terminal session
 * @param inactivityTimeout Inactivity timeout in minutes
 * @param updateHandler Function to handle session updates
 * @returns Timer interval ID that can be used to clear the interval
 */
export function setupInactivityTimer(
  manager: EventEmitter,
  getCurrentSession: () => TerminalSessionState | null,
  inactivityTimeout: number,
  updateHandler: (updates: { status: string }) => Promise<void>
): NodeJS.Timeout {
  return setInterval(() => {
    const currentSession = getCurrentSession();
    if (currentSession) {
      checkSessionInactivity(
        currentSession.id,
        currentSession.lastActive,
        currentSession.status,
        inactivityTimeout,
        updateHandler
      );
    }
  }, inactivityTimeout * 60 * 1000);
}

/**
 * Check session inactivity and update status if needed
 * @param sessionId Session ID
 * @param lastActive Last active time
 * @param status Current status
 * @param inactivityTimeout Inactivity timeout in minutes
 * @param updateHandler Function to handle status update
 */
export async function checkSessionInactivity(
  sessionId: string,
  lastActive: Date,
  status: string,
  inactivityTimeout: number,
  updateHandler: (updates: { status: string }) => Promise<void>
): Promise<void> {
  if (status !== 'active') {
    return;
  }
  
  try {
    // Calculate inactive time in minutes
    const now = new Date();
    const inactiveTime = (now.getTime() - lastActive.getTime()) / (60 * 1000);
    
    // If inactive for too long, mark as inactive
    if (inactiveTime >= inactivityTimeout) {
      await updateHandler({ status: 'inactive' });
      
      logger.debug(`Marked terminal session as inactive: ${sessionId}`);
    }
  } catch (error) {
    logger.error('Error checking session inactivity:', error);
  }
}

/**
 * Emit session detected event
 * @param manager The event emitter (terminal session manager)
 * @param session The detected terminal session
 */
export function emitSessionDetected(
  manager: EventEmitter,
  session: TerminalSessionState
): void {
  manager.emit('session:detected', session);
  logger.debug(`Terminal session detected event emitted: ${session.id}`);
}

/**
 * Emit session updated event
 * @param manager The event emitter (terminal session manager)
 * @param session The updated terminal session
 */
export function emitSessionUpdated(
  manager: EventEmitter,
  session: TerminalSessionState
): void {
  manager.emit('session:updated', session);
  logger.debug(`Terminal session updated event emitted: ${session.id}`);
}

/**
 * Emit session disconnected event
 * @param manager The event emitter (terminal session manager)
 * @param session The disconnected terminal session
 */
export function emitSessionDisconnected(
  manager: EventEmitter,
  session: TerminalSessionState
): void {
  manager.emit('session:disconnected', session);
  logger.debug(`Terminal session disconnected event emitted: ${session.id}`);
}

/**
 * Emit session recovery enabled event
 * @param manager The event emitter (terminal session manager)
 * @param sessionId The session ID
 */
export function emitSessionRecoveryEnabled(
  manager: EventEmitter,
  sessionId: string
): void {
  manager.emit('session:recovery-enabled', {
    sessionId,
    timestamp: new Date()
  });
  logger.debug(`Session recovery enabled event emitted: ${sessionId}`);
}

/**
 * Clean up event handlers and timers
 * @param inactivityTimer Inactivity timer to clear
 */
export function cleanupEventHandlers(
  inactivityTimer: NodeJS.Timeout | null
): void {
  if (inactivityTimer) {
    clearInterval(inactivityTimer);
  }
}