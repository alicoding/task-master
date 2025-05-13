/**
 * Progress bar rendering utilities for capability map visualization
 * 
 * This module provides utility functions for rendering progress bars
 * in capability map visualizations.
 */

import chalk from 'chalk';
import { getProgressColoredText } from '@/core/capability-map/visualizers/utils/styles';

/**
 * Render a progress bar with color gradients
 * @param progress Progress percentage (0-100)
 * @param width Total width of the progress bar
 * @param useColor Whether to use color
 * @returns Formatted progress bar
 */
export function renderProgressBar(
  progress: number,
  width: number,
  useColor: boolean
): string {
  const barWidth = Math.max(10, width - 10);
  const filledWidth = Math.floor(barWidth * progress / 100);
  const emptyWidth = barWidth - filledWidth;

  if (useColor) {
    // Instead of using a single color for the whole bar, use a gradient based on progress
    let filled = '';

    // For very low progress, use only red
    if (progress < 20) {
      filled = chalk.red('█'.repeat(filledWidth));
    }
    // For low progress, use red to yellow gradient
    else if (progress < 50) {
      const redPortion = Math.floor(filledWidth * 0.7);
      const yellowPortion = filledWidth - redPortion;
      filled = chalk.red('█'.repeat(redPortion)) + chalk.yellow('█'.repeat(yellowPortion));
    }
    // For medium progress, use yellow to cyan gradient
    else if (progress < 80) {
      const yellowPortion = Math.floor(filledWidth * 0.4);
      const cyanPortion = filledWidth - yellowPortion;
      filled = chalk.yellow('█'.repeat(yellowPortion)) + chalk.cyan('█'.repeat(cyanPortion));
    }
    // For high progress, use cyan to green gradient
    else {
      const cyanPortion = Math.floor(filledWidth * 0.3);
      const greenPortion = filledWidth - cyanPortion;
      filled = chalk.cyan('█'.repeat(cyanPortion)) + chalk.green('█'.repeat(greenPortion));
    }

    const empty = chalk.gray('░'.repeat(emptyWidth));

    // Also color the percentage based on progress level
    const coloredPercent = getProgressColoredText(progress, `${progress}%`);

    return `${filled}${empty} ${coloredPercent}`;
  } else {
    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    return `${filled}${empty} ${progress}%`;
  }
}