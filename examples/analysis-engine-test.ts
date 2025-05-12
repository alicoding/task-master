/**
 * Simple test for Analysis Engine
 */

import { AnalysisEngine } from '../core/daemon/analysis-engine.ts';
import fs from 'fs/promises';
import path from 'path';

// Mock repository for testing
const mockRepository = {
  getFileByPath: async (filePath: string) => {
    return { id: 1, path: filePath, type: path.extname(filePath) };
  }
};

async function main() {
  console.log('Creating test file...');
  const testFilePath = path.join(process.cwd(), 'test-analysis.ts');
  
  const testContent = `
  /**
   * This implements Task-123: Analysis Engine
   * 
   * It's also related to #456 for integration.
   */
  function analyzeContent() {
    // Tests for Task-789
    console.log("Analyzing...");
  }
  `;
  
  await fs.writeFile(testFilePath, testContent);
  console.log(`Created file at ${testFilePath}`);
  
  try {
    console.log('Initializing Analysis Engine...');
    const analysisEngine = new AnalysisEngine(
      mockRepository as any, 
      {
        confidenceThreshold: 70,
        exclusionPatterns: ['node_modules', 'dist'],
        inDepthExtensions: ['.ts', '.js', '.md']
      }
    );
    
    console.log('Analyzing file...');
    const result = await analysisEngine.analyzeFileChange({
      type: 'change',
      path: testFilePath
    });
    
    console.log('Analysis results:');
    console.log(JSON.stringify(result, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('Cleaning up...');
    await fs.unlink(testFilePath);
    console.log('Done!');
  }
}

main().catch(console.error);