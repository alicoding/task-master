/**
 * Interactive form for task updating
 * Provides a rich form-like UI for updating tasks
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import readline from 'readline';
import chalk from 'chalk';
import { TaskUpdateOptions, TaskStatus, TaskReadiness, Task } from '@/core/types';
import { TaskRepository } from '../../../core/repo';


export class InteractiveUpdateForm {
  private readline: readline.Interface;
  private task: Task;
  private updateOptions: TaskUpdateOptions;
  private useColors: boolean;
  private repo: TaskRepository;

  constructor(task: Task, repo: TaskRepository, useColors: boolean = true) {
    this.task = task;
    this.repo = repo;
    this.useColors = useColors;
    this.updateOptions = { id: task.id };
    
    this.readline = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Color helper function
   */
  colorize(text: string, color?: string, style?: string): string {
    if (!this.useColors) return text;
    
    let result = text;
    if (color && chalk[color]) {
      result = chalk[color](result);
    }
    if (style && chalk[style]) {
      result = chalk[style](result);
    }
    return result;
  }

  /**
   * Display welcome banner
   */
  displayBanner(): void {
    console.clear();
    console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    console.log(this.colorize(`📋 TASK MASTER - Update Task ${this.task.id}`, asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
    console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    console.log('');
    console.log(this.colorize('Update the fields below (leave empty to keep current value)', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    console.log('');
  }

  /**
   * Ask a question with default value
   */
  private async askQuestion(question: string, defaultValue?: string): Promise<string> {
    const displayDefault = defaultValue ? ` [${defaultValue}]` : '';
    
    return new Promise<string>((resolve) => {
      this.readline.question(`${question}${displayDefault}: `, (answer) => {
        // If answer is empty, use the default value
        resolve(answer.trim() || defaultValue || '');
      });
    });
  }

  /**
   * Ask a multiple choice question
   */
  private async askMultipleChoice<T extends string>(
    question: string, 
    choices: T[], 
    defaultChoice: T
  ): Promise<T> {
    const choiceStr = choices.map((choice, i) => {
      const isDefault = choice === defaultChoice;
      const choiceText = isDefault ? this.colorize(`${choice} (current)`, asChalkColor((asChalkColor(('green' as ChalkColor))))) : choice;
      return `${i + 1}. ${choiceText}`;
    }).join('  ');
    
    return new Promise<T>((resolve) => {
      this.readline.question(`${question} [${choiceStr}]: `, (answer) => {
        if (!answer.trim()) {
          resolve(defaultChoice);
        } else {
          const num = parseInt(answer, 10);
          if (!isNaN(num) && num >= 1 && num <= choices.length) {
            resolve(choices[num - 1]);
          } else if (choices.includes(answer as T)) {
            resolve(answer as T);
          } else {
            console.log(this.colorize('  Invalid choice. Using current value.', asChalkColor((asChalkColor(('red' as ChalkColor))))));
            resolve(defaultChoice);
          }
        }
      });
    });
  }

  /**
   * Ask for tags (multiple values)
   */
  private async askTags(question: string, currentTags: string[]): Promise<string[] | undefined> {
    const currentTagsStr = currentTags.length > 0 ? currentTags.join(', ') : 'none';
    const answer = await this.askQuestion(`${question} [${currentTagsStr}]`);
    
    if (!answer) return undefined; // Keep current tags
    
    // Split by commas or spaces and trim each tag
    return answer.split(/[,\s]+/).filter(Boolean).map(tag => tag.trim());
  }

  /**
   * Close the readline interface
   */
  close(): void {
    this.readline.close();
  }

  /**
   * Run the full form
   */
  async run(): Promise<TaskUpdateOptions | null> {
    try {
      this.displayBanner();
      
      // Display current task info before editing
      console.log(this.colorize('Current Task Information:', asChalkColor((asChalkColor(('cyan' as ChalkColor)))), asChalkColor('bold')));
      console.log(`${this.colorize('Title:', asChalkColor((asChalkColor(('gray' as ChalkColor)))))} ${this.task.title}`);
      if (this.task.description !== undefined && this.task.description !== null) {
        console.log(`${this.colorize('Description:', asChalkColor((asChalkColor(('gray' as ChalkColor)))))} ${this.task.description}`);
      }
      if (this.task.body !== undefined && this.task.body !== null) {
        console.log(`${this.colorize('Body:', asChalkColor((asChalkColor(('gray' as ChalkColor)))))} ${this.task.body.length > 60 ?
          this.task.body.substring(0, 60) + '...' : this.task.body}`);
      }
      console.log(`${this.colorize('Status:', asChalkColor((asChalkColor(('gray' as ChalkColor)))))} ${this.task.status}`);
      console.log(`${this.colorize('Readiness:', asChalkColor((asChalkColor(('gray' as ChalkColor)))))} ${this.task.readiness}`);
      console.log(`${this.colorize('Tags:', asChalkColor((asChalkColor(('gray' as ChalkColor)))))} ${this.task.tags?.join(', ') || 'none'}`);
      console.log(this.colorize('\nUpdate Fields (press Enter to keep current value):', asChalkColor((asChalkColor(('yellow' as ChalkColor)))), asChalkColor('bold')));
      console.log('');
      
      // Get new title (or keep current)
      const title = await this.askQuestion('Title', this.task.title);
      if (title !== this.task.title) this.updateOptions.title = title;
      
      // Get new description (or keep current) - handle case where field might not exist
      const currentDescription = (this.task.description !== undefined) ? this.task.description || '' : '';
      const description = await this.askQuestion('Description', currentDescription);
      if (description !== currentDescription) {
        this.updateOptions.description = description || null;
      }

      // Get new body (or keep current) - handle case where field might not exist
      let bodyPrompt = 'Body (use \\n for new lines)';
      const currentBody = (this.task.body !== undefined) ? this.task.body || '' : '';
      const body = await this.askQuestion(bodyPrompt, currentBody);
      if (body !== currentBody) {
        this.updateOptions.body = body ? body.replace(/\\n/g, '\n') : null;
      }
      
      // Get new status (or keep current)
      const status = await this.askMultipleChoice<TaskStatus>(
        'Status',
        ['todo', 'in-progress', 'done'],
        this.task.status as TaskStatus
      );
      if (status !== this.task.status) this.updateOptions.status = status;
      
      // Get new readiness (or keep current)
      const readiness = await this.askMultipleChoice<TaskReadiness>(
        'Readiness',
        ['draft', 'ready', 'blocked'],
        this.task.readiness as TaskReadiness
      );
      if (readiness !== this.task.readiness) this.updateOptions.readiness = readiness;
      
      // Get new tags (or keep current)
      const tags = await this.askTags('Tags (comma or space separated)', this.task.tags || []);
      if (tags) this.updateOptions.tags = tags;
      
      // Get optional metadata as JSON
      const currentMetadataStr = Object.keys(this.task.metadata || {}).length > 0 
        ? JSON.stringify(this.task.metadata) 
        : '{}';
      const metadataStr = await this.askQuestion(`Metadata as JSON`, currentMetadataStr);
      
      if (metadataStr && metadataStr !== currentMetadataStr) {
        try {
          this.updateOptions.metadata = JSON.parse(metadataStr);
        } catch (e) {
          console.log(this.colorize('  Invalid JSON. Metadata will not be updated.', asChalkColor((asChalkColor(('red' as ChalkColor))))));
        }
      }
      
      // Check if anything was changed
      const hasChanges = Object.keys(this.updateOptions).length > 1; // More than just ID
      
      if (!hasChanges) {
        console.log(this.colorize('\nNo changes were made to the task.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
        return null;
      }
      
      // Confirm submission
      console.log('');
      console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue' as ChalkColor))))));
      console.log(this.colorize('Task Update Summary:', asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
      console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue' as ChalkColor))))));
      
      // Show what will be updated
      Object.entries(this.updateOptions).forEach(([key, value]) => {
        if (key !== 'id') {
          console.log(`${this.colorize(key + ':', asChalkColor((asChalkColor(('yellow' as ChalkColor)))))} ${
            typeof value === 'object' ? JSON.stringify(value) : value
          }`);
        }
      });
      console.log('');
      
      const confirm = await this.askQuestion('Save these changes? (y/n)');
      if (confirm.toLowerCase() !== 'y') {
        console.log(this.colorize('Task update cancelled.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
        return null;
      }
      
      return this.updateOptions;
    } catch (error) {
      console?.error('Error in interactive form:', error);
      return null;
    } finally {
      this.close();
    }
  }
}