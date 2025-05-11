# Task Content Display

This document describes the enhanced Task Master CLI display for task descriptions and body content.

## Overview

Task Master now provides dedicated sections for task descriptions and body content, ensuring these essential fields are always visible in the user interface, even when they're empty. This enhancement creates a more consistent UI experience and makes users aware of these available fields.

## Content Sections

### Description Section

The Description section provides a brief overview of the task's purpose:

- **Always Visible**: The section appears even when empty
- **Placeholder Text**: Shows "No description provided" when empty
- **Intelligent Truncation**: For long descriptions, shows first 5 lines with a "more lines" indicator
- **Proper Formatting**: Text is wrapped nicely to fit the terminal width
- **Visual Indicators**: Uses 📝 icon and consistent styling

### Details/Body Section

The Details section provides comprehensive information about the task:

- **Always Visible**: The section appears even when empty
- **Placeholder Text**: Shows "No additional details provided" when empty
- **Line Break Preservation**: Maintains the intended formatting of the content
- **Intelligent Truncation**: For long content, shows first 15 lines with a "more lines" indicator
- **Visual Indicators**: Uses 📄 icon and consistent styling

## Usage Examples

```bash
# View a task with the enhanced content sections
tm show 42

# View a task with all content (no truncation)
tm show 42 --full-content
```

## Adding Content

The placeholder text in empty sections includes instructions for adding content:

```bash
# Add a description to an existing task
tm update --id 42 --description "A clear description of the task"

# Add body content to an existing task
tm update --id 42 --body "Detailed information about the task\nCan include multiple lines"
```

## Content Truncation

For readability in the terminal, long content is truncated by default:

- **Description**: Limited to 5 lines
- **Body**: Limited to 15 lines

When content exceeds these limits, you'll see a "more lines" indicator:
```
[...X more lines - use --full-content to show all]
```

To view all content without truncation:
```bash
tm show 42 --full-content
```

## Styling Features

The content sections feature:

- **Consistent Borders**: Matching the overall task display style
- **Clear Headers**: Distinct section headers with icons
- **Proper Indentation**: Content is properly indented for readability
- **Visual Separation**: Adequate spacing between sections
- **Placeholder Styling**: Dim styling for placeholder text

## Technical Implementation

The enhanced content display includes:

- **Word Wrapping**: Proper text wrapping that respects terminal width
- **Line Break Handling**: Preserves intended line breaks in content
- **Terminal Width Detection**: Adjusts formatting based on available space
- **Resilient Formatting**: Handles large content without breaking the UI
- **Consistent Placeholders**: Clear indicators for empty fields
- **Truncation Indicators**: Clear indicators when content is truncated