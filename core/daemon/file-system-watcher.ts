/**
 * File System Watcher
 * Implements Task 17.2: File System Watcher for tracking file changes
 * 
 * This module provides a high-performance file system watcher using Chokidar
 * with configurable filtering, debouncing, and event normalization.
 */

import chokidar from 'chokidar';
import path from 'path';
import { EventEmitter } from 'events';
import { FileChangeEvent } from './file-tracking-daemon.ts';
import { debounce } from './utils.ts';

/**
 * Configuration options for the file system watcher
 */
export interface FileSystemWatcherConfig {
  // Paths to watch
  watchPaths: string[];
  
  // Patterns to exclude (glob patterns)
  excludePatterns?: string[];
  
  // File extensions to watch (e.g., ['.js', '.ts', '.md'])
  includeExtensions?: string[];
  
  // Whether to watch for add events
  watchAdd?: boolean;
  
  // Whether to watch for change events
  watchChange?: boolean;
  
  // Whether to watch for unlink (delete) events
  watchUnlink?: boolean;
  
  // Debounce time in milliseconds
  debounceTime?: number;
  
  // Whether to use polling instead of fs events (useful for network drives)
  usePolling?: boolean;
  
  // Polling interval in milliseconds (only used if usePolling is true)
  pollingInterval?: number;
  
  // Whether to ignore initial add events when starting the watcher
  ignoreInitial?: boolean;
}

/**
 * File System Watcher Status
 */
export interface FileSystemWatcherStatus {
  isWatching: boolean;
  watchPaths: string[];
  excludePatterns: string[];
  includeExtensions: string[] | null;
  watchedFiles: number;
  pendingEvents: number;
  eventCounts: {
    created: number;
    modified: number;
    deleted: number;
    renamed: number;
  };
}

/**
 * FileSystemWatcher class for monitoring file changes
 * Uses Chokidar for high-performance file system monitoring
 */
export class FileSystemWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private config: Required<FileSystemWatcherConfig>;
  private isWatching: boolean = false;
  private pendingEvents: Map<string, FileChangeEvent> = new Map();
  private eventCounts: {
    created: number;
    modified: number;
    deleted: number;
    renamed: number;
  } = {
    created: 0,
    modified: 0,
    deleted: 0,
    renamed: 0
  };
  private recentlyDeleted: Set<string> = new Set();
  private recentlyRenamed: Map<string, string> = new Map();
  private watchedFiles: number = 0;
  
  /**
   * Create a new file system watcher
   * @param config Configuration options
   */
  constructor(config: FileSystemWatcherConfig) {
    super();
    
    // Set defaults for optional config properties
    this.config = {
      watchPaths: config.watchPaths,
      excludePatterns: config.excludePatterns || ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      includeExtensions: config.includeExtensions || [],
      watchAdd: config.watchAdd !== undefined ? config.watchAdd : true,
      watchChange: config.watchChange !== undefined ? config.watchChange : true,
      watchUnlink: config.watchUnlink !== undefined ? config.watchUnlink : true,
      debounceTime: config.debounceTime || 300,
      usePolling: config.usePolling || false,
      pollingInterval: config.pollingInterval || 1000,
      ignoreInitial: config.ignoreInitial !== undefined ? config.ignoreInitial : true
    };
    
    // Bind event handlers
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleUnlink = this.handleUnlink.bind(this);
    this.processEvents = this.processEvents.bind(this);
    this.handleReady = this.handleReady.bind(this);
    this.handleError = this.handleError.bind(this);
    
    // Create debounced version of processEvents
    this.debouncedProcessEvents = debounce(
      this.processEvents, 
      this.config.debounceTime
    );
  }
  
  // Debounced version of processEvents (will be defined in constructor)
  private debouncedProcessEvents: () => void;
  
  /**
   * Start watching the file system
   * @returns Promise that resolves when the watcher is ready
   */
  async start(): Promise<void> {
    if (this.isWatching) {
      return;
    }
    
    try {
      // Create watcher instance
      this.watcher = chokidar.watch(this.config.watchPaths, {
        ignored: this.config.excludePatterns,
        persistent: true,
        ignoreInitial: this.config.ignoreInitial,
        usePolling: this.config.usePolling,
        interval: this.config.pollingInterval,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      });
      
      // Set up event handlers
      if (this.config.watchAdd) {
        this.watcher.on('add', this.handleAdd);
      }
      
      if (this.config.watchChange) {
        this.watcher.on('change', this.handleChange);
      }
      
      if (this.config.watchUnlink) {
        this.watcher.on('unlink', this.handleUnlink);
      }
      
      // Handle renamed files (detected as unlink followed by add)
      this.watcher.on('ready', this.handleReady);
      this.watcher.on('error', this.handleError);
      
      this.isWatching = true;
      this.emit('started', { paths: this.config.watchPaths });
      
      // Return a promise that resolves when the watcher is ready
      return new Promise((resolve) => {
        this.watcher!.once('ready', () => resolve());
      });
    } catch (error) {
      this.isWatching = false;
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Stop watching the file system
   */
  async stop(): Promise<void> {
    if (!this.isWatching || !this.watcher) {
      return;
    }
    
    try {
      // Process any pending events
      this.processEvents();
      
      // Close the watcher
      await this.watcher.close();
      
      this.watcher = null;
      this.isWatching = false;
      this.pendingEvents.clear();
      this.recentlyDeleted.clear();
      this.recentlyRenamed.clear();
      this.emit('stopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Get the current status of the watcher
   */
  getStatus(): FileSystemWatcherStatus {
    return {
      isWatching: this.isWatching,
      watchPaths: this.config.watchPaths,
      excludePatterns: this.config.excludePatterns,
      includeExtensions: this.config.includeExtensions.length > 0 ? 
        this.config.includeExtensions : null,
      watchedFiles: this.watchedFiles,
      pendingEvents: this.pendingEvents.size,
      eventCounts: { ...this.eventCounts }
    };
  }
  
  /**
   * Add a new path to watch
   * @param pathToWatch Path to add to the watch list
   */
  addPath(pathToWatch: string): void {
    if (!this.isWatching || !this.watcher) {
      throw new Error('Watcher is not running');
    }
    
    const absolutePath = path.isAbsolute(pathToWatch) ? 
      pathToWatch : path.resolve(process.cwd(), pathToWatch);
    
    this.watcher.add(absolutePath);
    this.config.watchPaths.push(absolutePath);
  }
  
  /**
   * Remove a path from the watch list
   * @param pathToRemove Path to remove from the watch list
   */
  removePath(pathToRemove: string): void {
    if (!this.isWatching || !this.watcher) {
      throw new Error('Watcher is not running');
    }
    
    const absolutePath = path.isAbsolute(pathToRemove) ? 
      pathToRemove : path.resolve(process.cwd(), pathToRemove);
    
    this.watcher.unwatch(absolutePath);
    this.config.watchPaths = this.config.watchPaths.filter(p => p !== absolutePath);
  }
  
  /**
   * Update the configuration
   * @param newConfig New configuration options (partial)
   */
  updateConfig(newConfig: Partial<FileSystemWatcherConfig>): void {
    // Store old config for comparison
    const oldConfig = { ...this.config };
    
    // Update config with new values
    Object.assign(this.config, newConfig);
    
    // If watch paths or exclude patterns have changed and watcher is running,
    // we need to restart it to apply the new configuration
    const pathsChanged = 
      JSON.stringify(oldConfig.watchPaths) !== JSON.stringify(this.config.watchPaths) ||
      JSON.stringify(oldConfig.excludePatterns) !== JSON.stringify(this.config.excludePatterns);
    
    if (pathsChanged && this.isWatching) {
      this.stop().then(() => this.start());
    }
  }
  
  /**
   * Handle file add event
   * @param filePath Path to the added file
   */
  private handleAdd(filePath: string): void {
    // Skip files with extensions not in the include list (if specified)
    if (this.config.includeExtensions.length > 0) {
      const ext = path.extname(filePath);
      if (!this.config.includeExtensions.includes(ext)) {
        return;
      }
    }
    
    // Check if this is a rename (file was recently deleted)
    let isRename = false;
    let oldPath: string | undefined;
    
    // Look for a matching file that was recently deleted
    for (const deletedPath of this.recentlyDeleted) {
      // If filenames match or are similar, it's likely a rename
      if (path.basename(deletedPath) === path.basename(filePath)) {
        isRename = true;
        oldPath = deletedPath;
        this.recentlyDeleted.delete(deletedPath);
        break;
      }
    }
    
    // Create file change event
    const event: FileChangeEvent = {
      path: filePath,
      type: isRename ? 'renamed' : 'created',
      timestamp: new Date()
    };
    
    // Add previous path for renamed files
    if (isRename && oldPath) {
      event.previousPath = oldPath;
      this.recentlyRenamed.set(filePath, oldPath);
    }
    
    // Add to pending events
    this.pendingEvents.set(filePath, event);
    
    // Update event count
    if (isRename) {
      this.eventCounts.renamed++;
    } else {
      this.eventCounts.created++;
    }
    
    // Update watched files count
    this.watchedFiles++;
    
    // Schedule processing
    this.debouncedProcessEvents();
  }
  
  /**
   * Handle file change event
   * @param filePath Path to the changed file
   */
  private handleChange(filePath: string): void {
    // Skip files with extensions not in the include list (if specified)
    if (this.config.includeExtensions.length > 0) {
      const ext = path.extname(filePath);
      if (!this.config.includeExtensions.includes(ext)) {
        return;
      }
    }
    
    // Check if the file was recently added - if so, coalesce the events
    const existingEvent = this.pendingEvents.get(filePath);
    if (existingEvent && existingEvent.type === 'created') {
      // No need to emit a separate change event for newly created files
      return;
    }
    
    // Create file change event
    const event: FileChangeEvent = {
      path: filePath,
      type: 'modified',
      timestamp: new Date()
    };
    
    // Add to pending events
    this.pendingEvents.set(filePath, event);
    
    // Update event count
    this.eventCounts.modified++;
    
    // Schedule processing
    this.debouncedProcessEvents();
  }
  
  /**
   * Handle file unlink (delete) event
   * @param filePath Path to the deleted file
   */
  private handleUnlink(filePath: string): void {
    // Skip files with extensions not in the include list (if specified)
    if (this.config.includeExtensions.length > 0) {
      const ext = path.extname(filePath);
      if (!this.config.includeExtensions.includes(ext)) {
        return;
      }
    }
    
    // Add to recently deleted list for rename detection
    this.recentlyDeleted.add(filePath);
    
    // Create file change event
    const event: FileChangeEvent = {
      path: filePath,
      type: 'deleted',
      timestamp: new Date()
    };
    
    // Add to pending events
    this.pendingEvents.set(filePath, event);
    
    // Update event count
    this.eventCounts.deleted++;
    
    // Update watched files count
    this.watchedFiles = Math.max(0, this.watchedFiles - 1);
    
    // Schedule processing
    this.debouncedProcessEvents();
    
    // After some time, clean up the recently deleted list if the file wasn't renamed
    setTimeout(() => {
      this.recentlyDeleted.delete(filePath);
    }, this.config.debounceTime * 2);
  }
  
  /**
   * Handle watcher ready event
   */
  private handleReady(): void {
    if (this.watcher) {
      // Get approximate count of watched files
      this.watchedFiles = this.watcher.getWatched()
        .reduce((sum, files) => sum + Object.keys(files).length, 0);
      
      this.emit('ready', {
        watchedFiles: this.watchedFiles,
        paths: this.config.watchPaths
      });
    }
  }
  
  /**
   * Handle watcher error
   * @param error Error that occurred
   */
  private handleError(error: Error): void {
    this.emit('error', error);
  }
  
  /**
   * Process pending events
   * This is called after the debounce period to batch events together
   */
  private processEvents(): void {
    if (this.pendingEvents.size === 0) {
      return;
    }
    
    // Get a copy of the pending events
    const events = Array.from(this.pendingEvents.values());
    
    // Clear pending events
    this.pendingEvents.clear();
    
    // Sort events by timestamp (oldest first)
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Emit events
    for (const event of events) {
      this.emit('fileChange', event);
    }
    
    // Emit batch event
    this.emit('batchFileChanges', events);
  }
}