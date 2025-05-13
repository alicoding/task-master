import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'cli/commands/deduplicate/lib/merger-enhanced.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace nested asChalkColor calls with a single one
const nestedPattern = /asChalkColor\(\(asChalkColor\(\(asChalkColor\(\(['"]([^'"]+)['"]\)\)\)\)\)\)/g;
const doubleNestedPattern = /asChalkColor\(\(asChalkColor\(\(['"]([^'"]+)['"]\)\)\)\)/g;

// First replace triple nested calls
content = content.replace(nestedPattern, "asChalkColor('$1')");

// Then replace double nested calls
content = content.replace(doubleNestedPattern, "asChalkColor('$1')");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed nested asChalkColor calls in merger-enhanced.ts');
