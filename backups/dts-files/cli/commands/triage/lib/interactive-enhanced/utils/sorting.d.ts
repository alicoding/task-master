/**
 * Sorting utility functions for interactive triage mode
 */
import { TriageTask } from '../../utils';
/**
 * Sort tasks by status, readiness, and ID for triage
 * @param tasks Tasks to sort
 * @returns Sorted tasks
 */
export declare function sortPendingTasks(tasks: TriageTask[]): TriageTask[];
