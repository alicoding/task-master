// node-loaders.mjs
// TypeScript extension resolver with path alias support for Node.js
import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Base directory for the project
const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const CLI_DIR = path.join(PROJECT_ROOT, 'cli');
const CORE_DIR = path.join(PROJECT_ROOT, 'core');

/**
 * Custom ESM loader to resolve .ts extensions and path aliases in imports
 */
export async function resolve(specifier, context, nextResolve) {
  const { parentURL } = context;

  // Handle @ path alias imports
  if (specifier.startsWith('@/')) {
    // Convert the @ path to a file path relative to the src directory
    const relativePath = specifier.slice(2); // Remove the '@/'

    // First try in src directory
    const srcFullPath = path.join(SRC_DIR, relativePath);

    // Try with .ts extension in src
    const srcTsPath = `${srcFullPath}.ts`;
    if (fs.existsSync(srcTsPath)) {
      return {
        url: pathToFileURL(srcTsPath).href,
        shortCircuit: true
      };
    }

    // Try as directory with index.ts in src
    const srcIndexPath = path.join(srcFullPath, 'index.ts');
    if (fs.existsSync(srcIndexPath)) {
      return {
        url: pathToFileURL(srcIndexPath).href,
        shortCircuit: true
      };
    }

    // If it starts with cli/ also look in the CLI directory
    if (relativePath.startsWith('cli/')) {
      const cliRelativePath = relativePath.substring(4); // Remove 'cli/'
      const cliFullPath = path.join(CLI_DIR, cliRelativePath);

      // Try with .ts extension in cli
      const cliTsPath = `${cliFullPath}.ts`;
      if (fs.existsSync(cliTsPath)) {
        return {
          url: pathToFileURL(cliTsPath).href,
          shortCircuit: true
        };
      }

      // Try as directory with index.ts in cli
      const cliIndexPath = path.join(cliFullPath, 'index.ts');
      if (fs.existsSync(cliIndexPath)) {
        return {
          url: pathToFileURL(cliIndexPath).href,
          shortCircuit: true
        };
      }
    }

    // If it starts with core/ also look in the CORE directory
    if (relativePath.startsWith('core/')) {
      const coreRelativePath = relativePath.substring(5); // Remove 'core/'
      const coreFullPath = path.join(CORE_DIR, coreRelativePath);

      // Try with .ts extension in core
      const coreTsPath = `${coreFullPath}.ts`;
      if (fs.existsSync(coreTsPath)) {
        return {
          url: pathToFileURL(coreTsPath).href,
          shortCircuit: true
        };
      }

      // Try as directory with index.ts in core
      const coreIndexPath = path.join(coreFullPath, 'index.ts');
      if (fs.existsSync(coreIndexPath)) {
        return {
          url: pathToFileURL(coreIndexPath).href,
          shortCircuit: true
        };
      }
    }

    // Try the path as-is (might be a directory or have another extension)
    if (fs.existsSync(srcFullPath)) {
      return {
        url: pathToFileURL(srcFullPath).href,
        shortCircuit: true
      };
    }
  }

  // Handle direct .ts file imports
  if (specifier.endsWith('.ts')) {
    return {
      url: specifier.startsWith('file:')
        ? specifier
        : pathToFileURL(specifier).href,
      shortCircuit: true
    };
  }

  // For imports without extensions, try to resolve to .ts files
  if (parentURL &&
      !specifier.startsWith('node:') &&
      !specifier.startsWith('http:') &&
      !specifier.startsWith('https:') &&
      !specifier.includes('node_modules') &&
      !specifier.match(/\.(js|json|node|mjs)$/)) {

    // Convert URL to file path for the parent module
    const parentPath = fileURLToPath(parentURL);
    const parentDir = path.dirname(parentPath);

    // Try to resolve with .ts extension
    const possibleTsPath = path.resolve(parentDir, `${specifier}.ts`);

    if (fs.existsSync(possibleTsPath)) {
      return {
        url: pathToFileURL(possibleTsPath).href,
        shortCircuit: true
      };
    }

    // Try to resolve as a directory index file
    const possibleIndexPath = path.resolve(parentDir, specifier, 'index.ts');

    if (fs.existsSync(possibleIndexPath)) {
      return {
        url: pathToFileURL(possibleIndexPath).href,
        shortCircuit: true
      };
    }
  }

  // Fall back to standard Node.js resolution
  return nextResolve(specifier);
}

/**
 * Load hook to handle TypeScript files
 */
export async function load(url, context, nextLoad) {
  // Pass through to the default loader
  return nextLoad(url, context);
}