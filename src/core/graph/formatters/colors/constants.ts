/**
 * Color constants for task formatting
 * Defines color palettes that work well in both dark and light terminals
 */

/**
 * Beautiful color palettes that work well in both dark and light terminals
 */
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

export default COLORS;