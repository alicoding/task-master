/**
 * Enhanced tree formatter with advanced visual elements and relationship display
 */
import { TaskWithChildren, DependencyType } from '../../types';
/**
 * Generate enhanced tree visualization
 */
export declare function formatEnhancedTree(tasks: TaskWithChildren[], options?: any, dependencyMap?: Record<string, {
    id: string;
    title: string;
    type: DependencyType;
}[]>): Promise<string>;
