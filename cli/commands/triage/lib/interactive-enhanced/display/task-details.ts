/**
 * Task details display for interactive triage mode
 */
import { ChalkColor, ChalkStyle, TriageTask, colorizeStatus, colorizeReadiness } from '../../utils';
import { getStatusColor, getReadinessColor } from '../utils/colors';
import { TaskGraph } from '../../../../../core/graph';

/**
 * Display enhanced task details with hierarchy and metadata
 * @param task Task to display
 * @param index Current task index
 * @param total Total number of tasks
 * @param allTasks All available tasks
 * @param graph Task graph instance
 * @param colorize Colorize function for styling output
 */
export async function displayEnhancedTaskDetails(task: TriageTask & {
    createdAt: string;
    updatedAt: string;
}, index: number, total: number, allTasks: TriageTask[], graph: TaskGraph, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): Promise<void> {
    // Get task hierarchy information
    const childTasks = allTasks.filter(t => t.parentId === task.id);
    const parentTask = task.parentId ? allTasks.find(t => t.id === task.parentId) : null;
    // Header with progress
    console.log(colorize(`\n┌─ Task ${index + 1}/${total} `, asChalkColor(1), 'bold') +
        colorize(`(${task.status}`, getStatusColor(task.status as string)) +
        colorize(' / ', asChalkColor(1)) +
        colorize(`${task.readiness})`, getReadinessColor(task.readiness as string)));
    console.log(colorize('│', asChalkColor(1)));
    console.log(colorize('├─ ID: ', asChalkColor(1)) + colorize(task.id || '', asChalkColor(1), 'bold'));
    // Task title with status indicators
    console.log(colorize('├─ Title: ', asChalkColor(1)) + task.title);
    // Tags with better formatting
    if (task.tags && task.tags.length > 0) {
        console.log(colorize('├─ Tags: ', asChalkColor(1)) +
            task.tags.map((tag) => colorize(tag, asChalkColor(1))).join(', '));
    }
    else {
        console.log(colorize('├─ Tags: ', asChalkColor(1)) + colorize('none', asChalkColor(1)));
    }
    // Show status with color
    console.log(colorize('├─ Status: ', asChalkColor(1)) + colorizeStatus(task.status as string, colorize));
    // Show readiness with color
    console.log(colorize('├─ Readiness: ', asChalkColor(1)) + colorizeReadiness(task.readiness as string, colorize));
    // Show creation/update dates
    console.log(colorize('├─ Created: ', asChalkColor(1)) + new Date(task.createdAt).toLocaleString());
    console.log(colorize('├─ Updated: ', asChalkColor(1)) + new Date(task.updatedAt).toLocaleString());
    // Show parentage information if any
    if (parentTask) {
        console.log(colorize('│', asChalkColor(1)));
        console.log(colorize('├─ Parent Task:', asChalkColor(1)));
        console.log(colorize('│  ', asChalkColor(1)) + colorize(parentTask.id + ': ', asChalkColor(1)) + parentTask.title);
    }
    // Show child tasks if any
    if (childTasks.length > 0) {
        console.log(colorize('│', asChalkColor(1)));
        console.log(colorize(`├─ Child Tasks (${childTasks.length}):`, asChalkColor(1)));
        childTasks.forEach((child, idx) => {
            const statusColor = getStatusColor(child.status as string);
            console.log(colorize('│  ', asChalkColor(1)) +
                colorize(`[${idx + 1}] `, asChalkColor(1)) +
                colorize((child.id || '') + ': ', asChalkColor(1)) +
                child.title + ' ' +
                colorize(`(${child.status})`, statusColor));
        });
    }
    // Show metadata if any
    if (task.metadata && Object.keys(task.metadata).length > 0) {
        console.log(colorize('│', asChalkColor(1)));
        console.log(colorize('├─ Metadata:', asChalkColor(1)));
        for (const [key, value] of Object.entries(task.metadata)) {
            // Skip similarity score
            if (key === 'similarityScore')
                continue;
            console.log(colorize('│  ', asChalkColor(1)) +
                colorize(key + ': ', asChalkColor(1)) +
                JSON.stringify(value));
        }
    }
    // Footer
    console.log(colorize('└' + '─'.repeat(60), asChalkColor(1)));
}
