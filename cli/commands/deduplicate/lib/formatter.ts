import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { DuplicateGroup, ColorizeFunction } from './utils';
/**
 * Display duplicate groups
 */
export function displayDuplicateGroups(limitedGroups: DuplicateGroup[], duplicateGroups: DuplicateGroup[], colorize: ColorizeFunction) {
    console.log(colorize(`\nFound ${duplicateGroups.length} potential duplicate groups (showing top ${limitedGroups.length}):`, asChalkColor(1)));
    console.log(colorize('Groups are sorted by similarity (highest first)\n', asChalkColor(1)));
    for (let i = 0; i < limitedGroups.length; i++) {
        const group = limitedGroups[i];
        const groupNumber = i + 1;
        // Determine color based on max similarity
        let groupColor = 'yellow';
        if (group.maxSimilarity >= 0.8) {
            groupColor = 'red';
        }
        else if (group.maxSimilarity >= 0.6) {
            groupColor = 'magenta';
        }
        console.log(colorize(`Group ${groupNumber}: `, groupColor, 'bold') +
            colorize(`${Math.round(group.maxSimilarity * 100)}% max similarity`, groupColor));
        // Display tasks in group
        group.tasks.forEach((task, taskIndex) => {
            console.log(colorize(`  [${taskIndex + 1}] ${task.id}: `, asChalkColor(1), 'bold') + task.title);
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
            console.log(colorize('  ⚠️  These tasks are likely duplicates and should be merged', asChalkColor(1)));
        }
        else if (group.maxSimilarity >= 0.6) {
            console.log(colorize('  ℹ️  These tasks are similar and may be related or duplicates', asChalkColor(1)));
        }
        console.log(''); // Empty line between groups
    }
}
/**
 * Display detailed view of a group
 */
export function displayDetailedGroupView(groupNum: number, selectedGroup: DuplicateGroup, colorize: ColorizeFunction) {
    console.log(colorize(`\nDetailed view of Group ${groupNum}:\n`, asChalkColor(1), 'bold'));
    // Display similarity matrix
    console.log(colorize('Similarity Matrix:', asChalkColor(1)));
    console.log(colorize('                  '.substring(0, 18), asChalkColor(1)) +
        selectedGroup.tasks.map((t, i) => colorize(`[${i + 1}]`.padEnd(6), asChalkColor(1))).join(''));
    for (let i = 0; i < selectedGroup.tasks.length; i++) {
        const task = selectedGroup.tasks[i];
        console.log(colorize(`[${i + 1}] ${task.id}:`.padEnd(18), asChalkColor(1)) +
            selectedGroup.similarityMatrix[i].map((sim, j) => {
                if (i === j)
                    return colorize('  -  ', asChalkColor(1));
                const percentage = Math.round(sim * 100);
                let simColor = (asChalkColor(1));
                if (percentage >= 80)
                    simColor = (asChalkColor(1));
                else if (percentage >= 60)
                    simColor = (asChalkColor(1));
                return colorize(`${percentage}%`.padEnd(6), simColor);
            }).join(''));
    }
    console.log('');
    // Display task details
    for (let i = 0; i < selectedGroup.tasks.length; i++) {
        const task = selectedGroup.tasks[i];
        console.log(colorize(`Task [${i + 1}] ${task.id}:`, asChalkColor(1), 'bold'));
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
    console.log(colorize('\nWhat would you like to do?', asChalkColor(1), 'bold'));
    console.log(colorize('  m <group>', asChalkColor(1)) + ') ' + colorize('Merge tasks in a specific group', asChalkColor(1)));
    console.log(colorize('  v <group>', asChalkColor(1)) + ') ' + colorize('View group details', asChalkColor(1)));
    console.log(colorize('  q', asChalkColor(1)) + ') ' + colorize('Quit', asChalkColor(1)));
}
