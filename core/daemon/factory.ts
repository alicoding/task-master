/**
 * Factory for creating and managing file tracking daemon instances
 * Part of Task 17.1: Daemon Process Implementation
 */

import { FileTrackingDaemon, FileTrackingDaemonConfig } from './file-tracking-daemon.ts';
import { FileTrackingRepository } from '../repository/file-tracking.ts';
import { BaseTaskRepository } from '../repository/base.ts';

// Default configuration for the daemon
const DEFAULT_CONFIG: FileTrackingDaemonConfig = {
  watchPaths: [process.cwd()],
  excludePaths: ['node_modules', '.git', 'dist'],
  autoAssociate: true,
  confidenceThreshold: 70,
  pollingInterval: 1000,
  maxConcurrentOperations: 5
};

/**
 * Singleton instance of the daemon
 * This ensures we only have one daemon running at a time
 */
let daemonInstance: FileTrackingDaemon | null = null;

/**
 * Create a new file tracking daemon instance
 * If a singleton instance already exists, it will be returned
 * @param repository Repository for file tracking operations
 * @param config Configuration for the daemon
 */
export function createDaemon(
  repository?: FileTrackingRepository | BaseTaskRepository,
  config?: Partial<FileTrackingDaemonConfig>
): FileTrackingDaemon {
  // Return existing instance if available
  if (daemonInstance) {
    // Update config if provided
    if (config) {
      daemonInstance.updateConfig(config);
    }
    return daemonInstance;
  }

  // Create file tracking repository if not provided
  let fileTrackingRepo: FileTrackingRepository;
  
  if (!repository) {
    // Create a new repository
    fileTrackingRepo = new FileTrackingRepository();
  } else if (repository instanceof FileTrackingRepository) {
    // Use provided file tracking repository
    fileTrackingRepo = repository;
  } else {
    // Create a file tracking repository with the provided base repository
    fileTrackingRepo = new FileTrackingRepository(repository._db);
  }

  // Create daemon with merged config
  const mergedConfig: FileTrackingDaemonConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  // Create and store instance
  daemonInstance = new FileTrackingDaemon(fileTrackingRepo, mergedConfig);
  
  return daemonInstance;
}

/**
 * Get the current daemon instance
 * Returns null if no daemon has been created
 */
export function getDaemon(): FileTrackingDaemon | null {
  return daemonInstance;
}

/**
 * Close and cleanup the daemon instance
 * This will stop the daemon if it's running and clear the singleton instance
 */
export async function closeDaemon(): Promise<void> {
  if (daemonInstance) {
    // Stop daemon if it's running
    if (daemonInstance.state !== 'stopped') {
      await daemonInstance.stop();
    }
    
    // Clear reference
    daemonInstance = null;
  }
}