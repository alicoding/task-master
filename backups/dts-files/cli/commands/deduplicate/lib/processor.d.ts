import { TaskRepository } from '../../../../core/repo';
import { NlpService } from '../../../../core/nlp-service';
import { ColorizeFunction } from './utils';
import { findDuplicateGroups } from './finder';
/**
 * Process tasks and find duplicates
 */
export declare function processTasks(repo: TaskRepository, nlpService: NlpService, options: {
    status?: string;
    tag?: string[];
}): Promise<any[]>;
/**
 * Process duplicates in auto-merge mode
 */
export declare function processAutoMerge(limitedGroups: Awaited<ReturnType<typeof findDuplicateGroups>>, repo: TaskRepository, colorize: ColorizeFunction): Promise<void>;
