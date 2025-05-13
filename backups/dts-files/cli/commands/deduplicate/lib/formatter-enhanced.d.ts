/**
 * Enhanced formatter for deduplication with improved visual presentation
 */
import { DuplicateGroup, ColorizeFunction } from './utils';
/**
 * Display duplicate groups with improved visual formatting
 */
export declare function displayDuplicateGroups(limitedGroups: DuplicateGroup[], duplicateGroups: DuplicateGroup[], colorize: ColorizeFunction): void;
/**
 * Display detailed view of a group with enhanced visual presentation
 */
export declare function displayDetailedGroupView(groupNum: number, selectedGroup: DuplicateGroup, colorize: ColorizeFunction): void;
/**
 * Display interactive mode help with enhanced formatting
 */
export declare function displayInteractiveHelp(colorize: ColorizeFunction): void;
/**
 * Display task comparison view
 */
export declare function displayTaskComparison(task1: number, task2: number, group: DuplicateGroup, colorize: ColorizeFunction): void;
/**
 * Display a single task in detail
 */
export declare function displayTaskDetail(taskIndex: number, group: DuplicateGroup, colorize: ColorizeFunction): void;
