/**
 * Definition of Done (DoD) Manager
 * Core implementation of DoD functionality
 */
import { DoDItem, TaskDoD, ProjectDoD, DoDOperationResult } from './types';
/**
 * Manager for Definition of Done operations
 */
export declare class DoDManager {
    private configPath;
    private configDir;
    /**
     * Create a new DoD manager
     * @param configDir Optional custom configuration directory
     */
    constructor(configDir?: string);
    /**
     * Initialize DoD configuration with default templates
     * @param force Overwrite existing configuration if present
     * @returns Operation result with config details
     */
    initConfig(force?: boolean): Promise<DoDOperationResult<{
        configPath: string;
        defaultItems: DoDItem[];
        tagItems?: Record<string, DoDItem[]>;
    }>>;
    /**
     * Ensure the configuration directory exists
     * @returns Promise that resolves when the directory exists
     */
    private ensureConfigDir;
    /**
     * Load the project DoD configuration
     * @returns Project DoD configuration
     */
    getProjectDoD(): Promise<DoDOperationResult<ProjectDoD>>;
    /**
     * Save the project DoD configuration
     * @param config Project DoD configuration
     * @returns Operation result
     */
    private saveProjectDoD;
    /**
     * Add a DoD item to the project configuration
     * @param description Description of the DoD item
     * @param tag Optional tag to associate the item with
     * @returns Operation result with the added item
     */
    addProjectDoDItem(description: string, tag?: string): Promise<DoDOperationResult<DoDItem>>;
    /**
     * Remove a DoD item from the project configuration
     * @param idOrDescription ID or description of the DoD item to remove
     * @param tag Optional tag to remove the item from
     * @returns Operation result with the removed item
     */
    removeProjectDoDItem(idOrDescription: string, tag?: string): Promise<DoDOperationResult<DoDItem>>;
    /**
     * Get DoD for a specific task
     * @param taskId Task ID
     * @returns Operation result with the task DoD
     */
    getTaskDoD(taskId: string): Promise<DoDOperationResult<TaskDoD>>;
    /**
     * Add a DoD item to a task
     * @param taskId Task ID
     * @param description Description of the DoD item
     * @returns Operation result with the added item
     */
    addTaskDoDItem(taskId: string, description: string): Promise<DoDOperationResult<DoDItem>>;
    /**
     * Remove a DoD item from a task
     * @param taskId Task ID
     * @param idOrDescription ID or description of the DoD item to remove
     * @returns Operation result with the removed item
     */
    removeTaskDoDItem(taskId: string, idOrDescription: string): Promise<DoDOperationResult<DoDItem>>;
    /**
     * Mark a DoD item as completed or not completed
     * @param taskId Task ID
     * @param idOrDescription ID or description of the DoD item to mark
     * @param completed Whether the item is completed
     * @returns Operation result with the updated item
     */
    markTaskDoDItem(taskId: string, idOrDescription: string, completed: boolean): Promise<DoDOperationResult<DoDItem>>;
    /**
     * Enable or disable DoD for a task
     * @param taskId Task ID
     * @param enabled Whether DoD is enabled
     * @returns Operation result with the updated DoD
     */
    setTaskDoDEnabled(taskId: string, enabled: boolean): Promise<DoDOperationResult<TaskDoD>>;
    /**
     * Check if all DoD items are completed for a task
     * This method is kept for backward compatibility but now always returns success
     * DoD items are now purely informational and don't block task completion
     *
     * @param taskId Task ID
     * @returns Operation result with completion status (always returns completed=true)
     */
    checkTaskDoDCompletion(taskId: string): Promise<DoDOperationResult<{
        completed: boolean;
        totalItems: number;
        completedItems: number;
        missingItems: DoDItem[];
    }>>;
}
