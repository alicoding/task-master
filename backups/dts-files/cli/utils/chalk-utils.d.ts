/**
 * Chalk utility functions for proper typing
 * Resolves TypeScript errors with dynamic chalk property access
 */
/**
 * Valid chalk colors
 */
import { ChalkColor } from '@/cli/utils/chalk-utils';

export type ChalkColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey' | 'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';
/**
 * Valid chalk styles
 */
export type ChalkStyle = 'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 'hidden' | 'strikethrough' | 'visible';
/**
 * Type for colorize function
 */
export type ColorizeFunction = (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
/**
 * Colorize text with type-safe chalk colors and styles
 * @param text Text to colorize
 * @param color Optional color to apply
 * @param style Optional style to apply
 * @returns Colorized text
 */
export declare function colorize(text: string, color?: ChalkColor, style?: ChalkStyle): string;
/**
 * Create a colorize function that respects color settings
 * @param useColors Whether to use colors
 * @returns Colorize function
 */
export declare function createColorize(useColors?: boolean): ColorizeFunction;
