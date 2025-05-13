/**
 * Task dependencies display for interactive triage mode
 */

import { ChalkColor, ChalkStyle } from '../../utils';
import { getStatusColor } from '../utils/colors';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Display dependencies for the current task
 * @param dependencies Array of task dependencies
 * @param colorize Colorize function for styling output
 */
export function displayDependencies(
  dependencies: {
    direction: 'blocked' | 'blocking';
    task: {
      id: string;
      title: string;
      status: string;
    }
  }[],
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize(`\n┌─ Task Dependencies (${dependencies.length})`, asChalkColor((asChalkColor(('cyan' as ChalkColor)))), asChalkColor('bold')));

  // Process and categorize dependencies
  const blocked = dependencies.filter(d => d.direction === 'blocked');
  const blocking = dependencies.filter(d => d.direction === 'blocking');

  if (blocked.length > 0) {
    console.log(colorize('├─ Blocked by:', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
    blocked.forEach((dep, idx) => {
      console.log(colorize('│  ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) +
                  colorize(`${dep.task.id}: `, asChalkColor((asChalkColor(('red' as ChalkColor))))) +
                  dep.task.title + ' ' +
                  colorize(`(${dep.task.status})`, getStatusColor(dep.task.status)));
    });
  }

  if (blocking.length > 0) {
    console.log(colorize('├─ Blocking:', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
    blocking.forEach((dep, idx) => {
      console.log(colorize('│  ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) +
                  colorize(`${dep.task.id}: `, asChalkColor((asChalkColor(('yellow' as ChalkColor))))) +
                  dep.task.title + ' ' +
                  colorize(`(${dep.task.status})`, getStatusColor(dep.task.status)));
    });
  }

  // Footer
  console.log(colorize('└' + '─'.repeat(60), asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
}