/**
 * Task details display for interactive triage mode
 */
import { ChalkColor, ChalkStyle, TriageTask } from '../../utils';
import { TaskGraph } from '../../../../../core/graph';
import { ChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Display enhanced task details with hierarchy and metadata
 * @param task Task to display
 * @param index Current task index
 * @param total Total number of tasks
 * @param allTasks All available tasks
 * @param graph Task graph instance
 * @param colorize Colorize function for styling output
 */
export declare function displayEnhancedTaskDetails(task: TriageTask & {
    createdAt: string;
    updatedAt: string;
}, index: number, total: number, allTasks: TriageTask[], graph: TaskGraph, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): Promise<void>;
