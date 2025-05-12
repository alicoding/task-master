import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileChangeAnalyzer } from '../../core/daemon/file-change-analyzer.ts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { FileChangeEvent } from '../../core/daemon/file-tracking-daemon.ts';

describe('FileChangeAnalyzer', () => {
  let analyzer: FileChangeAnalyzer;
  let tempDir: string;
  let tempFilePath: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-change-analyzer-test-'));
    tempFilePath = path.join(tempDir, 'test-file.ts');
    
    // Create analyzer instance with test configuration
    analyzer = new FileChangeAnalyzer({
      fileExtensions: ['.ts', '.js', '.md'],
      excludePatterns: ['node_modules', 'excluded'],
      calculateComplexity: true,
      trackStructuralChanges: true,
      computeDiffStats: true,
      maxFileSize: 1024 * 1024 // 1MB
    });
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should analyze TypeScript file and extract metadata', async () => {
    // Create a test TypeScript file with some content
    const fileContent = `
      /**
       * Sample function for testing
       */
      function testFunction(param1: string, param2: number): boolean {
        if (param1.length > 10) {
          return true;
        } else if (param2 > 100) {
          return param1 === "test";
        }
        return false;
      }

      class TestClass {
        private name: string;
        
        constructor(name: string) {
          this.name = name;
        }
        
        getName(): string {
          return this.name;
        }
        
        setName(name: string): void {
          this.name = name;
        }
      }
    `;
    
    await fs.writeFile(tempFilePath, fileContent);
    
    const event: FileChangeEvent = {
      type: 'created',
      path: tempFilePath,
      timestamp: new Date()
    };
    
    const result = await analyzer.analyzeFileChange(event);
    
    // Verify basic metadata
    expect(result).not.toBeNull();
    expect(result?.filePath).toBe(tempFilePath);
    expect(result?.fileType).toBe('source');
    expect(result?.language).toBe('TypeScript');
    
    // Verify complexity metrics
    expect(result?.complexityMetrics).toBeDefined();
    expect(result?.complexityMetrics?.linesOfCode).toBeGreaterThan(0);
    expect(result?.complexityMetrics?.functionCount).toBe(3); // testFunction, constructor, getName, setName
    expect(result?.complexityMetrics?.classCount).toBe(1); // TestClass
    expect(result?.complexityMetrics?.cyclomaticComplexity).toBeGreaterThan(1); // Has if/else conditions
    
    // Verify keywords
    expect(result?.keywords).toContain('testFunction');
    expect(result?.keywords).toContain('TestClass');
  });

  it('should detect file changes when modifying a file', async () => {
    // Create initial file
    const initialContent = `
      function initialFunction() {
        return true;
      }
    `;
    
    await fs.writeFile(tempFilePath, initialContent);
    
    // First analysis
    await analyzer.analyzeFileChange({
      type: 'created',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Modify the file
    const modifiedContent = `
      function initialFunction() {
        console.log("Modified");
        return false;
      }
      
      function newFunction() {
        return "new";
      }
    `;
    
    await fs.writeFile(tempFilePath, modifiedContent);
    
    // Second analysis
    const result = await analyzer.analyzeFileChange({
      type: 'modified',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Verify diff stats
    expect(result).not.toBeNull();
    expect(result?.diffStats).toBeDefined();
    expect(result?.diffStats?.linesAdded).toBeGreaterThan(0);
    expect(result?.diffStats?.changePercentage).toBeGreaterThan(0);
    
    // Verify structural changes
    expect(result?.structuralChanges).toBeDefined();
    expect(result?.structuralChanges?.addedFunctions).toContain('newFunction');
    expect(result?.structuralChanges?.modifiedFunctions).toContain('initialFunction');
  });

  it('should respect exclusion patterns', async () => {
    // Create a file in an excluded directory
    const excludedDir = path.join(tempDir, 'excluded');
    await fs.mkdir(excludedDir);
    
    const excludedFilePath = path.join(excludedDir, 'excluded-file.ts');
    await fs.writeFile(excludedFilePath, 'function test() {}');
    
    // Analyze the excluded file
    const result = await analyzer.analyzeFileChange({
      type: 'created',
      path: excludedFilePath,
      timestamp: new Date()
    });
    
    // Should be skipped due to exclusion pattern
    expect(result).toBeNull();
  });

  it('should detect and analyze class changes', async () => {
    // Create initial file with a class
    const initialContent = `
      class TestClass {
        constructor() {}
        
        method1() {
          return 1;
        }
      }
    `;
    
    await fs.writeFile(tempFilePath, initialContent);
    
    // First analysis
    await analyzer.analyzeFileChange({
      type: 'created',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Modify the class
    const modifiedContent = `
      class TestClass {
        constructor() {}
        
        method1() {
          return 2; // Changed return value
        }
        
        method2() {
          return "new method";
        }
      }
      
      class AnotherClass {
        constructor() {}
      }
    `;
    
    await fs.writeFile(tempFilePath, modifiedContent);
    
    // Second analysis
    const result = await analyzer.analyzeFileChange({
      type: 'modified',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Verify structural changes for classes
    expect(result).not.toBeNull();
    expect(result?.structuralChanges).toBeDefined();
    expect(result?.structuralChanges?.addedClasses).toContain('AnotherClass');
    expect(result?.structuralChanges?.modifiedClasses).toContain('TestClass');
  });

  it('should extract meaningful keywords from content', async () => {
    // Create a file with domain-specific terms
    const content = `
      /**
       * UserAuthentication module handles login and registration
       */
      function validateCredentials(username, password) {
        // Check if username exists in database
        const userExists = checkUserInDatabase(username);
        
        // Verify password hash
        return userExists && verifyPasswordHash(password);
      }
      
      function registerNewUser(userData) {
        // Create user account with provided data
        const userId = createUserAccount(userData);
        
        // Send welcome email to user
        sendWelcomeEmail(userId);
        
        return userId;
      }
    `;
    
    await fs.writeFile(tempFilePath, content);
    
    // Analyze the file
    const result = await analyzer.analyzeFileChange({
      type: 'created',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Verify extracted keywords include domain terms
    expect(result).not.toBeNull();
    expect(result?.keywords).toContain('validateCredentials');
    expect(result?.keywords).toContain('username');
    expect(result?.keywords).toContain('password');
    expect(result?.keywords).toContain('registerNewUser');
    expect(result?.keywords).toContain('userData');
  });

  it('should handle deleted files properly', async () => {
    // Create a file first
    await fs.writeFile(tempFilePath, 'function test() {}');
    
    // Analyze creation
    await analyzer.analyzeFileChange({
      type: 'created',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Now delete it
    await fs.unlink(tempFilePath);
    
    // Analyze deletion
    const result = await analyzer.analyzeFileChange({
      type: 'deleted',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Should return null for deleted files
    expect(result).toBeNull();
  });

  it('should analyze multiple files in batch', async () => {
    // Create multiple files
    const file1Path = path.join(tempDir, 'file1.ts');
    const file2Path = path.join(tempDir, 'file2.ts');
    
    await fs.writeFile(file1Path, 'function file1() {}');
    await fs.writeFile(file2Path, 'function file2() {}');
    
    // Analyze batch
    const results = await analyzer.analyzeMultipleChanges([
      {
        type: 'created',
        path: file1Path,
        timestamp: new Date()
      },
      {
        type: 'created',
        path: file2Path,
        timestamp: new Date()
      }
    ]);
    
    // Should have results for both files
    expect(results).toHaveLength(2);
    expect(results[0]).not.toBeNull();
    expect(results[1]).not.toBeNull();
    expect(results[0]?.filePath).toBe(file1Path);
    expect(results[1]?.filePath).toBe(file2Path);
  });

  it('should properly calculate complexity metrics', async () => {
    // Create a file with varied complexity
    const complexContent = `
      // Simple function with no branches
      function simple() {
        return true;
      }
      
      // Complex function with multiple branches
      function complex(a, b, c) {
        if (a > b) {
          if (b > c) {
            return a;
          } else {
            return b;
          }
        } else if (a < c) {
          for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
              continue;
            }
            console.log(i);
          }
          return c;
        } else {
          switch (a) {
            case 1:
              return 'one';
            case 2:
              return 'two';
            default:
              return 'unknown';
          }
        }
      }
    `;
    
    await fs.writeFile(tempFilePath, complexContent);
    
    // Analyze the file
    const result = await analyzer.analyzeFileChange({
      type: 'created',
      path: tempFilePath,
      timestamp: new Date()
    });
    
    // Verify complexity metrics
    expect(result).not.toBeNull();
    expect(result?.complexityMetrics).toBeDefined();
    expect(result?.complexityMetrics?.functionCount).toBe(2); // simple, complex
    expect(result?.complexityMetrics?.cyclomaticComplexity).toBeGreaterThan(5); // Many branches
    
    // Simple function should have lower complexity than complex function
    const simpleContent = `function simple() { return true; }`;
    const simplePath = path.join(tempDir, 'simple.ts');
    await fs.writeFile(simplePath, simpleContent);
    
    const simpleResult = await analyzer.analyzeFileChange({
      type: 'created',
      path: simplePath,
      timestamp: new Date()
    });
    
    expect(simpleResult?.complexityMetrics?.cyclomaticComplexity).toBeLessThan(
      result?.complexityMetrics?.cyclomaticComplexity
    );
  });
});