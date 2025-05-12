# Terminal Integration Architecture Design

## Overview

The Terminal Integration component will provide the Task Master CLI with the ability to:

1. Detect and track terminal sessions
2. Display status indicators directly in the terminal prompt
3. Associate file changes with the terminal session they were made in
4. Reconnect to previous sessions when restarting the same terminal
5. Provide a comprehensive terminal user experience

## Core Components

### 1. Terminal Session Manager

**Purpose**: Detects, creates, and manages terminal sessions

**Key Features**:
- Terminal detection and TTY identification
- Session ID generation and tracking
- Environment variable management
- Session storage and persistence

### 2. Terminal Status Indicator

**Purpose**: Displays real-time status information in the terminal prompt

**Key Features**:
- Shell prompt integration via PS1 environment variable
- Status indicators for current tasks
- Task counts and activity summaries
- Visual indicators for daemon status

### 3. Shell Integration Provider

**Purpose**: Provides shell-specific integration code for different shells

**Key Features**:
- Shell detection (bash, zsh, fish, etc.)
- Shell-specific integration scripts
- Installation and configuration helpers
- Shell hook management

### 4. Session Reconnection Service

**Purpose**: Handles reconnection to previous terminal sessions

**Key Features**:
- Session persistence across terminal restarts
- Terminal fingerprinting for identification
- Session state recovery
- Automatic reconnection

## Data Structures

### Terminal Session

```typescript
interface TerminalSession {
  // Unique identifier for the session
  id: string;
  
  // Terminal information
  tty: string;
  pid: number;
  ppid: number;
  windowSize: { columns: number; rows: number };
  
  // User information
  user: string;
  shell: string;
  
  // Session state
  startTime: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'disconnected';
  
  // Associated tasks
  currentTaskId?: string;
  recentTaskIds: string[];
  
  // Environment variables
  environmentVariables: Record<string, string>;
  
  // Connection information
  connectionCount: number;
  lastDisconnect?: Date;
}
```

### Shell Integration Configuration

```typescript
interface ShellIntegrationConfig {
  // Shell type
  shellType: 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'other';
  
  // Integration options
  enablePrompt: boolean;
  enableStatus: boolean;
  enableTaskCounts: boolean;
  enableColorization: boolean;
  
  // Prompt configuration
  promptTemplate: string;
  statusIndicatorPosition: 'prefix' | 'suffix' | 'newline';
  
  // Update frequency
  updateInterval: number;
}
```

## Integration Flow

### Terminal Session Detection

1. When the CLI is invoked, check for TTY connection
2. Get terminal information: TTY path, PID, PPID
3. Generate or retrieve session ID based on terminal fingerprint
4. Create or reconnect to terminal session
5. Initialize session state and tracking

### Shell Integration

1. Detect current shell type
2. Generate shell-specific integration code
3. Install integration code in shell startup files (if requested)
4. Set environment variables for integration
5. Provide manual setup instructions if automatic setup isn't possible

### Status Display

1. Generate status indicator based on current state
2. Update environment variables for PS1 integration
3. Execute PROMPT_COMMAND to update status
4. Refresh status on relevant events

### Session Reconnection

1. On CLI startup, check for existing sessions
2. Match terminal fingerprint against stored sessions
3. Reconnect to matched session if found
4. Restore session state and continue tracking

## Architecture Diagram

```
┌─────────────────────────────────┐
│      CLI Command Interface      │
└─────────────────┬───────────────┘
                  │
┌─────────────────▼───────────────┐
│    Terminal Session Manager     │
│                                 │
│ ┌─────────────┐ ┌─────────────┐ │
│ │  Session    │ │  Session    │ │
│ │  Detection  │ │  Storage    │ │
│ └─────────────┘ └─────────────┘ │
└─────────────────┬───────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼─────────┐  ┌────────▼───────┐
│  Shell         │  │  Status        │
│  Integration   │  │  Indicator     │
│  Provider      │  │                │
└──────┬─────────┘  └────────┬───────┘
       │                     │
       │      ┌──────────────▼───────────┐
       │      │  Reconnection            │
       │      │  Service                 │
       │      └──────────────┬───────────┘
       │                     │
┌──────▼─────────────────────▼───────────┐
│         Storage Layer                   │
│  (Session data, status, associations)   │
└──────────────────────────────────────┬─┘
                                       │
┌──────────────────────────────────────▼─┐
│             File Tracking Daemon        │
└────────────────────────────────────────┘
```

## Database Schema Extensions

Add the following tables to the existing schema:

### Terminal Sessions Table

```sql
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id TEXT PRIMARY KEY,
  tty TEXT,
  pid INTEGER,
  ppid INTEGER,
  window_columns INTEGER,
  window_rows INTEGER,
  user TEXT,
  shell TEXT,
  start_time DATETIME,
  last_active DATETIME,
  status TEXT,
  current_task_id TEXT,
  connection_count INTEGER,
  last_disconnect DATETIME,
  metadata TEXT
);
```

### Session Tasks Table

```sql
CREATE TABLE IF NOT EXISTS session_tasks (
  session_id TEXT,
  task_id TEXT,
  access_time DATETIME,
  PRIMARY KEY (session_id, task_id),
  FOREIGN KEY (session_id) REFERENCES terminal_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

### File Session Mapping Table

```sql
CREATE TABLE IF NOT EXISTS file_session_mapping (
  file_id INTEGER,
  session_id TEXT,
  first_seen DATETIME,
  last_modified DATETIME,
  PRIMARY KEY (file_id, session_id),
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES terminal_sessions(id) ON DELETE CASCADE
);
```

## Shell Integration Scripts

### Bash Integration

```bash
# Task Master CLI Terminal Integration for Bash
# This file should be sourced from ~/.bashrc

# Task Master environment variables
export TM_SESSION_ID="[SESSION_ID]"
export TM_TTY="[TTY_PATH]"
export TM_PID="[PROCESS_ID]"

# Function to update Task Master status
tm_update_status() {
  local tm_status
  tm_status=$(tm status --format=prompt 2>/dev/null)
  export TM_STATUS="$tm_status"
}

# Add to PROMPT_COMMAND to update status before each prompt
PROMPT_COMMAND="tm_update_status;${PROMPT_COMMAND}"

# Define prompt elements
TM_PROMPT_PREFIX="\[\033[38;5;39m\]tm:\[\033[0m\]"
TM_PROMPT_NORMAL="\[\033[38;5;82m\]●\[\033[0m\]"
TM_PROMPT_ACTIVE="\[\033[38;5;196m\]●\[\033[0m\]"

# Modify PS1 to include Task Master status
if [[ -z "$TM_ORIGINAL_PS1" ]]; then
  export TM_ORIGINAL_PS1="$PS1"
fi

# Set new PS1 with Task Master indicators
export PS1="${TM_PROMPT_PREFIX}${TM_STATUS:+[$TM_STATUS]} ${TM_ORIGINAL_PS1}"
```

### Zsh Integration

```zsh
# Task Master CLI Terminal Integration for Zsh
# This file should be sourced from ~/.zshrc

# Task Master environment variables
export TM_SESSION_ID="[SESSION_ID]"
export TM_TTY="[TTY_PATH]"
export TM_PID="[PROCESS_ID]"

# Function to update Task Master status
tm_update_status() {
  TM_STATUS=$(tm status --format=prompt 2>/dev/null)
}

# Add to precmd hook to update status before each prompt
autoload -Uz add-zsh-hook
add-zsh-hook precmd tm_update_status

# Define prompt elements
TM_PROMPT_PREFIX="%F{39}tm:%f"
TM_PROMPT_NORMAL="%F{82}●%f"
TM_PROMPT_ACTIVE="%F{196}●%f"

# Save original prompt
if [[ -z "$TM_ORIGINAL_PROMPT" ]]; then
  export TM_ORIGINAL_PROMPT="$PROMPT"
fi

# Set new prompt with Task Master indicators
setopt promptsubst
export PROMPT="${TM_PROMPT_PREFIX}${TM_STATUS:+[$TM_STATUS]} ${TM_ORIGINAL_PROMPT}"
```

## Implementation Strategy

1. Start with the Terminal Session Manager as the core component
2. Add session detection and tracking functionality
3. Implement the database schema extensions
4. Create shell integration providers for bash and zsh
5. Add the status indicator system
6. Implement the reconnection service
7. Create CLI commands for terminal integration management

## Backwards Compatibility

The terminal integration will be optional and backward compatible with:
- Non-terminal environments (CI/CD, scripting)
- Terminals without shell integration
- Previous CLI invocations without session tracking

## Security Considerations

1. Store sensitive session information securely
2. Avoid leaking environment variables between sessions
3. Implement proper session isolation
4. Handle user-specific permissions appropriately
5. Validate all session reconnection requests

## Future Enhancements

1. Support for additional shells (fish, PowerShell)
2. Enhanced visual indicators with unicode or graphical elements
3. Terminal multiplexer support (tmux, screen)
4. Advanced session analytics and visualization
5. Remote terminal session support