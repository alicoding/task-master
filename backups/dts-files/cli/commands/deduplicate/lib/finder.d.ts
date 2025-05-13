import { Task } from '../../../../db/schema';
import { NlpService } from '../../../../core/nlp-service';
import { DuplicateGroup } from './utils';
/**
 * Find groups of duplicate tasks
 * @param tasks List of tasks to check
 * @param nlpService NLP service instance
 * @param minSimilarity Minimum similarity threshold (0-1)
 * @returns Array of duplicate groups
 */
export declare function findDuplicateGroups(tasks: Task[], nlpService: NlpService, minSimilarity: number): Promise<DuplicateGroup[]>;
