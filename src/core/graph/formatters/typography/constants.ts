/**
 * Typography constants for task formatting
 * Defines symbols and characters for consistent visual language
 */

/**
 * Typography constants - Using professional Unicode symbols for a refined look
 */
export const TYPOGRAPHY = {
  // Box drawing characters - smooth corners
  BOX: {
    TOP_LEFT: '╭',
    TOP_RIGHT: '╮',
    BOTTOM_LEFT: '╰',
    BOTTOM_RIGHT: '╯',
    HORIZONTAL: '─',
    VERTICAL: '│',
    CROSS: '┼',
    T_DOWN: '┬',
    T_UP: '┴',
    T_RIGHT: '├',
    T_LEFT: '┤',
  },
  
  // Section dividers
  DIVIDERS: {
    LIGHT: '┄',
    MEDIUM: '┈',
    HEAVY: '━',
    DOUBLE: '═',
    VERTICAL: '│',
    DOT: '•',
    BULLET: '◦',
    DIAMOND: '◆',
    SMALL_DIAMOND: '◇',
  },
  
  // Beautiful status indicators
  STATUS: {
    TODO: '◯',       // Empty circle
    IN_PROGRESS: '◑', // Half circle
    DONE: '●',        // Filled circle
    DRAFT: '✎',       // Pencil
    READY: '◉',       // Large dot
    BLOCKED: '⛔',     // Stop sign
  },
  
  // Section icons - more professional set
  ICONS: {
    TASK: '📋',
    CHECKBOX: '✓',
    TITLE: '✦',
    DESCRIPTION: '📝',
    DETAILS: '📄',
    STATUS: '⚙',
    PROGRESS: '☰',
    TAGS: '🏷',
    PARENT: '⤴',
    TIME: '⏱',
    CREATED: '⊕',
    UPDATED: '⟳',
    METADATA: '⚙',
    COMMAND: '➜',
    WARNING: '⚠',
    INFO: '🛈',
    SUCCESS: '✓',
  },
  
  // Badge styling for tags and status
  BADGE: {
    LEFT: '⟦',
    RIGHT: '⟧',
    DIVIDER: '│',
  },
  
  // Quotes for quoted text
  QUOTES: {
    LEFT: '"',
    RIGHT: '"',
  }
};

export default TYPOGRAPHY;