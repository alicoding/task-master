/**
 * Session Recovery Manager for Task Master CLI
 * Implements Task 17.8: Session Recovery - Subtask 17.8.1: Session Persistence
 * 
 * This module provides functionality for recovering terminal sessions after
 * unexpected terminations, system reboots, or process crashes.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.ts';
import {
  terminalSessions,
  sessionTasks,
  fileSessionMapping,
  timeWindows,
  TerminalSession
} from '../../db/schema-extensions.ts';
import { eq, and, or, desc, like, gt, lt, between } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { TerminalFingerprint, TerminalSessionState } from './terminal-session-types.ts';
import { TimeWindowManager } from './time-window-manager.ts';

// Create logger for session recovery
const logger = createLogger('SessionRecoveryManager');

/**
 * Criteria for finding recoverable sessions
 */
export interface RecoveryCriteria {
  /** User who owns the sessions */
  user?: string;
  /** Terminal TTY path pattern */
  ttyPattern?: string;
  /** Timeframe to search within (start time) */
  since?: Date;
  /** Timeframe to search within (end time) */
  until?: Date;
  /** Only return sessions with a specific status */
  status?: 'active' | 'inactive' | 'disconnected';
  /** Only include sessions working on a specific task */
  taskId?: string;
  /** Minimum recovery priority (higher value means higher priority for recovery) */
  minPriority?: number;
  /** Maximum number of results to return */
  limit?: number;
}

/**
 * Session recovery configuration
 */
export interface SessionRecoveryConfig {
  /** Maximum age of sessions to consider for recovery (in milliseconds) */
  maxSessionAge: number;
  /** Whether to automatically recover sessions on detection */
  autoRecover: boolean;
  /** Number of recovery attempts to allow before considering a session unrecoverable */
  maxRecoveryAttempts: number;
  /** Similarity threshold for matching sessions by fingerprint (0-1) */
  fingerprintSimilarityThreshold: number;
  /** Whether to maintain recovery history */
  trackRecoveryHistory: boolean;
  /** Criteria for selecting the best session to recover when multiple matches are found */
  selectionCriteria: 'mostRecent' | 'mostActive' | 'bestMatch';
}

/**
 * Default session recovery configuration
 */
const DEFAULT_SESSION_RECOVERY_CONFIG: SessionRecoveryConfig = {
  maxSessionAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoRecover: true,
  maxRecoveryAttempts: 5,
  fingerprintSimilarityThreshold: 0.7,
  trackRecoveryHistory: true,
  selectionCriteria: 'mostRecent'
};

/**
 * Result of a session recovery attempt
 */
export interface RecoveryResult {
  /** Whether the recovery was successful */
  success: boolean;
  /** The recovered session, if successful */
  session?: TerminalSessionState;
  /** ID of the recovered session */
  sessionId?: string;
  /** Error message if recovery failed */
  error?: string;
  /** Timestamp when recovery was attempted */
  timestamp: Date;
  /** Type of recovery performed */
  recoveryType: 'auto' | 'manual' | 'requested';
  /** Number of recovery attempts for this session */
  attemptNumber: number;
  /** Score representing the confidence of the recovery match (0-1) */
  matchScore?: number;
}

/**
 * Information about a recoverable session
 */
export interface RecoverableSession {
  /** ID of the recoverable session */
  id: string;
  /** Last active time of the session */
  lastActive: Date;
  /** Current status of the session */
  status: 'active' | 'inactive' | 'disconnected';
  /** Recovery priority score (higher means higher priority) */
  recoveryPriority: number;
  /** Session duration in milliseconds */
  duration: number;
  /** Number of tasks associated with the session */
  taskCount: number;
  /** Number of files modified in the session */
  fileCount: number;
  /** Terminal details for the session */
  terminal: {
    tty?: string;
    user?: string;
    shell?: string;
    pid?: number;
  };
}

/**
 * Description of a recovery source
 */
export interface RecoverySource {
  /** Unique identifier for the recovery source */
  id: string;
  /** Human-readable name of the recovery source */
  name: string;
  /** Function to recover a session */
  recover: (sessionId: string) => Promise<RecoveryResult>;
  /** Priority of the recovery source (higher values take precedence) */
  priority: number;
}

/**
 * Session Recovery Manager for terminal sessions
 */
export class SessionRecoveryManager extends EventEmitter {
  private _db: BetterSQLite3Database;
  private _config: SessionRecoveryConfig;
  private _recoverySources: Map<string, RecoverySource> = new Map();
  private _timeWindowManager: TimeWindowManager;

  /**
   * Create a new session recovery manager
   * @param db Database connection
   * @param config Configuration options
   */
  constructor(db: BetterSQLite3Database, config: Partial<SessionRecoveryConfig> = {}) {
    super();
    this._db = db;
    this._config = { ...DEFAULT_SESSION_RECOVERY_CONFIG, ...config };

    // Create time window manager
    this._timeWindowManager = new TimeWindowManager(db);

    // Forward time window events
    this._timeWindowManager.on('window:created', (data) => {
      this.emit('window:created', data);
    });

    this._timeWindowManager.on('window:split', (data) => {
      this.emit('window:split', data);
    });

    this._timeWindowManager.on('window:merged', (data) => {
      this.emit('window:merged', data);
    });

    // Register the default recovery source
    this.registerRecoverySource({
      id: 'database',
      name: 'Database Recovery',
      recover: this.recoverSessionFromDatabase.bind(this),
      priority: 10
    });

    logger.debug('Session Recovery Manager initialized with config:', {
      maxSessionAge: this._config.maxSessionAge,
      autoRecover: this._config.autoRecover,
      maxRecoveryAttempts: this._config.maxRecoveryAttempts,
      selectionCriteria: this._config.selectionCriteria
    });
  }

  /**
   * Get the time window manager instance
   * @returns Time window manager
   */
  getTimeWindowManager(): TimeWindowManager {
    return this._timeWindowManager;
  }
  
  /**
   * Register a recovery source for recovering sessions
   * @param source Recovery source to register
   */
  registerRecoverySource(source: RecoverySource): void {
    this._recoverySources.set(source.id, source);
    logger.debug(`Registered recovery source: ${source.name} (${source.id}) with priority ${source.priority}`);
  }
  
  /**
   * Find recoverable sessions based on specified criteria
   * @param criteria Criteria for finding recoverable sessions
   * @returns List of recoverable sessions
   */
  async findRecoverableSessions(criteria: RecoveryCriteria = {}): Promise<RecoverableSession[]> {
    try {
      logger.debug('Finding recoverable sessions with criteria:', criteria);
      
      // Start building the query
      let query = this._db.select({
        id: terminalSessions.id,
        lastActive: terminalSessions.lastActive,
        status: terminalSessions.status,
        tty: terminalSessions.tty,
        user: terminalSessions.user,
        shell: terminalSessions.shell,
        pid: terminalSessions.pid,
        startTime: terminalSessions.startTime,
        currentTaskId: terminalSessions.currentTaskId,
        connectionCount: terminalSessions.connectionCount,
        recoveryCount: terminalSessions.recoveryCount
      }).from(terminalSessions);
      
      // Apply criteria filters
      const conditions = [];
      
      // Filter by user
      if (criteria.user) {
        conditions.push(eq(terminalSessions.user, criteria.user));
      }
      
      // Filter by TTY pattern
      if (criteria.ttyPattern) {
        conditions.push(like(terminalSessions.tty, `%${criteria.ttyPattern}%`));
      }
      
      // Filter by timeframe
      if (criteria.since) {
        conditions.push(gt(terminalSessions.lastActive, criteria.since));
      }
      
      if (criteria.until) {
        conditions.push(lt(terminalSessions.lastActive, criteria.until));
      }
      
      // Filter by status
      if (criteria.status) {
        conditions.push(eq(terminalSessions.status, criteria.status));
      }
      
      // Filter by task
      if (criteria.taskId) {
        // We need to join with session_tasks to find sessions with this task
        query = query.innerJoin(
          sessionTasks, 
          and(
            eq(sessionTasks.sessionId, terminalSessions.id),
            eq(sessionTasks.taskId, criteria.taskId)
          )
        );
      }
      
      // Apply all conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Order by recency (most recent first)
      query = query.orderBy(desc(terminalSessions.lastActive));
      
      // Apply limit if specified
      if (criteria.limit && criteria.limit > 0) {
        query = query.limit(criteria.limit);
      }
      
      // Execute the query
      const sessions = await query;
      
      // Calculate recovery priority for each session
      const recoverableSessions: RecoverableSession[] = await Promise.all(
        sessions.map(async session => {
          // Calculate session duration
          const startTime = new Date(session.startTime);
          const lastActive = new Date(session.lastActive);
          const duration = lastActive.getTime() - startTime.getTime();
          
          // Count tasks associated with this session
          const tasks = await this._db.select().from(sessionTasks)
            .where(eq(sessionTasks.sessionId, session.id));
          
          // Count files modified in this session
          const files = await this._db.select().from(fileSessionMapping)
            .where(eq(fileSessionMapping.sessionId, session.id));
          
          // Calculate recovery priority based on session properties
          // Higher values mean higher priority for recovery
          let priority = 0;
          
          // Recent sessions get higher priority
          const ageInHours = (Date.now() - lastActive.getTime()) / (60 * 60 * 1000);
          priority += Math.max(0, 100 - ageInHours); // Newer sessions get up to 100 points
          
          // Active sessions get higher priority than inactive or disconnected
          if (session.status === 'active') priority += 50;
          else if (session.status === 'inactive') priority += 30;
          
          // Sessions with more activity get higher priority
          priority += Math.min(30, tasks.length * 2); // Up to 30 points for tasks
          priority += Math.min(20, files.length); // Up to 20 points for files
          
          // Sessions with fewer recovery attempts get higher priority
          priority += Math.max(0, 10 - (session.recoveryCount || 0) * 2); // Up to 10 points
          
          // Longer sessions get higher priority
          const durationHours = duration / (60 * 60 * 1000);
          priority += Math.min(20, durationHours * 2); // Up to 20 points for duration
          
          // Apply minimum priority filter
          if (criteria.minPriority !== undefined && priority < criteria.minPriority) {
            return null;
          }
          
          return {
            id: session.id,
            lastActive,
            status: session.status as 'active' | 'inactive' | 'disconnected',
            recoveryPriority: priority,
            duration,
            taskCount: tasks.length,
            fileCount: files.length,
            terminal: {
              tty: session.tty,
              user: session.user,
              shell: session.shell,
              pid: session.pid
            }
          };
        })
      );
      
      // Filter out null results and sort by priority
      const filteredSessions = recoverableSessions.filter(session => session !== null) as RecoverableSession[];
      return filteredSessions.sort((a, b) => b.recoveryPriority - a.recoveryPriority);
    } catch (error) {
      logger.error('Error finding recoverable sessions:', error);
      return [];
    }
  }
  
  /**
   * Recover a specific session by ID
   * @param sessionId ID of the session to recover
   * @returns Recovered session state or null if recovery failed
   */
  async recoverSession(sessionId: string): Promise<TerminalSessionState | null> {
    try {
      logger.debug(`Attempting to recover session: ${sessionId}`);

      // Check if session exists
      const session = await this._db.select().from(terminalSessions)
        .where(eq(terminalSessions.id, sessionId))
        .limit(1);

      if (session.length === 0) {
        logger.error(`Session not found: ${sessionId}`);
        return null;
      }

      // Check recovery attempt count
      const recoveryCount = session[0].recoveryCount || 0;
      if (recoveryCount >= this._config.maxRecoveryAttempts) {
        logger.warn(`Session ${sessionId} has reached maximum recovery attempts (${recoveryCount})`);

        // We'll still try to recover but will emit a warning event
        this.emit('session:recovery:warning', {
          sessionId,
          message: `Maximum recovery attempts reached (${recoveryCount})`,
          recoveryCount
        });
      }

      // Check session age
      const lastActive = new Date(session[0].lastActive);
      const age = Date.now() - lastActive.getTime();

      if (age > this._config.maxSessionAge) {
        logger.warn(`Session ${sessionId} exceeds maximum age for recovery (${age}ms)`);

        // Emit a warning event, but still try to recover
        this.emit('session:recovery:warning', {
          sessionId,
          message: `Session exceeds maximum age for recovery (${age}ms)`,
          age
        });
      }

      // Sort recovery sources by priority (highest first)
      const sortedSources = Array.from(this._recoverySources.values())
        .sort((a, b) => b.priority - a.priority);

      // Try each recovery source in order until one succeeds
      for (const source of sortedSources) {
        logger.debug(`Trying recovery source: ${source.name} (${source.id})`);

        const result = await source.recover(sessionId);

        if (result.success && result.session) {
          // Get the current time for recovery tracking
          const recoveryTime = new Date();

          // Create a recovery time window
          try {
            // Find or create a time window for this recovery operation
            const timeWindow = await this._timeWindowManager.getOrCreateTimeWindowForTimestamp(
              sessionId,
              recoveryTime,
              {
                windowDuration: 60 * 60 * 1000, // 1 hour
                name: `Recovery Window (attempt ${recoveryCount + 1})`,
                type: 'recovery'
              }
            );

            logger.debug(`Created recovery time window: ${timeWindow.id}`);

            // Emit time window event
            this.emit('session:recovery:window-created', {
              sessionId,
              windowId: timeWindow.id,
              recoveryTime,
              recoveryCount: recoveryCount + 1
            });
          } catch (windowError) {
            logger.warn(`Error creating recovery time window: ${windowError}`);
            // Continue with recovery even if time window creation fails
          }

          // Update recovery count and last recovery time
          await this._db.update(terminalSessions)
            .set({
              recoveryCount: recoveryCount + 1,
              lastRecovery: recoveryTime,
              recoverySource: source.id,
              status: 'active',
              lastActive: recoveryTime
            })
            .where(eq(terminalSessions.id, sessionId));

          // Emit recovery success event
          this.emit('session:recovery:success', {
            sessionId,
            recoverySource: source.id,
            recoveryCount: recoveryCount + 1,
            recoveryTime
          });

          logger.info(`Successfully recovered session ${sessionId} using ${source.name}`);

          // Try to auto-detect any missing time windows for the session
          try {
            const windows = await this._timeWindowManager.findTimeWindows({ sessionId });

            if (windows.length === 0) {
              logger.debug(`No time windows found for session ${sessionId}, auto-detecting...`);
              await this._timeWindowManager.autoDetectTimeWindows(sessionId);
            }
          } catch (windowError) {
            logger.warn(`Error auto-detecting time windows: ${windowError}`);
            // Continue with recovery even if window detection fails
          }

          return result.session;
        }
      }

      // If we get here, all recovery sources failed
      logger.error(`Failed to recover session ${sessionId} after trying all recovery sources`);

      // Update recovery count and mark as failed
      await this._db.update(terminalSessions)
        .set({
          recoveryCount: recoveryCount + 1,
          lastRecovery: new Date(),
          recoverySource: 'failed'
        })
        .where(eq(terminalSessions.id, sessionId));

      // Emit recovery failure event
      this.emit('session:recovery:failure', {
        sessionId,
        recoveryCount: recoveryCount + 1,
        recoveryTime: new Date()
      });

      return null;
    } catch (error) {
      logger.error(`Error recovering session ${sessionId}:`, error);

      // Emit recovery error event
      this.emit('session:recovery:error', {
        sessionId,
        error
      });

      return null;
    }
  }
  
  /**
   * Default recovery function using database information
   * @param sessionId ID of the session to recover
   * @returns Recovery result
   */
  private async recoverSessionFromDatabase(sessionId: string): Promise<RecoveryResult> {
    try {
      // Get session from database
      const sessions = await this._db.select().from(terminalSessions)
        .where(eq(terminalSessions.id, sessionId))
        .limit(1);
      
      if (sessions.length === 0) {
        return {
          success: false,
          error: `Session ${sessionId} not found in database`,
          timestamp: new Date(),
          recoveryType: 'manual',
          attemptNumber: 1
        };
      }
      
      const session = sessions[0];
      
      // Create a session state from the database record
      const sessionState: TerminalSessionState = {
        id: session.id,
        fingerprint: {
          tty: session.tty || '',
          pid: session.pid || 0,
          ppid: session.ppid || 0,
          user: session.user || '',
          shell: session.shell || '',
          termEnv: '',
        },
        startTime: session.startTime,
        lastActive: session.lastActive,
        status: session.status as 'active' | 'inactive' | 'disconnected',
        windowSize: {
          columns: session.windowColumns || 80,
          rows: session.windowRows || 24
        },
        currentTaskId: session.currentTaskId,
        recentTaskIds: [],
        connectionCount: session.connectionCount || 1,
        active: session.status === 'active',
        environmentVariables: {}
      };
      
      // Get recent tasks for this session
      const tasks = await this._db.select().from(sessionTasks)
        .where(eq(sessionTasks.sessionId, sessionId))
        .orderBy(desc(sessionTasks.accessTime))
        .limit(10);
      
      // Add recent task IDs
      sessionState.recentTaskIds = tasks.map(t => t.taskId);
      
      // Calculate recovery attempt number
      const attemptNumber = (session.recoveryCount || 0) + 1;
      
      return {
        success: true,
        session: sessionState,
        sessionId,
        timestamp: new Date(),
        recoveryType: 'manual',
        attemptNumber,
        matchScore: 1.0 // Perfect match since we're recovering directly from database
      };
    } catch (error) {
      logger.error(`Error recovering session ${sessionId} from database:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        recoveryType: 'manual',
        attemptNumber: 1
      };
    }
  }
  
  /**
   * Find and recover the most appropriate session for the current terminal
   * @param fingerprint Terminal fingerprint to match against
   * @returns Recovered session or null if no suitable session found
   */
  async recoverMostRecentSession(fingerprint?: TerminalFingerprint): Promise<TerminalSessionState | null> {
    try {
      // Use provided fingerprint or get current fingerprint
      const termFingerprint = fingerprint || await this.getCurrentTerminalFingerprint();
      
      if (!termFingerprint) {
        logger.error('Could not get terminal fingerprint for recovery');
        return null;
      }
      
      // Create criteria for finding most relevant session
      const criteria: RecoveryCriteria = {
        user: termFingerprint.user,
        ttyPattern: termFingerprint.tty,
        limit: 5 // Get the 5 most relevant sessions
      };
      
      // Find potential sessions to recover
      const recoverableSessions = await this.findRecoverableSessions(criteria);
      
      if (recoverableSessions.length === 0) {
        logger.info('No recoverable sessions found for current terminal');
        return null;
      }
      
      // Use the highest priority session
      const bestSession = recoverableSessions[0];
      
      // Attempt to recover the session
      return await this.recoverSession(bestSession.id);
    } catch (error) {
      logger.error('Error recovering most recent session:', error);
      return null;
    }
  }
  
  /**
   * Find and recover all disconnected sessions for the current user
   * @returns Recovery result summary
   */
  async recoverAllUserSessions(): Promise<{
    total: number;
    successful: number;
    failed: number;
    sessions: Array<{ id: string; success: boolean; error?: string }>
  }> {
    try {
      // Get current user
      const userInfo = await this.getCurrentTerminalFingerprint();
      const user = userInfo?.user || '';
      
      if (!user) {
        logger.error('Could not determine current user for session recovery');
        return { total: 0, successful: 0, failed: 0, sessions: [] };
      }
      
      // Find all disconnected sessions for the current user
      const criteria: RecoveryCriteria = {
        user,
        status: 'disconnected'
      };
      
      const recoverableSessions = await this.findRecoverableSessions(criteria);
      
      if (recoverableSessions.length === 0) {
        logger.info(`No disconnected sessions found for user ${user}`);
        return { total: 0, successful: 0, failed: 0, sessions: [] };
      }
      
      // Try to recover each session
      const results = [];
      let successful = 0;
      let failed = 0;
      
      for (const session of recoverableSessions) {
        const recoveredSession = await this.recoverSession(session.id);
        
        if (recoveredSession) {
          successful++;
          results.push({ id: session.id, success: true });
        } else {
          failed++;
          results.push({ id: session.id, success: false, error: 'Recovery failed' });
        }
      }
      
      logger.info(`Recovered ${successful}/${recoverableSessions.length} sessions for user ${user}`);
      
      return {
        total: recoverableSessions.length,
        successful,
        failed,
        sessions: results
      };
    } catch (error) {
      logger.error('Error recovering all user sessions:', error);
      return { total: 0, successful: 0, failed: 0, sessions: [] };
    }
  }
  
  /**
   * Get the current terminal fingerprint
   * Only used internally as a fallback
   */
  private async getCurrentTerminalFingerprint(): Promise<TerminalFingerprint | null> {
    try {
      // This is a minimal implementation that should be replaced with actual fingerprinting logic
      return {
        tty: process.stdin.isTTY ? '/dev/tty' : '',
        pid: process.pid,
        ppid: process.ppid,
        user: process.env.USER || '',
        shell: process.env.SHELL || '',
        termEnv: process.env.TERM || ''
      };
    } catch (error) {
      logger.error('Error getting current terminal fingerprint:', error);
      return null;
    }
  }
}