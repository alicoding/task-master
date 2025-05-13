/**
 * UI Configuration for Task Master
 * Provides centralized configuration and defaults for UI elements
 */
export interface UiConfig {
    useColor: boolean;
    useUnicode: boolean;
    useBoxes: boolean;
    useTables: boolean;
    compactMode: boolean;
    showDescription: boolean;
    showBody: boolean;
    showMetadata: boolean;
    showTags: boolean;
    showDates: boolean;
    showParentInfo: boolean;
    dateFormat: 'short' | 'medium' | 'long';
    titleMaxLength: number;
    descriptionMaxLength: number;
}
/**
 * Default UI configuration
 */
export declare const DEFAULT_UI_CONFIG: UiConfig;
/**
 * Low compatibility config for terminals with limited formatting support
 */
export declare const LOW_COMPAT_UI_CONFIG: UiConfig;
/**
 * Creates a UI configuration by merging user options with defaults
 */
export declare function createUiConfig(userOptions?: Partial<UiConfig>): UiConfig;
/**
 * CLI argument parser for UI configuration
 * Converts CLI options into UI configuration
 */
export declare function parseCliOptions(options: any): Partial<UiConfig>;
/**
 * Get task status color
 */
export declare function getStatusColor(status: string): string;
/**
 * Get task readiness color
 */
export declare function getReadinessColor(readiness: string): string;
