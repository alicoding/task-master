/**
 * Chalk utility functions for proper typing
 * Resolves TypeScript errors with dynamic chalk property access
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import chalk, { ChalkInstance } from 'chalk';

/**
 * Valid chalk colors
 */
export type ChalkColor = ChalkStyle;

/**
 * Valid chalk styles
 */
export type ChalkStyle = 
  'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 
  'hidden' | 'strikethrough' | 'visible';

/**
 * Type for colorize function
 */
export type ColorizeFunction = (text: string, color?: ChalkColor, style?: ChalkStyle) => string;

/**
 * Function to safely convert a string to ChalkColor type
 */
export function asChalkColor(colorName: string): ChalkColor {
  return colorName as ChalkColor;
}

/**
 * Safe color mapping from string to chalk function
 */
const colorMap: Record<ChalkColor, keyof ChalkInstance> = {
  black: 'black',
  red: 'red',
  green: 'green',
  yellow: 'yellow',
  blue: 'blue',
  magenta: 'magenta',
  cyan: 'cyan',
  white: 'white',
  gray: 'gray',
  grey: 'grey',
  blackBright: 'blackBright',
  redBright: 'redBright',
  greenBright: 'greenBright',
  yellowBright: 'yellowBright',
  blueBright: 'blueBright',
  magentaBright: 'magentaBright',
  cyanBright: 'cyanBright',
  whiteBright: 'whiteBright'
};

/**
 * Safe style mapping from string to chalk function
 */
const styleMap: Record<ChalkStyle, keyof ChalkInstance> = {
  bold: 'bold',
  dim: 'dim',
  italic: 'italic',
  underline: 'underline',
  inverse: 'inverse',
  hidden: 'hidden',
  strikethrough: 'strikethrough',
  visible: 'visible'
};

/**
 * Colorize text with type-safe chalk colors and styles
 * @param text Text to colorize
 * @param color Optional color to apply
 * @param style Optional style to apply
 * @returns Colorized text
 */
export function colorize(text: string, color?: ChalkColor, style?: ChalkStyle): string {
  let result = text;
  
  if (color && colorMap[color]) {
    const colorKey = colorMap[color];
    result = chalk[colorKey](result);
  }
  
  if (style && styleMap[style]) {
    const styleKey = styleMap[style];
    result = chalk[styleKey](result);
  }
  
  return result;
}

/**
 * Create a colorize function that respects color settings
 * @param useColors Whether to use colors
 * @returns Colorize function
 */
export function createColorize(useColors: boolean = true): ColorizeFunction {
  return (text: string, color?: ChalkColor, style?: ChalkStyle): string => {
    if (!useColors) return text;
    return colorize(text, color, style);
  };
}