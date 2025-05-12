/**
 * Terminal Status Indicator for Task Master CLI
 * Implements Task 17.7: Terminal Integration - Shell Status Indicator
 * 
 * This module provides visual indicators for terminal sessions, including
 * prompt generation, status indicators, and shell integration.
 */

import chalk from 'chalk';
import { TerminalSessionState } from './terminal-session-types.ts';
import { createLogger } from '../utils/logger.ts';

// Create logger for status indicator
const logger = createLogger('TerminalStatusIndicator');

/**
 * Configuration options for TerminalStatusIndicator
 */
export interface TerminalStatusIndicatorConfig {
  /** Whether to show task IDs in the terminal prompt */
  showTaskIds: boolean;
  /** Whether to show colors in the status indicator */
  useColors: boolean;
  /** Format for the status indicator */
  format: 'simple' | 'detailed' | 'compact';
  /** Shell type for proper escaping of prompt characters */
  shellType: 'bash' | 'zsh' | 'fish' | 'pwsh' | 'cmd' | 'other';
  /** Maximum length for the status indicator before truncation */
  maxLength: number;
  /** Show progress indicator in the prompt */
  showProgress: boolean;
  /** Show session duration in the prompt */
  showDuration: boolean;
  /** Show file count in the prompt */
  showFileCount: boolean;
  /** Show task count in the prompt */
  showTaskCount: boolean;
}

/**
 * Default configuration for terminal status indicators
 */
const DEFAULT_STATUS_INDICATOR_CONFIG: TerminalStatusIndicatorConfig = {
  showTaskIds: true,
  useColors: true,
  format: 'simple',
  shellType: 'bash',
  maxLength: 40,
  showProgress: true,
  showDuration: true,
  showFileCount: false,
  showTaskCount: false
};

/**
 * Task data needed for status indicator display
 */
export interface TaskIndicatorData {
  id: string;
  title: string;
  status: string;
}

/**
 * Session stats for display in indicator
 */
export interface SessionStats {
  taskCount: number;
  fileCount: number;
  duration: number; // in milliseconds
}

/**
 * Terminal Status Indicator
 */
export class TerminalStatusIndicator {
  private config: TerminalStatusIndicatorConfig;
  
  /**
   * Create a new Terminal Status Indicator
   * @param config Configuration options
   */
  constructor(config: Partial<TerminalStatusIndicatorConfig> = {}) {
    this.config = { ...DEFAULT_STATUS_INDICATOR_CONFIG, ...config };
    
    // Auto-configure shell type if not specified
    if (!config.shellType) {
      this.config.shellType = this.detectShellType();
    }
    
    // Auto-configure color usage if not specified
    if (config.useColors === undefined) {
      this.config.useColors = process.stdout.isTTY && !process.env.NO_COLOR;
    }
    
    logger.debug('Terminal Status Indicator initialized with config:', this.config);
  }
  
  /**
   * Generate a status indicator string for the terminal prompt
   * @param session Current terminal session state
   * @param currentTask Optional current task data
   * @param stats Optional session statistics
   * @returns Formatted status indicator string
   */
  generateStatusIndicator(
    session: TerminalSessionState,
    currentTask?: TaskIndicatorData,
    stats?: SessionStats
  ): string {
    // If session is not active, show inactive indicator
    if (session.status !== 'active') {
      return this.generateInactiveIndicator(session);
    }
    
    // Generate according to format
    switch (this.config.format) {
      case 'detailed':
        return this.generateDetailedIndicator(session, currentTask, stats);
      case 'compact':
        return this.generateCompactIndicator(session, currentTask);
      case 'simple':
      default:
        return this.generateSimpleIndicator(session, currentTask, stats);
    }
  }
  
  /**
   * Generate a simple status indicator
   */
  private generateSimpleIndicator(
    session: TerminalSessionState,
    currentTask?: TaskIndicatorData,
    stats?: SessionStats
  ): string {
    const icon = '◉';
    const taskInfo = this.getTaskText(currentTask);
    const durationText = this.getDurationText(session, stats);
    
    let indicator = '';
    
    if (this.config.useColors) {
      indicator = `${chalk.green(icon)} ${taskInfo}${durationText}`;
    } else {
      indicator = `${icon} ${taskInfo}${durationText}`;
    }
    
    return this.formatForShell(this.truncateIndicator(indicator));
  }
  
  /**
   * Generate a detailed status indicator
   */
  private generateDetailedIndicator(
    session: TerminalSessionState,
    currentTask?: TaskIndicatorData,
    stats?: SessionStats
  ): string {
    const icon = '◉';
    const userInfo = session.fingerprint.user;
    const deviceInfo = session.fingerprint.tty.split('/').pop() || 'tty';
    const taskInfo = this.getTaskText(currentTask);
    const durationText = this.getDurationText(session, stats);
    const statsText = this.getStatsText(stats);
    
    let indicator = '';
    
    if (this.config.useColors) {
      indicator = `${chalk.green(icon)} ${chalk.blue(`${userInfo}@${deviceInfo}`)} ${taskInfo}${durationText}${statsText}`;
    } else {
      indicator = `${icon} ${userInfo}@${deviceInfo} ${taskInfo}${durationText}${statsText}`;
    }
    
    return this.formatForShell(this.truncateIndicator(indicator));
  }
  
  /**
   * Generate a compact status indicator
   */
  private generateCompactIndicator(
    session: TerminalSessionState,
    currentTask?: TaskIndicatorData
  ): string {
    const icon = '◉';
    let taskId = '';
    
    if (currentTask && this.config.showTaskIds) {
      taskId = currentTask.id;
    }
    
    let indicator = '';
    
    if (this.config.useColors) {
      indicator = `${chalk.green(icon)}${taskId ? ` ${chalk.cyan(taskId)}` : ''}`;
    } else {
      indicator = `${icon}${taskId ? ` ${taskId}` : ''}`;
    }
    
    return this.formatForShell(indicator);
  }
  
  /**
   * Generate an inactive session indicator
   */
  private generateInactiveIndicator(session: TerminalSessionState): string {
    const icon = '◌';
    let indicator = '';
    
    if (this.config.useColors) {
      indicator = `${chalk.gray(icon)} ${chalk.gray(session.status)}`;
    } else {
      indicator = `${icon} ${session.status}`;
    }
    
    return this.formatForShell(indicator);
  }
  
  /**
   * Get task information text
   */
  private getTaskText(task?: TaskIndicatorData): string {
    if (!task || !this.config.showTaskIds) {
      return '';
    }
    
    let taskText = task.id;
    
    if (this.config.format === 'detailed') {
      const title = this.truncateTitle(task.title);
      taskText = `${taskText}: ${title}`;
    }
    
    if (this.config.useColors) {
      // Color by task status
      switch (task.status) {
        case 'done':
          return chalk.green(taskText);
        case 'in-progress':
          return chalk.yellow(taskText);
        case 'todo':
          return chalk.cyan(taskText);
        default:
          return chalk.white(taskText);
      }
    }
    
    return taskText;
  }
  
  /**
   * Get session duration text
   */
  private getDurationText(
    session: TerminalSessionState,
    stats?: SessionStats
  ): string {
    if (!this.config.showDuration) {
      return '';
    }
    
    const duration = stats?.duration || 
      (new Date().getTime() - session.startTime.getTime());
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    let durationText = '';
    
    if (hours > 0) {
      durationText = ` ${hours}h${minutes}m`;
    } else if (minutes > 0) {
      durationText = ` ${minutes}m`;
    } else {
      durationText = ' <1m';
    }
    
    if (this.config.useColors) {
      return chalk.blue(durationText);
    }
    
    return durationText;
  }
  
  /**
   * Get session stats text
   */
  private getStatsText(stats?: SessionStats): string {
    if (!stats) {
      return '';
    }
    
    let statsText = '';
    
    if (this.config.showTaskCount && stats.taskCount > 0) {
      statsText += ` ${stats.taskCount}↓`;
    }
    
    if (this.config.showFileCount && stats.fileCount > 0) {
      statsText += ` ${stats.fileCount}●`;
    }
    
    if (this.config.useColors && statsText) {
      return chalk.cyan(statsText);
    }
    
    return statsText;
  }
  
  /**
   * Truncate a task title to keep indicator length reasonable
   */
  private truncateTitle(title: string): string {
    const maxTitleLength = 20;
    
    if (!title || title.length <= maxTitleLength) {
      return title || '';
    }
    
    return title.substring(0, maxTitleLength - 3) + '...';
  }
  
  /**
   * Truncate the full indicator if it exceeds the maximum length
   */
  private truncateIndicator(indicator: string): string {
    // Strip ANSI color codes for length calculation
    const plainText = indicator.replace(/\u001b\[.*?m/g, '');
    
    if (plainText.length <= this.config.maxLength) {
      return indicator;
    }
    
    // This is a simplistic approach that works reasonably well with colored text
    // For a more robust solution, we'd need to track color positions
    const truncateAt = Math.max(this.config.maxLength - 3, 5);
    let truncated = '';
    let plainIndex = 0;
    let colorStack = [];
    
    for (let i = 0; i < indicator.length; i++) {
      if (indicator[i] === '\u001b' && indicator[i+1] === '[') {
        // Start of color code
        let colorCode = '\u001b[';
        let j = i + 2;
        
        while (j < indicator.length && indicator[j] !== 'm') {
          colorCode += indicator[j];
          j++;
        }
        
        if (j < indicator.length) {
          colorCode += 'm';
        }
        
        i = j;
        
        // Track color state
        if (colorCode === '\u001b[0m') {
          // Reset
          colorStack = [];
        } else {
          colorStack.push(colorCode);
        }
        
        truncated += colorCode;
      } else {
        // Regular character
        if (plainIndex < truncateAt) {
          truncated += indicator[i];
        } else if (plainIndex === truncateAt) {
          truncated += '...';
          
          // Add reset if we have active colors
          if (colorStack.length > 0) {
            truncated += '\u001b[0m';
          }
          
          break;
        }
        
        plainIndex++;
      }
    }
    
    return truncated;
  }
  
  /**
   * Format indicator for proper display in different shells
   */
  private formatForShell(indicator: string): string {
    switch (this.config.shellType) {
      case 'bash':
        // Enclose non-printing characters with \[ and \]
        return indicator.replace(/\u001b\[.*?m/g, match => '\\[' + match + '\\]');
      case 'zsh':
        // Use %{ and %} to mark non-printing characters
        return indicator.replace(/\u001b\[.*?m/g, match => '%{' + match + '%}');
      case 'fish':
        // No special escaping needed for fish
        return indicator;
      case 'pwsh':
        // PowerShell escape sequences
        return indicator;
      default:
        // Return as-is for other shells
        return indicator;
    }
  }
  
  /**
   * Generate PS1 environment variable value for shell integration
   * @param session Current terminal session
   * @param currentTask Optional current task
   * @param stats Optional session statistics
   * @param customPrompt Custom prompt format (defaults to standard PS1)
   * @returns PS1 compatible environment variable value
   */
  generatePS1Value(
    session: TerminalSessionState,
    currentTask?: TaskIndicatorData,
    stats?: SessionStats,
    customPrompt?: string
  ): string {
    const indicator = this.generateStatusIndicator(session, currentTask, stats);
    const defaultPrompt = this.getDefaultPrompt();
    const prompt = customPrompt || defaultPrompt;
    
    // Insert our indicator at the beginning of the prompt
    return `${indicator} ${prompt}`;
  }
  
  /**
   * Get the default prompt format for current shell
   */
  private getDefaultPrompt(): string {
    switch (this.config.shellType) {
      case 'bash':
        return '\\u@\\h:\\w\\$ ';
      case 'zsh':
        return '%n@%m:%~%# ';
      case 'fish':
        return '$USER@$hostname:$PWD\\$ ';
      case 'pwsh':
        return 'PS $PWD> ';
      default:
        return '$ ';
    }
  }
  
  /**
   * Generate shell integration script for the current shell
   * @returns Shell script for integrating with the prompt
   */
  generateShellIntegrationScript(): string {
    switch (this.config.shellType) {
      case 'bash':
        return this.generateBashIntegration();
      case 'zsh':
        return this.generateZshIntegration();
      case 'fish':
        return this.generateFishIntegration();
      default:
        return '# Shell integration not supported for this shell type\n';
    }
  }
  
  /**
   * Generate Bash shell integration script
   */
  private generateBashIntegration(): string {
    return `# Task Master Terminal Integration for Bash
# Add this to your .bashrc or paste in terminal

# Save original prompt
if [ -z "$TM_ORIGINAL_PS1" ]; then
  export TM_ORIGINAL_PS1="$PS1"
fi

# Task Master prompt command
task_master_prompt_command() {
  # Get current task ID from environment
  local task_id="\${TM_CURRENT_TASK:-}"
  
  # Only modify prompt if we have a session
  if [ -n "$TM_SESSION_ID" ]; then
    # Call taskmaster to get prompt (could be replaced with a more efficient mechanism)
    local tm_prompt=$(taskmaster terminal prompt --format=${this.config.format} --colors=${this.config.useColors})
    
    # Set the prompt with the indicator
    PS1="\${tm_prompt}${this.config.useColors ? '\\[\\e[0m\\]' : ''} \${TM_ORIGINAL_PS1}"
  else
    # Restore original prompt if not in a Task Master session
    PS1="\${TM_ORIGINAL_PS1}"
  fi
}

# Add to PROMPT_COMMAND if not already there
if [[ $PROMPT_COMMAND != *task_master_prompt_command* ]]; then
  PROMPT_COMMAND="task_master_prompt_command; \${PROMPT_COMMAND:-:}"
fi
`;
  }
  
  /**
   * Generate Zsh shell integration script
   */
  private generateZshIntegration(): string {
    return `# Task Master Terminal Integration for Zsh
# Add this to your .zshrc or paste in terminal

# Save original prompt
if [ -z "$TM_ORIGINAL_PROMPT" ]; then
  export TM_ORIGINAL_PROMPT="$PROMPT"
fi

# Task Master prompt function
task_master_prompt() {
  # Get current task ID from environment
  local task_id="\${TM_CURRENT_TASK:-}"
  
  # Only modify prompt if we have a session
  if [ -n "$TM_SESSION_ID" ]; then
    # Call taskmaster to get prompt (could be replaced with a more efficient mechanism)
    local tm_prompt=$(taskmaster terminal prompt --format=${this.config.format} --colors=${this.config.useColors})
    
    # Set the prompt with the indicator
    PROMPT="\${tm_prompt}${this.config.useColors ? '%{\\e[0m%}' : ''} \${TM_ORIGINAL_PROMPT}"
  else
    # Restore original prompt if not in a Task Master session
    PROMPT="\${TM_ORIGINAL_PROMPT}"
  fi
}

# Add to precmd functions
autoload -Uz add-zsh-hook
add-zsh-hook precmd task_master_prompt
`;
  }
  
  /**
   * Generate Fish shell integration script
   */
  private generateFishIntegration(): string {
    return `# Task Master Terminal Integration for Fish
# Add this to your config.fish or paste in terminal

# Save original prompt
if not set -q TM_ORIGINAL_FISH_PROMPT
  functions -c fish_prompt original_fish_prompt
  set -U TM_ORIGINAL_FISH_PROMPT 1
end

# Task Master prompt function
function fish_prompt
  # Get current task ID from environment
  set -l task_id "$TM_CURRENT_TASK"
  
  # Only modify prompt if we have a session
  if test -n "$TM_SESSION_ID"
    # Call taskmaster to get prompt (could be replaced with a more efficient mechanism)
    set -l tm_prompt (taskmaster terminal prompt --format=${this.config.format} --colors=${this.config.useColors})
    
    # Echo the prompt with the indicator
    echo -n "$tm_prompt "
    original_fish_prompt
  else
    # Use original prompt if not in a Task Master session
    original_fish_prompt
  end
end
`;
  }
  
  /**
   * Detect shell type from environment
   */
  detectShellType(): 'bash' | 'zsh' | 'fish' | 'pwsh' | 'cmd' | 'other' {
    const shell = process.env.SHELL || '';
    
    if (shell.includes('bash')) {
      return 'bash';
    } else if (shell.includes('zsh')) {
      return 'zsh';
    } else if (shell.includes('fish')) {
      return 'fish';
    } else if (process.platform === 'win32') {
      return process.env.PSModulePath ? 'pwsh' : 'cmd';
    }
    
    return 'other';
  }
  
  /**
   * Update configuration based on runtime environment
   */
  autoConfigureForEnvironment(): void {
    this.config.shellType = this.detectShellType();
    this.config.useColors = process.stdout.isTTY && !process.env.NO_COLOR;
    
    logger.debug('Auto-configured terminal status indicator for environment', {
      shellType: this.config.shellType,
      useColors: this.config.useColors
    });
  }
}