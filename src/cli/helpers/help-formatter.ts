/**
 * Enhanced Help Formatter
 * Provides comprehensive and consistent formatting for command help messages
 * with examples, notes, flag documentation, and more.
 */

import { Command, Option } from 'commander';
import chalk from 'chalk';

/**
 * Interface for command example
 */
export interface CommandExample {
  command: string;
  description: string;
  output?: string;
}

/**
 * Interface for flag documentation
 */
export interface FlagDoc {
  flag: string;
  description: string;
  default?: string;
  required?: boolean;
  choices?: string[];
}

/**
 * Configuration options for enhanced help
 */
export interface EnhancedHelpOptions {
  usage?: string;
  description: string;
  arguments?: { 
    name: string; 
    description: string; 
    optional?: boolean; 
    defaultValue?: string 
  }[];
  flags?: FlagDoc[];
  examples?: CommandExample[];
  notes?: string[];
  seeAlso?: string[];
  footer?: string;
}

/**
 * Format text for command help output with improved organization and style
 */
class HelpFormatter {
  /**
   * Width for text wrapping
   */
  private textWidth: number = 100;

  /**
   * Add enhanced help to a command
   * @param command Commander.js command to enhance
   * @param options Help options including examples, flags, and notes
   */
  public enhanceHelp(command: Command, options: EnhancedHelpOptions): Command {
    const description = options.description || command.description();

    // Set a more detailed description
    if (description) {
      command.description(this.wrapText(description, this.textWidth));
    }

    // Store enhanced help content for later use
    const helpData = {
      usage: options.usage || null,
      examples: options.examples || [],
      flags: options.flags || [],
      notes: options.notes || [],
      seeAlso: options.seeAlso || [],
      footer: options.footer || null
    };

    // Add our data to the command object for reference
    (command as any).enhancedHelpData = helpData;

    // Add a hook that will be triggered when --help is used
    command.on('--help', () => {
      // Add custom usage if provided
      if (helpData.usage) {
        console.log(chalk.yellow.bold('\nUsage:'));
        console.log(`  ${chalk.cyan(helpData.usage)}`);
      }

      // Document flags with more detail if provided
      if (helpData.flags && helpData.flags.length > 0) {
        console.log(chalk.yellow.bold('\nFlags:'));
        helpData.flags.forEach(flag => {
          let flagText = `  ${chalk.green(flag.flag)}`;
          
          if (flag.required) {
            flagText += chalk.red((' (Required)' as string));
          }
          
          if (flag.choices) {
            flagText += chalk.blue(` [${flag.choices.join('|')}]`);
          }
          
          if (flag.default !== undefined) {
            flagText += chalk.dim(` (Default: ${flag.default})`);
          }
          
          console.log(flagText);
          console.log(`    ${this.wrapText(flag.description, this.textWidth - 4)}`);
        });
      } else {
        // Auto-document command options if no explicit flags provided
        this.documentCommandOptions(command);
      }

      // Add examples with rich formatting
      if (helpData.examples && helpData.examples.length > 0) {
        console.log(chalk.yellow.bold('\nExamples:'));
        helpData.examples.forEach(example => {
          console.log(`  ${chalk.green(('>' as string))} ${chalk.cyan(example.command)}`);
          console.log(`    ${this.wrapText(example.description, this.textWidth - 4)}`);
          
          // If example output is provided, show it
          if (example.output) {
            console.log(chalk.dim('    Output:'));
            const outputLines = example.output.split('\n');
            outputLines.forEach(line => {
              console.log(chalk.dim(`      ${line}`));
            });
          }
        });
      }

      // Add notes with better formatting
      if (helpData.notes && helpData.notes.length > 0) {
        console.log(chalk.yellow.bold('\nNotes:'));
        helpData.notes.forEach(note => {
          console.log(`  ${chalk.dim('•')} ${this.wrapText(note, this.textWidth - 4)}`);
        });
      }

      // Improve see also section
      if (helpData.seeAlso && helpData.seeAlso.length > 0) {
        console.log(chalk.yellow.bold('\nSee Also:'));
        const formattedCommands = helpData.seeAlso.map(cmd => chalk.cyan(cmd));
        // Format in multiple columns if many commands
        if (formattedCommands.length > 5) {
          const columns = Math.min(3, Math.ceil(formattedCommands.length / 5));
          const rows = Math.ceil(formattedCommands.length / columns);
          
          for (let i = 0; i < rows; i++) {
            const rowItems = [];
            for (let j = 0; j < columns; j++) {
              const index = j * rows + i;
              if (index < formattedCommands.length) {
                rowItems.push(formattedCommands[index].padEnd(20));
              }
            }
            console.log(`  ${rowItems.join(' ')}`);
          }
        } else {
          console.log(`  ${formattedCommands.join(', ')}`);
        }
      }

      // Add footer if provided
      if (helpData.footer) {
        console.log(chalk.dim('\n' + helpData.footer));
      }
    });

    return command;
  }
  
  /**
   * Automatically document command options from Command instance
   * @param command Commander.js command to document
   */
  private documentCommandOptions(command: Command): void {
    const options = command.options;
    
    if (options.length > 0) {
      console.log(chalk.yellow.bold('\nOptions:'));
      
      options.forEach((option: Option) => {
        let flagLine = `  ${chalk.green(option.flags)}`;
        
        // Add default value if available
        if (option.defaultValue !== undefined) {
          flagLine += chalk.dim(` (Default: ${option.defaultValue})`);
        }
        
        // Add required indicator
        if (option.required) {
          flagLine += chalk.red((' (Required)' as string));
        }
        
        // Add choices if available
        if ((option as any).choices && Array.isArray((option as any).choices)) {
          flagLine += chalk.blue(` [${(option as any).choices.join('|')}]`);
        }
        
        console.log(flagLine);
        console.log(`    ${this.wrapText(option.description || '', this.textWidth - 4)}`);
      });
    }
  }
  
  /**
   * Wrap a long text string to a specified width
   * @param text Text to wrap
   * @param width Maximum line width (default: 80)
   * @returns Wrapped text
   */
  public wrapText(text: string, width: number = 80): string {
    if (!text) return '';
    
    const words = text.split(' ');
    let result = '';
    let line = '';
    
    for (const word of words) {
      if (line.length + word.length + 1 <= width) {
        line += (line ? ' ' : '') + word;
      } else {
        result += (result ? '\n' : '') + line;
        line = word;
      }
    }
    
    if (line) {
      result += (result ? '\n' : '') + line;
    }
    
    return result;
  }
  
  /**
   * Generate markdown documentation for a command
   * @param command Commander.js command to document
   * @returns Markdown documentation string
   */
  public generateMarkdownDocs(command: Command): string {
    const enhancedData = (command as any).enhancedHelpData || {};
    const subcommands = command.commands;
    
    let md = `# ${command.name() || 'Command'}\n\n`;
    
    // Add description
    if (command.description()) {
      md += `${command.description()}\n\n`;
    }
    
    // Add usage
    if (enhancedData.usage) {
      md += `## Usage\n\n\`\`\`\n${enhancedData.usage}\n\`\`\`\n\n`;
    } else {
      md += `## Usage\n\n\`\`\`\n${command.name()} [options]\n\`\`\`\n\n`;
    }
    
    // Add options
    if (command.options.length > 0 || (enhancedData.flags && enhancedData.flags.length > 0)) {
      md += '## Options\n\n';
      
      // Use enhanced flags if available, otherwise use command options
      if (enhancedData.flags && enhancedData.flags.length > 0) {
        enhancedData.flags.forEach((flag: FlagDoc) => {
          md += `### \`${flag.flag}\`\n\n`;
          md += `${flag.description}\n\n`;
          
          if (flag.default !== undefined) {
            md += `- Default: \`${flag.default}\`\n`;
          }
          
          if (flag.required) {
            md += '- Required: Yes\n';
          }
          
          if (flag.choices) {
            md += `- Choices: ${flag.choices.map(c => `\`${c}\``).join(', ')}\n`;
          }
          
          md += '\n';
        });
      } else {
        command.options.forEach((option: Option) => {
          md += `### \`${option.flags}\`\n\n`;
          md += `${option.description || ''}\n\n`;
          
          if (option.defaultValue !== undefined) {
            md += `- Default: \`${option.defaultValue}\`\n`;
          }
          
          if (option.required) {
            md += '- Required: Yes\n';
          }
          
          if ((option as any).choices) {
            md += `- Choices: ${(option as any).choices.map((c: string) => `\`${c}\``).join(', ')}\n`;
          }
          
          md += '\n';
        });
      }
    }
    
    // Add examples
    if (enhancedData.examples && enhancedData.examples.length > 0) {
      md += '## Examples\n\n';
      
      enhancedData.examples.forEach((example: CommandExample) => {
        md += `### ${example.description}\n\n`;
        md += `\`\`\`\n${example.command}\n\`\`\`\n\n`;
        
        if (example.output) {
          md += `Output:\n\n\`\`\`\n${example.output}\n\`\`\`\n\n`;
        }
      });
    }
    
    // Add notes
    if (enhancedData.notes && enhancedData.notes.length > 0) {
      md += '## Notes\n\n';
      
      enhancedData.notes.forEach((note: string) => {
        md += `- ${note}\n`;
      });
      
      md += '\n';
    }
    
    // Add see also
    if (enhancedData.seeAlso && enhancedData.seeAlso.length > 0) {
      md += '## See Also\n\n';
      
      enhancedData.seeAlso.forEach((cmd: string) => {
        md += `- \`${cmd}\`\n`;
      });
      
      md += '\n';
    }
    
    // Add subcommands
    if (subcommands && subcommands.length > 0) {
      md += '## Subcommands\n\n';
      
      subcommands.forEach((subcmd: Command) => {
        md += `### \`${subcmd.name()}\`\n\n`;
        md += `${subcmd.description() || ''}\n\n`;
        md += `Run \`${command.name()} ${subcmd.name()} --help\` for more information.\n\n`;
      });
    }
    
    return md;
  }
}

// Export as singleton
export const helpFormatter = new HelpFormatter();