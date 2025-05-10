// Helper functions for command testing
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export const execPromise = promisify(exec);

// Capture console output for testing
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let consoleOutput: string[] = [];

export function captureConsoleOutput() {
  consoleOutput = [];
  console.log = (...args) => {
    const output = args.join(' ');
    consoleOutput.push(output);
    originalConsoleLog('DEBUG LOG:', output); // Show in test output
  };
  console.error = (...args) => {
    const output = args.join(' ');
    consoleOutput.push(output);
    originalConsoleError('DEBUG ERROR:', output); // Show in test output
  };
}

export function restoreConsole() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}

export function getConsoleOutput() {
  originalConsoleLog('DEBUG ALL OUTPUT:', consoleOutput);
  return consoleOutput;
}

// Mock command parent object for CLI testing
export function createCommandParent(format = 'text') {
  return {
    opts: () => ({
      format
    })
  };
}

// Create temporary test directory
export const tempDir = './test/temp';

export async function setupTestTempDir() {
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error("Error creating temp directory:", error);
  }
}

export async function cleanupTestTempDir() {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error("Error cleaning up temp directory:", error);
  }
}

// Helper to create files for API command testing
export async function createTestApiFiles() {
  console.error('Creating test files in directory:', tempDir);

  // Make sure the directory exists
  try {
    await fs.mkdir(tempDir, { recursive: true });
    console.error('Directory created or exists');
  } catch (e) {
    console.error('Error creating directory:', e);
  }

  const inputFilePath = path.join(tempDir, 'api-test-input.json');
  const batchFilePath = path.join(tempDir, 'api-test-batch.json');
  const outputFilePath = path.join(tempDir, 'api-test-output.json');

  console.error('Input path:', inputFilePath);
  console.error('Batch path:', batchFilePath);
  console.error('Output path:', outputFilePath);

  // Create import data file
  const importData = {
    tasks: [
      {
        title: "Imported Test Task 1",
        status: "todo",
        tags: ["api", "test"],
        metadata: { source: "api-test" }
      },
      {
        title: "Imported Test Task 2",
        status: "in-progress",
        tags: ["api", "important"],
        metadata: { priority: "high" }
      }
    ]
  };

  try {
    await fs.writeFile(inputFilePath, JSON.stringify(importData, null, 2));
    console.error('Input file created');
  } catch (e) {
    console.error('Error writing input file:', e);
  }

  // Create batch operations file
  const batchData = {
    operations: [
      {
        type: "add",
        data: {
          title: "Batch Add Task",
          tags: ["batch", "test"],
          status: "todo"
        }
      },
      {
        type: "search",
        data: {
          tags: ["batch"]
        }
      }
    ]
  };

  try {
    await fs.writeFile(batchFilePath, JSON.stringify(batchData, null, 2));
    console.error('Batch file created');
  } catch (e) {
    console.error('Error writing batch file:', e);
  }

  // Create an empty output file
  try {
    await fs.writeFile(outputFilePath, '');
    console.error('Output file created');
  } catch (e) {
    console.error('Error creating output file:', e);
  }

  return {
    inputFilePath,
    batchFilePath,
    outputFilePath
  };
}