/**
 * Terminal Session Manager Entry Point for Task Master CLI
 * Implements Task 17.7: Terminal Integration
 * 
 * This module re-exports the terminal session manager for easy importing.
 * 
 * Refactored as part of Task 17.8.9: Modularize terminal-session-manager.ts
 */

export { TerminalSessionManager } from './terminal-session-manager.ts';
export { DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG } from './terminal-session-types.ts';
export type {
  TerminalSessionManagerConfig,
  TerminalSessionState,
  TerminalFingerprint,
  TerminalIntegrationStatus,
  SessionActivityType
} from './terminal-session-types.ts';