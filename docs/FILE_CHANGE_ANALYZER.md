# File Change Analyzer

This document describes the implementation of the File Change Analyzer component for the Task-Code Relationship Tracker.

## Overview

The File Change Analyzer is a component that analyzes file changes to extract metadata beyond task relationships. While the Analysis Engine (Task 17.5) focuses on relating files to tasks, the File Change Analyzer (Task 17.6) provides deeper insights into the files themselves, including:

- Code complexity metrics
- Structural changes (functions, classes)
- Diff statistics
- Language detection
- Keyword extraction

## Key Features

### 1. Content Analysis
- **Code Complexity Metrics**: Calculates metrics like lines of code, function count, class count, and cyclomatic complexity
- **Structural Detection**: Identifies functions and classes in the code
- **Language Detection**: Determines the programming language based on file extension and content
- **File Type Classification**: Categorizes files as source code, test, documentation, configuration, etc.

### 2. Change Analysis
- **Diff Statistics**: Computes added, removed, and modified lines between versions
- **Structural Changes**: Tracks added, modified, and removed functions and classes
- **Change Percentage**: Calculates the overall change percentage of a file

### 3. Metadata Extraction
- **Keyword Extraction**: Identifies important terms from the file content
- **Size Tracking**: Monitors file size changes over time
- **Complexity Trends**: Tracks complexity metrics over time to identify maintenance needs

## Architecture

### Core Components

1. **FileChangeAnalyzer Class**
   - Main analysis engine that processes file changes
   - Configurable via FileChangeAnalyzerConfig
   - Provides both single-file and batch analysis capabilities

2. **Analysis Results**
   - Structured outputs including FileChangeAnalysisResult with detailed metadata

3. **Integration with File Tracking Daemon**
   - Seamless integration with the existing daemon process
   - Automatic analysis of all tracked files
   - Metadata storage in the database

## Key Implementation Details

### Code Complexity Analysis

The analyzer calculates several important code metrics:

```typescript
private calculateComplexityMetrics(content: string, language: string): CodeComplexityMetrics {
  // Count lines of code (excluding empty lines and comments)
  const lines = content.split('\n');
  const linesOfCode = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
      !trimmed.startsWith('//') && 
      !trimmed.startsWith('/*') && 
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('#');
  }).length;
  
  // Count functions and classes
  const functionCount = /* implementation */;
  const classCount = /* implementation */;
  
  // Simple cyclomatic complexity estimation
  const branches = (content.match(/if|else|for|while|switch|case|catch|&&|\|\||\?/g) || []).length;
  const cyclomaticComplexity = 1 + branches;
  
  // Maintainability index calculation
  const maintainabilityIndex = /* implementation */;
  
  return {
    linesOfCode,
    functionCount,
    classCount,
    cyclomaticComplexity,
    maintainabilityIndex
  };
}
```

### Structural Change Detection

The analyzer tracks function and class changes between file versions:

```typescript
private analyzeStructuralChanges(
  newContent: string, 
  oldContent: string,
  language: string
): StructuralChangeInfo {
  // Extract functions and classes from both versions
  const oldFunctions = extractFunctions(oldContent);
  const newFunctions = extractFunctions(newContent);
  const oldClasses = extractClasses(oldContent);
  const newClasses = extractClasses(newContent);
  
  // Determine added, modified, and removed elements
  const addedFunctions = /* implementation */;
  const modifiedFunctions = /* implementation */;
  const removedFunctions = /* implementation */;
  
  // Similarly for classes
  
  return {
    addedFunctions,
    modifiedFunctions,
    removedFunctions,
    addedClasses,
    modifiedClasses,
    removedClasses
  };
}
```

### Diff Analysis

The analyzer computes detailed diff statistics using the `diff` library:

```typescript
private computeDiffStatistics(newContent: string, oldContent: string): DiffStatistics {
  // Calculate diff using 'diff' library
  const changes = diffLines(oldContent, newContent);
  
  // Count added, removed, and modified lines
  // Calculate change percentage
  
  return {
    linesAdded,
    linesRemoved,
    linesModified,
    changePercentage
  };
}
```

## Integration with File Tracking Daemon

The File Change Analyzer is integrated with the File Tracking Daemon:

```typescript
// Initialize the file change analyzer
this._fileChangeAnalyzer = new FileChangeAnalyzer({
  ...this._config.fileChangeAnalyzerConfig,
  fileExtensions: this._config.includeExtensions || [],
  excludePatterns: this._config.excludePaths || []
});

// During file processing
if (this._fileChangeAnalyzer) {
  const analysisResult = await this._fileChangeAnalyzer.analyzeFileChange(event);
  if (analysisResult) {
    // Store metadata for the file
    await this._repository.updateFile(fileId, {
      metadata: JSON.stringify({
        fileType: analysisResult.fileType,
        language: analysisResult.language,
        complexity: analysisResult.complexityMetrics,
        keywords: analysisResult.keywords,
        analyzedAt: new Date().toISOString()
      })
    });
    
    // Emit file analyzed event
    this.emit('fileAnalyzed', { /* event data */ });
  }
}
```

## Configuration Options

The analyzer can be configured with the following options:

- `fileExtensions`: File extensions to analyze (e.g., `['.js', '.ts', '.tsx']`)
- `excludePatterns`: Patterns to exclude from analysis (e.g., `['node_modules', 'dist']`)
- `calculateComplexity`: Whether to calculate code complexity metrics
- `trackStructuralChanges`: Whether to track function/class changes
- `computeDiffStats`: Whether to compute diff statistics
- `maxFileSize`: Maximum file size to analyze (in bytes)

## Future Enhancements

1. **AST-based Analysis**: Implement more robust analysis using abstract syntax trees for each supported language
2. **Performance Optimization**: Improve performance for large files and repositories
3. **Trend Analysis**: Track metrics over time to identify code quality trends
4. **Integration with CI/CD**: Generate reports during continuous integration
5. **Advanced NLP**: Implement more sophisticated natural language processing for keyword extraction and code understanding

## Testing

The analyzer includes comprehensive tests covering:

- Basic file analysis functionality
- Structural change detection
- Complexity metrics calculation
- Diff statistics computation
- Batch processing
- Configuration options

## Conclusion

The File Change Analyzer significantly enhances the Task Master CLI's file tracking capabilities by providing deep insights into code quality, complexity, and changes. It complements the Analysis Engine's task relationship tracking, creating a comprehensive code monitoring solution.