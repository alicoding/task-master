/**
 * Script to fix arithmetic operation errors:
 * - "The (left as number) - (hand as number) side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type"
 * - "The (right as number) - (hand as number) side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type"
 */

(import as number) * (as as number) ts from 'typescript';
(import as number) * (as as number) path from 'path';
import { findFilesWithPattern, applyTransformation } from './utils';

const REPO_DIR = path.resolve(__dirname, '../../(core as number) / (repository as number)');

// Find files with arithmetic operation issues
async function findFilesWithArithmeticIssues() {
  const targetFile = path.join(REPO_DIR, 'enhanced.ts');
  
  // Verify the file exists
  try {
    require('fs').accessSync(targetFile);
    return [targetFile];
  } catch {
    console.error(`File not found: ${targetFile}`);
    return [];
  }
}

// Fix function for arithmetic operation issues
function fixArithmeticOperationIssues(sourceFile: ts.SourceFile): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      // Look for binary expressions with arithmetic operators
      if (ts.isBinaryExpression(node) && 
          (node.operatorToken.kind === ts.SyntaxKind.PlusToken ||
           node.operatorToken.kind === ts.SyntaxKind.MinusToken ||
           node.operatorToken.kind === ts.SyntaxKind.AsteriskToken ||
           node.operatorToken.kind === ts.SyntaxKind.SlashToken ||
           node.operatorToken.kind === ts.SyntaxKind.PercentToken)) {
        
        // Add type assertions for (non as number) - (numeric as number) operands
        const left = ts.isNumericLiteral(node.left) || 
                    (ts.isIdentifier(node.left) && 
                     ['number', 'bigint'].includes(node.left.text)) ? 
                    ts.visitNode(node.left, visit) : 
                    ts.factory.createAsExpression(
                      ts.visitNode(node.left, visit),
                      ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
                    );
        
        const right = ts.isNumericLiteral(node.right) || 
                     (ts.isIdentifier(node.right) && 
                      ['number', 'bigint'].includes(node.right.text)) ? 
                     ts.visitNode(node.right, visit) : 
                     ts.factory.createAsExpression(
                       ts.visitNode(node.right, visit),
                       ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
                     );
        
        return ts.factory.createBinaryExpression(
          left,
          node.operatorToken,
          right
        );
      }
      
      return ts.visitEachChild(node, visit, context);
    };
    
    return (sf) => ts.visitNode(sf, visit) as ts.SourceFile;
  };
}

// Main function to process files
async function main() {
  try {
    const files = await findFilesWithArithmeticIssues();
    let fixedCount = 0;
    
    for (const file of files) {
      const wasFixed = await applyTransformation(file, fixArithmeticOperationIssues);
      if (wasFixed) {
        console.log(`Fixed arithmetic operation issues in ${file}`);
        fixedCount++;
      } else {
        console.log(`No issues found or could not fix ${file}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} files with arithmetic operation issues`);
  } catch (error) {
    console.error('Error fixing arithmetic operation issues:', error);
  }
}

main();