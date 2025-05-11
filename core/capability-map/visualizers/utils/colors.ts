/**
 * Color utility functions for capability map visualizations
 */

/**
 * Get a color based on the confidence score
 * @param confidence Confidence score (0-1)
 * @returns Chalk color name
 */
export function getColorForConfidence(confidence: number): string {
  if (confidence >= 0.8) return 'green';
  if (confidence >= 0.6) return 'cyan';
  if (confidence >= 0.4) return 'yellow';
  return 'red';
}

/**
 * Get a DOT color based on node type and confidence
 * @param type Node type
 * @param confidence Confidence score (0-1)
 * @returns Hex color code
 */
export function getNodeColorByTypeAndConfidence(type: string, confidence: number): string {
  // Base colors by type
  let baseColor = '#f9f9f9'; // default light gray
  
  if (type.includes('core') || type.includes('feature')) {
    baseColor = '#f9f2ff'; // light purple
  } else if (type.includes('technical') || type.includes('domain')) {
    baseColor = '#eef6ff'; // light blue
  } else if (type.includes('cross')) {
    baseColor = '#fffbe6'; // light yellow
  }
  
  // Adjust saturation based on confidence
  const saturationAdjust = Math.min(confidence * 0.6, 0.6);
  return adjustColorSaturation(baseColor, saturationAdjust);
}

/**
 * Adjust the saturation of a hex color
 * @param hex Hex color code
 * @param saturationAdjust Saturation adjustment (0-1)
 * @returns Adjusted hex color
 */
export function adjustColorSaturation(hex: string, saturationAdjust: number): string {
  // Parse hex color
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  // Find min and max
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate lightness and saturation
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    
    h /= 6;
  }
  
  // Adjust saturation
  s = Math.min(1, s + saturationAdjust);
  
  // Convert back to RGB
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r2 = hueToRgb(p, q, h + 1/3);
  const g2 = hueToRgb(p, q, h);
  const b2 = hueToRgb(p, q, h - 1/3);
  
  // Convert to hex
  const toHex = (v: number) => {
    const hex = Math.round(v * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}