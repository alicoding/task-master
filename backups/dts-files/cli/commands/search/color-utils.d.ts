import { ChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Color Utilities for Search Output
 *
 * Provides utilities for colorizing console output in the search command.
 */
/**
 * Type for chalk color names
 */
export type ChalkColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';
/**
 * Type for chalk style modifiers
 */
export type ChalkStyle = 'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 'hidden' | 'strikethrough';
/**
 * Type for colorize function
 */
export type ColorizeFunction = (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
/**
 * Get color functions based on whether colors are enabled
 * @param colorEnabled Whether colors are enabled
 * @returns Color utility functions
 */
export declare function getColorFunctions(colorEnabled: boolean): {
    colorize: ColorizeFunction;
};
/**
 * Colorize status text based on task status
 * @param status Task status
 * @param colorEnabled Whether colors are enabled
 * @returns Colorized status text
 */
export declare function colorizeStatus(status: string, colorEnabled: boolean): string;
/**
 * Colorize readiness text based on task readiness
 * @param readiness Task readiness
 * @param colorEnabled Whether colors are enabled
 * @returns Colorized readiness text
 */
export declare function colorizeReadiness(readiness: string, colorEnabled: boolean): string;
