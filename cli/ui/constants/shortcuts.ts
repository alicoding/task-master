/**
 * Keyboard shortcut definitions
 */
export interface Shortcut {
  key: string;
  description: string;
  isGlobal?: boolean;
}

/**
 * Global keyboard shortcuts
 */
export const GLOBAL_SHORTCUTS: Shortcut[] = [
  {
    key: 'Esc',
    description: 'Go back / Cancel',
    isGlobal: true,
  },
  {
    key: 'Ctrl+H',
    description: 'Show help',
    isGlobal: true,
  },
  {
    key: 'Ctrl+Q',
    description: 'Return to main menu',
    isGlobal: true,
  },
  {
    key: 'Tab',
    description: 'Cycle through options',
    isGlobal: true,
  },
  {
    key: '↑/↓',
    description: 'Navigate items',
    isGlobal: true,
  },
  {
    key: 'Enter',
    description: 'Select / Confirm',
    isGlobal: true,
  },
  {
    key: 'Ctrl+S',
    description: 'Save current progress',
    isGlobal: true,
  },
];

/**
 * Screen-specific shortcuts
 */
export const SCREEN_SHORTCUTS: Record<string, Shortcut[]> = {
  'MAIN_MENU': [
    { key: 'C', description: 'Go to Configuration' },
    { key: 'T', description: 'Go to Task Management' },
    { key: 'I', description: 'Initialize Project' },
    { key: 'V', description: 'Validate Configuration' },
  ],
  'CONFIG_MENU': [
    { key: 'A', description: 'Configure AI' },
    { key: 'D', description: 'Configure Database' },
    { key: 'E', description: 'Export Configuration' },
    { key: 'I', description: 'Import Configuration' },
  ],
  'TASK_MENU': [
    { key: 'N', description: 'New Task' },
    { key: 'L', description: 'List Tasks' },
    { key: 'F', description: 'Filter Tasks' },
    { key: 'S', description: 'Search Tasks' },
  ],
  'TASK_LIST': [
    { key: 'F', description: 'Filter List' },
    { key: 'S', description: 'Search Tasks' },
    { key: 'R', description: 'Refresh List' },
  ],
  'TASK_DETAIL': [
    { key: 'E', description: 'Edit Task' },
    { key: 'D', description: 'Delete Task' },
    { key: 'M', description: 'Mark as Complete' },
  ],
};