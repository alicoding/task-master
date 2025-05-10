#!/usr/bin/env node

/**
 * Command Documentation Generator for Task Master
 * 
 * Automatically generates markdown documentation for all CLI commands
 * using the helpFormatter's generateMarkdownDocs functionality.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Target documentation directory
const COMMAND_DOCS_DIR = path.join(rootDir, 'docs', 'commands');

/**
 * Main function
 */
async function main() {
  console.log('Generating command documentation...');
  
  // Create directory if it doesn't exist
  await fs.mkdir(COMMAND_DOCS_DIR, { recursive: true });
  
  // Get all command names
  const commands = await getCommandNames();
  console.log(`Found ${commands.length} commands to document`);
  
  // Create a simple command reference
  await generateCommandReference(commands);
  
  console.log('Command documentation generated successfully!');
}

/**
 * Get list of command names
 */
async function getCommandNames() {
  try {
    // List files in commands directory
    const cmdDirs = await fs.readdir(path.join(rootDir, 'cli', 'commands'), { withFileTypes: true });
    return cmdDirs
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    console.error('Error reading command directories:', error);
    return [];
  }
}

/**
 * Generate a simple command reference document
 */
async function generateCommandReference(commands) {
  // Create a simple command reference document
  let reference = '# Task Master CLI Command Reference\n\n';
  reference += 'This reference provides documentation for all available commands in the Task Master CLI.\n\n';
  reference += '## Available Commands\n\n';
  
  for (const cmd of commands) {
    // Read the command file to extract description
    try {
      const cmdFilePath = path.join(rootDir, 'cli', 'commands', cmd, 'index.ts');
      const content = await fs.readFile(cmdFilePath, 'utf8');
      
      // Extract description from .description() call
      const descMatch = content.match(/\.description\(['"](.*?)['"][)]/);
      const description = descMatch ? descMatch[1] : 'No description available';
      
      reference += `### ${cmd}\n\n`;
      reference += `${description}\n\n`;
      
      // Extract options
      const optionMatches = [...content.matchAll(/\.option\(['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"][)]/g)];
      
      if (optionMatches.length > 0) {
        reference += '#### Options\n\n';
        
        for (const match of optionMatches) {
          const option = match[1];
          const optDesc = match[2];
          reference += `- \`${option}\`: ${optDesc}\n`;
        }
        
        reference += '\n';
      }
      
      // Check if there are subcommands
      const subCmdDir = path.join(rootDir, 'cli', 'commands', cmd, 'commands');
      try {
        const subCmdStat = await fs.stat(subCmdDir);
        
        if (subCmdStat.isDirectory()) {
          const subCmdFiles = await fs.readdir(subCmdDir);
          
          if (subCmdFiles.length > 0) {
            reference += '#### Subcommands\n\n';
            
            for (const subCmdFile of subCmdFiles) {
              if (subCmdFile.endsWith('.ts') || subCmdFile.endsWith('.js')) {
                const subCmd = subCmdFile.replace(/\.(ts|js)$/, '');
                const subCmdContent = await fs.readFile(path.join(subCmdDir, subCmdFile), 'utf8');
                
                const subDescMatch = subCmdContent.match(/\.description\(['"](.*?)['"][)]/);
                const subDesc = subDescMatch ? subDescMatch[1] : 'No description available';
                
                reference += `- **${subCmd}**: ${subDesc}\n`;
              }
            }
            
            reference += '\n';
          }
        }
      } catch (error) {
        // No subcommands directory or can't read it, that's okay
      }
      
      reference += '---\n\n';
    } catch (error) {
      console.error(`Error processing command ${cmd}:`, error);
      reference += `### ${cmd}\n\nNo description available\n\n---\n\n`;
    }
  }
  
  // Add usage instructions
  reference += '## Usage Examples\n\n';
  reference += 'Here are some common usage examples for Task Master CLI:\n\n';
  reference += '```bash\n';
  reference += '# Create a new task\n';
  reference += 'tm add --title "Implement login form"\n\n';
  reference += '# List all tasks\n';
  reference += 'tm show\n\n';
  reference += '# Show task hierarchy as a tree\n';
  reference += 'tm show graph\n\n';
  reference += '# Show the next task to work on\n';
  reference += 'tm next\n\n';
  reference += '# Search for tasks matching specific text\n';
  reference += 'tm search --query "user interface"\n\n';
  reference += '# Mark a task as completed\n';
  reference += 'tm update --id 5 --status done\n\n';
  reference += '# Find and merge duplicate tasks\n';
  reference += 'tm deduplicate\n';
  reference += '```\n\n';
  reference += '> Note: All commands support detailed help with `--help` flag, e.g., `tm add --help`\n';
  
  // Write the reference file
  await fs.writeFile(path.join(COMMAND_DOCS_DIR, 'README.md'), reference);
  console.log('Generated command reference: docs/commands/README.md');
}

// Run the main function
main().catch(error => {
  console.error('Error generating command documentation:', error);
  process.exit(1);
});