/**
 * Simple test to verify dot notation works for nested metadata access
 * TypeScript version with proper types and error handling
 */

/**
 * Gets a nested field from an object using dot notation
 * @param obj The object to access
 * @param path The path to the field using dot notation (e.g., 'nested.field.property')
 * @returns The value at the specified path, or undefined if not found
 */
function getNestedField(obj: Record<string, any>, path: string): any {
  if (!obj || !path) return undefined;
  
  // Handle nested field access with dot notation
  if (path.includes('.')) {
    const parts = path.split('.');
    let value: any = obj;
    
    // Navigate through the nested structure
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  // Simple field access
  return obj[path];
}

/**
 * Test case definition with name, path, and expected value
 */
interface TestCase {
  name: string;
  path: string;
  expected: any;
}

// Sample data for testing
const sampleMetadata: Record<string, any> = {
  simple: 'value',
  number: 42,
  boolean: true,
  array: [1, 2, 3],
  nested: {
    key1: 'value1',
    key2: 'value2',
    deep: {
      property: 'nested value'
    }
  },
  items: ['item1', 'item2'],
  nestedArray: [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' }
  ]
};

// Test cases
const tests: TestCase[] = [
  {
    name: 'Simple field access',
    path: 'simple',
    expected: 'value'
  },
  {
    name: 'Nested field access - first level',
    path: 'nested.key1',
    expected: 'value1'
  },
  {
    name: 'Deeply nested field access',
    path: 'nested.deep.property',
    expected: 'nested value'
  },
  {
    name: 'Non-existent field access',
    path: 'nonexistent',
    expected: undefined
  },
  {
    name: 'Non-existent nested field access',
    path: 'nested.nonexistent',
    expected: undefined
  },
  {
    name: 'Invalid path on non-object',
    path: 'simple.nonexistent',
    expected: undefined
  },
  {
    name: 'Array element access',
    path: 'array.1',
    expected: 2
  },
  {
    name: 'Array with objects access',
    path: 'nestedArray.1.name',
    expected: 'Second'
  }
];

/**
 * Run the tests and output results
 */
function runTests(): void {
  let passed = 0;
  let failed = 0;
  
  console.log('Running dot notation metadata field access tests:');
  console.log('------------------------------------------------');
  
  for (const testCase of tests) {
    const result = getNestedField(sampleMetadata, testCase.path);
    const success = 
      (result === testCase.expected) || 
      (JSON.stringify(result) === JSON.stringify(testCase.expected));
    
    if (success) {
      console.log(`✅ PASS: ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
      console.log(`  Actual:   ${JSON.stringify(result)}`);
      failed++;
    }
  }
  
  console.log('------------------------------------------------');
  console.log(`Tests completed: ${passed + failed} total, ${passed} passed, ${failed} failed`);
  
  // Exit with code 0 if all tests pass, 1 if any fail
  process.exit(passed === tests.length ? 0 : 1);
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests();
}

// Export for use in other modules
export { getNestedField, runTests };