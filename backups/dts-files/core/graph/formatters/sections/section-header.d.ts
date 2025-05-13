/**
 * Section header formatter for task display
 */
/**
 * Create a professionally styled section header
 * @param title The title of the section
 * @param icon The icon to display before the title
 * @param color The color to use for the title and icon
 * @param useColor Whether to use colors in the output
 * @param width The width of the terminal for proper sizing
 * @returns Formatted section header string
 */
export declare function createSectionHeader(title: string, icon: string, color: string, useColor?: boolean, width?: number): Promise<string>;
