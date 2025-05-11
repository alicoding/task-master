import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { RepositoryFactory } from '../../core/repository/factory.ts';
import { DbConnection } from '../../core/repository/base.ts';

test('RepositoryFactory - initialization and reset', () => {
  // Initial state
  assert.equal(RepositoryFactory.isInitialized(), false, 'Should start uninitialized');
  
  // Initialize
  const connection = RepositoryFactory.initialize(':memory:', true);
  assert.ok(connection, 'Should return a connection object');
  assert.ok(connection.db, 'Connection should have a database instance');
  assert.ok(connection.sqlite, 'Connection should have a SQLite instance');
  assert.equal(RepositoryFactory.isInitialized(), true, 'Should be initialized after initialize()');
  
  // Get connection
  const getConnection = RepositoryFactory.getConnection();
  assert.equal(getConnection.db, connection.db, 'Should return the same database instance');
  assert.equal(getConnection.sqlite, connection.sqlite, 'Should return the same SQLite instance');
  
  // Reset
  assert.equal(RepositoryFactory.reset(), true, 'Reset should return true');
  assert.equal(RepositoryFactory.isInitialized(), false, 'Should be uninitialized after reset()');
  
  // Try to get connection after reset (should throw)
  try {
    RepositoryFactory.getConnection();
    assert.unreachable('Should throw when not initialized');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw an error');
    assert.ok(error.message.includes('not initialized'), 'Error should mention not initialized');
  }
});

test('RepositoryFactory - reinitialize', () => {
  // Initialize first connection
  const connection1 = RepositoryFactory.initialize(':memory:', true);
  assert.ok(connection1, 'Should return first connection');
  
  // Initialize second connection
  const connection2 = RepositoryFactory.initialize(':memory:', true);
  assert.ok(connection2, 'Should return second connection');
  
  // Connections should be different
  assert.not.equal(connection1.db, connection2.db, 'Should have different database instances');
  assert.not.equal(connection1.sqlite, connection2.sqlite, 'Should have different SQLite instances');
  
  // Clean up
  RepositoryFactory.reset();
});

test('RepositoryFactory - error handling', () => {
  // Reset to start clean
  RepositoryFactory.reset();
  
  // Try to initialize with invalid path (should throw)
  try {
    // Use a path that doesn't exist and isn't creatable
    RepositoryFactory.initialize('/non-existent/invalid/path/db.sqlite', false);
    assert.unreachable('Should throw with invalid db path');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw an error');
    assert.ok(RepositoryFactory.isInitialized() === false, 'Should not be initialized after error');
  }
});

// Run all tests
test.run();