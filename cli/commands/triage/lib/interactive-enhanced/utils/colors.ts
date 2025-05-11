/**
 * Color utility functions for interactive triage mode
 */

import { ChalkColor } from '../utils.ts';

/**
 * Get a color for a status
 * @param status Task status
 * @returns Chalk color name
 */
export function getStatusColor(status: string): ChalkColor {
  switch (status) {
    case 'todo': return 'blue';
    case 'in-progress': return 'yellow';
    case 'done': return 'green';
    default: return 'gray';
  }
}

/**
 * Get a color for a readiness
 * @param readiness Task readiness
 * @returns Chalk color name
 */
export function getReadinessColor(readiness: string): ChalkColor {
  switch (readiness) {
    case 'draft': return 'gray';
    case 'ready': return 'green';
    case 'blocked': return 'red';
    default: return 'gray';
  }
}