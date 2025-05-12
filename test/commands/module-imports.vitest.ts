/**
 * Module Import Tests
 * Tests to ensure modules can be imported correctly
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

describe('Module Import Validation', () => {
  // Test function to check if a module can be imported
  async function canImportModule(modulePath: string): Promise<boolean> {
    try {
      // Test if we can dynamically import the module
      await import(modulePath);
      return true;
    } catch (error) {
      console.error(`Error importing ${modulePath}:`, error);
      return false;
    }
  }

  // Test function to check export names in a module
  async function validateExports(modulePath: string, expectedExports: string[]): Promise<string[]> {
    const missingExports: string[] = [];
    
    try {
      const module = await import(modulePath);
      
      // Check each expected export
      for (const exportName of expectedExports) {
        if (!(exportName in module)) {
          missingExports.push(exportName);
        }
      }
    } catch (error) {
      console.error(`Error validating exports in ${modulePath}:`, error);
      missingExports.push(...expectedExports); // All exports considered missing if import fails
    }
    
    return missingExports;
  }

  // Get all command files
  function getCommandFiles(): string[] {
    const commandsDir = path.resolve(process.cwd(), 'cli/commands');
    const commandDirs = fs.readdirSync(commandsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    const commandFiles: string[] = [];
    
    // For each command directory, look for index.ts
    for (const dir of commandDirs) {
      const indexPath = path.join(commandsDir, dir, 'index.ts');
      if (fs.existsSync(indexPath)) {
        commandFiles.push(indexPath);
      }
    }
    
    return commandFiles;
  }

  it('should successfully import all command modules', async () => {
    const commandFiles = getCommandFiles();
    expect(commandFiles.length).toBeGreaterThan(0);
    
    // Check each command file
    for (const file of commandFiles) {
      const relativePath = path.relative(process.cwd(), file);
      const importPath = `../../${relativePath}`;
      
      const canImport = await canImportModule(importPath);
      expect(canImport).toBe(true);
    }
  });

  it('should import core terminal modules correctly', async () => {
    // Check terminal session manager
    const sessionManagerPath = '../../core/terminal/terminal-session-manager-index.ts';
    const canImportSessionManager = await canImportModule(sessionManagerPath);
    expect(canImportSessionManager).toBe(true);
    
    // Check terminal status indicator
    const statusIndicatorPath = '../../core/terminal/terminal-status-indicator.ts';
    const canImportStatusIndicator = await canImportModule(statusIndicatorPath);
    expect(canImportStatusIndicator).toBe(true);
  });

  it('should verify db/init.ts exports the expected functions', async () => {
    const dbInitPath = '../../db/init.ts';
    
    // Check if createDb is exported
    const missingExports = await validateExports(dbInitPath, ['createDb']);
    expect(missingExports).toEqual([]);
  });

  it('should verify terminal command exports the expected functions', async () => {
    const terminalCommandPath = '../../cli/commands/terminal/index.ts';
    
    // Check if createTerminalCommand is exported
    const missingExports = await validateExports(terminalCommandPath, ['createTerminalCommand']);
    expect(missingExports).toEqual([]);
  });
  
  it('should check test runner for import compatibility', async () => {
    // Make sure the test runner can import our modules
    const paths = [
      '../../db/init.ts',
      '../../core/terminal/terminal-session-manager-index.ts',
      '../../core/terminal/terminal-status-indicator.ts',
      '../../cli/commands/terminal/index.ts'
    ];
    
    for (const modulePath of paths) {
      const canImport = await canImportModule(modulePath);
      expect(canImport).toBe(true);
    }
  });
});