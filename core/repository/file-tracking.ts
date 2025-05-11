/**
 * File Tracking Repository
 * Handles database operations for file tracking and task-code relationships
 */

import { eq, and, desc } from 'drizzle-orm';
import { BaseTaskRepository } from './base.ts';
import {
  File, NewFile,
  TaskFile, NewTaskFile,
  FileChange, NewFileChange,
  files, taskFiles, fileChanges
} from '../../db/schema-extensions.ts';
import {
  TaskOperationResult,
  TaskError,
  TaskErrorCode
} from '../types.ts';
import { createHash } from 'crypto';
import fs from 'fs/promises';

/**
 * Repository for tracking files and their relationships with tasks
 * Implements Task 17.3: Database Extensions for tracking file changes
 */
export class FileTrackingRepository extends BaseTaskRepository {
  /**
   * Create or update a file in the database
   * @param filePath Absolute path to the file
   * @returns The file record
   */
  async trackFile(filePath: string): Promise<TaskOperationResult<File>> {
    try {
      // Input validation
      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid file path', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return {
          success: false,
          error: new TaskError(`File not found: ${filePath}`, TaskErrorCode.NOT_FOUND)
        };
      }

      // Read file content and calculate hash
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = this.calculateFileHash(content);
      const stats = await fs.stat(filePath);
      const fileType = filePath.split('.').pop() || '';

      // Check if file already exists in database
      const existingFiles = await this._db.select()
        .from(files)
        .where(eq(files.path, filePath))
        .limit(1);

      if (existingFiles.length > 0) {
        const existingFile = existingFiles[0];
        
        // Check if file has changed
        if (existingFile.hash !== hash) {
          // Update file record
          const updatedFile = await this._db.update(files)
            .set({
              hash,
              lastModified: new Date(),
              fileType
            })
            .where(eq(files.id, existingFile.id))
            .returning();

          // Record the change
          await this.recordFileChange(existingFile.id, 'modified', existingFile.hash, hash);
          
          return {
            success: true,
            data: updatedFile[0]
          };
        }
        
        // File hasn't changed
        return {
          success: true,
          data: existingFile
        };
      }

      // Create new file record
      const newFile: NewFile = {
        path: filePath,
        hash,
        lastModified: stats.mtime,
        createdAt: new Date(),
        fileType
      };

      const insertedFile = await this._db.insert(files)
        .values(newFile)
        .returning();

      // Record the file creation
      await this.recordFileChange(insertedFile[0].id, 'created', null, hash);

      return {
        success: true,
        data: insertedFile[0]
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error tracking file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Associate a file with a task
   * @param taskId Task ID
   * @param filePath File path
   * @param relationshipType Type of relationship
   * @param confidence Confidence score (0-100)
   * @returns The task-file relationship
   */
  async associateFileWithTask(
    taskId: string,
    filePath: string,
    relationshipType: 'implements' | 'tests' | 'documents' | 'related' = 'related',
    confidence: number = 100
  ): Promise<TaskOperationResult<TaskFile>> {
    try {
      // Input validation
      if (!taskId || typeof taskId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid file path', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Validate confidence score
      if (confidence < 0 || confidence > 100) {
        confidence = 100; // Default to 100 if invalid
      }

      // Check if task exists
      const taskResult = await this.getTask(taskId);
      if (!taskResult.success) {
        return {
          success: false,
          error: new TaskError(`Task not found: ${taskId}`, TaskErrorCode.NOT_FOUND)
        };
      }

      // Get or create file record
      const fileResult = await this.trackFile(filePath);
      if (!fileResult.success) {
        return {
          success: false,
          error: fileResult.error
        };
      }

      const fileId = fileResult.data.id;

      // Check if association already exists
      const existingAssociations = await this._db.select()
        .from(taskFiles)
        .where(
          and(
            eq(taskFiles.taskId, taskId),
            eq(taskFiles.fileId, fileId)
          )
        )
        .limit(1);

      if (existingAssociations.length > 0) {
        const existingAssociation = existingAssociations[0];
        
        // Update association if relationship type or confidence has changed
        if (existingAssociation.relationshipType !== relationshipType || 
            existingAssociation.confidence !== confidence) {
          
          const updatedAssociation = await this._db.update(taskFiles)
            .set({
              relationshipType,
              confidence,
              updatedAt: new Date()
            })
            .where(eq(taskFiles.id, existingAssociation.id))
            .returning();
          
          return {
            success: true,
            data: updatedAssociation[0]
          };
        }
        
        // Association hasn't changed
        return {
          success: true,
          data: existingAssociation
        };
      }

      // Create new association
      const newAssociation: NewTaskFile = {
        taskId,
        fileId,
        relationshipType,
        confidence,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertedAssociation = await this._db.insert(taskFiles)
        .values(newAssociation)
        .returning();

      return {
        success: true,
        data: insertedAssociation[0]
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error associating file with task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Get all files associated with a task
   * @param taskId Task ID
   * @returns List of files and their relationship details
   */
  async getFilesForTask(taskId: string): Promise<TaskOperationResult<{ file: File, relationship: TaskFile }[]>> {
    try {
      // Input validation
      if (!taskId || typeof taskId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Check if task exists
      const taskResult = await this.getTask(taskId);
      if (!taskResult.success) {
        return {
          success: false,
          error: new TaskError(`Task not found: ${taskId}`, TaskErrorCode.NOT_FOUND)
        };
      }

      // Query for task-file relationships
      const relationships = await this._db.select()
        .from(taskFiles)
        .where(eq(taskFiles.taskId, taskId));

      if (relationships.length === 0) {
        // No files associated with this task
        return {
          success: true,
          data: []
        };
      }

      // Get file details for each relationship
      const result = await Promise.all(
        relationships.map(async (relationship) => {
          const fileResults = await this._db.select()
            .from(files)
            .where(eq(files.id, relationship.fileId))
            .limit(1);

          if (fileResults.length === 0) {
            // This should not happen if foreign key constraints are enforced
            console.error(`File with ID ${relationship.fileId} not found but referenced in task-file relationship`);
            return null;
          }

          return {
            file: fileResults[0],
            relationship
          };
        })
      );

      // Filter out any null entries
      const validResults = result.filter(item => item !== null) as { file: File, relationship: TaskFile }[];

      return {
        success: true,
        data: validResults
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error getting files for task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Get all tasks associated with a file
   * @param filePath Path to the file
   * @returns List of tasks and their relationship details
   */
  async getTasksForFile(filePath: string): Promise<TaskOperationResult<{ task: any, relationship: TaskFile }[]>> {
    try {
      // Input validation
      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid file path', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Get file ID
      const fileResults = await this._db.select()
        .from(files)
        .where(eq(files.path, filePath))
        .limit(1);

      if (fileResults.length === 0) {
        return {
          success: false,
          error: new TaskError(`File not found: ${filePath}`, TaskErrorCode.NOT_FOUND)
        };
      }

      const fileId = fileResults[0].id;

      // Query for file-task relationships
      const relationships = await this._db.select()
        .from(taskFiles)
        .where(eq(taskFiles.fileId, fileId));

      if (relationships.length === 0) {
        // No tasks associated with this file
        return {
          success: true,
          data: []
        };
      }

      // Get task details for each relationship
      const result = await Promise.all(
        relationships.map(async (relationship) => {
          const taskResult = await this.getTask(relationship.taskId);
          
          if (!taskResult.success || !taskResult.data) {
            // This should not happen if foreign key constraints are enforced
            console.error(`Task with ID ${relationship.taskId} not found but referenced in task-file relationship`);
            return null;
          }

          return {
            task: taskResult.data,
            relationship
          };
        })
      );

      // Filter out any null entries
      const validResults = result.filter(item => item !== null) as { task: any, relationship: TaskFile }[];

      return {
        success: true,
        data: validResults
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error getting tasks for file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Get the change history for a file
   * @param filePath Path to the file
   * @returns List of file changes
   */
  async getFileChangeHistory(filePath: string): Promise<TaskOperationResult<FileChange[]>> {
    try {
      // Input validation
      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid file path', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Get file ID
      const fileResults = await this._db.select()
        .from(files)
        .where(eq(files.path, filePath))
        .limit(1);

      if (fileResults.length === 0) {
        return {
          success: false,
          error: new TaskError(`File not found: ${filePath}`, TaskErrorCode.NOT_FOUND)
        };
      }

      const fileId = fileResults[0].id;

      // Query for file changes
      const changes = await this._db.select()
        .from(fileChanges)
        .where(eq(fileChanges.fileId, fileId))
        .orderBy(desc(fileChanges.timestamp));

      return {
        success: true,
        data: changes
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error getting file change history: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Record a file change event
   * @param fileId File ID
   * @param changeType Type of change
   * @param previousHash Previous hash value
   * @param currentHash Current hash value
   * @param taskId Optional task ID associated with the change
   * @param metadata Optional metadata about the change
   * @returns The file change record
   */
  public async recordFileChange(
    fileId: number,
    changeType: 'created' | 'modified' | 'deleted' | 'renamed',
    previousHash: string | null,
    currentHash: string | null,
    taskId?: string,
    metadata: Record<string, any> = {}
  ): Promise<FileChange> {
    const newChange: NewFileChange = {
      fileId,
      changeType,
      timestamp: new Date(),
      previousHash,
      currentHash,
      taskId,
      metadata: JSON.stringify(metadata)
    };

    const insertedChange = await this._db.insert(fileChanges)
      .values(newChange)
      .returning();

    return insertedChange[0];
  }

  /**
   * Calculate a hash for a file's content
   * @param content File content
   * @returns SHA-256 hash of the file content
   */
  public calculateFileHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}