/**
 * Similar tasks display for interactive triage mode
 */

import { ChalkColor, ChalkStyle, TriageTask, colorizeStatus } from '../../utils.ts';

/**
 * Display similar tasks with enhanced formatting
 * @param filteredTasks Array of similar tasks
 * @param colorize Colorize function for styling output
 */
export async function displaySimilarTasksEnhanced(
  filteredTasks: TriageTask[] & {
    metadata?: {
      similarityScore?: number;
      [key: string]: any;
    }
  }[],
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): Promise<void> {
  console.log(colorize(`\n┌─ Similar Tasks Found (${filteredTasks.length})`, 'yellow', 'bold'));
  
  filteredTasks.forEach((task, idx) => {
    const score = task.metadata?.similarityScore || 0;
    const percentage = Math.round(score * 100);
    
    // Determine color based on similarity
    let simColor: ChalkColor = 'green';
    if (percentage >= 90) simColor = 'red';
    else if (percentage >= 80) simColor = 'red';
    else if (percentage >= 70) simColor = 'magenta';
    else if (percentage >= 60) simColor = 'yellow';
    
    // Generate a similarity bar
    const barLength = Math.round(percentage / 5); // 20 chars = 100%
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    
    console.log(colorize(`├─ [${idx + 1}] `, 'yellow') + 
                colorize((task.id || '') + ': ', 'yellow') + 
                task.title);
    
    console.log(colorize('│  ', 'yellow') + 
                colorize(`Similarity: ${percentage}%  `, simColor) + 
                colorize(bar, simColor));
    
    // Status and tags
    console.log(colorize('│  ', 'yellow') + 
                `Status: ${colorizeStatus(task.status as string, colorize)}, ` + 
                `Tags: ${task.tags && task.tags.length > 0 ? 
                        task.tags.map((tag) => colorize(tag, 'cyan')).join(', ') : 
                        colorize('none', 'gray')}`);
  });
  
  // Footer
  console.log(colorize('└' + '─'.repeat(60), 'yellow'));
}