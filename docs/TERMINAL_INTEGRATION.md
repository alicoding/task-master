# Terminal Integration

Terminal Integration allows Task Master to track, associate, and display task information within your terminal sessions. This feature provides real-time task context in your terminal prompt and enables effective tracking of which tasks are being worked on in which terminal sessions.

## Overview

The Terminal Integration system consists of several components:

1. **Terminal Session Manager** - Detects and tracks terminal sessions, handling session reconnection and state management
2. **Terminal Status Indicator** - Provides visual indicators for shell prompts and shell integration scripts
3. **CLI Commands** - Exposes terminal session functionality through the Task Master CLI

## Features

- **Session Detection** - Automatically detects and fingerprints terminal sessions
- **Session Persistence** - Maintains session state across application restarts
- **Session Reconnection** - Reconnects to previous sessions when restarting applications
- **Task Association** - Associates tasks with terminal sessions for tracking
- **File Association** - Tracks which files are modified in which terminal sessions
- **Shell Integration** - Modifies shell prompts to display current task and session information
- **Multiple Shell Support** - Works with Bash, Zsh, and Fish shells

## Usage

### Terminal Status

View the current terminal session status:

```bash
tm terminal status
```

This will display information about the current session, including:
- Session ID
- Status (active, inactive, disconnected)
- Session duration
- Current task
- Shell integration status

### Setting the Current Task

Set the current task for a terminal session:

```bash
tm terminal task <task-id>
```

This associates the specified task with the current terminal session, enabling:
- Automatic task context in your shell prompt
- Tracking which files are modified while working on the task
- Session-task association metrics

### Shell Integration

Enable shell integration to display task and session information in your prompt:

```bash
tm terminal setup
```

This will:
1. Detect your shell type (bash, zsh, fish)
2. Generate appropriate integration code
3. Add it to your shell configuration file
4. Create a backup of your original configuration

You can also generate the integration script without installing it:

```bash
tm terminal setup --print
```

Or specify a specific shell and output file:

```bash
tm terminal setup --shell zsh --output ~/.zshrc
```

### Session Management

List all active sessions:

```bash
tm terminal session --list
```

View details about a specific session:

```bash
tm terminal session --id <session-id>
```

Disconnect the current session:

```bash
tm terminal session --disconnect
```

## Prompt Formats

The terminal integration supports multiple prompt formats:

### Simple Format (default)

Displays a colored status indicator and task ID:

```
◉ task-123 30m $
```

### Detailed Format

Shows more information including user, terminal, task title, and duration:

```
◉ user@tty task-123: Implement terminal... 1h30m $
```

### Compact Format

Minimal format showing only the status indicator and task ID:

```
◉ task-123 $
```

## Configuration

The Terminal integration behavior can be customized through configuration options:

```bash
# Show detailed format always
tm config set terminal.format detailed

# Disable colors
tm config set terminal.useColors false

# Change maximum indicator length
tm config set terminal.maxLength 50
```

## Architecture

The Terminal Integration feature is built on several key components:

### Terminal Session Manager

The Session Manager handles:
- Terminal detection using TTY interfaces
- Session fingerprinting for unique identification
- Session state persistence in the database
- Task and file association tracking
- Session reconnection logic
- Environment variable management

### Terminal Status Indicator

The Status Indicator manages:
- Generating visual indicators for different shells
- Formatting prompt fragments with shell-specific escaping
- Handling color output appropriately
- Generating shell integration scripts
- Task status visualization
- Session duration and statistics display

### Database Schema

Terminal sessions are stored in the database with the following main tables:

- `terminal_sessions` - Stores session information
- `session_tasks` - Tracks which tasks are used in which sessions
- `file_session_mapping` - Maps files to the sessions they were modified in

## Shell Integration Details

The Terminal Integration adds indicators to your shell prompt using shell-specific techniques:

### Bash
- Uses PROMPT_COMMAND to update PS1
- Stores original prompt in TM_ORIGINAL_PS1
- Uses `\[ and \]` to wrap non-printing characters

### Zsh
- Uses precmd hook with add-zsh-hook
- Stores original prompt in TM_ORIGINAL_PROMPT
- Uses `%{ and %}` to wrap non-printing characters

### Fish
- Overrides the fish_prompt function
- Backs up original with functions -c
- Calls original prompt after adding indicator