import { describe, it, expect, afterEach } from 'vitest';
import { RepositoryFactory } from '../../core/repository/factory';

describe('Repository Factory', () => {
  afterEach(() => {
    // Reset the factory after each test
    RepositoryFactory.reset();
  });
  
  it('should initialize and provide a database connection', () => {
    const connection = RepositoryFactory.initialize();
    
    expect(connection).toBeDefined();
    expect(connection.db).toBeDefined();
    expect(connection.sqlite).toBeDefined();
    expect(RepositoryFactory.isInitialized()).toBe(true);
  });
  
  it('should reset the connection', () => {
    RepositoryFactory.initialize();
    expect(RepositoryFactory.isInitialized()).toBe(true);
    
    const resetResult = RepositoryFactory.reset();
    expect(resetResult).toBe(true);
    expect(RepositoryFactory.isInitialized()).toBe(false);
  });
  
  it('should throw an error when getting a connection without initialization', () => {
    RepositoryFactory.reset(); // Ensure it's reset
    
    expect(() => {
      RepositoryFactory.getConnection();
    }).toThrow(/not initialized/);
  });
  
  it('should allow setting a test connection', () => {
    // Create mock objects
    const mockDb = {} as any;
    const mockSqlite = {} as any;
    
    // Set the test connection
    const connection = RepositoryFactory.setTestConnection(mockDb, mockSqlite);
    
    // Verify the connection was set
    expect(connection.db).toBe(mockDb);
    expect(connection.sqlite).toBe(mockSqlite);
    expect(RepositoryFactory.isInitialized()).toBe(true);
    
    // Verify we can get the connection
    const retrievedConnection = RepositoryFactory.getConnection();
    expect(retrievedConnection.db).toBe(mockDb);
    expect(retrievedConnection.sqlite).toBe(mockSqlite);
  });
});