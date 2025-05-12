/**
 * Entry point for the file tracking daemon
 * Implements Task 17.1: Daemon Process Implementation
 */

export * from './file-tracking-daemon.ts';
export * from './factory.ts';
export * from './analysis-engine.ts';

// Re-export types for convenience
export type {
  FileTrackingDaemonConfig,
  FileChangeEvent,
  TaskAssociationEvent,
  DaemonState
} from './file-tracking-daemon.ts';

export type {
  AnalysisEngineConfig,
  FileAnalysisResult
} from './analysis-engine.ts';