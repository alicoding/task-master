/**
 * Task details display for interactive triage mode
 */

import { ChalkColor, ChalkStyle, TriageTask, colorizeStatus, colorizeReadiness } from '../../utils';
import { getStatusColor, getReadinessColor } from '../utils/colors';
import { TaskGraph } from '../../../../../core/graph';
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
  console.log(colorize(`\n┌─ Task ${index+1}/${total} `, asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')) + 
              colorize(`(${task.status}`, getStatusColor(task.status as string)) + 
              colorize(' / ', asChalkColor((asChalkColor(('gray' as ChalkColor))))) + 
              colorize(`${task.readiness})`, getReadinessColor(task.readiness as string)));
  
  console.log(colorize('│', asChalkColor((asChalkColor(('blue' as ChalkColor))))));
  console.log(colorize('├─ ID: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + colorize(task.id || '', asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
  
  // Task title with status indicators
  console.log(colorize('├─ Title: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + task.title);
  
  // Tags with better formatting
  if (task.tags && task.tags.length > 0) {
    console.log(colorize('├─ Tags: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) +
                task.tags.map((tag) => colorize(tag, asChalkColor((asChalkColor(('cyan' as ChalkColor)))))).join(', '));
  } else {
    console.log(colorize('├─ Tags: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + colorize('none', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  }
  
  // Show status with color
  console.log(colorize('├─ Status: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + colorizeStatus(task.status as string, colorize));
  
  // Show readiness with color
  console.log(colorize('├─ Readiness: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + colorizeReadiness(task.readiness as string, colorize));
  
  // Show creation/update dates
  console.log(colorize('├─ Created: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + new Date(task.createdAt).toLocaleString());
  console.log(colorize('├─ Updated: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + new Date(task.updatedAt).toLocaleString());
  
  // Show parentage information if any
  if (parentTask) {
    console.log(colorize('│', asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    console.log(colorize('├─ Parent Task:', asChalkColor((asChalkColor(('magenta' as ChalkColor))))));
    console.log(colorize('│  ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + colorize(parentTask.id + ': ', asChalkColor((asChalkColor(('magenta' as ChalkColor))))) + parentTask.title);
  }
  
  // Show child tasks if any
  if (childTasks.length > 0) {
    console.log(colorize('│', asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    console.log(colorize(`├─ Child Tasks (${childTasks.length}):`, asChalkColor((asChalkColor(('green' as ChalkColor))))));
    childTasks.forEach((child, idx) => {
      const statusColor = getStatusColor(child.status as string);
      console.log(colorize('│  ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + 
                  colorize(`[${idx + 1}] `, asChalkColor((asChalkColor(('green' as ChalkColor))))) + 
                  colorize((child.id || '') + ': ', asChalkColor((asChalkColor(('green' as ChalkColor))))) + 
                  child.title + ' ' + 
                  colorize(`(${child.status})`, statusColor));
    });
  }
  
  // Show metadata if any
  if (task.metadata && Object.keys(task.metadata).length > 0) {
    console.log(colorize('│', asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    console.log(colorize('├─ Metadata:', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    
    for (const [key, value] of Object.entries(task.metadata)) {
      // Skip similarity score
      if (key === 'similarityScore') continue;
      
      console.log(colorize('│  ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + 
                  colorize(key + ': ', asChalkColor((asChalkColor(('yellow' as ChalkColor))))) + 
                  JSON.stringify(value));
    }
  }
  
  // Footer
  console.log(colorize('└' + '─'.repeat(60), asChalkColor((asChalkColor(('blue' as ChalkColor))))));
}