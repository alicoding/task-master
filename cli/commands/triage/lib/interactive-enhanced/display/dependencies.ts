/**
 * Task dependencies display for interactive triage mode
 */
import { ChalkColor, ChalkStyle } from '../../utils';
import { getStatusColor } from '../utils/colors';

/**
 * Display dependencies for the current task
 * @param dependencies Array of task dependencies
 * @param colorize Colorize function for styling output
 */
export function displayDependencies(dependencies: {
    direction: 'blocked' | 'blocking';
    task: {
        id: string;
        title: string;
        status: string;
    };
}[], colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): void {
    console.log(colorize(`\n┌─ Task Dependencies (${dependencies.length})`, asChalkColor(1), 'bold'));
    // Process and categorize dependencies
    const blocked = dependencies.filter(d => d.direction === 'blocked');
    const blocking = dependencies.filter(d => d.direction === 'blocking');
    if (blocked.length > 0) {
        console.log(colorize('├─ Blocked by:', asChalkColor(1)));
        blocked.forEach((dep, idx) => {
            console.log(colorize('│  ', asChalkColor(1)) +
                colorize(`${dep.task.id}: `, asChalkColor(1)) +
                dep.task.title + ' ' +
                colorize(`(${dep.task.status})`, getStatusColor(dep.task.status)));
        });
    }
    if (blocking.length > 0) {
        console.log(colorize('├─ Blocking:', asChalkColor(1)));
        blocking.forEach((dep, idx) => {
            console.log(colorize('│  ', asChalkColor(1)) +
                colorize(`${dep.task.id}: `, asChalkColor(1)) +
                dep.task.title + ' ' +
                colorize(`(${dep.task.status})`, getStatusColor(dep.task.status)));
        });
    }
    // Footer
    console.log(colorize('└' + '─'.repeat(60), asChalkColor(1)));
}
