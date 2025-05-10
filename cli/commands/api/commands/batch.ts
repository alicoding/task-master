import { Command } from 'commander';
import fs from 'fs/promises';
import { helpFormatter } from '../../../helpers/help-formatter.js';
import { ApiService } from '../../../../core/api/service.js';

/**
 * Create the batch command
 * Executes multiple task operations in a single batch
 */
export function createBatchCommand() {
  const batchCommand = new Command('batch')
    .description('Execute batch operations for external tool integration')
    .requiredOption('--input <file>', 'JSON file with batch operations')
    .option('--dry-run', 'Show what would happen without making changes');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(batchCommand, {
    description: 'Execute multiple task operations in a single request. This powerful command allows you to combine add, update, delete, get, and search operations in one batch file for efficient processing.',
    examples: [
      {
        command: 'tm api batch --input operations.json',
        description: 'Execute multiple operations from a JSON file'
      },
      {
        command: 'tm api batch --input batch-file.json --dry-run',
        description: 'Preview batch operations without executing them'
      }
    ],
    notes: [
      'The input file must contain an operations array with typed operations',
      'Expected format: { "operations": [ {...op1}, {...op2} ] }',
      'Each operation requires:',
      '  - type: The operation type (add, update, delete, get, search)',
      '  - data: The data for the operation',
      'Supported operation types:',
      '  - add: Create a new task',
      '  - update: Modify an existing task',
      '  - delete: Remove a task',
      '  - get: Retrieve a specific task',
      '  - search: Find tasks matching criteria',
      'The command provides detailed results including success, failure, and error information',
      'Use --dry-run to preview operations without making changes'
    ],
    seeAlso: ['api export', 'api import']
  });

  return batchCommand
    .action(async (options) => {
      try {
        // Use the shared API service
        const apiService = new ApiService('./db/taskmaster.db', false, true);
        
        // Read and parse the input file
        const fileContent = await fs.readFile(options.input, 'utf-8');
        const batchData = JSON.parse(fileContent);
        
        if (!batchData.operations || !Array.isArray(batchData.operations)) {
          console.error('Invalid batch file format. Expected an "operations" array.');
          apiService.close();
          return;
        }
        
        // Execute batch operations using the API service
        const results = await apiService.executeBatch(batchData, options.dryRun);
        
        // Output results
        console.log(JSON.stringify(results, null, 2));
        
        apiService.close();
      } catch (error) {
        console.error('Error processing batch operations:', error);
        process.exit(1);
      }
    });
}