// node-loaders.mjs
// Simple TypeScript extension resolver for Node.js
import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

/**
 * Custom ESM loader to resolve .ts extensions in imports
 */
export async function resolve(specifier, context, nextResolve) {
  const { parentURL } = context;

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