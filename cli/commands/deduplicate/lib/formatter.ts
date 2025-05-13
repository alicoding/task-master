import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { DuplicateGroup, ColorizeFunction } from './utils';


/**
 * Display duplicate groups
 */
export function displayDuplicateGroups(
  limitedGroups: DuplicateGroup[],
  duplicateGroups: DuplicateGroup[],
  colorize: ColorizeFunction
) {
  console.log(colorize(`\nFound ${duplicateGroups.length} potential duplicate groups (showing top ${limitedGroups.length}):`, asChalkColor((asChalkColor(('green' as ChalkColor))))));
  console.log(colorize('Groups are sorted by similarity (highest first)\n', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  
  for (let i = 0; i < limitedGroups.length; i++) {
    const group = limitedGroups[i];
    const groupNumber = i + 1;
    
    // Determine color based on max similarity
    let groupColor = asChalkColor('yellow');
    if (group.maxSimilarity >= 0.8) {
      groupColor = asChalkColor('red');
    } else if (group.maxSimilarity >= 0.6) {
      groupColor = asChalkColor('magenta');
    }

    console.log(colorize(`Group ${groupNumber}: `, groupColor, asChalkColor('bold')) +
                colorize(`${Math.round(group.maxSimilarity * 100)}% max similarity`, groupColor));
    
    // Display tasks in group
    group.tasks.forEach((task, taskIndex) => {
      console.log(colorize(`  [${taskIndex + 1}] ${task.id}: `, asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')) + task.title);
      console.log(`     Status: ${task.status}, Tags: ${task.tags?.join(', ') || 'none'}`);
      
      // Show similarity matrix for this task
      if (group.similarityMatrix[taskIndex].some(sim => sim > 0)) {
        const similarities = group.similarityMatrix[taskIndex]
          .map((sim, idx) => idx !== taskIndex ? Math.round(sim * 100) : null)
          .filter((sim, idx) => sim !== null && idx < group.tasks.length)
          .map((sim, idx) => `${idx + 1}:${sim}%`);
        
        if (similarities.length > 0) {
          console.log(`     Similarity to others: ${similarities.join(', ')}`);
        }
      }
    });
    
    // Add action suggestion for high similarity groups
    if (group.maxSimilarity >= 0.8) {
      console.log(colorize('  ⚠️  These tasks are likely duplicates and should be merged', asChalkColor((asChalkColor(('red' as ChalkColor))))));
    } else if (group.maxSimilarity >= 0.6) {
      console.log(colorize('  ℹ️  These tasks are similar and may be related or duplicates', asChalkColor((asChalkColor(('magenta' as ChalkColor))))));
    }
    
    console.log(''); // Empty line between groups
  }
}

/**
 * Display detailed view of a group
 */
export function displayDetailedGroupView(
  groupNum: number,
  selectedGroup: DuplicateGroup,
  colorize: ColorizeFunction
) {
  console.log(colorize(`\nDetailed view of Group ${groupNum}:\n`, asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
  
  // Display similarity matrix
  console.log(colorize('Similarity Matrix:', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
  console.log(colorize('                  '.substring(0, 18), asChalkColor((asChalkColor(('gray' as ChalkColor))))) + 
              selectedGroup.tasks.map((t, i) => colorize(`[${i + 1}]`.padEnd(6), asChalkColor((asChalkColor(('blue' as ChalkColor)))))).join(''));
  
  for (let i = 0; i < selectedGroup.tasks.length; i++) {
    const task = selectedGroup.tasks[i];
    console.log(colorize(`[${i + 1}] ${task.id}:`.padEnd(18), asChalkColor((asChalkColor(('blue' as ChalkColor))))) + 
                selectedGroup.similarityMatrix[i].map((sim, j) => {
                  if (i === j) return colorize('  -  ', asChalkColor((asChalkColor(('gray' as ChalkColor)))));
                  const percentage = Math.round(sim * 100);
                  let simColor = (asChalkColor((asChalkColor(('green' as ChalkColor)))));
                  if (percentage >= 80) simColor = (asChalkColor((asChalkColor(('red' as ChalkColor)))));
                  else if (percentage >= 60) simColor = (asChalkColor((asChalkColor(('yellow' as ChalkColor)))));
                  return colorize(`${percentage}%`.padEnd(6), simColor);
                }).join(''));
  }
  
  console.log('');
  
  // Display task details
  for (let i = 0; i < selectedGroup.tasks.length; i++) {
    const task = selectedGroup.tasks[i];
    console.log(colorize(`Task [${i + 1}] ${task.id}:`, asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
    console.log(`  Title: ${task.title}`);
    console.log(`  Status: ${task.status}, Readiness: ${task.readiness}`);
    console.log(`  Tags: ${task.tags?.join(', ') || 'none'}`);
    console.log(`  Created: ${new Date(task.createdAt).toLocaleString()}`);
    console.log(`  Updated: ${new Date(task.updatedAt).toLocaleString()}`);
    if (task.metadata) {
      const metadata = typeof task.metadata === 'string' ? JSON.parse(task.metadata) : task.metadata;
      const cleanMetadata = { ...metadata };
      delete cleanMetadata.similarityScore;
      if (Object.keys(cleanMetadata).length > 0) {
        console.log(`  Metadata: ${JSON.stringify(cleanMetadata)}`);
      }
    }
    console.log('');
  }
}

/**
 * Display interactive mode help
 */
export function displayInteractiveHelp(colorize: ColorizeFunction) {
  console.log(colorize('\nWhat would you like to do?', asChalkColor((asChalkColor(('cyan' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('  m <group>', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ') ' + colorize('Merge tasks in a specific group', asChalkColor((asChalkColor(('white' as ChalkColor))))));
  console.log(colorize('  v <group>', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + ') ' + colorize('View group details', asChalkColor((asChalkColor(('white' as ChalkColor))))));
  console.log(colorize('  q', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ') ' + colorize('Quit', asChalkColor((asChalkColor(('white' as ChalkColor))))));
}