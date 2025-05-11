/**
 * UI Configuration for Task Master
 * Provides centralized configuration and defaults for UI elements
 */

export interface UiConfig {
  // General UI settings
  useColor: boolean;
  useUnicode: boolean;
  useBoxes: boolean;
  useTables: boolean;
  compactMode: boolean;
  
  // Task view settings
  showDescription: boolean;
  showBody: boolean;
  showMetadata: boolean;
  showTags: boolean;
  showDates: boolean;
  showParentInfo: boolean;
  
  // Format settings
  dateFormat: 'short' | 'medium' | 'long';
  titleMaxLength: number;
  descriptionMaxLength: number;
}

/**
 * Default UI configuration
 */
export const DEFAULT_UI_CONFIG: UiConfig = {
  // General UI defaults - enable all formatting features by default
  useColor: true,
  useUnicode: true,
  useBoxes: true,
  useTables: true,
  compactMode: false,
  
  // Task view defaults - show all information by default
  showDescription: true,
  showBody: true,
  showMetadata: true,
  showTags: true,
  showDates: true,
  showParentInfo: true,
  
  // Format defaults
  dateFormat: 'medium',
  titleMaxLength: 40,
  descriptionMaxLength: 100
};

/**
 * Low compatibility config for terminals with limited formatting support
 */
export const LOW_COMPAT_UI_CONFIG: UiConfig = {
  ...DEFAULT_UI_CONFIG,
  useColor: false,
  useUnicode: false,
  useBoxes: false,
  useTables: false
};

/**
 * Creates a UI configuration by merging user options with defaults
 */
export function createUiConfig(userOptions: Partial<UiConfig> = {}): UiConfig {
  return {
    ...DEFAULT_UI_CONFIG,
    ...userOptions
  };
}

/**
 * CLI argument parser for UI configuration
 * Converts CLI options into UI configuration
 */
export function parseCliOptions(options: any): Partial<UiConfig> {
  const config: Partial<UiConfig> = {};
  
  // Parse boolean flags
  if (options.color !== undefined) config.useColor = options.color;
  if (options.unicode !== undefined) config.useUnicode = options.unicode;
  if (options.boxes !== undefined) config.useBoxes = options.boxes;
  if (options.tables !== undefined) config.useTables = options.tables;
  if (options.compact !== undefined) config.compactMode = options.compact;
  
  // Parse show/hide options
  if (options.showDescription !== undefined) config.showDescription = options.showDescription;
  if (options.showBody !== undefined) config.showBody = options.showBody;
  if (options.showMetadata !== undefined) config.showMetadata = options.showMetadata;
  if (options.showTags !== undefined) config.showTags = options.showTags;
  if (options.showDates !== undefined) config.showDates = options.showDates;
  if (options.showParentInfo !== undefined) config.showParentInfo = options.showParentInfo;
  
  // Parse format options
  if (options.dateFormat) config.dateFormat = options.dateFormat;
  if (options.titleMaxLength) config.titleMaxLength = options.titleMaxLength;
  if (options.descriptionMaxLength) config.descriptionMaxLength = options.descriptionMaxLength;
  
  // Handle compatibility mode
  if (options.compatibilityMode === true) {
    return LOW_COMPAT_UI_CONFIG;
  }
  
  return config;
}

/**
 * Get task status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'todo': return 'white';
    case 'in-progress': return 'yellow';
    case 'done': return 'green';
    default: return 'white';
  }
}

/**
 * Get task readiness color
 */
export function getReadinessColor(readiness: string): string {
  switch (readiness) {
    case 'draft': return 'blue';
    case 'ready': return 'magenta';
    case 'blocked': return 'red';
    default: return 'white';
  }
}