/**
 * Gradient utility for text styling
 * Creates beautiful multi-color gradients for text
 */

// Dynamic imports
let gradient: any;

// Import gradient-string dynamically when needed
async function getGradientLib() {
  if (!gradient) {
    try {
      const gradientModule = await import('gradient-string');
      gradient = gradientModule.default;
    } catch (e) {
      console.warn('Warning: gradient-string not available, using plain text output');
      gradient = null;
    }
  }
  return gradient;
}

// Dynamic chalk import
let chalk: any;
async function getChalk() {
  if (!chalk) {
    try {
      const chalkModule = await import('chalk');
      chalk = chalkModule.default;
    } catch (e) {
      console.warn('Warning: chalk not available, using plain text output');
      chalk = null;
    }
  }
  return chalk;
}

/**
 * Get gradient text using a multi-color gradient
 * @param text The text to apply the gradient to
 * @param colors Array of color hexcodes to use for the gradient
 * @param useColors Whether to apply colors or return plain text
 * @returns The text with gradient colors applied
 */
export async function getGradient(text: string, colors: string[], useColors: boolean = true): Promise<string> {
  if (!useColors) return text;
  
  try {
    const gradientLib = await getGradientLib();
    if (!gradientLib) return text;
    
    const customGradient = gradientLib(colors);
    return customGradient(text);
  } catch (e) {
    const chalkInstance = await getChalk();
    return chalkInstance ? chalkInstance.blue(text) : text;
  }
}