/**
 * Logger Example for Task Master
 * 
 * This example demonstrates how to use the standardized logging system
 * for consistent log messages across the codebase.
 */

import { createLogger, configureLogger, LogLevel } from '../core/utils/logger.ts';

// Example usage in a repository or service class
class ExampleService {
  private logger = createLogger('ExampleService');
  
  constructor() {
    this.logger.info('Service initialized');
  }
  
  public doSomething(param: string): void {
    this.logger.debug('Processing request', { param });
    
    try {
      // Simulate some work
      if (param === 'fail') {
        throw new Error('Operation failed');
      }
      
      this.logger.info(`Successfully processed: ${param}`);
    } catch (error) {
      this.logger.error('Failed to process request', error, { param });
    }
  }
  
  public complexOperation(): void {
    // Create a child logger for this specific operation
    const operationLogger = this.logger.child('ComplexOperation');
    
    operationLogger.info('Starting complex operation');
    
    // Simulate an operation that produces a warning
    operationLogger.warn('Resource usage is high', { memoryUsage: '85%' });
    
    operationLogger.info('Complex operation completed');
  }
}

// Example of configuring the logger globally
function configureLoggerExample(): void {
  console.log('\n=== Logger Configuration Examples ===\n');
  
  // Default configuration
  const defaultLogger = createLogger('Default');
  defaultLogger.debug('This is a debug message (should not show by default)');
  defaultLogger.info('This is an info message');
  defaultLogger.warn('This is a warning');
  defaultLogger.error('This is an error message');
  
  // Change global configuration to show debug messages
  console.log('\n--- Enabling Debug Level ---\n');
  configureLogger({ level: LogLevel.DEBUG });
  
  const debugLogger = createLogger('DebugEnabled');
  debugLogger.debug('This debug message should now be visible');
  debugLogger.info('This is an info message');
  
  // Disable colors
  console.log('\n--- Disabling Colors ---\n');
  configureLogger({ useColors: false });
  
  const noColorLogger = createLogger('NoColors');
  noColorLogger.info('This message should have no colors');
  noColorLogger.warn('This warning should have no colors');
  
  // Disable timestamps and use minimal format
  console.log('\n--- Minimal Format ---\n');
  configureLogger({ 
    includeTimestamps: false,
    includeContext: false,
    useColors: true
  });
  
  const minimalLogger = createLogger('Minimal');
  minimalLogger.info('This is a minimal format message');
  minimalLogger.error('This is a minimal format error');
  
  // Reset to defaults
  configureLogger({
    level: LogLevel.INFO,
    useColors: true,
    includeTimestamps: true,
    includeContext: true
  });
}

// Example of using the logger in a service
function serviceExample(): void {
  console.log('\n=== Service Example ===\n');
  
  const service = new ExampleService();
  
  // Successful operation
  service.doSomething('test');
  
  // Failed operation
  service.doSomething('fail');
  
  // Complex operation with child logger
  service.complexOperation();
}

// Run the examples
async function main() {
  configureLoggerExample();
  serviceExample();
}

main().catch(error => {
  console.error('Error in logger example:', error);
  process.exit(1);
});