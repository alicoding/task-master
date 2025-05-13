/**
 * Type declarations for chalk utilities
 */

// Augment the existing chalk-utils module
import { ChalkColor } from '@/cli/utils/chalk-utils';

declare module '@/cli/utils/chalk-utils' {
  // Strict ChalkColor type with specific string literals only
  export type ChalkColor =
    'black' | 'red' | 'green' | 'yellow' | 'blue' |
    'magenta' | 'cyan' | 'white' | 'gray' | 'grey' |
    'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' |
    'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';

  // Original ChalkStyle type
  export type ChalkStyle =
    'bold' | 'dim' | 'italic' | 'underline' | 'inverse' |
    'hidden' | 'strikethrough' | 'visible';

  // Function type definitions
  export type ColorizeFunction = (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
  export function colorize(text: string, color?: ChalkColor, style?: ChalkStyle): string;
  export function createColorize(useColors?: boolean): ColorizeFunction;
}