/**
 * Color utility functions for interactive triage mode
 */
import { ChalkColor } from '../utils';

/**
 * Get a color for a status
 * @param status Task status
 * @returns Chalk color name
 */
export declare function getStatusColor(status: string): ChalkColor;
/**
 * Get a color for a readiness
 * @param readiness Task readiness
 * @returns Chalk color name
 */
export declare function getReadinessColor(readiness: string): ChalkColor;
