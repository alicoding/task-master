/**
 * Enhanced formatter for deduplication with improved visual presentation
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { DuplicateGroup, ColorizeFunction } from './utils';


/**
 * Display duplicate groups with improved visual formatting
 */

/**
 * Helper to format tags for display
 */
function formatTags(tags: string[] | null, color: string, colorize: ColorizeFunction): string {
  if (!tags || tags.length === 0) {
    return colorize('none', asChalkColor(('gray' as ChalkColor)));
  }
  return tags.map(tag => colorize(tag, asChalkColor(color))).join(', ');
}

export function displayDuplicateGroups(
  limitedGroups: DuplicateGroup[],
  duplicateGroups: DuplicateGroup[],
  colorize: ColorizeFunction
) {
  console.log(colorize(`\n🔍 Found ${duplicateGroups.length} potential duplicate groups`, asChalkColor('bold'), asChalkColor(('green' as ChalkColor))));
  console.log(colorize(`   Showing top ${limitedGroups.length} groups sorted by similarity\n`, asChalkColor(('gray' as ChalkColor))));
  
  for (let i = 0; i < limitedGroups.length; i++) {
    const group = limitedGroups[i];
    const groupNumber = i + 1;
    
    // Determine color and icon based on similarity
    let groupColor = 'yellow';
    let groupIcon = 'ℹ️';
    let groupLabel = 'SIMILAR';

    if (group.maxSimilarity >= 0.9) {
      groupColor = 'red';
      groupIcon = '⚠️';
      groupLabel = 'DUPLICATE';
    } else if (group.maxSimilarity >= 0.8) {
      groupColor = 'red';
      groupIcon = '⚠️';
      groupLabel = 'LIKELY DUPLICATE';
    } else if (group.maxSimilarity >= 0.7) {
      groupColor = 'magenta';
      groupIcon = '⚠️';
      groupLabel = 'VERY SIMILAR';
    } else if (group.maxSimilarity >= 0.5) {
      groupColor = 'yellow';
      groupIcon = 'ℹ️';
      groupLabel = 'MODERATELY SIMILAR';
    }
    
    // Generate similarity indicator bar
    const percentage = Math.round(group.maxSimilarity * 100);
    const barLength = Math.round(percentage / 5); // 20 chars = 100%
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    
    // Group header with visual elements
    console.log(
      colorize(`┌─ Group ${groupNumber} `, groupColor, asChalkColor('bold')) + 
      colorize(groupIcon, asChalkColor(('white' as ChalkColor))) + ' ' +
      colorize(groupLabel, groupColor, asChalkColor('bold')) + ' ' +
      colorize(`(${percentage}% similarity)`, groupColor)
    );
    
    // Similarity bar
    console.log(colorize(`│ `, groupColor) + colorize(`[${bar}] ${percentage}%`, groupColor));
    
    // Display tasks in group with enhanced formatting
    group.tasks.forEach((task, taskIndex) => {
      // Use different prefix for first vs remaining tasks
      const prefix = taskIndex === 0 ? '├─' : '├─';
      
      // Show task with ID and status indicators
      console.log(
        colorize(`│ ${prefix} `, groupColor) + 
        colorize(`[${taskIndex + 1}] `, asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))) + 
        colorize(`${task.id}: `, asChalkColor(('blue' as ChalkColor))) + 
        task.title
      );
      
      // Show details with better formatting
      console.log(
        colorize('│    ', groupColor) + 
        colorize(`Status: `, asChalkColor(('gray' as ChalkColor))) + colorizeStatus(task.status, colorize) +
        colorize(` • Tags: `, asChalkColor(('gray' as ChalkColor))) + formatTags(task.tags, asChalkColor(('cyan' as ChalkColor)), colorize)
      );
      
      // Show similarity to other tasks in this group
      if (group.similarityMatrix[taskIndex].some(sim => sim > 0)) {
        const similarities = group.similarityMatrix[taskIndex]
          .map((sim, idx) => idx !== taskIndex ? [idx, sim] : null)
          .filter((pair): pair is [number, number] => pair !== null && pair[0] < group.tasks.length)
          .sort((a, b) => b[1] - a[1]) // Sort by similarity (highest first)
          .map(([idx, sim]) => {
            const simPercentage = Math.round(sim * 100);
            let simColor = (asChalkColor(('green' as ChalkColor)));
            if (simPercentage >= 90) simColor = (asChalkColor(('red' as ChalkColor)));
            else if (simPercentage >= 70) simColor = (asChalkColor(('yellow' as ChalkColor)));
            return `${colorize(`[${idx + 1}]`, asChalkColor(('blue' as ChalkColor)))}: ${colorize(`${simPercentage}%`, simColor)}`;
          });
        
        if (similarities.length > 0) {
          console.log(
            colorize('│    ', groupColor) + 
            colorize('Similar to: ', asChalkColor(('gray' as ChalkColor))) + 
            similarities.join('  ')
          );
        }
      }
      
      // Date information
      const createdDate = new Date(task.createdAt).toLocaleString();
      const updatedDate = new Date(task.updatedAt).toLocaleString();
      console.log(
        colorize('│    ', groupColor) + 
        colorize('Created: ', asChalkColor(('gray' as ChalkColor))) + createdDate + 
        colorize(' • Updated: ', asChalkColor(('gray' as ChalkColor))) + updatedDate
      );
    });
    
    // Show action recommendation
    if (group.maxSimilarity >= 0.8) {
      console.log(
        colorize('│ ', groupColor) + 
        colorize('⚠️  Recommendation: ', asChalkColor('bold'), asChalkColor(('red' as ChalkColor))) + 
        colorize('These tasks should be merged', asChalkColor(('red' as ChalkColor)))
      );
    } else if (group.maxSimilarity >= 0.6) {
      console.log(
        colorize('│ ', groupColor) + 
        colorize('ℹ️  Recommendation: ', asChalkColor('bold'), asChalkColor(('yellow' as ChalkColor))) + 
        colorize('Review these tasks - they may be related or duplicates', asChalkColor(('yellow' as ChalkColor)))
      );
    }
    
    // Group footer
    console.log(colorize('└' + '─'.repeat(60), groupColor));
    
    // Add space between groups
    console.log('');
  }
}

/**
 * Display detailed view of a group with enhanced visual presentation
 */
export function displayDetailedGroupView(
  groupNum: number,
  selectedGroup: DuplicateGroup,
  colorize: ColorizeFunction
) {
  // Determine group characteristics
  const percentage = Math.round(selectedGroup.maxSimilarity * 100);
  let groupColor = 'blue';
  let groupLabel = 'SIMILAR TASKS';

  if (percentage >= 90) {
    groupColor = 'red';
    groupLabel = 'DUPLICATE TASKS';
  } else if (percentage >= 80) {
    groupColor = 'red';
    groupLabel = 'LIKELY DUPLICATES';
  } else if (percentage >= 70) {
    groupColor = 'magenta';
    groupLabel = 'VERY SIMILAR TASKS';
  }
  
  // Header
  console.log(colorize(`\n┌${'─'.repeat(78)}┐`, groupColor));
  console.log(colorize(`│ ${groupLabel} - GROUP ${groupNum} ${' '.repeat(76 - groupLabel.length - String(groupNum).length)}│`, groupColor, asChalkColor('bold')));
  console.log(colorize(`│ ${percentage}% maximum similarity between tasks${' '.repeat(78 - String(percentage).length - 35)}│`, groupColor));
  console.log(colorize(`└${'─'.repeat(78)}┘`, groupColor));
  
  // Tasks overview section
  console.log(colorize(`\n● TASKS OVERVIEW (${selectedGroup.tasks.length} tasks)`, asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
  console.log(colorize('  ID           Title                                     Status      Updated', asChalkColor(('gray' as ChalkColor))));
  console.log(colorize('  ─────────────────────────────────────────────────────────────────────────────', asChalkColor(('gray' as ChalkColor))));
  
  for (let i = 0; i < selectedGroup.tasks.length; i++) {
    const task = selectedGroup.tasks[i];
    const taskNum = `[${i + 1}]`;
    const updatedDate = new Date(task.updatedAt).toLocaleDateString();
    // Truncate title if needed
    const title = task.title.length > 40 ? task.title.substring(0, 37) + '...' : task.title;
    
    console.log(
      `  ${colorize(taskNum.padEnd(4), asChalkColor('bold'), asChalkColor(('blue' as ChalkColor)))}` +
      `${colorize(task.id.padEnd(10), asChalkColor(('blue' as ChalkColor)))}` +
      `${title.padEnd(40)}` +
      `${colorizeStatus(task.status, colorize).padEnd(12)}` +
      `${updatedDate}`
    );
  }
  
  // Similarity matrix section
  console.log(colorize('\n● SIMILARITY MATRIX', asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
  
  // Column headers
  process.stdout.write(colorize('      ', asChalkColor(('gray' as ChalkColor))));
  for (let i = 0; i < selectedGroup.tasks.length; i++) {
    process.stdout.write(colorize(`  [${i + 1}]`, asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
  }
  console.log();
  
  // Matrix rows
  for (let i = 0; i < selectedGroup.tasks.length; i++) {
    process.stdout.write(colorize(`  [${i + 1}]`, asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
    
    for (let j = 0; j < selectedGroup.tasks.length; j++) {
      const sim = selectedGroup.similarityMatrix[i][j];
      if (i === j) {
        process.stdout.write(colorize('   -  ', asChalkColor(('gray' as ChalkColor))));
      } else {
        const percentage = Math.round(sim * 100);
        let simColor = 'green';
        if (percentage >= 90) simColor = 'red';
        else if (percentage >= 80) simColor = 'red';
        else if (percentage >= 70) simColor = 'magenta';
        else if (percentage >= 50) simColor = 'yellow';
        
        // Format to ensure alignment
        const formattedPercentage = String(percentage).padStart(3, ' ');
        process.stdout.write(colorize(`  ${formattedPercentage}%`, simColor));
      }
    }
    console.log();
  }
  
  // Detailed tasks section
  console.log(colorize('\n● DETAILED TASK INFORMATION', asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
  
  for (let i = 0; i < selectedGroup.tasks.length; i++) {
    const task = selectedGroup.tasks[i];
    
    console.log(colorize(`  ┌ Task [${i + 1}] ${task.id}`, asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
    console.log(`  │ Title: ${task.title}`);
    console.log(`  │ Status: ${colorizeStatus(task.status, colorize)}, Readiness: ${colorizeReadiness(task.readiness, colorize)}`);
    console.log(`  │ Tags: ${formatTags(task.tags, asChalkColor(('cyan' as ChalkColor)), colorize)}`);
    console.log(`  │ Created: ${new Date(task.createdAt).toLocaleString()}`);
    console.log(`  │ Updated: ${new Date(task.updatedAt).toLocaleString()}`);
    
    // Metadata display
    if (task.metadata) {
      const metadata = typeof task.metadata === 'string' ? JSON.parse(task.metadata) : task.metadata;
      const cleanMetadata = { ...metadata };
      delete cleanMetadata.similarityScore;
      
      if (Object.keys(cleanMetadata).length > 0) {
        console.log(`  │ Metadata:`);
        for (const [key, value] of Object.entries(cleanMetadata)) {
          console.log(`  │   ${colorize(key, asChalkColor(('gray' as ChalkColor)))}: ${JSON.stringify(value)}`);
        }
      }
    }
    
    // Show similarities to other tasks in more detail
    const similarities = selectedGroup.similarityMatrix[i]
      .map((sim, idx) => idx !== i ? { idx, sim } : null)
      .filter((item): item is { idx: number, sim: number } => item !== null)
      .sort((a, b) => b.sim - a.sim); // Sort by similarity (highest first)
      
    if (similarities.length > 0) {
      console.log(`  │ Similarity to other tasks:`);
      
      for (const { idx, sim } of similarities) {
        const otherTask = selectedGroup.tasks[idx];
        const percentage = Math.round(sim * 100);

        let simColor = 'green';
        if (percentage >= 90) simColor = 'red';
        else if (percentage >= 80) simColor = 'red';
        else if (percentage >= 70) simColor = 'magenta';
        else if (percentage >= 50) simColor = 'yellow';
        
        // Generate a mini visual representation of similarity
        const barLength = Math.round(percentage / 10); // 10 chars = 100%
        const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
        
        console.log(
          `  │   To [${idx + 1}]: ` +
          colorize(`${percentage}%`, simColor) + ' ' +
          colorize(bar, simColor) + ' ' +
          colorize(`"${otherTask.title.substring(0, 40)}${otherTask.title.length > 40 ? '...' : ''}"`, asChalkColor(('gray' as ChalkColor)))
        );
      }
    }
    
    console.log(colorize('  └' + '─'.repeat(60), asChalkColor(('blue' as ChalkColor))));
    console.log(); // Empty line between tasks
  }
}

/**
 * Display interactive mode help with enhanced formatting
 */
export function displayInteractiveHelp(colorize: ColorizeFunction) {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', asChalkColor(('cyan' as ChalkColor))));
  console.log(colorize('│ DEDUPLICATION INTERACTIVE MODE', asChalkColor('bold'), asChalkColor(('cyan' as ChalkColor))) + colorize(' '.repeat(34) + '│', asChalkColor(('cyan' as ChalkColor))));
  console.log(colorize('└' + '─'.repeat(60) + '┘', asChalkColor(('cyan' as ChalkColor))));
  
  console.log(colorize('\nAvailable Commands:', asChalkColor('bold'), asChalkColor(('cyan' as ChalkColor))));
  
  // Format commands in a more organized way
  console.log(
    colorize('  m <group>  ', asChalkColor('bold'), asChalkColor(('green' as ChalkColor))) + 
    'Merge tasks in a specific group (e.g., ' + 
    colorize('m 1', asChalkColor(('green' as ChalkColor))) + 
    ' to merge group 1)'
  );
  
  console.log(
    colorize('  v <group>  ', asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))) + 
    'View detailed information about a group (e.g., ' + 
    colorize('v 2', asChalkColor(('blue' as ChalkColor))) + 
    ' to view group 2)'
  );
  
  console.log(
    colorize('  c <number> ', asChalkColor('bold'), asChalkColor(('magenta' as ChalkColor))) + 
    'Compare specific tasks (e.g., ' + 
    colorize('c 1 2', asChalkColor(('magenta' as ChalkColor))) + 
    ' to compare tasks 1 and 2)'
  );
  
  console.log(
    colorize('  s <number> ', asChalkColor('bold'), asChalkColor(('yellow' as ChalkColor))) + 
    'Show a specific task in detail (e.g., ' + 
    colorize('s 3', asChalkColor(('yellow' as ChalkColor))) + 
    ' to show task 3)'
  );
  
  console.log(
    colorize('  r         ', asChalkColor('bold'), asChalkColor(('cyan' as ChalkColor))) + 
    'Refresh the list of duplicates'
  );
  
  console.log(
    colorize('  h         ', asChalkColor('bold'), asChalkColor(('gray' as ChalkColor))) + 
    'Show this help message'
  );
  
  console.log(
    colorize('  q         ', asChalkColor('bold'), asChalkColor(('red' as ChalkColor))) + 
    'Quit deduplication tool'
  );
}

/**
 * Helper to colorize task status
 */
function colorizeStatus(status: string, colorize: ColorizeFunction): string {
  switch (status) {
    case 'todo':
      return colorize(status, asChalkColor(('yellow' as ChalkColor)));
    case 'in-progress':
      return colorize(status, asChalkColor(('blue' as ChalkColor)));
    case 'done':
      return colorize(status, asChalkColor(('green' as ChalkColor)));
    default:
      return status;
  }
}

/**
 * Helper to colorize task readiness
 */
function colorizeReadiness(readiness: string, colorize: ColorizeFunction): string {
  switch (readiness) {
    case 'draft':
      return colorize(readiness, asChalkColor(('yellow' as ChalkColor)));
    case 'ready':
      return colorize(readiness, asChalkColor(('green' as ChalkColor)));
    case 'blocked':
      return colorize(readiness, asChalkColor(('red' as ChalkColor)));
    default:
      return readiness;
  }
}

/**
 * Display task comparison view
 */
export function displayTaskComparison(
  task1: number,
  task2: number,
  group: DuplicateGroup,
  colorize: ColorizeFunction
) {
  // Validate task indices
  if (task1 < 0 || task1 >= group.tasks.length || task2 < 0 || task2 >= group.tasks.length) {
    console.log(colorize('Invalid task indices for comparison.', asChalkColor(('red' as ChalkColor))));
    return;
  }
  
  const taskA = group.tasks[task1];
  const taskB = group.tasks[task2];
  const similarity = group.similarityMatrix[task1][task2];
  const percentage = Math.round(similarity * 100);
  
  // Determine color based on similarity
  let simColor = 'green';
  if (percentage >= 90) simColor = 'red';
  else if (percentage >= 80) simColor = 'red';
  else if (percentage >= 70) simColor = 'magenta';
  else if (percentage >= 50) simColor = 'yellow';
  
  // Header
  console.log(colorize(`\n┌${'─'.repeat(78)}┐`, simColor));
  console.log(colorize(`│ TASK COMPARISON - ${percentage}% SIMILARITY ${' '.repeat(78 - 25 - String(percentage).length)}│`, simColor, asChalkColor('bold')));
  console.log(colorize(`└${'─'.repeat(78)}┘`, simColor));
  
  // Side by side comparison
  console.log(`\n${'─'.repeat(38)} vs ${'─'.repeat(38)}`);
  
  // IDs and titles
  console.log(
    colorize(`[${task1 + 1}] ${taskA.id}`, asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))) + 
    ' '.repeat(Math.max(1, 40 - taskA.id.length - String(task1 + 1).length)) + 
    '│ ' + 
    colorize(`[${task2 + 1}] ${taskB.id}`, asChalkColor('bold'), asChalkColor(('blue' as ChalkColor)))
  );
  
  // Split titles into multiple lines if needed
  const title1Lines = splitString(taskA.title, 38);
  const title2Lines = splitString(taskB.title, 38);
  const maxTitleLines = Math.max(title1Lines.length, title2Lines.length);
  
  for (let i = 0; i < maxTitleLines; i++) {
    console.log(
      (i < title1Lines.length ? title1Lines[i] : '').padEnd(40) + 
      '│ ' + 
      (i < title2Lines.length ? title2Lines[i] : '')
    );
  }
  
  console.log('─'.repeat(40) + '┼' + '─'.repeat(39));
  
  // Status and readiness
  console.log(
    `Status: ${colorizeStatus(taskA.status, colorize)}`.padEnd(40) + 
    '│ ' + 
    `Status: ${colorizeStatus(taskB.status, colorize)}`
  );
  
  console.log(
    `Readiness: ${colorizeReadiness(taskA.readiness, colorize)}`.padEnd(40) + 
    '│ ' + 
    `Readiness: ${colorizeReadiness(taskB.readiness, colorize)}`
  );
  
  // Tags
  const tags1 = formatTags(taskA.tags, asChalkColor(('cyan' as ChalkColor)), colorize);

  const tags2 = formatTags(taskB.tags, asChalkColor(('cyan' as ChalkColor)), colorize);
  
  // Split tags into multiple lines if needed
  const tags1Lines = splitString(tags1, 33);  // Accounting for "Tags: " prefix
  const tags2Lines = splitString(tags2, 33);
  const maxTagLines = Math.max(tags1Lines.length, tags2Lines.length);
  
  for (let i = 0; i < maxTagLines; i++) {
    console.log(
      (i === 0 ? 'Tags: ' : '      ') + 
      (i < tags1Lines.length ? tags1Lines[i] : '').padEnd(i === 0 ? 34 : 40) + 
      '│ ' + 
      (i === 0 ? 'Tags: ' : '      ') + 
      (i < tags2Lines.length ? tags2Lines[i] : '')
    );
  }
  
  // Dates
  console.log(
    `Created: ${new Date(taskA.createdAt).toLocaleDateString()}`.padEnd(40) + 
    '│ ' + 
    `Created: ${new Date(taskB.createdAt).toLocaleDateString()}`
  );
  
  console.log(
    `Updated: ${new Date(taskA.updatedAt).toLocaleDateString()}`.padEnd(40) + 
    '│ ' + 
    `Updated: ${new Date(taskB.updatedAt).toLocaleDateString()}`
  );
  
  console.log('─'.repeat(40) + '┼' + '─'.repeat(39));
  
  // Similarity visualization
  const barLength = Math.round(percentage / 2); // 50 chars = 100%
  const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);
  
  console.log(colorize(`\nSimilarity: ${percentage}%`, simColor, asChalkColor('bold')));
  console.log(colorize(bar, simColor));
  
  // Recommendation
  if (percentage >= 90) {
    console.log(colorize('\n⚠️  RECOMMENDATION: These tasks are almost certainly duplicates and should be merged.', asChalkColor('bold'), asChalkColor(('red' as ChalkColor))));
  } else if (percentage >= 80) {
    console.log(colorize('\n⚠️  RECOMMENDATION: These tasks are likely duplicates and should be merged.', asChalkColor(('red' as ChalkColor))));
  } else if (percentage >= 70) {
    console.log(colorize('\nℹ️  RECOMMENDATION: These tasks are very similar and should be reviewed for potential duplication.', asChalkColor(('magenta' as ChalkColor))));
  } else if (percentage >= 50) {
    console.log(colorize('\nℹ️  RECOMMENDATION: These tasks are moderately similar and may be related.', asChalkColor(('yellow' as ChalkColor))));
  } else {
    console.log(colorize('\nℹ️  These tasks show only minor similarity.', asChalkColor(('green' as ChalkColor))));
  }
}

/**
 * Display a single task in detail
 */
export function displayTaskDetail(
  taskIndex: number,
  group: DuplicateGroup,
  colorize: ColorizeFunction
) {
  // Validate task index
  if (taskIndex < 0 || taskIndex >= group.tasks.length) {
    console.log(colorize('Invalid task index.', asChalkColor(('red' as ChalkColor))));
    return;
  }
  
  const task = group.tasks[taskIndex];
  
  // Header
  console.log(colorize(`\n┌${'─'.repeat(78)}┐`, asChalkColor(('yellow' as ChalkColor))));
  console.log(colorize(`│ TASK DETAILS - [${taskIndex + 1}] ${task.id} ${' '.repeat(78 - 16 - task.id.length - String(taskIndex + 1).length)}│`, asChalkColor('bold'), asChalkColor(('yellow' as ChalkColor))));
  console.log(colorize(`└${'─'.repeat(78)}┘`, asChalkColor(('yellow' as ChalkColor))));
  
  // Title section
  console.log(colorize('\n● TITLE', asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
  console.log(task.title);
  
  // Basic info section
  console.log(colorize('\n● BASIC INFORMATION', asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
  console.log(`Status: ${colorizeStatus(task.status, colorize)}`);
  console.log(`Readiness: ${colorizeReadiness(task.readiness, colorize)}`);
  console.log(`Tags: ${formatTags(task.tags, asChalkColor(('cyan' as ChalkColor)), colorize)}`);
  console.log(`Created: ${new Date(task.createdAt).toLocaleString()}`);
  console.log(`Updated: ${new Date(task.updatedAt).toLocaleString()}`);
  
  // Metadata section
  if (task.metadata) {
    const metadata = typeof task.metadata === 'string' ? JSON.parse(task.metadata) : task.metadata;
    const cleanMetadata = { ...metadata };
    delete cleanMetadata.similarityScore;
    
    if (Object.keys(cleanMetadata).length > 0) {
      console.log(colorize('\n● METADATA', asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
      for (const [key, value] of Object.entries(cleanMetadata)) {
        console.log(`${colorize(key, asChalkColor(('cyan' as ChalkColor)))}: ${JSON.stringify(value, null, 2)}`);
      }
    }
  }
  
  // Similarity section
  console.log(colorize('\n● SIMILARITY TO OTHER TASKS', asChalkColor('bold'), asChalkColor(('blue' as ChalkColor))));
  
  const similarities = group.similarityMatrix[taskIndex]
    .map((sim, idx) => idx !== taskIndex ? { idx, sim } : null)
    .filter((item): item is { idx: number, sim: number } => item !== null)
    .sort((a, b) => b.sim - a.sim); // Sort by similarity (highest first)
  
  if (similarities.length > 0) {
    for (const { idx, sim } of similarities) {
      const otherTask = group.tasks[idx];
      const percentage = Math.round(sim * 100);

      let simColor = 'green';
      if (percentage >= 90) simColor = 'red';
      else if (percentage >= 80) simColor = 'red';
      else if (percentage >= 70) simColor = 'magenta';
      else if (percentage >= 50) simColor = 'yellow';
      
      // Generate a visual representation of similarity
      const barLength = Math.round(percentage / 5); // 20 chars = 100%
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      
      console.log(
        colorize(`[${idx + 1}] ${otherTask.id}:`, asChalkColor(('blue' as ChalkColor))) + ' ' +
        colorize(`${percentage}%`, simColor) + ' ' +
        colorize(bar, simColor) + ' ' +
        otherTask.title.substring(0, 30) + (otherTask.title.length > 30 ? '...' : '')
      );
    }
  } else {
    console.log(colorize('No other tasks in this group to compare with.', asChalkColor(('gray' as ChalkColor))));
  }
}

/**
 * Helper function to split a string into multiple lines
 */
function splitString(str: string, maxLength: number): string[] {
  const result: string[] = [];
  let remainingStr = str;
  
  while (remainingStr.length > maxLength) {
    // Find a good break point
    let breakPoint = maxLength;
    while (breakPoint > 0 && remainingStr[breakPoint] !== ' ' && remainingStr[breakPoint] !== ',') {
      breakPoint--;
    }
    
    // If no good break point, force break at maxLength
    if (breakPoint === 0) {
      breakPoint = maxLength;
    }
    
    result.push(remainingStr.substring(0, breakPoint));
    remainingStr = remainingStr.substring(breakPoint).trim();
  }
  
  if (remainingStr.length > 0) {
    result.push(remainingStr);
  }
  
  return result;
}