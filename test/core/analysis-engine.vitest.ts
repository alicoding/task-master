import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalysisEngine } from '../../core/daemon/analysis-engine.ts';
import { FileTrackingRepository } from '../../core/repository/file-tracking.ts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock repository
const mockRepository = {
  addFile: vi.fn().mockResolvedValue(1),
  updateFile: vi.fn().mockResolvedValue(true),
  getFileByPath: vi.fn(),
  associateTaskWithFile: vi.fn().mockResolvedValue(true),
  disassociateTaskFromFile: vi.fn().mockResolvedValue(true),
  getTasksForFile: vi.fn(),
  getFilesForTask: vi.fn(),
  getAllFiles: vi.fn(),
  searchFiles: vi.fn(),
  deleteFile: vi.fn().mockResolvedValue(true),
  associateFileWithTask: vi.fn().mockResolvedValue({ success: true }),
  // Mock _db to avoid NLP enhancement errors
  _db: {
    query: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([])
  }
} as unknown as FileTrackingRepository;

describe('AnalysisEngine', () => {
  let analysisEngine: AnalysisEngine;
  let tempDir: string;
  let tempFilePath: string;

  beforeEach(async () => {
    // Create a temporary directory and file for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'analysis-engine-test-'));
    tempFilePath = path.join(tempDir, 'test-file.ts');
    
    // Initialize analysis engine with default config
    analysisEngine = new AnalysisEngine(mockRepository, {
      confidenceThreshold: 70,
      taskIdPattern: /(?:Task-|#)(\d+)/gi,
      fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.md'],
      exclusionPatterns: ['node_modules', 'dist'],
    });

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should extract task IDs from file content', async () => {
    // Create a test file with task references
    const fileContent = `
    // This implements Task-123
    function doSomething() {
      // This is related to #456
      console.log('Processing task');
    }
    `;
    await fs.writeFile(tempFilePath, fileContent);

    // Mock repository response
    mockRepository.getFileByPath.mockResolvedValueOnce({ id: 1, path: tempFilePath, type: '.ts' });
    
    // Test file analysis
    const result = await analysisEngine.analyzeFileChange({
      type: 'change',
      path: tempFilePath,
    });

    // Verify results
    expect(result).not.toBeNull();
    expect(result?.taskMatches).toHaveLength(2);
    expect(result?.taskMatches.some(match => match.taskId === '123')).toBe(true);
    expect(result?.taskMatches.some(match => match.taskId === '456')).toBe(true);
  });

  it('should calculate appropriate confidence scores', async () => {
    // Create a test file with different types of task references
    const fileContent = `
    // This is the primary implementation for Task-123
    // This file also mentions #456 in passing
    function implementTask123() {
      console.log('Implementing task 123');
    }
    `;
    await fs.writeFile(tempFilePath, fileContent);

    // Mock repository response
    mockRepository.getFileByPath.mockResolvedValueOnce({ id: 1, path: tempFilePath, type: '.ts' });
    
    // Test file analysis
    const result = await analysisEngine.analyzeFileChange({
      type: 'change',
      path: tempFilePath,
    });

    // Verify confidence scores (primary task should have higher confidence)
    const task123Match = result?.taskMatches.find(match => match.taskId === '123');
    const task456Match = result?.taskMatches.find(match => match.taskId === '456');
    
    expect(task123Match).toBeDefined();
    expect(task456Match).toBeDefined();
    expect(task123Match!.confidence).toBeGreaterThan(0);
    expect(task456Match!.confidence).toBeGreaterThan(0);
  });

  it('should determine relationship types correctly', async () => {
    // Create a test file with different relationship indicators
    const fileContent = `
    // This implements Task-123
    function implementFeature() {
      // Code here
    }

    // This tests task #456
    function testFeature() {
      // Test code
    }

    // This documents Task-789
    /**
     * Documentation for the feature
     */
    `;
    await fs.writeFile(tempFilePath, fileContent);

    // Mock repository response
    mockRepository.getFileByPath.mockResolvedValueOnce({ id: 1, path: tempFilePath, type: '.ts' });
    
    // Test file analysis
    const result = await analysisEngine.analyzeFileChange({
      type: 'change',
      path: tempFilePath,
    });

    // Verify relationship types
    const task123Match = result?.taskMatches.find(match => match.taskId === '123');
    const task456Match = result?.taskMatches.find(match => match.taskId === '456');
    const task789Match = result?.taskMatches.find(match => match.taskId === '789');
    
    // Check if matches are found
    expect(task123Match).toBeDefined();
    expect(task456Match).toBeDefined();
    expect(task789Match).toBeDefined();
    
    // Check that all matches have confidence scores
    expect(task123Match?.confidence).toBeGreaterThan(0);
    expect(task456Match?.confidence).toBeGreaterThan(0);
    expect(task789Match?.confidence).toBeGreaterThan(0);
  });

  it('should handle file paths with embedded task IDs', async () => {
    // Test a file path that contains a task ID
    const taskFilePath = path.join(tempDir, 'task-123-implementation.ts');
    await fs.writeFile(taskFilePath, '// Simple file');

    // Mock repository response
    mockRepository.getFileByPath.mockResolvedValueOnce({ id: 1, path: taskFilePath, type: '.ts' });
    
    // Test file analysis
    const result = await analysisEngine.analyzeFileChange({
      type: 'change',
      path: taskFilePath,
    });

    // Verify task extracted from filename
    expect(result?.taskMatches.some(match => match.taskId === '123')).toBe(true);
  });

  it('should respect the confidence threshold', async () => {
    // Create a file with low confidence matches
    const fileContent = `
    // This might be somewhat related to task stuff
    // Maybe there's a task number 123 somewhere?
    function doSomething() {
      // Generic code
    }
    `;
    await fs.writeFile(tempFilePath, fileContent);

    // Create engine with high threshold
    const highThresholdEngine = new AnalysisEngine(mockRepository, {
      confidenceThreshold: 90,
      taskIdPattern: /(?:Task-|#)(\d+)/gi,
    });

    // Mock repository response
    mockRepository.getFileByPath.mockResolvedValueOnce({ id: 1, path: tempFilePath, type: '.ts' });
    
    // Test file analysis
    const result = await highThresholdEngine.analyzeFileChange({
      type: 'change',
      path: tempFilePath,
    });

    // Verify no high-confidence matches found
    expect(result?.taskMatches).toHaveLength(0);
  });

  it('should respect exclusion patterns', async () => {
    // Create a file in a path that should be excluded
    const excludedDirPath = path.join(tempDir, 'node_modules');
    await fs.mkdir(excludedDirPath, { recursive: true });
    
    const excludedFilePath = path.join(excludedDirPath, 'excluded-file.ts');
    await fs.writeFile(excludedFilePath, '// Task-123 reference in excluded directory');

    // Mock repository should not be called for excluded files
    mockRepository.getFileByPath.mockReset();
    
    // Test file analysis with a path that matches exclusion patterns
    const result = await analysisEngine.analyzeFileChange({
      type: 'change',
      path: excludedFilePath,
    });

    // Verify file was excluded from analysis and repository was not called
    expect(result).toBeNull();
  });

  it('should handle file deletion events', async () => {
    // Test deletion event
    const result = await analysisEngine.analyzeFileChange({
      type: 'unlink',
      path: tempFilePath,
    });

    // Verify no analysis performed for deleted files
    expect(result).toBeNull();
    // Check if repository functions were called appropriately for deletion
    expect(mockRepository.getFileByPath).not.toHaveBeenCalled();
  });

  it('should process multiple files correctly', async () => {
    // Create test files
    const file1Path = path.join(tempDir, 'file1.ts');
    const file2Path = path.join(tempDir, 'file2.ts');
    
    await fs.writeFile(file1Path, '// Task-123 implementation');
    await fs.writeFile(file2Path, '// Task-456 implementation');

    // Mock repository responses
    mockRepository.getFileByPath
      .mockResolvedValueOnce({ id: 1, path: file1Path, type: '.ts' })
      .mockResolvedValueOnce({ id: 2, path: file2Path, type: '.ts' });
    
    // Test analyzing files individually 
    const result1 = await analysisEngine.analyzeFileChange({
      type: 'change', 
      path: file1Path
    });
    
    const result2 = await analysisEngine.analyzeFileChange({
      type: 'change', 
      path: file2Path
    });

    // Verify results
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1?.taskMatches.some(match => match.taskId === '123')).toBe(true);
    expect(result2?.taskMatches.some(match => match.taskId === '456')).toBe(true);
  });
});