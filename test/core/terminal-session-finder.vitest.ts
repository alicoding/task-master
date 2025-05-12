/**
 * Tests for Terminal Session Finder Module
 * Tests for terminal-session-finder.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  findExistingSession,
  getSessionById,
  getActiveSessions
} from '../../core/terminal/terminal-session-finder.ts';
import { createDb } from '../../db/init.ts';
import { terminalSessions } from '../../db/schema-extensions.ts';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

// Create test DB path
const createTestDbPath = () => join(os.tmpdir(), `test-tm-${Date.now()}.db`);

describe('Terminal Session Finder', () => {
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
  
  describe('findExistingSession', () => {
    it('should find a session by TTY path', async () => {
      // Insert a test session into the database
      const sessionId = uuidv4();
      await db.insert(terminalSessions).values({
        id: sessionId,
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash',
        status: 'active',
        startTime: new Date(),
        lastActive: new Date()
      });
      
      // Try to find the session
      const result = await findExistingSession(db, {
        tty: '/dev/test-tty',
        pid: 9999, // Different PID
        ppid: 9998,
        user: 'other-user',
        shell: 'zsh'
      });
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sessionId);
      expect(result?.tty).toBe('/dev/test-tty');
    });
    
    it('should find a session by PID/PPID when TTY does not match', async () => {
      // Insert a test session into the database
      const sessionId = uuidv4();
      await db.insert(terminalSessions).values({
        id: sessionId,
        tty: '/dev/other-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash',
        status: 'active',
        startTime: new Date(),
        lastActive: new Date()
      });
      
      // Try to find the session
      const result = await findExistingSession(db, {
        tty: '/dev/test-tty', // Different TTY
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash'
      });
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sessionId);
      expect(result?.pid).toBe(12345);
      expect(result?.ppid).toBe(12344);
    });
    
    it('should find a session by tmux session ID in metadata', async () => {
      // Insert a test session into the database
      const sessionId = uuidv4();
      await db.insert(terminalSessions).values({
        id: sessionId,
        tty: '/dev/tmux-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash',
        status: 'active',
        metadata: JSON.stringify({ tmuxSession: 'test-tmux-1' }),
        startTime: new Date(),
        lastActive: new Date()
      });
      
      // Try to find the session with different TTY and PID but same tmux session
      const result = await findExistingSession(db, {
        tty: '/dev/other-tty',
        pid: 9999,
        ppid: 9998,
        user: 'other-user',
        shell: 'zsh',
        tmuxSession: 'test-tmux-1'
      });
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sessionId);
    });
    
    it('should return null when no matching session is found', async () => {
      // Try to find a session that doesn't exist
      const result = await findExistingSession(db, {
        tty: '/dev/nonexistent',
        pid: 9999,
        ppid: 9998,
        user: 'nonexistent',
        shell: 'nonexistent'
      });
      
      expect(result).toBeNull();
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock the database query to throw an error
      vi.spyOn(db.query.terminalSessions, 'findFirst').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await findExistingSession(db, {
        tty: '/dev/test',
        pid: 12345,
        ppid: 12344,
        user: 'test',
        shell: 'bash'
      });
      
      expect(result).toBeNull();
    });
  });
  
  describe('getSessionById', () => {
    it('should return a session by ID when it exists', async () => {
      // Insert a test session
      const sessionId = uuidv4();
      await db.insert(terminalSessions).values({
        id: sessionId,
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash',
        status: 'active',
        startTime: new Date(),
        lastActive: new Date()
      });
      
      // Get the session by ID
      const result = await getSessionById(db, sessionId);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sessionId);
    });
    
    it('should return null when no session with the given ID exists', async () => {
      const nonExistentId = uuidv4();
      const result = await getSessionById(db, nonExistentId);
      
      expect(result).toBeNull();
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock the database query to throw an error
      vi.spyOn(db.query.terminalSessions, 'findFirst').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await getSessionById(db, uuidv4());
      
      expect(result).toBeNull();
    });
  });
  
  describe('getActiveSessions', () => {
    beforeEach(async () => {
      // Insert multiple test sessions with different statuses
      await db.insert(terminalSessions).values({
        id: uuidv4(),
        tty: '/dev/tty1',
        pid: 1000,
        ppid: 999,
        user: 'user1',
        shell: 'bash',
        status: 'active',
        startTime: new Date(),
        lastActive: new Date(Date.now() - 1000)
      });
      
      await db.insert(terminalSessions).values({
        id: uuidv4(),
        tty: '/dev/tty2',
        pid: 2000,
        ppid: 1999,
        user: 'user2',
        shell: 'zsh',
        status: 'inactive',
        startTime: new Date(),
        lastActive: new Date(Date.now() - 2000)
      });
      
      await db.insert(terminalSessions).values({
        id: uuidv4(),
        tty: '/dev/tty3',
        pid: 3000,
        ppid: 2999,
        user: 'user3',
        shell: 'fish',
        status: 'disconnected',
        startTime: new Date(),
        lastActive: new Date(Date.now() - 3000)
      });
    });
    
    it('should return only active sessions by default', async () => {
      const sessions = await getActiveSessions(db);
      
      expect(sessions.length).toBe(1);
      expect(sessions[0].status).toBe('active');
      expect(sessions[0].tty).toBe('/dev/tty1');
    });
    
    it('should include inactive sessions when includeInactive is true', async () => {
      const sessions = await getActiveSessions(db, true);
      
      expect(sessions.length).toBe(2);
      expect(sessions.some(s => s.status === 'active')).toBe(true);
      expect(sessions.some(s => s.status === 'inactive')).toBe(true);
      expect(sessions.some(s => s.status === 'disconnected')).toBe(false);
    });
    
    it('should order sessions by lastActive in descending order', async () => {
      const sessions = await getActiveSessions(db, true);
      
      expect(sessions.length).toBeGreaterThan(0);
      if (sessions.length > 1) {
        const firstTimestamp = new Date(sessions[0].lastActive).getTime();
        const secondTimestamp = new Date(sessions[1].lastActive).getTime();
        expect(firstTimestamp).toBeGreaterThan(secondTimestamp);
      }
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock the database query to throw an error
      vi.spyOn(db, 'select').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const sessions = await getActiveSessions(db);
      
      expect(sessions).toEqual([]);
    });
  });
});