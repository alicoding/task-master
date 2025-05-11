/**
 * Utility functions for the daemon module
 */

/**
 * Debounce a function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * @param func Function to throttle
 * @param limit Limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function(...args: Parameters<T>): void {
    // Store the latest arguments
    lastArgs = args;
    
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        
        // Call with the latest arguments if there were any during the throttle period
        if (lastArgs !== null) {
          const currentArgs = lastArgs;
          lastArgs = null;
          func(...currentArgs);
        }
      }, limit);
    }
  };
}

/**
 * Filter a path against a list of exclude patterns
 * @param filePath Path to check
 * @param excludePatterns List of glob patterns to exclude
 * @returns True if the path should be excluded, false otherwise
 */
export function shouldExcludePath(filePath: string, excludePatterns: string[]): boolean {
  // Simple string matching for now, we could use micromatch for more complex patterns
  return excludePatterns.some(pattern => {
    // Convert glob patterns to regex-like checks
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  });
}

/**
 * Get a list of tasks mentioned in a file content
 * Simple implementation that looks for task IDs in the format "Task-123" or "#123"
 * @param content File content
 * @returns List of task IDs found in the content
 */
export function extractTaskIdsFromContent(content: string): string[] {
  // This is a simple implementation that can be improved later
  const taskIds = new Set<string>();
  
  // Look for Task-123 format
  const taskIdRegex = /Task[- _](\d+)/gi;
  let match = taskIdRegex.exec(content);
  
  while (match !== null) {
    taskIds.add(match[1]);
    match = taskIdRegex.exec(content);
  }
  
  // Look for #123 format
  const hashIdRegex = /#(\d+)\b/g;
  match = hashIdRegex.exec(content);
  
  while (match !== null) {
    taskIds.add(match[1]);
    match = hashIdRegex.exec(content);
  }
  
  return Array.from(taskIds);
}

/**
 * Analyze code to determine its purpose based on simple heuristics
 * @param filename Filename to analyze
 * @param content File content
 * @returns Classification of the file ('implements', 'tests', 'documents', or 'related')
 */
export function classifyFileType(filename: string, content: string): 'implements' | 'tests' | 'documents' | 'related' {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const normalizedContent = content.toLowerCase();
  
  // Check if it's a test file
  if (
    filename.includes('.test.') || 
    filename.includes('.spec.') || 
    filename.includes('Test') ||
    filename.startsWith('test') ||
    (extension === 'js' || extension === 'ts') && normalizedContent.includes('describe(') && normalizedContent.includes('it(')
  ) {
    return 'tests';
  }
  
  // Check if it's a documentation file
  if (
    extension === 'md' || 
    extension === 'txt' || 
    extension === 'doc' || 
    extension === 'pdf' ||
    filename.includes('README') ||
    filename.includes('DOCUMENTATION')
  ) {
    return 'documents';
  }
  
  // Check if it's an implementation file
  if (
    extension === 'js' || 
    extension === 'ts' || 
    extension === 'jsx' || 
    extension === 'tsx' || 
    extension === 'py' || 
    extension === 'java' || 
    extension === 'c' || 
    extension === 'cpp' || 
    extension === 'go'
  ) {
    return 'implements';
  }
  
  // Default to related
  return 'related';
}

/**
 * Calculate a confidence score for the association between a file and a task
 * @param taskId Task ID
 * @param filename Filename
 * @param content File content
 * @returns Confidence score (0-100)
 */
export function calculateConfidenceScore(taskId: string, filename: string, content: string): number {
  // This implementation can be enhanced with more sophisticated algorithms
  let score = 0;
  
  // Explicit mention in content
  if (content.includes(`Task-${taskId}`)) {
    score += 50;
  }
  
  if (content.includes(`#${taskId}`)) {
    score += 30;
  }
  
  // Filename contains task ID
  if (filename.includes(taskId)) {
    score += 40;
  }
  
  // Cap the score at 100
  return Math.min(100, score);
}