import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'cli/commands/deduplicate/lib/formatter-enhanced.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace pattern: asChalkColor(('color')) with asChalkColor('color')
const pattern = /asChalkColor\(\((['"][^'"]+['"]\))\)/g;
content = content.replace(pattern, "asChalkColor($1");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed asChalkColor patterns in formatter-enhanced.ts');
