# Task Master Enhanced UI

This document describes the UI enhancements added to Task Master CLI to improve the visual appeal and readability of task output.

## Overview

The Task Master CLI now features significantly improved visual formatting for all task displays, including:

1. **Enhanced Task View**: Individual tasks now display in boxed sections with clear separation between different information types
2. **Formatted Task Lists**: Task lists now appear in properly aligned tables with improved readability
3. **Enhanced Graph View**: The hierarchy display now uses box-drawing characters and improved visual indicators
4. **Color-Coded Status**: Task status and readiness are now color-coded for quick visual reference
5. **Flexible Terminal Compatibility**: Options to adjust formatting for different terminal capabilities

## New Commands and Options

### Show Command Enhancements

The `show` command now supports these additional options:

```bash
# Show a task with enhanced boxed formatting
tm show 42

# Show tasks with table formatting
tm show

# Show tasks with compact formatting
tm show --compact

# Disable color for terminals with limited color support
tm show --no-color

# Disable box drawing for simple terminal compatibility
tm show --no-boxes

# Use compatibility mode for very limited terminals
tm show --compatibility-mode

# Show task with metadata included
tm show 42 --show-metadata

# Hide task description in output
tm show 42 --hide-description
```

### Graph Command Enhancements

The `show graph` command now supports these additional options:

```bash
# Show graph with enhanced tree formatting (default)
tm show graph

# Show graph with enhanced tree formatting explicitly
tm show graph --text-style enhanced

# Show graph with compatibility mode for limited terminals
tm show graph --compatibility-mode

# Show graph with compact layout
tm show graph --text-style compact

# Show graph with detailed information
tm show graph --text-style detailed
```

## Visual Features

### Status Indicators

Task statuses are visually distinguished:

- **Todo**: □ (white)
- **In Progress**: ▶ (yellow)
- **Done**: ✓ (green)

### Readiness Indicators

Task readiness states are visually distinguished:

- **Draft**: ✎ (blue)
- **Ready**: ▣ (magenta)
- **Blocked**: ⚠ (red)

### Layout Improvements

- **Boxed Sections**: Task details are organized in visually separated sections
- **Table Formatting**: Task lists use proper column alignment
- **Hierarchical Structure**: Tree views use box-drawing characters to show relationships
- **Progress Indicators**: Visual indicators show task completion status
- **Color Coding**: Consistent color scheme for different task elements

## Terminal Compatibility

For terminals with limited formatting capabilities, you can use these options:

1. `--no-color`: Disable colored output
2. `--no-boxes`: Disable box drawing characters
3. `--no-tables`: Disable table formatting
4. `--no-unicode`: Disable Unicode characters
5. `--compatibility-mode`: Enable all compatibility options at once

## Examples

### Individual Task View

The enhanced task view organizes information in clearly separated sections:

- Task ID and title in a header box
- Description and body content in a content box
- Status, readiness, and tags in a status box
- Timestamps in a dates box
- Metadata in a separate section when requested

### Task List View

The enhanced task list view shows:

- Properly aligned columns with headers
- Truncated long titles with ellipsis
- Color-coded status and tags
- Description preview when space allows

### Graph View

The enhanced graph view features:

- Clear hierarchy using box-drawing characters
- Color-coded task status and readiness
- Improved indentation for better readability
- Tag previews on the same line as tasks
- Description previews for important context