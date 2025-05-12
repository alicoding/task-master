/**
 * File Tracking Daemon Process
 * Implements Task 17.1: Daemon Process Implementation
 * 
 * This daemon runs in the background and monitors file changes,
 * associating them with tasks in the database.
 */

import { EventEmitter } from 'events';
import { FileTrackingRepository } from '../repository/file-tracking.ts';
import path from 'path';
import fs from 'fs/promises';
import { TaskOperationResult } from '../types.ts';
import { FileSystemWatcher, FileSystemWatcherConfig } from './file-system-watcher.ts';
import { extractTaskIdsFromContent, classifyFileType, calculateConfidenceScore } from './utils.ts';
import { AnalysisEngine, AnalysisEngineConfig } from './analysis-engine.ts';
import { FileChangeAnalyzer, FileChangeAnalyzerConfig } from './file-change-analyzer.ts';
import { files } from '../../db/schema-extensions.ts';
import { tasks } from '../../db/schema.ts';
import { eq, desc, or } from 'drizzle-orm';

// Types for daemon configuration
export interface FileTrackingDaemonConfig {
  watchPaths: string[];
  excludePaths?: string[];
  autoAssociate?: boolean;
  confidenceThreshold?: number;
  pollingInterval?: number;
  maxConcurrentOperations?: number;
  includeExtensions?: string[]; // File extensions to watch
  analysisConfig?: Partial<AnalysisEngineConfig>; // Configuration for analysis engine
  fileChangeAnalyzerConfig?: Partial<FileChangeAnalyzerConfig>; // Configuration for file change analyzer
}

// Types for file change events
export interface FileChangeEvent {
  path: string;
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  timestamp: Date;
  previousPath?: string; // For renamed files
}

// Types for task association events
export interface TaskAssociationEvent {
  filePath: string;
  taskId: string;
  confidence: number;
  relationshipType: 'implements' | 'tests' | 'documents' | 'related';
  automatic: boolean;
}

// Daemon states
export type DaemonState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * File Tracking Daemon
 * 
 * This daemon runs in the background and:
 * 1. Monitors file changes in the project
 * 2. Records those changes in the database
 * 3. Associates changes with tasks based on analysis
 * 4. Provides a communication interface with the CLI
 */
export class FileTrackingDaemon extends EventEmitter {
  private _repository: FileTrackingRepository;
  private _config: FileTrackingDaemonConfig;
  private _state: DaemonState = 'stopped';
  // Make the watcher accessible to the CLI command for status reporting
  public readonly _watcher: FileSystemWatcher | null = null;
  // Add the analysis engine
  private _analysisEngine: AnalysisEngine | null = null;
  // Add the file change analyzer
  private _fileChangeAnalyzer: FileChangeAnalyzer | null = null;
  private _taskAssociations = new Map<string, Set<string>>(); // Map of filePath -> taskIds
  private _pendingOperations = new Set<Promise<any>>();
  private _isProcessingEvents = false;
  private _eventQueue: FileChangeEvent[] = [];
  private _startTime: Date | null = null;
  private _errorCount = 0;
  private _analysisStats = {
    totalFiles: 0,
    autoAssociated: 0,
    lastAssociation: null as Date | null
  };

  /**
   * Create a new File Tracking Daemon
   * @param repository Repository for file tracking operations
   * @param config Configuration for the daemon
   */
  constructor(repository: FileTrackingRepository, config: FileTrackingDaemonConfig) {
    super();
    this._repository = repository;
    this._config = this.normalizeConfig(config);

    // Bind methods
    this.handleFileChange = this.handleFileChange.bind(this);
    this.processEventQueue = this.processEventQueue.bind(this);
  }

  /**
   * Get the current state of the daemon
   */
  get state(): DaemonState {
    return this._state;
  }

  /**
   * Get the current configuration
   */
  get config(): FileTrackingDaemonConfig {
    return { ...this._config };
  }

  /**
   * Update the daemon configuration
   * @param config New configuration (partial)
   */
  updateConfig(config: Partial<FileTrackingDaemonConfig>): void {
    this._config = {
      ...this._config,
      ...config
    };

    // Apply new configuration if daemon is running
    if (this._state === 'running' && this._watcher) {
      // Restart watcher with new configuration
      this.stop()
        .then(() => this.start())
        .catch(err => {
          this._state = 'error';
          this.emit('error', new Error(`Failed to restart daemon with new configuration: ${err.message}`));
        });
    }
  }

  /**
   * Start the daemon process
   */
  async start(): Promise<void> {
    if (this._state === 'running' || this._state === 'starting') {
      return;
    }

    try {
      this._state = 'starting';
      this.emit('stateChange', this._state);

      // Initialize the file system watcher
      const watcherConfig: FileSystemWatcherConfig = {
        watchPaths: this._config.watchPaths,
        excludePatterns: this._config.excludePaths?.map(p => `**/${p}/**`),
        includeExtensions: this._config.includeExtensions,
        debounceTime: this._config.pollingInterval,
        usePolling: this._config.pollingInterval !== undefined && this._config.pollingInterval > 0,
        pollingInterval: this._config.pollingInterval
      };

      this._watcher = new FileSystemWatcher(watcherConfig);

      // Set up event handlers for the watcher
      this._watcher.on('fileChange', this.handleFileChange.bind(this));
      this._watcher.on('error', (error) => {
        this._errorCount++;
        this.emit('error', error);
      });

      this._watcher.on('ready', (stats) => {
        console.log(`[FileTrackingDaemon] Watcher ready, watching ${stats.watchedFiles} files`);
      });

      // Start the watcher
      await this._watcher.start();

      // Initialize the analysis engine
      this._analysisEngine = new AnalysisEngine(
        this._repository,
        {
          ...this._config.analysisConfig,
          confidenceThreshold: this._config.confidenceThreshold || 70
        }
      );

      // Initialize the file change analyzer
      this._fileChangeAnalyzer = new FileChangeAnalyzer({
        ...this._config.fileChangeAnalyzerConfig,
        fileExtensions: this._config.includeExtensions || [],
        excludePatterns: this._config.excludePaths || []
      });

      this._startTime = new Date();
      this._state = 'running';
      this.emit('stateChange', this._state);
      this.emit('started', {
        startTime: this._startTime,
        watchPaths: this._config.watchPaths,
        excludePaths: this._config.excludePaths,
        watcherStatus: this._watcher.getStatus()
      });

      // Log startup
      console.log(`[FileTrackingDaemon] Started at ${this._startTime.toISOString()}`);
      console.log(`[FileTrackingDaemon] Watching paths: ${this._config.watchPaths.join(', ')}`);
      if (this._config.excludePaths && this._config.excludePaths.length > 0) {
        console.log(`[FileTrackingDaemon] Excluding paths: ${this._config.excludePaths.join(', ')}`);
      }
    } catch (error) {
      this._state = 'error';
      this.emit('stateChange', this._state);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Stop the daemon process
   */
  async stop(): Promise<void> {
    if (this._state === 'stopped' || this._state === 'stopping') {
      return;
    }

    try {
      this._state = 'stopping';
      this.emit('stateChange', this._state);

      // Wait for any pending operations to complete
      if (this._pendingOperations.size > 0) {
        console.log(`[FileTrackingDaemon] Waiting for ${this._pendingOperations.size} pending operations to complete...`);
        await Promise.all(Array.from(this._pendingOperations));
      }

      // Stop the file system watcher
      if (this._watcher) {
        await this._watcher.stop();
        this._watcher = null;
      }

      // Clean up
      this._eventQueue = [];
      this._isProcessingEvents = false;
      this._analysisEngine = null;
      this._fileChangeAnalyzer = null;

      const runtime = this._startTime ? new Date().getTime() - this._startTime.getTime() : 0;

      // Compile statistics for the stopped event
      const stats = {
        runtime,
        errorCount: this._errorCount,
        filesProcessed: this._analysisStats.totalFiles,
        filesAutoAssociated: this._analysisStats.autoAssociated,
        lastAssociation: this._analysisStats.lastAssociation
      };

      this._state = 'stopped';
      this.emit('stateChange', this._state);
      this.emit('stopped', stats);

      // Reset counters
      this._errorCount = 0;
      this._startTime = null;
      this._analysisStats = {
        totalFiles: 0,
        autoAssociated: 0,
        lastAssociation: null
      };

      console.log(`[FileTrackingDaemon] Stopped after ${runtime}ms`);
      console.log(`[FileTrackingDaemon] Processed ${stats.filesProcessed} files, auto-associated ${stats.filesAutoAssociated} files`);
    } catch (error) {
      this._state = 'error';
      this.emit('stateChange', this._state);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Force stop the daemon immediately without waiting for pending operations
   */
  async forceStop(): Promise<void> {
    if (this._state === 'stopped') {
      return;
    }

    try {
      this._state = 'stopping';
      
      // Cancel all pending operations
      this._pendingOperations.clear();
      this._eventQueue = [];
      this._isProcessingEvents = false;

      // Close watcher if it exists
      if (this._watcher) {
        await this._watcher.close();
        this._watcher = null;
      }

      this._state = 'stopped';
      this.emit('stateChange', this._state);
      this.emit('forceStopped');

      // Reset counters
      this._errorCount = 0;
      this._startTime = null;

      console.log(`[FileTrackingDaemon] Force stopped`);
    } catch (error) {
      this._state = 'error';
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Restart the daemon
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Handle a file change event from the watcher
   * This method will be called by the file system watcher (Task 17.2)
   */
  async handleFileChange(event: FileChangeEvent): Promise<void> {
    if (this._state !== 'running') {
      return;
    }

    // Check if the file should be excluded
    if (this.shouldExcludeFile(event.path)) {
      return;
    }

    // Add event to the queue
    this._eventQueue.push(event);
    
    // Emit file change event
    this.emit('fileChange', event);

    // Start processing the queue if it's not already being processed
    if (!this._isProcessingEvents) {
      this.processEventQueue();
    }
  }

  /**
   * Process the event queue
   * This handles batching and throttling of file change events
   */
  private async processEventQueue(): Promise<void> {
    if (this._isProcessingEvents || this._eventQueue.length === 0 || this._state !== 'running') {
      return;
    }

    this._isProcessingEvents = true;

    try {
      // Get the next batch of events to process based on max concurrent operations
      const batchSize = Math.min(this._eventQueue.length, this._config.maxConcurrentOperations || 5);
      const batch = this._eventQueue.splice(0, batchSize);

      // Process each event in the batch concurrently
      const operations = batch.map(event => this.processFileChange(event));

      // Track pending operations
      operations.forEach(op => this._pendingOperations.add(op));

      // Wait for all operations to complete
      await Promise.all(operations);

      // Remove completed operations from tracking
      operations.forEach(op => this._pendingOperations.delete(op));

      // If analysis engine is available and auto-associate is enabled, process batch with analysis engine
      if (this._analysisEngine && this._config.autoAssociate && batch.length > 0) {
        // Process batch with analysis engine
        try {
          const associationCount = await this._analysisEngine.processBatchFileChanges(batch);
          if (associationCount > 0) {
            console.log(`[FileTrackingDaemon] Analysis engine created ${associationCount} file-task associations`);
          }
        } catch (analysisError) {
          console.error('[FileTrackingDaemon] Error in batch analysis:', analysisError);
        }
      }

      // Continue processing if there are more events
      if (this._eventQueue.length > 0) {
        this.processEventQueue();
      } else {
        this._isProcessingEvents = false;
      }
    } catch (error) {
      this._errorCount++;
      this._isProcessingEvents = false;
      this.emit('error', error instanceof Error ? error : new Error(String(error)));

      // Continue processing after an error
      if (this._eventQueue.length > 0) {
        // Add a small delay before retrying
        setTimeout(() => this.processEventQueue(), 1000);
      }
    }
  }

  /**
   * Process a single file change event
   * Tracks the file in the database and attempts to associate it with tasks
   */
  private async processFileChange(event: FileChangeEvent): Promise<void> {
    try {
      // Update stats
      this._analysisStats.totalFiles++;

      // For deleted files, we just record the deletion but don't track the file
      if (event.type === 'deleted') {
        // Handle file deletion
        try {
          // Find file in database by path
          const fileResults = await this._repository._db.select()
            .from(files)
            .where(eq(files.path, event.path))
            .limit(1);

          if (fileResults.length > 0) {
            const fileId = fileResults[0].id;

            // Record the file deletion
            await this._repository.recordFileChange(fileId, 'deleted', fileResults[0].hash, null);

            console.log(`[FileTrackingDaemon] Recorded deletion of file ${event.path} (ID: ${fileId})`);
          }
        } catch (error) {
          console.error(`[FileTrackingDaemon] Error recording file deletion for ${event.path}:`, error);
        }
        return;
      }

      // For renamed files, handle both the old and new path
      if (event.type === 'renamed' && event.previousPath) {
        try {
          // Find old file in database
          const oldFileResults = await this._repository._db.select()
            .from(files)
            .where(eq(files.path, event.previousPath))
            .limit(1);

          if (oldFileResults.length > 0) {
            const oldFileId = oldFileResults[0].id;

            // Read the content of the new file to calculate hash
            const content = await fs.readFile(event.path, 'utf-8');
            const hash = this._repository.calculateFileHash(content);

            // Update the file record with the new path and hash
            await this._repository._db.update(files)
              .set({
                path: event.path,
                hash,
                lastModified: new Date()
              })
              .where(eq(files.id, oldFileId));

            // Record the file rename
            await this._repository.recordFileChange(
              oldFileId,
              'renamed',
              oldFileResults[0].hash,
              hash,
              undefined,
              { previousPath: event.previousPath, newPath: event.path }
            );

            console.log(`[FileTrackingDaemon] Recorded rename of file from ${event.previousPath} to ${event.path}`);

            // If auto-association is enabled, try to find tasks that should be associated with this file
            if (this._config.autoAssociate) {
              await this.tryAutoAssociateTasks(event.path, oldFileId);
            }
          }
        } catch (error) {
          console.error(`[FileTrackingDaemon] Error handling renamed file from ${event.previousPath} to ${event.path}:`, error);
        }
        return;
      }

      // Track the file in the database
      const trackResult = await this._repository.trackFile(event.path);

      if (!trackResult.success) {
        throw new Error(`Failed to track file ${event.path}: ${trackResult.error?.message}`);
      }

      // If we have file change analyzer, update file metadata
      if (this._fileChangeAnalyzer) {
        const analysisResult = await this._fileChangeAnalyzer.analyzeFileChange({
          type: event.type === 'renamed' ? 'modified' : event.type,
          path: event.path,
          timestamp: event.timestamp
        });

        if (analysisResult) {
          // Store metadata for the file
          await this._repository.updateFile(trackResult.data.id, {
            metadata: JSON.stringify({
              fileType: analysisResult.fileType,
              language: analysisResult.language,
              complexity: analysisResult.complexityMetrics,
              keywords: analysisResult.keywords,
              analyzedAt: new Date().toISOString()
            })
          });

          // Emit file analyzed event
          this.emit('fileAnalyzed', {
            fileId: trackResult.data.id,
            filePath: event.path,
            metadata: analysisResult,
            timestamp: new Date()
          });
        }
      }

      // If auto-association is enabled, try to find tasks that should be associated with this file
      if (this._config.autoAssociate) {
        await this.tryAutoAssociateTasks(event.path, trackResult.data.id);
      }
    } catch (error) {
      console.error(`[FileTrackingDaemon] Error processing file change for ${event.path}:`, error);
      throw error;
    }
  }

  /**
   * Try to automatically associate a file with relevant tasks
   * Implements Task 17.5: Analysis Engine for relating file changes to tasks
   */
  private async tryAutoAssociateTasks(filePath: string, fileId: number): Promise<void> {
    try {
      // If analysis engine is not initialized or auto-association is disabled, skip
      if (!this._analysisEngine || !this._config.autoAssociate) {
        return;
      }

      // Create a file change event for analysis
      const event: FileChangeEvent = {
        path: filePath,
        type: 'created', // Treat as created for initial analysis
        timestamp: new Date()
      };

      // Analyze the file
      const analysisResult = await this._analysisEngine.analyzeFileChange(event);

      if (!analysisResult || analysisResult.taskMatches.length === 0) {
        console.log(`[FileTrackingDaemon] No tasks found to associate with file ${filePath}`);
        return;
      }

      // Associate the file with matching tasks
      const success = await this._analysisEngine.associateFilesWithTasks(analysisResult);

      if (success) {
        // Update association tracking
        const associationCount = analysisResult.taskMatches.length;
        this._analysisStats.autoAssociated += associationCount;
        this._analysisStats.lastAssociation = new Date();

        // Track associations in memory for quick lookups
        if (!this._taskAssociations.has(filePath)) {
          this._taskAssociations.set(filePath, new Set<string>());
        }

        // Emit task association events
        for (const match of analysisResult.taskMatches) {
          // Only process matches above the confidence threshold
          if (match.confidence >= (this._config.confidenceThreshold || 70)) {
            const taskId = match.taskId;
            const relationshipType = analysisResult.suggestedRelationships.get(taskId) || 'related';

            // Add to in-memory tracking
            this._taskAssociations.get(filePath)?.add(taskId);

            // Emit task association event
            this.emit('taskAssociated', {
              filePath,
              taskId,
              confidence: match.confidence,
              relationshipType,
              automatic: true
            });

            console.log(`[FileTrackingDaemon] Auto-associated file ${filePath} with task ${taskId} (${relationshipType}, ${match.confidence}% confidence): ${match.matchReason}`);
          }
        }

        console.log(`[FileTrackingDaemon] Associated file ${filePath} with ${associationCount} tasks`);
      } else {
        console.log(`[FileTrackingDaemon] No tasks met the confidence threshold for file ${filePath}`);
      }
    } catch (error) {
      console.error(`[FileTrackingDaemon] Error auto-associating tasks for file ${filePath}:`, error);
    }
  }

  /**
   * Manually associate a file with a task
   * @param filePath Path to the file
   * @param taskId Task ID
   * @param relationshipType Type of relationship
   * @param confidence Confidence score
   */
  async associateFileWithTask(
    filePath: string,
    taskId: string, 
    relationshipType: 'implements' | 'tests' | 'documents' | 'related' = 'related',
    confidence: number = 100
  ): Promise<TaskOperationResult<any>> {
    try {
      // Check if daemon is running
      if (this._state !== 'running') {
        return {
          success: false,
          error: new Error(`Daemon is not running (current state: ${this._state})`)
        };
      }

      // Associate file with task
      const result = await this._repository.associateFileWithTask(
        taskId,
        filePath,
        relationshipType,
        confidence
      );

      if (result.success) {
        // Add to in-memory mapping for faster lookups
        if (!this._taskAssociations.has(filePath)) {
          this._taskAssociations.set(filePath, new Set<string>());
        }
        this._taskAssociations.get(filePath)?.add(taskId);

        // Emit association event
        this.emit('taskAssociated', {
          filePath,
          taskId,
          confidence,
          relationshipType,
          automatic: false
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Get all tasks associated with a file
   * @param filePath Path to the file
   */
  async getTasksForFile(filePath: string): Promise<TaskOperationResult<any>> {
    return this._repository.getTasksForFile(filePath);
  }

  /**
   * Get all files associated with a task
   * @param taskId Task ID
   */
  async getFilesForTask(taskId: string): Promise<TaskOperationResult<any>> {
    return this._repository.getFilesForTask(taskId);
  }

  /**
   * Check if a file should be excluded based on the exclude paths
   * @param filePath Path to check
   */
  private shouldExcludeFile(filePath: string): boolean {
    if (!this._config.excludePaths || this._config.excludePaths.length === 0) {
      return false;
    }

    return this._config.excludePaths.some(excludePath => {
      // Convert both paths to absolute paths for comparison
      const absoluteExcludePath = path.isAbsolute(excludePath) 
        ? excludePath 
        : path.resolve(process.cwd(), excludePath);
      const absoluteFilePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);

      // Check if the file path is within the exclude path
      return absoluteFilePath.startsWith(absoluteExcludePath);
    });
  }

  /**
   * Normalize and validate configuration
   * @param config Configuration to normalize
   */
  private normalizeConfig(config: FileTrackingDaemonConfig): FileTrackingDaemonConfig {
    return {
      watchPaths: config.watchPaths || [process.cwd()],
      excludePaths: config.excludePaths || ['node_modules', '.git'],
      autoAssociate: config.autoAssociate !== undefined ? config.autoAssociate : true,
      confidenceThreshold: config.confidenceThreshold || 70,
      pollingInterval: config.pollingInterval || 1000,
      maxConcurrentOperations: config.maxConcurrentOperations || 5,
      includeExtensions: config.includeExtensions || [],
      analysisConfig: config.analysisConfig || {},
      fileChangeAnalyzerConfig: config.fileChangeAnalyzerConfig || {}
    };
  }
}