/**
 * Definition of Done (DoD) Manager
 * Core implementation of DoD functionality
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  DoDItem,
  TaskDoD,
  ProjectDoD,
  DoDError,
  DoDErrorCode,
  DoDOperationResult
} from '@/core/dod/types';
import { TaskRepository } from '@/core/repo';

/**
 * Default DoD configuration for development tasks
 */
const DEFAULT_DOD_CONFIG: ProjectDoD = {
  enabled: true,
  defaultItems: [
    {
      id: 'imports-verified',
      description: 'All imports verified against their source modules'
    },
    {
      id: 'typescript-patterns',
      description: 'TypeScript-only patterns followed throughout implementation'
    },
    {
      id: 'cli-commands',
      description: 'CLI commands run without errors after implementation'
    },
    {
      id: 'regression',
      description: 'No regression in existing functionality'
    },
    {
      id: 'tested',
      description: 'Code tested with example use cases'
    }
  ],
  tagItems: {
    'feature': [
      {
        id: 'user-doc',
        description: 'User documentation updated'
      },
      {
        id: 'tests-added',
        description: 'Tests added for new functionality'
      }
    ],
    'bug': [
      {
        id: 'root-cause',
        description: 'Root cause identified and documented'
      },
      {
        id: 'regression-test',
        description: 'Regression test added to prevent recurrence'
      }
    ],
    'refactor': [
      {
        id: 'backward-compatible',
        description: 'Changes maintain backward compatibility'
      },
      {
        id: 'tests-passing',
        description: 'All existing tests passing'
      }
    ]
  }
};

/**
 * Manager for Definition of Done operations
 */
export class DoDManager {
  private configPath: string;
  private configDir: string;

  /**
   * Create a new DoD manager
   * @param configDir Optional custom configuration directory
   */
  constructor(configDir?: string) {
    this.configDir = configDir || path.join(process.cwd(), '.taskmaster');
    this.configPath = path.join(this.configDir, 'dod.json');
  }

  /**
   * Initialize DoD configuration with default templates
   * @param force Overwrite existing configuration if present
   * @returns Operation result with config details
   */
  async initConfig(force: boolean = false): Promise<DoDOperationResult<{ configPath: string, defaultItems: DoDItem[], tagItems?: Record<string, DoDItem[]> }>> {
    try {
      // Check if config directory exists, create if not
      await this.ensureConfigDir();

      // Check if config file already exists
      try {
        await fs.access(this.configPath);
        if (!force) {
          return {
            success: false,
            error: new DoDError('DoD configuration already exists', DoDErrorCode.CONFIG_EXISTS)
          };
        }
      } catch (error) {
        // File doesn't exist, which is fine for initialization
      }

      // Write default configuration
      await fs.writeFile(this.configPath, JSON.stringify(DEFAULT_DOD_CONFIG, null, 2), 'utf-8');

      return {
        success: true,
        data: {
          configPath: this.configPath,
          defaultItems: DEFAULT_DOD_CONFIG.defaultItems,
          tagItems: DEFAULT_DOD_CONFIG.tagItems
        }
      };
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to initialize DoD configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.FILE_SYSTEM_ERROR
        )
      };
    }
  }

  /**
   * Ensure the configuration directory exists
   * @returns Promise that resolves when the directory exists
   */
  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      throw new DoDError(
        `Failed to create config directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        DoDErrorCode.FILE_SYSTEM_ERROR
      );
    }
  }

  /**
   * Load the project DoD configuration
   * @returns Project DoD configuration
   */
  async getProjectDoD(): Promise<DoDOperationResult<ProjectDoD>> {
    try {
      // Check if config file exists
      try {
        await fs.access(this.configPath);
      } catch (error) {
        // Initialize with default config if file doesn't exist
        const initResult = await this.initConfig();
        if (!initResult.success) {
          return {
            success: false,
            error: initResult.error
          };
        }
      }

      // Read and parse the config file
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configData) as ProjectDoD;

      // Validate the configuration
      if (!config || typeof config !== 'object' || !Array.isArray(config.defaultItems)) {
        return {
          success: false,
          error: new DoDError('Invalid DoD configuration format', DoDErrorCode.INVALID_CONFIG)
        };
      }

      return {
        success: true,
        data: config
      };
    } catch (error) {
      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: new DoDError('Invalid JSON in DoD configuration file', DoDErrorCode.INVALID_CONFIG)
        };
      }

      // Handle other errors
      return {
        success: false,
        error: new DoDError(
          `Failed to load DoD configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.FILE_SYSTEM_ERROR
        )
      };
    }
  }

  /**
   * Save the project DoD configuration
   * @param config Project DoD configuration
   * @returns Operation result
   */
  private async saveProjectDoD(config: ProjectDoD): Promise<DoDOperationResult<void>> {
    try {
      await this.ensureConfigDir();
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to save DoD configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.FILE_SYSTEM_ERROR
        )
      };
    }
  }

  /**
   * Add a DoD item to the project configuration
   * @param description Description of the DoD item
   * @param tag Optional tag to associate the item with
   * @returns Operation result with the added item
   */
  async addProjectDoDItem(description: string, tag?: string): Promise<DoDOperationResult<DoDItem>> {
    try {
      // Load current config
      const configResult = await this.getProjectDoD();
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error
        };
      }

      const config = configResult.data;
      const newItem: DoDItem = {
        id: uuidv4(),
        description
      };

      // Add to tag-specific or default items
      if (tag) {
        // Initialize tag items if not exists
        if (!config.tagItems) {
          config.tagItems = {};
        }
        
        if (!config.tagItems[tag]) {
          config.tagItems[tag] = [];
        }
        
        // Check if item already exists
        const existingItem = config.tagItems[tag].find(item => 
          item.description.toLowerCase() === description.toLowerCase()
        );
        
        if (existingItem) {
          return {
            success: false,
            error: new DoDError(`DoD item already exists for tag "${tag}"`, DoDErrorCode.ITEM_EXISTS)
          };
        }
        
        config.tagItems[tag].push(newItem);
      } else {
        // Check if item already exists
        const existingItem = config.defaultItems.find(item => 
          item.description.toLowerCase() === description.toLowerCase()
        );
        
        if (existingItem) {
          return {
            success: false,
            error: new DoDError('DoD item already exists in default configuration', DoDErrorCode.ITEM_EXISTS)
          };
        }
        
        config.defaultItems.push(newItem);
      }

      // Save updated config
      const saveResult = await this.saveProjectDoD(config);
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error
        };
      }

      return {
        success: true,
        data: newItem
      };
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to add DoD item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Remove a DoD item from the project configuration
   * @param idOrDescription ID or description of the DoD item to remove
   * @param tag Optional tag to remove the item from
   * @returns Operation result with the removed item
   */
  async removeProjectDoDItem(idOrDescription: string, tag?: string): Promise<DoDOperationResult<DoDItem>> {
    try {
      // Load current config
      const configResult = await this.getProjectDoD();
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error
        };
      }

      const config = configResult.data;
      let removedItem: DoDItem | undefined;

      // Remove from tag-specific or default items
      if (tag) {
        if (!config.tagItems || !config.tagItems[tag]) {
          return {
            success: false,
            error: new DoDError(`No DoD items found for tag "${tag}"`, DoDErrorCode.ITEM_NOT_FOUND)
          };
        }
        
        const index = config.tagItems[tag].findIndex(item => 
          item.id === idOrDescription || 
          item.description.toLowerCase() === idOrDescription.toLowerCase()
        );
        
        if (index === -1) {
          return {
            success: false,
            error: new DoDError(`DoD item not found for tag "${tag}"`, DoDErrorCode.ITEM_NOT_FOUND)
          };
        }
        
        removedItem = config.tagItems[tag][index];
        config.tagItems[tag].splice(index, 1);
      } else {
        const index = config.defaultItems.findIndex(item => 
          item.id === idOrDescription || 
          item.description.toLowerCase() === idOrDescription.toLowerCase()
        );
        
        if (index === -1) {
          return {
            success: false,
            error: new DoDError('DoD item not found in default configuration', DoDErrorCode.ITEM_NOT_FOUND)
          };
        }
        
        removedItem = config.defaultItems[index];
        config.defaultItems.splice(index, 1);
      }

      // Save updated config
      const saveResult = await this.saveProjectDoD(config);
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error
        };
      }

      return {
        success: true,
        data: removedItem
      };
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to remove DoD item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Get DoD for a specific task
   * @param taskId Task ID
   * @returns Operation result with the task DoD
   */
  async getTaskDoD(taskId: string): Promise<DoDOperationResult<TaskDoD>> {
    try {
      const repo = new TaskRepository();
      try {
        // Get the task
        const taskResult = await repo.getTask(taskId);
        if (!taskResult.success || !taskResult.data) {
          return {
            success: false,
            error: new DoDError(`Task with ID ${taskId} not found`, DoDErrorCode.TASK_NOT_FOUND)
          };
        }

        const task = taskResult.data;
        const metadata = task.metadata || {};
        
        // If task has DoD in metadata, return it
        if (metadata.dod && typeof metadata.dod === 'object') {
          // Ensure proper structure
          const taskDoD: TaskDoD = {
            enabled: metadata.dod.enabled !== false, // Default to true if not specified
            items: Array.isArray(metadata.dod.items) ? metadata.dod.items : []
          };
          
          return {
            success: true,
            data: taskDoD
          };
        }
        
        // Get project DoD items (based on task tags)
        // This is for tasks that don't have explicit DoD settings
        const items: DoDItem[] = [];
        
        // Get project DoD config
        const projectDoDResult = await this.getProjectDoD();
        if (projectDoDResult.success) {
          const projectDoD = projectDoDResult.data;
          
          // Add default items
          projectDoD.defaultItems.forEach(item => {
            items.push({
              ...item,
              completed: false
            });
          });
          
          // Add tag-specific items
          if (projectDoD.tagItems && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
              if (projectDoD.tagItems?.[tag]) {
                projectDoD.tagItems[tag].forEach(item => {
                  // Don't add duplicates
                  if (!items.some(existing => existing.id === item.id)) {
                    items.push({
                      ...item,
                      completed: false
                    });
                  }
                });
              }
            });
          }
        }
        
        // Return default DoD for the task
        return {
          success: true,
          data: {
            enabled: true,
            items
          }
        };
      } finally {
        repo.close();
      }
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to get task DoD: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Add a DoD item to a task
   * @param taskId Task ID
   * @param description Description of the DoD item
   * @returns Operation result with the added item
   */
  async addTaskDoDItem(taskId: string, description: string): Promise<DoDOperationResult<DoDItem>> {
    try {
      const repo = new TaskRepository();
      try {
        // Get the task
        const taskResult = await repo.getTask(taskId);
        if (!taskResult.success || !taskResult.data) {
          return {
            success: false,
            error: new DoDError(`Task with ID ${taskId} not found`, DoDErrorCode.TASK_NOT_FOUND)
          };
        }

        const task = taskResult.data;
        const metadata = { ...task.metadata } || {};
        
        // Initialize DoD structure if not exists
        if (!metadata.dod || typeof metadata.dod !== 'object') {
          metadata.dod = {
            enabled: true,
            items: []
          };
        }
        
        // Initialize items array if not exists
        if (!Array.isArray(metadata.dod.items)) {
          metadata.dod.items = [];
        }
        
        // Check if item already exists
        const existingItem = metadata.dod.items.find(item => 
          item.description.toLowerCase() === description.toLowerCase()
        );
        
        if (existingItem) {
          return {
            success: false,
            error: new DoDError(`DoD item already exists for task ${taskId}`, DoDErrorCode.ITEM_EXISTS)
          };
        }
        
        // Add new item
        const newItem: DoDItem = {
          id: uuidv4(),
          description,
          completed: false
        };
        
        metadata.dod.items.push(newItem);
        
        // Update task metadata
        await repo.updateTask({
          id: taskId,
          metadata
        });
        
        return {
          success: true,
          data: newItem
        };
      } finally {
        repo.close();
      }
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to add DoD item to task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Remove a DoD item from a task
   * @param taskId Task ID
   * @param idOrDescription ID or description of the DoD item to remove
   * @returns Operation result with the removed item
   */
  async removeTaskDoDItem(taskId: string, idOrDescription: string): Promise<DoDOperationResult<DoDItem>> {
    try {
      const repo = new TaskRepository();
      try {
        // Get the task
        const taskResult = await repo.getTask(taskId);
        if (!taskResult.success || !taskResult.data) {
          return {
            success: false,
            error: new DoDError(`Task with ID ${taskId} not found`, DoDErrorCode.TASK_NOT_FOUND)
          };
        }

        const task = taskResult.data;
        const metadata = { ...task.metadata } || {};
        
        // Check if DoD exists
        if (!metadata.dod || !Array.isArray(metadata.dod.items) || metadata.dod.items.length === 0) {
          return {
            success: false,
            error: new DoDError(`No DoD items found for task ${taskId}`, DoDErrorCode.ITEM_NOT_FOUND)
          };
        }
        
        // Find the item by ID or description
        const index = metadata.dod.items.findIndex(item => 
          item.id === idOrDescription || 
          item.description.toLowerCase() === idOrDescription.toLowerCase()
        );
        
        if (index === -1) {
          return {
            success: false,
            error: new DoDError(`DoD item not found for task ${taskId}`, DoDErrorCode.ITEM_NOT_FOUND)
          };
        }
        
        // Remove the item
        const removedItem = metadata.dod.items[index];
        metadata.dod.items.splice(index, 1);
        
        // Update task metadata
        await repo.updateTask({
          id: taskId,
          metadata
        });
        
        return {
          success: true,
          data: removedItem
        };
      } finally {
        repo.close();
      }
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to remove DoD item from task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Mark a DoD item as completed or not completed
   * @param taskId Task ID
   * @param idOrDescription ID or description of the DoD item to mark
   * @param completed Whether the item is completed
   * @returns Operation result with the updated item
   */
  async markTaskDoDItem(taskId: string, idOrDescription: string, completed: boolean): Promise<DoDOperationResult<DoDItem>> {
    try {
      const repo = new TaskRepository();
      try {
        // Get the task
        const taskResult = await repo.getTask(taskId);
        if (!taskResult.success || !taskResult.data) {
          return {
            success: false,
            error: new DoDError(`Task with ID ${taskId} not found`, DoDErrorCode.TASK_NOT_FOUND)
          };
        }

        const task = taskResult.data;
        const metadata = { ...task.metadata } || {};
        
        // Check if DoD exists
        if (!metadata.dod || !Array.isArray(metadata.dod.items) || metadata.dod.items.length === 0) {
          return {
            success: false,
            error: new DoDError(`No DoD items found for task ${taskId}`, DoDErrorCode.ITEM_NOT_FOUND)
          };
        }
        
        // Find the item by ID or description
        const index = metadata.dod.items.findIndex(item => 
          item.id === idOrDescription || 
          item.description.toLowerCase() === idOrDescription.toLowerCase()
        );
        
        if (index === -1) {
          return {
            success: false,
            error: new DoDError(`DoD item not found for task ${taskId}`, DoDErrorCode.ITEM_NOT_FOUND)
          };
        }
        
        // Update the item
        metadata.dod.items[index].completed = completed;
        const updatedItem = metadata.dod.items[index];
        
        // Update task metadata
        await repo.updateTask({
          id: taskId,
          metadata
        });
        
        return {
          success: true,
          data: updatedItem
        };
      } finally {
        repo.close();
      }
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to mark DoD item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Enable or disable DoD for a task
   * @param taskId Task ID
   * @param enabled Whether DoD is enabled
   * @returns Operation result with the updated DoD
   */
  async setTaskDoDEnabled(taskId: string, enabled: boolean): Promise<DoDOperationResult<TaskDoD>> {
    try {
      const repo = new TaskRepository();
      try {
        // Get the task
        const taskResult = await repo.getTask(taskId);
        if (!taskResult.success || !taskResult.data) {
          return {
            success: false,
            error: new DoDError(`Task with ID ${taskId} not found`, DoDErrorCode.TASK_NOT_FOUND)
          };
        }

        const task = taskResult.data;
        const metadata = { ...task.metadata } || {};
        
        // Initialize DoD structure if not exists
        if (!metadata.dod || typeof metadata.dod !== 'object') {
          metadata.dod = {
            enabled: true,
            items: []
          };
        }
        
        // Set enabled flag
        metadata.dod.enabled = enabled;
        
        // Initialize items array if not exists
        if (!Array.isArray(metadata.dod.items)) {
          metadata.dod.items = [];
        }
        
        // If enabling and no items exist, initialize with default items
        if (enabled && metadata.dod.items.length === 0) {
          // Get project DoD items (based on task tags)
          const projectDoDResult = await this.getProjectDoD();
          
          if (projectDoDResult.success) {
            const projectDoD = projectDoDResult.data;
            
            // Add default items
            projectDoD.defaultItems.forEach(item => {
              metadata.dod.items.push({
                ...item,
                completed: false
              });
            });
            
            // Add tag-specific items
            if (projectDoD.tagItems && Array.isArray(task.tags)) {
              task.tags.forEach(tag => {
                if (projectDoD.tagItems?.[tag]) {
                  projectDoD.tagItems[tag].forEach(item => {
                    // Don't add duplicates
                    if (!metadata.dod.items.some(existing => existing.id === item.id)) {
                      metadata.dod.items.push({
                        ...item,
                        completed: false
                      });
                    }
                  });
                }
              });
            }
          }
        }
        
        // Update task metadata
        await repo.updateTask({
          id: taskId,
          metadata
        });
        
        return {
          success: true,
          data: {
            enabled,
            items: metadata.dod.items
          }
        };
      } finally {
        repo.close();
      }
    } catch (error) {
      return {
        success: false,
        error: new DoDError(
          `Failed to set DoD enabled state: ${error instanceof Error ? error.message : 'Unknown error'}`,
          DoDErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Check if all DoD items are completed for a task
   * This method is kept for backward compatibility but now always returns success
   * DoD items are now purely informational and don't block task completion
   *
   * @param taskId Task ID
   * @returns Operation result with completion status (always returns completed=true)
   */
  async checkTaskDoDCompletion(taskId: string): Promise<DoDOperationResult<{
    completed: boolean;
    totalItems: number;
    completedItems: number;
    missingItems: DoDItem[];
  }>> {
    try {
      // Get task DoD for informational purposes
      const doDResult = await this.getTaskDoD(taskId);

      if (!doDResult.success) {
        // Even on error, return success=true (no enforcement)
        return {
          success: true,
          data: {
            completed: true,
            totalItems: 0,
            completedItems: 0,
            missingItems: []
          }
        };
      }

      const taskDoD = doDResult.data;

      // If DoD is disabled or no items, consider it completed
      if (taskDoD.enabled === false || !taskDoD.items || taskDoD.items.length === 0) {
        return {
          success: true,
          data: {
            completed: true,
            totalItems: 0,
            completedItems: 0,
            missingItems: []
          }
        };
      }

      // Count items (for informational purposes only)
      const totalItems = taskDoD.items.length;
      const completedItems = taskDoD.items.filter(item => item.completed).length;
      const missingItems = taskDoD.items.filter(item => !item.completed);

      // Always return completed=true regardless of actual completion state
      // since DoD is now purely informational
      return {
        success: true,
        data: {
          completed: true, // Always true - no enforcement
          totalItems,
          completedItems,
          missingItems
        }
      };
    } catch (error) {
      // Even on error, return success=true (no enforcement)
      return {
        success: true,
        data: {
          completed: true,
          totalItems: 0,
          completedItems: 0,
          missingItems: []
        }
      };
    }
  }
}