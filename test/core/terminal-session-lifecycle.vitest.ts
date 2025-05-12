/**
 * Tests for Terminal Session Lifecycle Module
 * Tests for terminal-session-lifecycle.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createSession,
  reconnectSession,
  disconnectSession
} from '../../core/terminal/terminal-session-lifecycle.ts';
import { terminalSessions } from '../../db/schema-extensions.ts';
import { createDb } from '../../db/init.ts';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

// Create test DB path
const createTestDbPath = () => join(os.tmpdir(), `test-tm-${Date.now()}.db`);

// Mock the window size utility
vi.mock('../../core/terminal/terminal-session-utils.ts', async () => ({
  getWindowSize: () => ({ columns: 80, rows: 24 })
}));

describe('Terminal Session Lifecycle', () => {
  let dbPath: string;
  let db: any;
  
  beforeEach(() => {
    // Create a test database
    dbPath = createTestDbPath();
    const result = createDb(dbPath);
    db = result.db;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up test database
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  });
  
  describe('createSession', () => {
    it('should create a new session with correct data', async () => {
      const sessionId = uuidv4();
      const fingerprint = {
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash',
        termEnv: 'xterm'
      };
      
      const result = await createSession(db, sessionId, fingerprint);
      
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      
      // Verify the session was created in the database
      const session = await db.query.terminalSessions.findFirst({
        where: { id: sessionId }
      });
      
      expect(session).not.toBeNull();
      expect(session.tty).toBe(fingerprint.tty);
      expect(session.pid).toBe(fingerprint.pid);
      expect(session.ppid).toBe(fingerprint.ppid);
      expect(session.user).toBe(fingerprint.user);
      expect(session.shell).toBe(fingerprint.shell);
      expect(session.status).toBe('active');
      expect(session.connectionCount).toBe(1);
      
      // Check metadata
      const metadata = JSON.parse(session.metadata);
      expect(metadata.termEnv).toBe(fingerprint.termEnv);
    });
    
    it('should include optional properties in session metadata when provided', async () => {
      const sessionId = uuidv4();
      const fingerprint = {
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash',
        termEnv: 'xterm',
        sshConnection: 'user@host',
        tmuxSession: 'tmux-123',
        screenSession: 'screen-123'
      };
      
      await createSession(db, sessionId, fingerprint);
      
      // Verify the session metadata contains all the optional properties
      const session = await db.query.terminalSessions.findFirst({
        where: { id: sessionId }
      });
      
      const metadata = JSON.parse(session.metadata);
      expect(metadata.termEnv).toBe(fingerprint.termEnv);
      expect(metadata.sshConnection).toBe(fingerprint.sshConnection);
      expect(metadata.tmuxSession).toBe(fingerprint.tmuxSession);
      expect(metadata.screenSession).toBe(fingerprint.screenSession);
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock the database to throw an error
      vi.spyOn(db, 'insert').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const sessionId = uuidv4();
      const fingerprint = {
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash',
        termEnv: 'xterm'
      };
      
      const result = await createSession(db, sessionId, fingerprint);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('reconnectSession', () => {
    let existingSessionId: string;
    
    beforeEach(async () => {
      // Create an existing session
      existingSessionId = uuidv4();
      await db.insert(terminalSessions).values({
        id: existingSessionId,
        tty: '/dev/old-tty',
        pid: 1000,
        ppid: 999,
        user: 'old-user',
        shell: 'old-shell',
        windowColumns: 100,
        windowRows: 30,
        status: 'inactive',
        connectionCount: 3,
        metadata: JSON.stringify({ termEnv: 'old-term' }),
        startTime: new Date(Date.now() - 36000000),
        lastActive: new Date(Date.now() - 3600000)
      });
    });
    
    it('should update an existing session with new fingerprint data', async () => {
      const newFingerprint = {
        tty: '/dev/new-tty',
        pid: 2000,
        ppid: 1999,
        user: 'new-user',
        shell: 'new-shell',
        termEnv: 'new-term'
      };
      
      const result = await reconnectSession(db, existingSessionId, newFingerprint);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(existingSessionId);
      expect(result?.tty).toBe(newFingerprint.tty);
      expect(result?.pid).toBe(newFingerprint.pid);
      expect(result?.ppid).toBe(newFingerprint.ppid);
      expect(result?.status).toBe('active');
      expect(result?.connectionCount).toBe(4); // Incremented from 3
      
      // Check metadata was updated
      const metadata = JSON.parse(result?.metadata || '{}');
      expect(metadata.termEnv).toBe(newFingerprint.termEnv);
    });
    
    it('should update all optional metadata fields when provided', async () => {
      const newFingerprint = {
        tty: '/dev/new-tty',
        pid: 2000,
        ppid: 1999,
        user: 'new-user',
        shell: 'new-shell',
        termEnv: 'new-term',
        sshConnection: 'new-ssh',
        tmuxSession: 'new-tmux',
        screenSession: 'new-screen'
      };
      
      const result = await reconnectSession(db, existingSessionId, newFingerprint);
      
      expect(result).not.toBeNull();
      
      // Check all metadata fields were updated
      const metadata = JSON.parse(result?.metadata || '{}');
      expect(metadata.termEnv).toBe(newFingerprint.termEnv);
      expect(metadata.sshConnection).toBe(newFingerprint.sshConnection);
      expect(metadata.tmuxSession).toBe(newFingerprint.tmuxSession);
      expect(metadata.screenSession).toBe(newFingerprint.screenSession);
    });
    
    it('should return null when session ID does not exist', async () => {
      const nonExistentId = uuidv4();
      const fingerprint = {
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash'
      };
      
      const result = await reconnectSession(db, nonExistentId, fingerprint);
      
      expect(result).toBeNull();
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock the database to throw an error
      vi.spyOn(db.query.terminalSessions, 'findFirst').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const fingerprint = {
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash'
      };
      
      const result = await reconnectSession(db, existingSessionId, fingerprint);
      
      expect(result).toBeNull();
    });
  });
  
  describe('disconnectSession', () => {
    let activeSessionId: string;
    
    beforeEach(async () => {
      // Create an active session
      activeSessionId = uuidv4();
      await db.insert(terminalSessions).values({
        id: activeSessionId,
        tty: '/dev/active-tty',
        pid: 5000,
        ppid: 4999,
        user: 'active-user',
        shell: 'active-shell',
        status: 'active',
        startTime: new Date(),
        lastActive: new Date(Date.now() - 60000)
      });
    });
    
    it('should mark a session as disconnected', async () => {
      const result = await disconnectSession(db, activeSessionId);
      
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(activeSessionId);
      
      // Verify the session was updated
      const session = await db.query.terminalSessions.findFirst({
        where: { id: activeSessionId }
      });
      
      expect(session.status).toBe('disconnected');
      expect(session.lastDisconnect).toBeInstanceOf(Date);
    });
    
    it('should handle non-existent session IDs gracefully', async () => {
      const nonExistentId = uuidv4();
      
      // This should not throw an error, just report success (no rows affected)
      const result = await disconnectSession(db, nonExistentId);
      
      expect(result.success).toBe(true);
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock the database to throw an error
      vi.spyOn(db, 'update').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await disconnectSession(db, activeSessionId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});