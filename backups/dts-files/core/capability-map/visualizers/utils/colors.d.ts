/**
 * Color utility functions for capability map visualizations
 */
/**
 * Get a color based on the confidence score
 * @param confidence Confidence score (0-1)
 * @returns Chalk color name
 */
export declare function getColorForConfidence(confidence: number): string;
/**
 * Get a DOT color based on node type and confidence
 * @param type Node type
 * @param confidence Confidence score (0-1)
 * @returns Hex color code
 */
export declare function getNodeColorByTypeAndConfidence(type: string, confidence: number): string;
/**
 * Adjust the saturation of a hex color
 * @param hex Hex color code
 * @param saturationAdjust Saturation adjustment (0-1)
 * @returns Adjusted hex color
 */
export declare function adjustColorSaturation(hex: string, saturationAdjust: number): string;
