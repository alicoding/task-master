/**
 * Entry point for the file tracking daemon
 * Implements Task 17.1: Daemon Process Implementation
 */

export * from './file-tracking-daemon.ts';
export * from './factory.ts';

// Re-export types for convenience
export type {
  FileTrackingDaemonConfig,
  FileChangeEvent,
  TaskAssociationEvent,
  DaemonState
} from './file-tracking-daemon.ts';