import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory path in ESM format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../');
const targetFiles = [
  path.join(rootDir, 'cli/commands/search/search-handler.ts'),
  path.join(rootDir, 'cli/commands/search/search-handler-clean.ts')
];

async function updateFunctionSignature(filePath) {
  console.log(`Updating function signature in ${path.basename(filePath)}...`);
  
  try {
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Function to update
    const functionName = 'displaySearchExplanation';
    
    // Find the function declaration
    const functionRegex = new RegExp(`function ${functionName}\\([^)]*\\)`, 'g');
    const match = content.match(functionRegex);
    
    if (!match || match.length === 0) {
      console.log(`Function ${functionName} not found in ${path.basename(filePath)}.`);
      return;
    }
    
    // Check if the function signature already includes boolean | undefined
    if (content.includes('useFuzzy: boolean | undefined')) {
      console.log(`Function signature already updated in ${path.basename(filePath)}.`);
      return;
    }
    
    // Update the function signature to accept boolean | undefined
    const updatedContent = content.replace(
      functionRegex,
      (match) => {
        return match.replace('useFuzzy: boolean', 'useFuzzy: boolean | undefined');
      }
    );
    
    // Write the updated content back to the file
    await fs.writeFile(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully updated function signature in ${path.basename(filePath)}.`);
  } catch (error) {
    console.error(`Error updating function in ${path.basename(filePath)}:`, error);
  }
}

async function fixSearchHandlerParams() {
  console.log('Fixing search handler parameters...');
  
  for (const file of targetFiles) {
    await updateFunctionSignature(file);
  }
  
  console.log('Search handler parameter fixes complete.');
}

// Run the function
fixSearchHandlerParams();