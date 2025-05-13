/**
 * Color palette for the UI
 */
export const COLORS = {
  // Primary colors
  primary: '#0ea5e9', // Sky blue
  secondary: '#8b5cf6', // Violet
  accent: '#f43f5e', // Rose
  
  // UI colors
  background: '#1e293b', // Slate 800
  foreground: '#f8fafc', // Slate 50
  border: '#475569', // Slate 600
  
  // Text colors
  text: {
    primary: '#f8fafc', // Slate 50
    secondary: '#cbd5e1', // Slate 300
    muted: '#94a3b8', // Slate 400
    link: '#38bdf8', // Sky 400
  },
  
  // Status colors
  status: {
    info: '#0ea5e9', // Sky 500
    success: '#22c55e', // Green 500
    warning: '#f59e0b', // Amber 500
    error: '#ef4444', // Red 500
  },
};

/**
 * Spacing units for consistent spacing
 */
export const SPACING = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
};

/**
 * Border styles for UI elements
 */
export const BORDERS = {
  normal: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
  },
  bold: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛', 
    horizontal: '━',
    vertical: '┃',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
  },
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
  },
};

/**
 * Icons for UI elements
 */
export const ICONS = {
  menu: '≡',
  check: '✓',
  cross: '✗',
  warning: '⚠',
  info: 'ℹ',
  arrow: {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    back: '⟵',
    forward: '⟶',
  },
  bullet: '•',
  star: '★',
  heart: '♥',
};

/**
 * UI element dimensions
 */
export const DIMENSIONS = {
  menuWidth: 20,
  headerHeight: 3,
  footerHeight: 3,
  sidebarWidth: 25,
  maxContentWidth: 100,
};

/**
 * Element style configurations
 */
export const ELEMENTS = {
  header: {
    backgroundColor: COLORS.primary,
    textColor: COLORS.text.primary,
    height: DIMENSIONS.headerHeight,
    padding: SPACING.md,
  },
  footer: {
    backgroundColor: COLORS.background,
    textColor: COLORS.text.secondary,
    borderTop: true,
    height: DIMENSIONS.footerHeight,
    padding: SPACING.sm,
  },
  sidebar: {
    backgroundColor: COLORS.background,
    textColor: COLORS.text.secondary,
    borderRight: true,
    width: DIMENSIONS.sidebarWidth,
    padding: SPACING.sm,
  },
  button: {
    primaryColor: COLORS.primary,
    secondaryColor: COLORS.secondary,
    padding: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    textColor: COLORS.text.primary,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  modal: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
};