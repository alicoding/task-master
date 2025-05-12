# Session Recovery Architecture Design

## Overview

The Session Recovery component for Task Master CLI enables the recovery of terminal sessions and their associated tasks and files after unexpected terminations, system reboots, or process crashes. This feature enhances the Terminal Integration by providing session continuity across different terminal instances and over time.

## Goals

1. Provide reliable session persistence across terminal restarts
2. Enable time-window-based session management for retroactive associations
3. Support retroactive task assignment to past sessions
4. Maintain reliable session history and statistics
5. Integrate seamlessly with existing Terminal Integration components

## Components

### 1. Session Recovery Manager

The `SessionRecoveryManager` will be the primary component responsible for:

- Finding and recovering lost or disconnected sessions
- Managing session time windows for activity grouping
- Supporting retroactive task assignments to sessions
- Providing methods to query inactive/historical sessions
- Automatic recovery of sessions on terminal restart

### 2. Time Window Management

The `TimeWindowManager` will handle:

- Grouping of terminal activities into logical time windows
- Detecting and managing session boundaries
- Managing session gaps and breaks
- Identifying related activities across session boundaries
- Providing time-based filtering and query capabilities

### 3. Retroactive Assignment Service

The `RetroactiveAssignmentService` will enable:

- Assigning tasks to past session activities
- Modifying file-task associations retroactively
- Recalculating metrics and statistics after retroactive changes
- Providing an API for manual retroactive assignment

## Database Schema

The existing terminal session tables will be sufficient for most of the session recovery functionality. We'll add new fields for tracking recovery attempts:

```sql
-- Add recovery-related fields to terminal_sessions table
ALTER TABLE terminal_sessions ADD COLUMN
  recovery_count INTEGER DEFAULT 0;
ALTER TABLE terminal_sessions ADD COLUMN
  last_recovery DATETIME;
ALTER TABLE terminal_sessions ADD COLUMN
  recovery_source TEXT;
```

## API Design

### SessionRecoveryManager

```typescript
class SessionRecoveryManager {
  /**
   * Initialize the session recovery manager
   */
  constructor(db: BetterSQLite3Database, config?: SessionRecoveryConfig);

  /**
   * Find and recover sessions that match the given criteria
   */
  async findRecoverableSessions(criteria: RecoveryCriteria): Promise<RecoverableSession[]>;

  /**
   * Attempt to recover a specific session
   */
  async recoverSession(sessionId: string): Promise<TerminalSessionState | null>;

  /**
   * Recover the most recent session for the current terminal
   */
  async recoverMostRecentSession(): Promise<TerminalSessionState | null>;

  /**
   * Recover all disconnected sessions for the current user
   */
  async recoverAllUserSessions(): Promise<RecoveryResult>;

  /**
   * Register a new recovery source
   */
  registerRecoverySource(source: RecoverySource): void;
}
```

### TimeWindowManager

```typescript
class TimeWindowManager {
  /**
   * Initialize time window manager
   */
  constructor(db: BetterSQLite3Database, config?: TimeWindowConfig);

  /**
   * Find a time window containing the specified timestamp
   */
  async findTimeWindow(timestamp: Date): Promise<TimeWindow | null>;

  /**
   * Create a new time window
   */
  async createTimeWindow(start: Date, end: Date, metadata?: Record<string, any>): Promise<TimeWindow>;

  /**
   * Get all time windows for a session
   */
  async getSessionTimeWindows(sessionId: string): Promise<TimeWindow[]>;

  /**
   * Split a time window at a specific point
   */
  async splitTimeWindow(windowId: string, splitPoint: Date): Promise<[TimeWindow, TimeWindow]>;

  /**
   * Merge adjacent time windows
   */
  async mergeTimeWindows(windowIds: string[]): Promise<TimeWindow>;
}
```

### RetroactiveAssignmentService

```typescript
class RetroactiveAssignmentService {
  /**
   * Initialize retroactive assignment service
   */
  constructor(db: BetterSQLite3Database, config?: RetroactiveAssignmentConfig);

  /**
   * Assign a task to a past session
   */
  async assignTaskToSession(
    taskId: string, 
    sessionId: string, 
    timestamp?: Date
  ): Promise<void>;

  /**
   * Reassign file changes to a different task
   */
  async reassignFileChanges(
    fileIds: number[], 
    fromTaskId: string,

    toTaskId: string,
    timeRange?: [Date, Date]
  ): Promise<void>;

  /**
   * Recalculate session statistics after retroactive changes
   */
  async recalculateSessionStats(sessionId: string): Promise<SessionStats>;
}
```

## Integration with Terminal Session Manager

The Session Recovery Manager will be integrated with the existing Terminal Session Manager:

```typescript
class TerminalSessionManager {
  // Existing implementation...
  
  private _recoveryManager: SessionRecoveryManager;
  
  /**
   * Try to recover an existing session
   */
  async tryRecoverSession(): Promise<TerminalSessionState | null>;

  /**
   * Register current session for recovery
   */
  async enableSessionRecovery(): Promise<void>;
}
```

## Implementation Strategy

1. Implement core `SessionRecoveryManager` with basic recovery functionality
2. Add time window management for session boundary detection
3. Implement retroactive task assignment capabilities
4. Integrate with Terminal Session Manager
5. Add CLI commands for manual session recovery and management
6. Extend status display to show recovery-related information

## Metrics and Reporting

The Session Recovery Manager will track:

- Recovery success rate
- Number of recovery attempts
- Session gap durations
- Task continuity across sessions
- Retroactive assignment statistics

## Security Considerations

- Only allow recovery of sessions belonging to the current user
- Implement timeouts for very old sessions
- Rate-limit recovery attempts
- Verify terminal environment before recovery

## User Experience

The primary goal is to make recovery automatic and seamless. For most users:

1. When starting a terminal, the system should automatically recover/reconnect to the most appropriate previous session
2. Time windows should automatically determine the correct context for current activities
3. The terminal prompt should show recovery status (e.g., "Recovered session")
4. Session history should be preserved with clear indications of gaps

## CLI Command Extensions

We'll add the following CLI commands:

```
tm terminal recover [--all] [--session-id <id>]
tm terminal sessions --time-windows
tm terminal assign --task <task-id> --to-session <session-id>
```