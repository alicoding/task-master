import { ChalkColor, asChalkColor, ChalkStyle } from '@/cli/utils/chalk-utils';
import { createColorize } from '@/cli/utils/chalk-utils';
/**
 * Interactive form for task creation
 * Provides a rich form-like UI for creating tasks
 */
import readline from 'readline';
import { TaskInsertOptions, TaskStatus, TaskReadiness } from '../../../core/types';
export class InteractiveTaskForm {
    private readline: readline.Interface;
    private taskOptions: Partial<TaskInsertOptions> = {};
    protected colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
    constructor(useColors: boolean = true) {
        this.colorize = createColorize(useColors);
        this.readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    /**
     * Display welcome banner
     */
    displayBanner(): void {
        console.clear();
        console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue'))))));
        console.log(this.colorize('📋 TASK MASTER - Interactive Task Creation', asChalkColor((asChalkColor(('blue')))), 'bold'));
        console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue'))))));
        console.log('');
        console.log(this.colorize('Fill out the form below to create a new task.', asChalkColor((asChalkColor(('yellow'))))));
        console.log(this.colorize('Required fields are marked with *', asChalkColor((asChalkColor(('red'))))));
        console.log('');
    }
    /**
     * Ask a question and get user input
     */
    private async askQuestion(question: string, required: boolean = false): Promise<string> {
        const marker = required ? this.colorize('*', asChalkColor((asChalkColor(('red')))), 'bold') + ' ' : '  ';
        return new Promise<string>((resolve) => {
            this.readline.question(`${marker}${question}: `, (answer) => {
                if (required && !answer.trim()) {
                    console.log(this.colorize('  This field is required.', asChalkColor((asChalkColor(('red'))))));
                    resolve(this.askQuestion(question, required));
                }
                else {
                    resolve(answer);
                }
            });
        });
    }
    /**
     * Ask a multiple choice question
     */
    private async askMultipleChoice<T extends string>(question: string, choices: T[], defaultChoice?: T, required: boolean = false): Promise<T | undefined> {
        const marker = required ? this.colorize('*', asChalkColor((asChalkColor(('red')))), 'bold') + ' ' : '  ';
        const choiceStr = choices.map((choice, i) => {
            const isDefault = choice === defaultChoice;
            const choiceText = isDefault ? this.colorize(`${choice} (default)`, asChalkColor((asChalkColor(('green'))))) : choice;
            return `${i + 1}. ${choiceText}`;
        }).join('  ');
        return new Promise<T | undefined>((resolve) => {
            this.readline.question(`${marker}${question} [${choiceStr}]: `, (answer) => {
                if (!answer.trim()) {
                    resolve(defaultChoice);
                }
                else {
                    const num = parseInt(answer, 10);
                    if (!isNaN(num) && num >= 1 && num <= choices.length) {
                        resolve(choices[num - 1]);
                    }
                    else if (choices.includes(answer as T)) {
                        resolve(answer as T);
                    }
                    else {
                        console.log(this.colorize('  Invalid choice. Please try again.', asChalkColor((asChalkColor(('red'))))));
                        resolve(this.askMultipleChoice(question, choices, defaultChoice, required));
                    }
                }
            });
        });
    }
    /**
     * Ask for tags (multiple values)
     */
    private async askTags(question: string): Promise<string[]> {
        const answer = await this.askQuestion(question);
        if (!answer.trim())
            return [];
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
    async run(): Promise<TaskInsertOptions | null> {
        try {
            this.displayBanner();
            // Get required title
            const title = await this.askQuestion('Enter task title', true);
            this.taskOptions.title = title;
            // Get optional description
            const description = await this.askQuestion('Enter short description');
            if (description)
                this.taskOptions.description = description;
            // Get optional detailed body
            const body = await this.askQuestion('Enter detailed body/content (use \\n for new lines)');
            if (body)
                this.taskOptions.body = body.replace(/\\n/g, '\n');
            // Get status
            const status = await this.askMultipleChoice<TaskStatus>('Select status', ['todo', 'in-progress', 'done'], 'todo');
            this.taskOptions.status = status;
            // Get readiness
            const readiness = await this.askMultipleChoice<TaskReadiness>('Select readiness', ['draft', 'ready', 'blocked'], 'draft');
            this.taskOptions.readiness = readiness;
            // Get tags
            const tags = await this.askTags('Enter tags (comma or space separated)');
            if (tags.length > 0)
                this.taskOptions.tags = tags;
            // Get parent task relationship
            const childOf = await this.askQuestion('Child of task ID (optional)');
            if (childOf)
                this.taskOptions.childOf = childOf;
            // Get after task relationship
            const after = await this.askQuestion('After task ID (optional)');
            if (after)
                this.taskOptions.after = after;
            // Get optional metadata as JSON
            const metadataStr = await this.askQuestion('Enter metadata as JSON (optional)');
            if (metadataStr) {
                try {
                    const metadata = JSON.parse(metadataStr);
                    this.taskOptions.metadata = metadata;
                }
                catch (e) {
                    console.log(this.colorize('  Invalid JSON. Metadata will be ignored.', asChalkColor((asChalkColor(('red'))))));
                }
            }
            // Confirm submission
            console.log('');
            console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue'))))));
            console.log(this.colorize('Task Summary:', asChalkColor((asChalkColor(('blue')))), 'bold'));
            console.log(this.colorize('─'.repeat(60), asChalkColor((asChalkColor(('blue'))))));
            console.log(this.colorize('Title: ', asChalkColor((asChalkColor(('yellow'))))) + title);
            if (description)
                console.log(this.colorize('Description: ', asChalkColor((asChalkColor(('yellow'))))) + description);
            if (body) {
                console.log(this.colorize('Body: ', asChalkColor((asChalkColor(('yellow'))))));
                console.log(body.replace(/\\n/g, '\n'));
            }
            console.log(this.colorize('Status: ', asChalkColor((asChalkColor(('yellow'))))) + status);
            console.log(this.colorize('Readiness: ', asChalkColor((asChalkColor(('yellow'))))) + readiness);
            if (tags.length > 0)
                console.log(this.colorize('Tags: ', asChalkColor((asChalkColor(('yellow'))))) + tags.join(', '));
            if (childOf)
                console.log(this.colorize('Child of: ', asChalkColor((asChalkColor(('yellow'))))) + childOf);
            if (after)
                console.log(this.colorize('After: ', asChalkColor((asChalkColor(('yellow'))))) + after);
            console.log('');
            const confirm = await this.askQuestion('Create this task? (y/n)');
            if (confirm.toLowerCase() !== 'y') {
                console.log(this.colorize('Task creation cancelled.', asChalkColor((asChalkColor(('yellow'))))));
                return null;
            }
            return this.taskOptions as TaskInsertOptions;
        }
        catch (error) {
            console?.error('Error in interactive form:', error);
            return null;
        }
        finally {
            this.close();
        }
    }
}
