/**
 * Screen identifiers for navigation
 */
export enum Screen {
  // Main navigation screens
  MAIN_MENU = 'MAIN_MENU',
  HELP = 'HELP',
  
  // Configuration screens
  CONFIG_MENU = 'CONFIG_MENU',
  CONFIG_AI = 'CONFIG_AI',
  CONFIG_DATABASE = 'CONFIG_DATABASE',
  CONFIG_EXPORT = 'CONFIG_EXPORT',
  CONFIG_IMPORT = 'CONFIG_IMPORT',
  
  // Task management screens
  TASK_MENU = 'TASK_MENU',
  TASK_CREATE = 'TASK_CREATE',
  TASK_LIST = 'TASK_LIST',
  TASK_DETAIL = 'TASK_DETAIL',
  TASK_EDIT = 'TASK_EDIT',
  
  // Project initialization
  PROJECT_INIT = 'PROJECT_INIT',
  
  // Validation and testing
  VALIDATION = 'VALIDATION',
  CONNECTION_TEST = 'CONNECTION_TEST',
}

/**
 * Screen metadata
 */
export interface ScreenInfo {
  id: Screen;
  title: string;
  description: string;
  shortcut?: string;
}

/**
 * Screen information lookup
 */
export const SCREEN_INFO: Record<Screen, ScreenInfo> = {
  [Screen.MAIN_MENU]: {
    id: Screen.MAIN_MENU,
    title: 'Main Menu',
    description: 'Task Master interactive setup and management',
  },
  [Screen.HELP]: {
    id: Screen.HELP,
    title: 'Help',
    description: 'View help and keyboard shortcuts',
    shortcut: 'Ctrl+H',
  },
  [Screen.CONFIG_MENU]: {
    id: Screen.CONFIG_MENU,
    title: 'Configuration',
    description: 'Configure Task Master settings',
    shortcut: 'C',
  },
  [Screen.CONFIG_AI]: {
    id: Screen.CONFIG_AI,
    title: 'AI Provider Configuration',
    description: 'Configure AI providers and models',
  },
  [Screen.CONFIG_DATABASE]: {
    id: Screen.CONFIG_DATABASE,
    title: 'Database Configuration',
    description: 'Configure database settings',
  },
  [Screen.CONFIG_EXPORT]: {
    id: Screen.CONFIG_EXPORT,
    title: 'Export Configuration',
    description: 'Export configuration to a file',
  },
  [Screen.CONFIG_IMPORT]: {
    id: Screen.CONFIG_IMPORT,
    title: 'Import Configuration',
    description: 'Import configuration from a file',
  },
  [Screen.TASK_MENU]: {
    id: Screen.TASK_MENU,
    title: 'Task Management',
    description: 'Manage tasks and projects',
    shortcut: 'T',
  },
  [Screen.TASK_CREATE]: {
    id: Screen.TASK_CREATE,
    title: 'Create Task',
    description: 'Create a new task',
  },
  [Screen.TASK_LIST]: {
    id: Screen.TASK_LIST,
    title: 'Task List',
    description: 'View and filter tasks',
  },
  [Screen.TASK_DETAIL]: {
    id: Screen.TASK_DETAIL,
    title: 'Task Details',
    description: 'View task details',
  },
  [Screen.TASK_EDIT]: {
    id: Screen.TASK_EDIT,
    title: 'Edit Task',
    description: 'Edit task details',
  },
  [Screen.PROJECT_INIT]: {
    id: Screen.PROJECT_INIT,
    title: 'Project Initialization',
    description: 'Initialize a new Task Master project',
    shortcut: 'I',
  },
  [Screen.VALIDATION]: {
    id: Screen.VALIDATION,
    title: 'Configuration Validation',
    description: 'Validate configuration settings',
    shortcut: 'V',
  },
  [Screen.CONNECTION_TEST]: {
    id: Screen.CONNECTION_TEST,
    title: 'Connection Test',
    description: 'Test AI provider connection',
  },
};