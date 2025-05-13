/**
 * Enhanced interactive mode for deduplication tool
 */
import { TaskRepository } from '../../../../core/repo';
import { DuplicateGroup, ColorizeFunction } from './utils';
/**
 * Run enhanced interactive mode
 */
export declare function runInteractiveMode(limitedGroups: DuplicateGroup[], repo: TaskRepository, colorize: ColorizeFunction): Promise<void>;
/**
 * Run auto-merge with enhanced UI
 */
export declare function runAutoMergeSuggestions(highSimilarityGroups: DuplicateGroup[], repo: TaskRepository, colorize: ColorizeFunction): Promise<void>;
