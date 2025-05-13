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
    console.log(colorize(`\n┌─ Task ${index + 1}/${total} `, asChalkColor((asChalkColor(('blue')))), 'bold') +
        colorize(`(${task.status}`, getStatusColor(task.status as string)) +
        colorize(' / ', asChalkColor((asChalkColor(('gray'))))) +
        colorize(`${task.readiness})`, getReadinessColor(task.readiness as string)));
    console.log(colorize('│', asChalkColor((asChalkColor(('blue'))))));
    console.log(colorize('├─ ID: ', asChalkColor((asChalkColor(('blue'))))) + colorize(task.id || '', asChalkColor((asChalkColor(('blue')))), 'bold'));
    // Task title with status indicators
    console.log(colorize('├─ Title: ', asChalkColor((asChalkColor(('blue'))))) + task.title);
    // Tags with better formatting
    if (task.tags && task.tags.length > 0) {
        console.log(colorize('├─ Tags: ', asChalkColor((asChalkColor(('blue'))))) +
            task.tags.map((tag) => colorize(tag, asChalkColor((asChalkColor(('cyan')))))).join(', '));
    }
    else {
        console.log(colorize('├─ Tags: ', asChalkColor((asChalkColor(('blue'))))) + colorize('none', asChalkColor((asChalkColor(('gray'))))));
    }
    // Show status with color
    console.log(colorize('├─ Status: ', asChalkColor((asChalkColor(('blue'))))) + colorizeStatus(task.status as string, colorize));
    // Show readiness with color
    console.log(colorize('├─ Readiness: ', asChalkColor((asChalkColor(('blue'))))) + colorizeReadiness(task.readiness as string, colorize));
    // Show creation/update dates
    console.log(colorize('├─ Created: ', asChalkColor((asChalkColor(('blue'))))) + new Date(task.createdAt).toLocaleString());
    console.log(colorize('├─ Updated: ', asChalkColor((asChalkColor(('blue'))))) + new Date(task.updatedAt).toLocaleString());
    // Show parentage information if any
    if (parentTask) {
        console.log(colorize('│', asChalkColor((asChalkColor(('blue'))))));
        console.log(colorize('├─ Parent Task:', asChalkColor((asChalkColor(('magenta'))))));
        console.log(colorize('│  ', asChalkColor((asChalkColor(('blue'))))) + colorize(parentTask.id + ': ', asChalkColor((asChalkColor(('magenta'))))) + parentTask.title);
    }
    // Show child tasks if any
    if (childTasks.length > 0) {
        console.log(colorize('│', asChalkColor((asChalkColor(('blue'))))));
        console.log(colorize(`├─ Child Tasks (${childTasks.length}):`, asChalkColor((asChalkColor(('green'))))));
        childTasks.forEach((child, idx) => {
            const statusColor = getStatusColor(child.status as string);
            console.log(colorize('│  ', asChalkColor((asChalkColor(('blue'))))) +
                colorize(`[${idx + 1}] `, asChalkColor((asChalkColor(('green'))))) +
                colorize((child.id || '') + ': ', asChalkColor((asChalkColor(('green'))))) +
                child.title + ' ' +
                colorize(`(${child.status})`, statusColor));
        });
    }
    // Show metadata if any
    if (task.metadata && Object.keys(task.metadata).length > 0) {
        console.log(colorize('│', asChalkColor((asChalkColor(('blue'))))));
        console.log(colorize('├─ Metadata:', asChalkColor((asChalkColor(('yellow'))))));
        for (const [key, value] of Object.entries(task.metadata)) {
            // Skip similarity score
            if (key === 'similarityScore')
                continue;
            console.log(colorize('│  ', asChalkColor((asChalkColor(('blue'))))) +
                colorize(key + ': ', asChalkColor((asChalkColor(('yellow'))))) +
                JSON.stringify(value));
        }
    }
    // Footer
    console.log(colorize('└' + '─'.repeat(60), asChalkColor((asChalkColor(('blue'))))));
}
