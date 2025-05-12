/**
 * Terminal Session Status Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides standalone functions for terminal session status management,
 * including getting integration status and session information.
 */

import { createLogger } from '../utils/logger.ts';
import { TerminalSessionState, TerminalIntegrationStatus } from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getSessionIntegrationStatus } from './terminal-session-state-handler.ts';

// Create logger for terminal status integration
const logger = createLogger('TerminalSessionStatus');

/**
 * Get terminal integration status
 * @param db Database connection
 * @param currentSession Current session
 * @param config Configuration settings
 * @param recoveryEnabled Whether recovery is enabled
 * @returns Terminal integration status
 */
export async function getTerminalIntegrationStatus(
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  config: {
    trackTaskUsage: boolean;
    trackFileChanges: boolean;
    persistSessions: boolean;
  },
  recoveryEnabled: boolean
): Promise<TerminalIntegrationStatus> {
  try {
    return await getSessionIntegrationStatus(
      db,
      currentSession,
      config.trackTaskUsage,
      config.trackFileChanges,
      config.persistSessions,
      recoveryEnabled
    );
  } catch (error) {
    logger.error('Error getting integration status:', error);
    
    // Return a default status in case of error
    return {
      sessionDetected: false,
      sessionTracking: false,
      taskTracking: false,
      fileTracking: false,
      sessionCount: 0,
      recoveryEnabled: false,
      currentStatus: null,
      sessionId: null
    };
  }
}