/**
 * Terminal Session Index for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module serves as a consolidated entry point for all terminal session
 * operations, re-exporting functions from the modularized terminal session files.
 * It maintains the same interface as terminal-session-operations.ts to ensure
 * backward compatibility.
 */

// Re-export all functions from terminal-session-finder.ts
export {
  findExistingSession,
  getSessionById,
  getActiveSessions
} from './terminal-session-finder.ts';

// Re-export all functions from terminal-session-lifecycle.ts
export {
  createSession,
  reconnectSession,
  disconnectSession
} from './terminal-session-lifecycle.ts';

// Re-export all functions from terminal-session-tracking.ts
export {
  recordTaskUsage,
  recordFileChange,
  getRecentTasks
} from './terminal-session-tracking.ts';