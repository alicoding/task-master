import { DuplicateGroup, ColorizeFunction } from './utils';
/**
 * Display duplicate groups
 */
export declare function displayDuplicateGroups(limitedGroups: DuplicateGroup[], duplicateGroups: DuplicateGroup[], colorize: ColorizeFunction): void;
/**
 * Display detailed view of a group
 */
export declare function displayDetailedGroupView(groupNum: number, selectedGroup: DuplicateGroup, colorize: ColorizeFunction): void;
/**
 * Display interactive mode help
 */
export declare function displayInteractiveHelp(colorize: ColorizeFunction): void;
