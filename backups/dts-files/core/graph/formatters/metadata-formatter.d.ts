/**
 * Metadata formatter for displaying structured metadata
 * with improved handling of nested objects and arrays
 */
/**
 * Format metadata as a beautiful table with improved object handling
 * @param metadata Metadata object to format
 * @param useColor Whether to use colors in the output
 * @returns Formatted metadata string
 */
export declare function formatMetadata(metadata: Record<string, any> | null | undefined, useColor?: boolean): string;
