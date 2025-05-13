/**
 * Polished task formatter with professional typography and advanced visual styling
 */

import { Task, TaskWithChildren } from '../../types';

// Import typography and colors constants
import { TYPOGRAPHY } from './typography/constants';
import { COLORS } from './colors/constants';

// Import formatter sections
import { createTitleBanner } from './sections/title-banner';
import { createSectionHeader } from './sections/section-header';
import { formatText } from './utils/text-formatter';
import { createProgressBar } from './sections/progress-bar';
import { formatReadiness } from './sections/readiness-formatter';
import { formatTagBadges } from './sections/tags-formatter';
import { formatDates } from './sections/dates-formatter';
import { formatCommandBlock, createPlaceholder } from './sections/command-block';
import { formatMetadata } from './metadata-formatter';
import { formatDoD } from './sections/dod-formatter';
import { formatTreeText, getStatusSymbol } from './tree';

// Dynamic imports for ESM compatibility
let chalk: any;
let boxen: any;

// Function to initialize dependencies
async function initDependencies() {
  try {
    const chalkModule = await import('chalk');
    chalk = chalkModule.default;
  } catch (e) {
    console.warn('Warning: chalk not available, using plain text output');
    chalk = null;
  }

  try {
    const boxenModule = await import('boxen');
    boxen = boxenModule.default;
  } catch (e) {
    console.warn('Warning: boxen not available, using plain text output');
    boxen = null;
  }
}

// Start loading dependencies in the background
const dependenciesPromise = initDependencies();

/**
 * Format a single task with polished, professional layout
 */
export async function formatPolishedTask(task: Task, options: any = {}): Promise<string> {
  // Make sure dependencies are loaded
  await dependenciesPromise;
  
  // Configuration options
  const useColor = options.useColor !== false;
  const useBoxes = options.useBoxes !== false && boxen;
  const terminalWidth = options.width || 80;
  const showMetadata = options.showMetadata === true;
  const fullContent = options.fullContent === true;
  
  // Calculate content width
  const contentWidth = terminalWidth - 6; // Account for padding and borders

  // Generate content for the card
  let content = '';

  // 1. TITLE SECTION WITH GRADIENT AND STATUS
  // ----------------------------------------
  content += await createTitleBanner(task.id, task.title, task.status, useColor, contentWidth);
  content += '\n';
  
  // 2. DESCRIPTION SECTION
  // ----------------------
  const descriptionHeader = await createSectionHeader(
    'Description',
    TYPOGRAPHY.ICONS.DESCRIPTION,
    COLORS.SECTION.DESCRIPTION,
    useColor,
    contentWidth
  );
  content += descriptionHeader + '\n';
  
  if (task.description !== undefined && task.description !== null && task.description !== '') {
    // Format description with improved typography
    content += await formatText(task.description, contentWidth, {
      indent: 2,
      maxLines: fullContent ? 0 : 5,
      truncate: true,
      showMore: true,
      useColor: useColor,
      color: COLORS.TEXT.BODY,
      style: 'normal'
    });
  } else {
    // Format placeholder with command suggestion
    content += await createPlaceholder(
      'No description provided.',
      '--description "Your description here"',
      task.id,
      useColor
    );
  }
  content += '\n';
  
  // 3. DETAILS/BODY SECTION
  // -----------------------
  const detailsHeader = await createSectionHeader(
    'Details',
    TYPOGRAPHY.ICONS.DETAILS,
    COLORS.SECTION.DETAILS,
    useColor,
    contentWidth
  );
  content += detailsHeader + '\n';
  
  if (task.body !== undefined && task.body !== null && task.body !== '') {
    // Process multiline content with proper preservation of line breaks
    const lines = task.body.split('\n');
    const formattedLinesPromises = lines.map(async (line) => {
      if (line.trim() === '') return '';
      return formatText(line, contentWidth, {
        indent: 2,
        useColor: useColor,
        color: COLORS.TEXT.BODY,
        style: 'normal'
      });
    });
    
    const formattedLines = await Promise.all(formattedLinesPromises);
    
    // Apply truncation if needed
    let formattedBody = formattedLines.join('\n');
    if (!fullContent) {
      const bodyLines = formattedBody.split('\n');
      if (bodyLines.length > 15) { // Limit to 15 lines
        const truncatedLines = bodyLines.slice(0, 15);
        const moreText = useColor && chalk
          ? chalk.hex(COLORS.TEXT.MUTED).italic(`  ${TYPOGRAPHY.ICONS.INFO} ${bodyLines.length - 15} more lines - use --full-content to show all`)
          : `  [...${bodyLines.length - 15} more lines - use --full-content to show all]`;
        
        truncatedLines.push(moreText);
        formattedBody = truncatedLines.join('\n');
      }
    }
    
    content += formattedBody;
  } else {
    // Format placeholder with command suggestion
    content += await createPlaceholder(
      'No additional details provided.',
      '--body "Your detailed information here"',
      task.id,
      useColor
    );
  }
  content += '\n';
  
  // 4. STATUS SECTION WITH BEAUTIFUL PROGRESS BAR
  // --------------------------------------------
  const statusHeader = await createSectionHeader(
    'Status',
    TYPOGRAPHY.ICONS.STATUS,
    COLORS.SECTION.STATUS,
    useColor,
    contentWidth
  );
  content += statusHeader + '\n';
  
  // Add beautiful progress bar
  content += `  ${await createProgressBar(task, contentWidth - 4, useColor)}\n`;

  // Add readiness in a styled format
  content += `  ${useColor && chalk ? chalk.hex(COLORS.TEXT.MUTED).bold('Readiness:') : 'Readiness:'} ${await formatReadiness(task.readiness, useColor)}\n`;

  // 5. DEFINITION OF DONE SECTION
  // ----------------------------
  const dodHeader = await createSectionHeader(
    'DEFINITION OF DONE',
    TYPOGRAPHY.ICONS.CHECKBOX,
    COLORS.SECTION.DESCRIPTION,
    useColor,
    contentWidth
  );
  content += dodHeader + '\n';

  // Format DoD checklist
  const dodContent = await formatDoD(task.id, useColor);

  if (dodContent) {
    content += dodContent;
  } else {
    // Format placeholder with command suggestion
    content += await createPlaceholder(
      'Definition of Done not enabled for this task.',
      `dod toggle ${task.id} --enable`,
      '',
      useColor
    );
  }
  content += '\n';

  // 6. TAGS SECTION WITH BADGES
  // --------------------------
  const tagsHeader = await createSectionHeader(
    'Tags',
    TYPOGRAPHY.ICONS.TAGS,
    COLORS.SECTION.TAGS,
    useColor,
    contentWidth
  );
  content += tagsHeader + '\n';

  // Format tags as beautiful badges
  content += `  ${await formatTagBadges(task.tags, useColor)}\n`;
  
  // 6. PARENT/CHILD RELATIONSHIPS
  // ---------------------------------
  if (task.parentId || (task as any).children?.length > 0) {
    const relationshipHeader = await createSectionHeader(
      'Relationships',
      TYPOGRAPHY.ICONS.PARENT,
      COLORS.SECTION.TITLE,
      useColor,
      contentWidth
    );
    content += relationshipHeader + '\n';

    // Format parent with link styling if exists
    if (task.parentId) {
      const parentText = useColor && chalk
        ? `  ${chalk.hex(COLORS.TEXT.MUTED).bold('Parent:')} ${chalk.hex(COLORS.TEXT.HEADER).underline(`Task ${task.parentId}`)}`
        : `  Parent: Task ${task.parentId}`;

      content += parentText + '\n';
    }

    // Format subtasks if they exist
    if ((task as any).children?.length > 0) {
      const subtasksHeader = useColor && chalk
        ? `  ${chalk.hex(COLORS.TEXT.MUTED).bold('Subtasks:')}`
        : '  Subtasks:';

      content += subtasksHeader + '\n';

      // Tree-style display with status indicators
      const children = (task as any).children as TaskWithChildren[];
      const subtaskContent = children.map((child, index) => {
        const isLast = index === children.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const statusSym = getStatusSymbol(child.status);

        return useColor && chalk
          ? `  ${chalk.gray(connector)}${
              child.status === 'done'
                ? chalk.green(statusSym)
                : child.status === 'in-progress'
                  ? chalk.yellow(statusSym)
                  : chalk.white(statusSym)
            } ${chalk.cyan(child.id)}. ${
              child.status === 'done'
                ? chalk.green(child.title)
                : child.status === 'in-progress'
                  ? chalk.yellow(child.title)
                  : chalk.white(child.title)
            }`
          : `  ${connector}${statusSym} ${child.id}. ${child.title}`;
      }).join('\n');

      content += subtaskContent + '\n';
    }
  }
  
  // 7. TIMESTAMPS IN TWO-COLUMN LAYOUT
  // ---------------------------------
  const timeHeader = await createSectionHeader(
    'Timestamps',
    TYPOGRAPHY.ICONS.TIME,
    COLORS.MUTED,
    useColor,
    contentWidth
  );
  content += timeHeader + '\n';
  
  // Format created/updated dates in two columns
  content += `  ${await formatDates(task.createdAt, task.updatedAt, useColor)}\n`;
  
  // 8. METADATA SECTION (if present and requested)
  // --------------------------------------------
  if (showMetadata && task.metadata && Object.keys(task.metadata).length > 0) {
    content += '\n';
    const metadataHeader = await createSectionHeader(
      'Metadata',
      TYPOGRAPHY.ICONS.METADATA,
      COLORS.SECTION.METADATA,
      useColor,
      contentWidth
    );
    content += metadataHeader + '\n\n';
    
    // Format metadata as a beautiful table
    content += `  ${formatMetadata(task.metadata, useColor).replace(/\n/g, '\n  ')}\n`;
  }
  
  // Apply boxen for final presentation if available
  if (useBoxes) {
    const boxTitle = useColor && chalk
      ? chalk.hex(COLORS.PRIMARY).bold('✧ TASK DETAILS ✧')
      : 'TASK DETAILS';
    
    // Configure box styling
    const boxOptions: any = {
      padding: {
        top: 0,
        bottom: 0,
        left: 2,
        right: 2
      },
      margin: {
        top: 1,
        bottom: 1
      },
      borderStyle: 'round',
      borderColor: useColor ? COLORS.PRIMARY : undefined,
      title: boxTitle,
      titleAlignment: 'center',
      width: terminalWidth,
      float: 'center'
    };
    
    return boxen(content, boxOptions);
  }
  
  // Fallback to simple presentation if boxen isn't available
  const divider = useColor && chalk 
    ? chalk.hex(COLORS.MUTED)(TYPOGRAPHY.DIVIDERS.HEAVY.repeat(terminalWidth))
    : TYPOGRAPHY.DIVIDERS.HEAVY.repeat(terminalWidth);
  
  return `\n${divider}\n${content}${divider}\n`;
}