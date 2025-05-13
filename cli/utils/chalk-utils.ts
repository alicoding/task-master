/**
 * Chalk utility functions for proper typing
 * Resolves TypeScript errors with dynamic chalk property access
 */

// Removed self-import to fix circular dependency
import chalk, { ChalkInstance } from 'chalk';

/**
 * Valid chalk colors
 */
export type ChalkColor = ChalkStyle | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey' | 'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';

/**
 * Valid chalk styles
 */
export type ChalkStyle = 
  'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 
  'hidden' | 'strikethrough' | 'visible';

/**
 * Type for colorize function
 */
export type ColorizeFunction = (text: string, color?: ChalkColor | ChalkStyle, style?: ChalkStyle) => string;

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
export function colorize(text: string, color?: ChalkColor | ChalkStyle, style?: ChalkStyle): string {
  let result = text;
  
  if (color) {
    // Check if it's a color
    if (colorMap[color as keyof typeof colorMap]) {
      const colorKey = colorMap[color as keyof typeof colorMap];
      result = chalk[colorKey](result);
    }
    // Check if it's a style
    else if (styleMap[color as keyof typeof styleMap]) {
      const styleKey = styleMap[color as keyof typeof styleMap];
      result = chalk[styleKey](result);
    }
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
  return (text: string, color?: ChalkColor | ChalkStyle, style?: ChalkStyle): string => {
    if (!useColors) return text;
    return colorize(text, color, style);
  };
}

/**
 * Function to safely convert a string to ChalkColor type
 * @param colorName The color name to convert
 * @returns The color name as a ChalkColor type
 */
/**
 * Function to safely convert a string to ChalkColor or ChalkStyle type
 * @param colorOrStyle The color or style name to convert
 * @returns The color or style name as a ChalkColor or ChalkStyle type
 */
export function asChalkColor(colorOrStyle: string): ChalkColor | ChalkStyle {
  // First check if it's a style
  if (Object.keys(styleMap).includes(colorOrStyle)) {
    return colorOrStyle as ChalkStyle;
  }
  // Otherwise treat it as a color
  return colorOrStyle as ChalkColor;
}

/**
 * Safely formats tags array for display, handling null values
 * @param tags The tags array which might be null
 * @param color Optional color for non-empty tags
 * @param emptyText Text to show when no tags (defaults to 'none')
 * @returns Formatted tags string
 */
export function formatTags(
  tags: string[] | null | undefined,
  color?: ChalkColor | ChalkStyle,
  emptyText: string = 'none'
): string {
  if (!tags || tags.length === 0) {
    return colorize(emptyText, asChalkColor('gray'));
  }

  return color
    ? tags.map(tag => colorize(tag, color)).join(', ')
    : tags.join(', ');
}