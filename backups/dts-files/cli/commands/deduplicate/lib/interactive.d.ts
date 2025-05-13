import { TaskRepository } from '../../../../core/repo';
import { DuplicateGroup, ColorizeFunction } from './utils';
/**
 * Run interactive mode
 */
export declare function runInteractiveMode(limitedGroups: DuplicateGroup[], repo: TaskRepository, colorize: ColorizeFunction): Promise<void>;
