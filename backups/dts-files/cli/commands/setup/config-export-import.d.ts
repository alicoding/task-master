/**
 * Configuration Export/Import
 * Allows exporting and importing Task Master configuration
 */
/**
 * Export configuration to a file
 */
export declare function exportConfiguration(includeSecrets?: boolean, specificSections?: string[]): Promise<void>;
/**
 * Import configuration from a file
 */
export declare function importConfiguration(overwriteExisting?: boolean, specificSections?: string[]): Promise<void>;
