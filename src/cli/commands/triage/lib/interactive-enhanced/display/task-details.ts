/**
 * Task details display for interactive triage mode
 */

import { ChalkStyle, TriageTask, colorizeStatus, colorizeReadiness } from '@/cli/commands/triage/lib/utils';
import { getStatusColor, getReadinessColor } from '@/cli/commands/triage/lib/interactive-enhanced/utils/colors';
import { TaskGraph } from '@/core/graph';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Display enhanced task details with hierarchy and metadata
 * @param task Task to display
 * @param index Current task index
 * @param total Total number of tasks
 * @param allTasks All available tasks
 * @param graph Task graph instance
 * @param colorize Colorize function for styling output
 */
export async function displayEnhancedTaskDetails(
  task: TriageTask & {
    createdAt: string,
    updatedAt: string,
  },
  index: number,
  total: number,
  allTasks: TriageTask[],
  graph: TaskGraph,
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): Promise<void> {
  // Get task hierarchy information
  const childTasks = allTasks.filter(t => t.parentId === task.id);
  const parentTask = task.parentId ? allTasks.find(t => t.id === task.parentId) : null;
  
  // Header with progress
  console.log(colorize(`\n┌─ Task ${index+1}/${total} `, asChalkColor('blue'), asChalkColor('bold')) + 
              colorize(`(${task.status}`, getStatusColor(task.status as string)) + 
              colorize(' / ', asChalkColor('gray')) + 
              colorize(`${task.readiness})`, getReadinessColor(task.readiness as string)));
  
  console.log(colorize('│', asChalkColor('blue')));
  console.log(colorize('├─ ID: ', asChalkColor('blue')) + colorize(task.id || '', asChalkColor('blue'), asChalkColor('bold')));
  
  // Task title with status indicators
  console.log(colorize('├─ Title: ', asChalkColor('blue')) + task.title);
  
  // Tags with better formatting
  if (task.tags && task.tags.length > 0) {
    console.log(colorize('├─ Tags: ', asChalkColor('blue')) +
                task.tags.map((tag) => colorize(tag, asChalkColor('cyan'))).join(', '));
  } else {
    console.log(colorize('├─ Tags: ', asChalkColor('blue')) + colorize('none', asChalkColor('gray')));
  }
  
  // Show status with color
  console.log(colorize('├─ Status: ', asChalkColor('blue')) + colorizeStatus(task.status as string, colorize));
  
  // Show readiness with color
  console.log(colorize('├─ Readiness: ', asChalkColor('blue')) + colorizeReadiness(task.readiness as string, colorize));
  
  // Show creation/update dates
  console.log(colorize('├─ Created: ', asChalkColor('blue')) + new Date(task.createdAt).toLocaleString());
  console.log(colorize('├─ Updated: ', asChalkColor('blue')) + new Date(task.updatedAt).toLocaleString());
  
  // Show parentage information if any
  if (parentTask) {
    console.log(colorize('│', asChalkColor('blue')));
    console.log(colorize('├─ Parent Task:', asChalkColor('magenta')));
    console.log(colorize('│  ', asChalkColor('blue')) + colorize(parentTask.id + ': ', asChalkColor('magenta')) + parentTask.title);
  }
  
  // Show child tasks if any
  if (childTasks.length > 0) {
    console.log(colorize('│', asChalkColor('blue')));
    console.log(colorize(`├─ Child Tasks (${childTasks.length}):`, asChalkColor('green')));
    childTasks.forEach((child, idx) => {
      const statusColor = getStatusColor(child.status as string);
      console.log(colorize('│  ', asChalkColor('blue')) + 
                  colorize(`[${idx + 1}] `, asChalkColor('green')) + 
                  colorize((child.id || '') + ': ', asChalkColor('green')) + 
                  child.title + ' ' + 
                  colorize(`(${child.status})`, statusColor));
    });
  }
  
  // Show metadata if any
  if (task.metadata && Object.keys(task.metadata).length > 0) {
    console.log(colorize('│', asChalkColor('blue')));
    console.log(colorize('├─ Metadata:', asChalkColor('yellow')));
    
    for (const [key, value] of Object.entries(task.metadata)) {
      // Skip similarity score
      if (key === 'similarityScore') continue;
      
      console.log(colorize('│  ', asChalkColor('blue')) + 
                  colorize(key + ': ', asChalkColor('yellow')) + 
                  JSON.stringify(value));
    }
  }
  
  // Footer
  console.log(colorize('└' + '─'.repeat(60), asChalkColor('blue')));
}