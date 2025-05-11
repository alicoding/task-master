/**
 * User action prompts for interactive triage mode
 */

import readline from 'readline';
import { ChalkColor, ChalkStyle } from '../../utils.ts';

/**
 * Prompt user for action
 * @param colorize Colorize function for styling output
 * @returns User's action selection
 */
export async function promptForAction(
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const action = await new Promise<string>(resolve => {
    rl.question(colorize('Choose an action: ', 'cyan'), resolve);
  });
  
  rl.close();
  
  return action.toLowerCase();
}