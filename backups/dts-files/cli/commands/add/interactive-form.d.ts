/**
 * Interactive form for task creation
 * Provides a rich form-like UI for creating tasks
 */
import { TaskInsertOptions } from '../../../core/types';
export declare class InteractiveTaskForm {
    private readline;
    private taskOptions;
    protected colorize;
    constructor(useColors?: boolean);
    /**
     * Display welcome banner
     */
    displayBanner(): void;
    /**
     * Ask a question and get user input
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
    run(): Promise<TaskInsertOptions | null>;
}
