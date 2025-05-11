/**
 * Shared constants for typography and colors used across formatters
 */

// Typography - Symbols and characters for consistent visual language
// Using more professional Unicode symbols for a refined look
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

// Beautiful color palettes that work well in both dark and light terminals
export const COLORS = {
  // Primary UI colors
  PRIMARY: '#4dabf7',
  SECONDARY: '#748ffc',
  ACCENT: '#9775fa',
  MUTED: '#868e96',
  
  // Status colors - more refined palette
  STATUS: {
    TODO: '#adb5bd',      // Neutral gray
    IN_PROGRESS: '#fcc419', // Warm yellow
    DONE: '#51cf66',     // Fresh green
    DRAFT: '#74c0fc',    // Light blue
    READY: '#be4bdb',    // Purple
    BLOCKED: '#fa5252',  // Bright red
  },
  
  // Text colors
  TEXT: {
    TITLE: '#ffffff',     // White
    HEADER: '#4dabf7',    // Blue
    BODY: '#ced4da',      // Light gray
    MUTED: '#868e96',     // Darker gray
    PLACEHOLDER: '#495057', // Very dark gray
    COMMAND: '#69db7c',   // Green for commands
  },
  
  // Section colors for backgrounds and borders
  SECTION: {
    TITLE: '#4dabf7',     // Blue
    DESCRIPTION: '#748ffc', // Indigo
    DETAILS: '#9775fa',   // Violet
    STATUS: '#da77f2',    // Magenta
    TAGS: '#ffa94d',      // Orange
    METADATA: '#868e96',  // Gray
  },
  
  // Progress bar colors
  PROGRESS: {
    BAR_COMPLETE: '#40c057', // Green
    BAR_INCOMPLETE: '#495057', // Dark gray
    BACKGROUND: '#343a40',  // Near black
  },
};