import { TaskRepository } from '@/core/repo';
import { NlpService } from '@/core/nlp-service';
import { Task } from '@/db/schema';
import { ColorizeFunction } from '@/cli/commands/deduplicate/lib/utils';
import { findDuplicateGroups } from '@/cli/commands/deduplicate/lib/finder';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Process tasks and find duplicates
 */
export async function processTasks(
  repo: TaskRepository,
  nlpService: NlpService,
  options: {
    status?: string;
    tag?: string[];
  }
) {
  // Get all tasks
  const tasksResult = await repo.getAllTasks();

  // Handle the operation result pattern
  if (!tasksResult.success || !tasksResult.data) {
    return [];
  }

  let allTasks = tasksResult.data;

  // Apply filters if provided
  if (options.status) {
    allTasks = allTasks.filter(task => task.status === options.status);
  }

  if (options.tag && options.tag.length > 0) {
    allTasks = allTasks.filter(task =>
      options.tag!.some(tag => task.tags.includes(tag))
    );
  }

  return allTasks;
}

/**
 * Process duplicates in auto-merge mode
 */
export async function processAutoMerge(
  limitedGroups: Awaited<ReturnType<typeof findDuplicateGroups>>,
  repo: TaskRepository,
  colorize: ColorizeFunction
) {
  // Get high similarity groups (80%+)
  const highSimilarityGroups = limitedGroups.filter(group => group.maxSimilarity >= 0.8);
  
  if (highSimilarityGroups.length === 0) {
    console.log(colorize('No groups with 80%+ similarity found for auto-merge.', asChalkColor('yellow')));
    return;
  }
  
  console.log(colorize(`\nAuto-merge suggestions for ${highSimilarityGroups.length} groups:\n`, asChalkColor('blue'), asChalkColor('bold')));
  
  // Import here to avoid circular dependencies
  const { suggestMerge } = await import("@/cli/commands/deduplicate/lib/merger");
  
  for (let i = 0; i < highSimilarityGroups.length; i++) {
    const group = highSimilarityGroups[i];
    await suggestMerge(group, repo, colorize);
  }
}