#!/usr/bin/env node

/**
 * Auto Documentation Generator for Task Master
 * 
 * This script automatically generates documentation from the codebase by:
 * 1. Extracting JSDoc comments from source files
 * 2. Building a documentation structure based on directories and files
 * 3. Updating the DEVELOPER_DOCS.md file with auto-generated content
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// File extensions to process
const EXTENSIONS = ['.ts', '.js'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', 'test/temp'];

// Files to exclude
const EXCLUDE_FILES = ['scripts/generate-docs.js'];

// Target documentation file
const DOC_FILE = path.join(rootDir, 'docs', 'DEVELOPER_DOCS.md');

// Markers for auto-generated content
const START_MARKER = '<!-- AUTO-GENERATED-CONTENT:START -->';
const END_MARKER = '<!-- AUTO-GENERATED-CONTENT:END -->';

/**
 * Main function
 */
async function main() {
  console.log('Generating documentation...');
  
  // Read all source files
  const sourceFiles = await getSourceFiles(rootDir);
  console.log(`Found ${sourceFiles.length} source files`);
  
  // Extract documentation from source files
  const docs = await extractDocs(sourceFiles);
  
  // Generate structured documentation
  const content = generateDocContent(docs);
  
  // Update the documentation file
  await updateDocFile(DOC_FILE, content);
  
  console.log('Documentation generated successfully!');
}

/**
 * Get all source files in the project
 * @param dir Directory to scan
 * @returns Array of file paths
 */
async function getSourceFiles(dir) {
  const files = [];
  
  async function scanDir(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.some(exclude => relativePath.startsWith(exclude))) {
          await scanDir(fullPath);
        }
        continue;
      }
      
      // Skip excluded files
      if (EXCLUDE_FILES.some(exclude => relativePath === exclude)) {
        continue;
      }
      
      // Add files with matching extensions
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDir(dir);
  return files;
}

/**
 * Extract documentation from source files
 * @param files Array of file paths
 * @returns Documentation object
 */
async function extractDocs(files) {
  const docs = {};
  
  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const content = await fs.readFile(file, 'utf-8');
    
    // Extract JSDoc comments
    const jsdocComments = extractJsdocComments(content);
    
    // Extract exports
    const exports = extractExports(content);
    
    // Add to docs structure
    const dir = path.dirname(relativePath);
    const category = dir.split(path.sep)[0];
    
    if (!docs[category]) {
      docs[category] = {
        name: formatCategoryName(category),
        modules: {}
      };
    }
    
    if (!docs[category].modules[dir]) {
      docs[category].modules[dir] = {
        name: formatModuleName(dir),
        files: {}
      };
    }
    
    docs[category].modules[dir].files[relativePath] = {
      name: path.basename(relativePath, path.extname(relativePath)),
      jsdocComments,
      exports
    };
  }
  
  return docs;
}

/**
 * Extract JSDoc comments from file content
 * @param content File content
 * @returns Array of JSDoc comments
 */
function extractJsdocComments(content) {
  const comments = [];
  const regex = /\/\*\*\s*\n([^*]|\*[^/])*\*\//g;
  const matches = content.match(regex);
  
  if (matches) {
    for (const match of matches) {
      // Clean up the comment
      const cleaned = match
        .replace(/\/\*\*|\*\//g, '')
        .replace(/\n\s*\*/g, '\n')
        .trim();
      
      comments.push(cleaned);
    }
  }
  
  return comments;
}

/**
 * Extract exports from file content
 * @param content File content
 * @returns Array of exports
 */
function extractExports(content) {
  const exports = [];
  
  // Match export statements
  const exportRegex = /export\s+(const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match;
  
  while ((match = exportRegex.exec(content))) {
    exports.push({
      type: match[1],
      name: match[2]
    });
  }
  
  // Match default exports
  const defaultExportRegex = /export\s+default\s+(\w+)/;
  const defaultMatch = content.match(defaultExportRegex);
  
  if (defaultMatch) {
    exports.push({
      type: 'default',
      name: defaultMatch[1]
    });
  }
  
  return exports;
}

/**
 * Format a category name for display
 * @param category Category name
 * @returns Formatted name
 */
function formatCategoryName(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Format a module name for display
 * @param modulePath Module path
 * @returns Formatted name
 */
function formatModuleName(modulePath) {
  const parts = modulePath.split(path.sep);
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' - ');
}

/**
 * Generate structured documentation content
 * @param docs Documentation object
 * @returns Markdown content
 */
function generateDocContent(docs) {
  let content = '### Auto-Generated API Documentation\n\n';
  content += 'This section is automatically generated from JSDoc comments and exports in the codebase.\n\n';
  
  // Categories
  for (const [categoryKey, category] of Object.entries(docs)) {
    content += `## ${category.name}\n\n`;
    
    // Modules
    for (const [modulePath, module] of Object.entries(category.modules)) {
      content += `### ${module.name}\n\n`;
      
      // Files
      for (const [filePath, file] of Object.entries(module.files)) {
        content += `#### ${file.name} (${filePath})\n\n`;
        
        // Exports
        if (file.exports.length > 0) {
          content += 'Exports:\n';
          for (const exp of file.exports) {
            content += `- ${exp.type} \`${exp.name}\`\n`;
          }
          content += '\n';
        }
        
        // JSDoc comments (if available and not too many)
        if (file.jsdocComments.length > 0 && file.jsdocComments.length < 10) {
          content += 'Documentation:\n';
          for (const comment of file.jsdocComments) {
            // Format the comment as a blockquote
            content += '```\n' + comment + '\n```\n\n';
          }
        }
      }
    }
  }
  
  return content;
}

/**
 * Update the documentation file with auto-generated content
 * @param filePath Documentation file path
 * @param content New content to insert
 */
async function updateDocFile(filePath, content) {
  try {
    // Read the existing file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Find the markers
    const startIndex = fileContent.indexOf(START_MARKER);
    const endIndex = fileContent.indexOf(END_MARKER);
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Markers not found in file: ${filePath}`);
    }
    
    // Replace the content between the markers
    const newContent = 
      fileContent.substring(0, startIndex + START_MARKER.length) + 
      '\n' + content + '\n' + 
      fileContent.substring(endIndex);
    
    // Write the updated file
    await fs.writeFile(filePath, newContent, 'utf-8');
    
    console.log(`Updated documentation file: ${filePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`File not found: ${filePath}. Creating new file.`);
      
      // If file doesn't exist, create it with the content
      const newContent = 
        '# Developer Documentation\n\n' +
        START_MARKER + '\n' +
        content + '\n' +
        END_MARKER;
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write the new file
      await fs.writeFile(filePath, newContent, 'utf-8');
    } else {
      throw error;
    }
  }
}

// Run the main function
main().catch(error => {
  console.error('Error generating documentation:', error);
  process.exit(1);
});