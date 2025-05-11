/**
 * Definition of Done (DoD) commands
 * Implements CLI commands for managing DoD requirements
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { TaskRepository } from '../../../core/repo.ts';
import { helpFormatter } from '../../helpers/help-formatter.ts';
import { DoDManager } from '../../../core/dod/manager.ts';
import { DoDItem, DoD } from '../../../core/dod/types.ts';

/**
 * Register all DoD commands
 */
export function createDoDCommand(): Command {
  // Create the DoD command with the name 'dod'
  // When added to the main program, it will be accessible as 'tm dod'
  const dodCommand = new Command('dod')
    .description('Manage Definition of Done requirements');

  // Sub-command: Initialize DoD configuration
  dodCommand
    .command('init')
    .description('Initialize DoD configuration with default templates')
    .option('--force', 'Overwrite existing configuration if present')
    .action(async (options) => {
      try {
        const manager = new DoDManager();
        const result = await manager.initConfig(options.force);
        
        if (result.success) {
          console.log(chalk.green('✅ DoD configuration initialized successfully'));
          console.log(chalk.blue('Configuration file created at:'), result.data.configPath);
          console.log(chalk.blue('Default DoD items:'));
          
          result.data.defaultItems.forEach(item => {
            console.log(`  • ${chalk.yellow(item.description)}`);
          });
          
          const tagCount = Object.keys(result.data.tagItems || {}).length;
          if (tagCount > 0) {
            console.log(chalk.blue(`Tag-specific DoD items for ${tagCount} tags also configured.`));
          }
        } else {
          console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
          
          if (result.error?.code === 'CONFIG_EXISTS' && !options.force) {
            console.log(chalk.yellow('Use --force to overwrite existing configuration'));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error initializing DoD config:'), error instanceof Error ? error.message : error);
      }
    });

  // Sub-command: Add DoD item
  dodCommand
    .command('add')
    .description('Add DoD item to project or specific task')
    .argument('<item>', 'DoD item description')
    .option('-t, --task <id>', 'Task ID to add the DoD item to (defaults to project-level if not specified)')
    .option('--tag <tag>', 'Tag to associate this DoD item with (for project-level only)')
    .action(async (item, options) => {
      try {
        const manager = new DoDManager();
        
        if (options.task) {
          // Add DoD item to specific task
          const repo = new TaskRepository();
          const result = await manager.addTaskDoDItem(options.task, item);
          
          if (result.success) {
            console.log(chalk.green(`✅ Added DoD item to task ${options.task}`));
            console.log(`  • ${chalk.yellow(item)}`);
          } else {
            console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
          }
          
          repo.close();
        } else {
          // Add DoD item to project configuration
          const result = await manager.addProjectDoDItem(item, options.tag);
          
          if (result.success) {
            if (options.tag) {
              console.log(chalk.green(`✅ Added DoD item to tag "${options.tag}" configuration`));
            } else {
              console.log(chalk.green('✅ Added DoD item to default project configuration'));
            }
            console.log(`  • ${chalk.yellow(item)}`);
          } else {
            console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error adding DoD item:'), error instanceof Error ? error.message : error);
      }
    });

  // Sub-command: Remove DoD item
  dodCommand
    .command('remove')
    .description('Remove DoD item from project or specific task')
    .argument('<item>', 'DoD item ID or description to remove')
    .option('-t, --task <id>', 'Task ID to remove the DoD item from (defaults to project-level if not specified)')
    .option('--tag <tag>', 'Tag to remove this DoD item from (for project-level only)')
    .action(async (item, options) => {
      try {
        const manager = new DoDManager();
        
        if (options.task) {
          // Remove DoD item from specific task
          const repo = new TaskRepository();
          const result = await manager.removeTaskDoDItem(options.task, item);
          
          if (result.success) {
            console.log(chalk.green(`✅ Removed DoD item from task ${options.task}`));
            console.log(`  • ${chalk.yellow(result.data.description || item)}`);
          } else {
            console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
          }
          
          repo.close();
        } else {
          // Remove DoD item from project configuration
          const result = await manager.removeProjectDoDItem(item, options.tag);
          
          if (result.success) {
            if (options.tag) {
              console.log(chalk.green(`✅ Removed DoD item from tag "${options.tag}" configuration`));
            } else {
              console.log(chalk.green('✅ Removed DoD item from default project configuration'));
            }
            console.log(`  • ${chalk.yellow(result.data.description || item)}`);
          } else {
            console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error removing DoD item:'), error instanceof Error ? error.message : error);
      }
    });

  // Sub-command: Toggle DoD for a task
  dodCommand
    .command('toggle')
    .description('Enable or disable DoD for a task')
    .argument('<task-id>', 'Task ID to toggle DoD for')
    .option('--enable', 'Enable DoD for the task')
    .option('--disable', 'Disable DoD for the task (takes precedence if both flags are provided)')
    .action(async (taskId, options) => {
      try {
        const manager = new DoDManager();
        const repo = new TaskRepository();
        
        // Determine the desired state
        let enable = true;
        if (options.disable) {
          enable = false;
        } else if (options.enable) {
          enable = true;
        } else {
          // If neither flag is provided, toggle the current state
          const taskResult = await repo.getTask(taskId);
          if (taskResult.success && taskResult.data) {
            const metadata = taskResult.data.metadata || {};
            enable = !((metadata.dod?.enabled) === true);
          }
        }
        
        const result = await manager.setTaskDoDEnabled(taskId, enable);
        
        if (result.success) {
          if (enable) {
            console.log(chalk.green(`✅ Enabled DoD for task ${taskId}`));
            
            if (result.data.items && result.data.items.length > 0) {
              console.log(chalk.blue('Current DoD items:'));
              result.data.items.forEach(item => {
                const status = item.completed ? 
                  chalk.green('✓') : 
                  chalk.yellow('☐');
                console.log(`  ${status} ${item.description}`);
              });
            } else {
              console.log(chalk.yellow('No DoD items defined for this task yet.'));
              console.log(`Add items with: ${chalk.cyan(`tm dod add "Item description" --task ${taskId}`)}`);
            }
          } else {
            console.log(chalk.yellow(`⚠️ Disabled DoD for task ${taskId}`));
          }
        } else {
          console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
        }
        
        repo.close();
      } catch (error) {
        console.error(chalk.red('Error toggling DoD:'), error instanceof Error ? error.message : error);
      }
    });

  // Sub-command: List DoD items
  dodCommand
    .command('list')
    .description('List all DoD items for a task or project')
    .option('-t, --task <id>', 'Task ID to list DoD items for (defaults to project-level if not specified)')
    .option('--tag <tag>', 'Show DoD items for a specific tag (for project-level only)')
    .action(async (options) => {
      try {
        const manager = new DoDManager();
        
        if (options.task) {
          // List DoD items for specific task
          const result = await manager.getTaskDoD(options.task);
          
          if (result.success) {
            console.log(chalk.blue(`Definition of Done for task ${options.task}:`));
            
            if (result.data.enabled === false) {
              console.log(chalk.yellow('⚠️ DoD is disabled for this task'));
              return;
            }
            
            if (!result.data.items || result.data.items.length === 0) {
              console.log(chalk.yellow('No DoD items defined for this task.'));
              return;
            }
            
            result.data.items.forEach(item => {
              const status = item.completed ? 
                chalk.green('✓') : 
                chalk.yellow('☐');
              console.log(`  ${status} ${item.description}`);
            });
          } else {
            console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
          }
        } else {
          // List project-level DoD items
          const result = await manager.getProjectDoD();
          
          if (result.success) {
            if (options.tag && result.data.tagItems && result.data.tagItems[options.tag]) {
              // Show tag-specific DoD items
              console.log(chalk.blue(`Definition of Done for tag "${options.tag}":`));
              
              const tagItems = result.data.tagItems[options.tag];
              if (tagItems.length === 0) {
                console.log(chalk.yellow(`No DoD items defined for tag "${options.tag}".`));
                return;
              }
              
              tagItems.forEach(item => {
                console.log(`  • ${chalk.yellow(item.description)}`);
              });
            } else if (options.tag) {
              console.log(chalk.yellow(`No DoD items defined for tag "${options.tag}".`));
            } else {
              // Show default DoD items
              console.log(chalk.blue('Default Definition of Done:'));
              
              if (!result.data.defaultItems || result.data.defaultItems.length === 0) {
                console.log(chalk.yellow('No default DoD items defined.'));
              } else {
                result.data.defaultItems.forEach(item => {
                  console.log(`  • ${chalk.yellow(item.description)}`);
                });
              }
              
              // Show all tag-specific items
              if (result.data.tagItems && Object.keys(result.data.tagItems).length > 0) {
                console.log('');
                console.log(chalk.blue('Tag-specific Definitions of Done:'));
                
                for (const [tag, items] of Object.entries(result.data.tagItems)) {
                  console.log(chalk.cyan(`  ${tag}:`));
                  items.forEach(item => {
                    console.log(`    • ${chalk.yellow(item.description)}`);
                  });
                }
              }
            }
          } else {
            console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error listing DoD items:'), error instanceof Error ? error.message : error);
      }
    });

  // Sub-command: Check DoD completion status
  dodCommand
    .command('check')
    .description('Check DoD completion status for a task')
    .argument('<task-id>', 'Task ID to check DoD completion for')
    .action(async (taskId) => {
      try {
        const manager = new DoDManager();
        const result = await manager.getTaskDoD(taskId);
        
        if (result.success) {
          if (result.data.enabled === false) {
            console.log(chalk.yellow(`⚠️ DoD is disabled for task ${taskId}`));
            return;
          }
          
          console.log(chalk.blue(`DoD completion status for task ${taskId}:`));
          
          if (!result.data.items || result.data.items.length === 0) {
            console.log(chalk.yellow('No DoD items defined for this task.'));
            return;
          }
          
          const completed = result.data.items.filter(item => item.completed).length;
          const total = result.data.items.length;
          const percentage = Math.round((completed / total) * 100);
          
          console.log(chalk.blue(`Progress: ${completed}/${total} items (${percentage}%)`));
          
          result.data.items.forEach(item => {
            const status = item.completed ? 
              chalk.green('✓') : 
              chalk.yellow('☐');
            console.log(`  ${status} ${item.description}`);
          });
          
          if (completed === total) {
            console.log(chalk.green('✅ All DoD items are complete!'));
          } else {
            console.log(chalk.yellow(`⚠️ ${total - completed} items remaining to be completed.`));
          }
        } else {
          console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
        }
      } catch (error) {
        console.error(chalk.red('Error checking DoD status:'), error instanceof Error ? error.message : error);
      }
    });

  // Sub-command: Mark DoD item as completed or not completed
  dodCommand
    .command('mark')
    .description('Mark a DoD item as completed or not completed')
    .argument('<task-id>', 'Task ID')
    .argument('<item-id>', 'DoD item ID or description to mark')
    .option('--completed', 'Mark as completed (default)')
    .option('--not-completed', 'Mark as not completed')
    .action(async (taskId, itemId, options) => {
      try {
        const manager = new DoDManager();
        const completed = !options.notCompleted;
        
        const result = await manager.markTaskDoDItem(taskId, itemId, completed);
        
        if (result.success) {
          const status = completed ? 'completed' : 'not completed';
          console.log(chalk.green(`✅ Marked DoD item as ${status} for task ${taskId}`));
          console.log(`  • ${chalk.yellow(result.data.description || itemId)}`);
        } else {
          console.error(chalk.red(`❌ ${result.error?.message || 'Unknown error'}`));
        }
      } catch (error) {
        console.error(chalk.red('Error marking DoD item:'), error instanceof Error ? error.message : error);
      }
    });

  // Enhance help with examples
  helpFormatter.enhanceHelp(dodCommand, {
    description: 'Manage Definition of Done (DoD) requirements for tasks and projects. DoD helps maintain quality standards and ensures tasks are truly completed before being marked as done.',
    examples: [
      {
        command: 'tm dod init',
        description: 'Create default DoD template file in .taskmaster/dod.json'
      },
      {
        command: 'tm dod list',
        description: 'List all project-level DoD requirements'
      },
      {
        command: 'tm dod list --tag feature',
        description: 'List DoD requirements for a specific tag'
      },
      {
        command: 'tm dod list --task 42',
        description: 'List DoD requirements for task #42'
      },
      {
        command: 'tm dod add "Update documentation" --task 42',
        description: 'Add a DoD item to task #42'
      },
      {
        command: 'tm dod add "Security checks completed" --tag security',
        description: 'Add a DoD item for all tasks with the "security" tag'
      },
      {
        command: 'tm dod remove "Update documentation" --task 42',
        description: 'Remove a DoD item from task #42'
      },
      {
        command: 'tm dod toggle 42',
        description: 'Toggle DoD on/off for task #42'
      },
      {
        command: 'tm dod check 42',
        description: 'Check DoD completion status for task #42'
      },
      {
        command: 'tm dod mark 42 "Unit tests added" --completed',
        description: 'Mark a DoD item as completed for task #42'
      }
    ],
    notes: [
      'DoD requirements are stored at project level in .taskmaster/dod.json',
      'Task-specific DoD items are stored in the task metadata',
      'You can disable DoD for specific tasks with the toggle command',
      'DoD is purely informational and serves as a reference checklist',
      'DoD items can be checked off but do not block task completion'
    ]
  });

  return dodCommand;
}

export default createDoDCommand;