/**
 * Sorting utility functions for interactive triage mode
 */

import { TriageTask } from '../../utils';

/**
 * Sort tasks by status, readiness, and ID for triage
 * @param tasks Tasks to sort
 * @returns Sorted tasks
 */
export function sortPendingTasks(tasks: TriageTask[]): TriageTask[] {
  return [...tasks].sort((a, b) => {
    // First by status priority (todo > in-progress > done)
    const statusOrder: Record<string, number> = { 'todo': 0, 'in-progress': 1, 'done': 2 };
    const statusDiff = statusOrder[a.status as string] - statusOrder[b.status as string];
    if (statusDiff !== 0) return statusDiff;

    // Then by readiness (draft > ready > blocked)
    const readinessOrder: Record<string, number> = { 'draft': 0, 'ready': 1, 'blocked': 2 };
    const readinessDiff = readinessOrder[a.readiness as string] - readinessOrder[b.readiness as string];
    if (readinessDiff !== 0) return readinessDiff;

    // Finally by ID
    return a.id?.localeCompare(b.id || '') || 0;
  });
}