/**
 * Interactive form for task updating
 * Provides a rich form-like UI for updating tasks
 */
import { ChalkColor } from '@/cli/utils/chalk-utils';
import { TaskUpdateOptions, Task } from '../../../core/types';
import { TaskRepository } from '../../../core/repo';
export declare class InteractiveUpdateForm {
    private readline;
    private task;
    private updateOptions;
    private useColors;
    private repo;
    constructor(task: Task, repo: TaskRepository, useColors?: boolean);
    /**
     * Color helper function
     */
    colorize(text: string, color?: string, style?: string): string;
    /**
     * Display welcome banner
     */
    displayBanner(): void;
    /**
     * Ask a question with default value
     */
    private askQuestion;
    /**
     * Ask a multiple choice question
     */
    private askMultipleChoice;
    /**
     * Ask for tags (multiple values)
     */
    private askTags;
    /**
     * Close the readline interface
     */
    close(): void;
    /**
     * Run the full form
     */
    run(): Promise<TaskUpdateOptions | null>;
}
