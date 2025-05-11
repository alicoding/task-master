# Polished Task Display

The Polished Task Display is a premium visual formatting system for Task Master CLI that provides a professional-grade display for individual tasks. This document outlines the features, styling, and usage of this enhanced display format.

## Overview

The Polished Task Display was designed to create a cohesive, visually appealing presentation with careful attention to typography, spacing, and visual hierarchy. It's now the default task style in Task Master.

## Features

- **Gradient Title Banner**: Titles are displayed with beautiful color gradients based on task status
- **Professional Typography**: Consistent use of Unicode symbols and characters for visual hierarchy
- **Section Headers**: Each section has a distinct, visually appealing header with icons
- **Enhanced Progress Visualization**: Status is displayed with elegant progress bars and visual indicators
- **Tag Badges**: Tags are displayed as visually appealing badges
- **Two-Column Layout**: Dates and other paired information are displayed in space-efficient columns
- **Helpful Placeholders**: Empty sections include command suggestions for adding content
- **Intelligent Truncation**: Long content is intelligently truncated with "more lines" indicators
- **Metadata Table**: Metadata is formatted as a clean, professional table when displayed

## Display Sections

The display includes the following sections:

1. **Title Banner**: Task ID and title with gradient based on status
2. **Description**: Task description with helpful placeholder if empty
3. **Details**: Body content with support for multi-line text
4. **Status**: Visual progress bar and readiness indicator
5. **Tags**: Styled badges for each tag
6. **Relationships**: Parent task information if applicable
7. **Timestamps**: Creation and update timestamps in a two-column layout
8. **Metadata**: Optional table of key-value metadata (shown with `--show-metadata`)

## Usage

The Polished Task Display is now the default format when viewing individual tasks:

```bash
# View a specific task with polished formatting (default)
tm show 42

# Explicitly specify polished format
tm show 42 --task-style polished

# Show all content without truncation
tm show 42 --full-content

# Include metadata in the display
tm show 42 --show-metadata
```

## Configuration Options

The following options affect the Polished Task Display:

- `--task-style polished` - Use the polished task display (default)
- `--full-content` - Show all content without truncation for long text
- `--show-metadata` - Include metadata section
- `--color` / `--no-color` - Enable/disable color output
- `--boxes` / `--no-boxes` - Enable/disable box drawing

## Visual Elements

The Polished Task Display uses a variety of visual elements to create a rich, informative interface:

- **Status Colors**: todo (blue), in-progress (yellow), done (green)
- **Typography Symbols**: Elegant Unicode symbols for status indicators and dividers
- **Section Icons**: Professional icons for each section type
- **Badge Styling**: Visually distinct badges for tags
- **Progress Bars**: Gradient-colored progress bars showing completion status
- **Box Drawing**: Professional terminal UI with rounded corners and consistent styling

## Compatibility

The Polished Task Display automatically adapts to different terminal capabilities:

- Falls back to simpler formatting if advanced libraries are not available
- Adapts to the terminal width for responsive layout
- Support for light and dark terminal themes
- Degrades gracefully when color or box drawing is disabled

## Example Output

When displaying a task with the Polished Task Display:

```
✧ TASK DETAILS ✧
╭──────────────────────────────────────────────────────────────────────────────╮
│  ● Task 42                                                                   │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  Implement polished task formatter                                           │
│                                                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄ 📝 DESCRIPTION ┄┄┄┄┄┄┄┄┄┄┄┄┄                                  │
│                                                                              │
│  Create a polished, professional CLI display for tasks with careful          │
│  attention to typography, spacing, and visual elements.                      │
│                                                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ 📄 DETAILS ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄                                   │
│                                                                              │
│  This implementation should include:                                         │
│  - Gradient text for titles                                                  │
│  - Professional typography and symbols                                       │
│  - Well-designed section headers                                             │
│  - Beautiful progress visualization                                          │
│  - Tag badges with consistent styling                                        │
│  - Helpful placeholder text with command examples                            │
│                                                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ⚙ STATUS ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄                                     │
│                                                                              │
│  ● COMPLETED                                                                 │
│    █████████████████████████████████████████ 100%                           │
│                                                                              │
│  Readiness: ◉ READY                                                         │
│                                                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ 🏷 TAGS ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄                                    │
│                                                                              │
│   ui  formatting  enhancement                                                │
│                                                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄ ⏱ TIMESTAMPS ┄┄┄┄┄┄┄┄┄┄┄┄┄                                    │
│                                                                              │
│  ⊕ Created: May 9, 2023, 2:15 PM    ⟳ Updated: May 10, 2023, 4:30 PM        │
╰──────────────────────────────────────────────────────────────────────────────╯
```

## Development

The Polished Task Display is implemented in `/core/graph/formatters/polished-task.ts` and dynamically adapts to available libraries for optimal formatting.