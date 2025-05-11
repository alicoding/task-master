# Enhanced Task Display

This document describes the improved individual task display in Task Master CLI, which provides a more cohesive, professional layout for viewing task details.

## Overview

The enhanced task display features a unified, well-structured layout with clear visual organization of task information. Key improvements include:

1. **Unified Layout**: A single cohesive box with consistent styling and integrated sections
2. **Dedicated Content Sections**: Clear sections for description and body content
3. **Integrated Progress Visualization**: Progress bar that complements status information
4. **Visual Hierarchy**: Clear section headers with icons and consistent styling
5. **Optimized Spacing**: Reduced vertical space while maintaining readability

## Display Features

### Task Header
- Prominent task ID and title at the top
- Color-coded based on task status
- Clear visual separation from content sections

### Description & Body Sections
- Dedicated "DESCRIPTION" section that properly displays the task description
- Separate "DETAILS" section for longer body content
- Text wrapping with proper indentation
- Placeholder text when content is empty

### Status & Progress
- Status indicators with consistent symbols and colors
- Integrated progress bar showing completion percentage
- Readiness information with appropriate visual styling
- Compact layout that groups related information

### Tags & Relationships
- Tags displayed as visual badges
- Parent/child relationships clearly indicated
- Visual separators between logical sections

### Timestamps & Metadata
- Timestamps in a user-friendly format
- Metadata displayed in a structured table
- Consistent visual treatment of auxiliary information

## Usage

### Basic Task View
```bash
# Show a task with the enhanced unified layout (default)
tm show 42
```

### Layout Options
The task display supports three layout styles:

```bash
# Enhanced unified layout (default)
tm show 42 --task-style enhanced

# Classic boxed layout with separate sections
tm show 42 --task-style boxed

# Simple plain text layout
tm show 42 --task-style simple
```

### Display Options

```bash
# Show task with metadata included
tm show 42 --show-metadata

# Disable colored output
tm show 42 --no-color

# Disable box drawing
tm show 42 --no-boxes

# Compatibility mode for limited terminals
tm show 42 --compatibility-mode
```

## Visual Elements

### Status Indicators
- **Todo**: □ (white)
- **In Progress**: ▶ (yellow)
- **Done**: ✓ (green)

### Readiness Indicators
- **Draft**: ✎ (blue)
- **Ready**: ▣ (magenta)
- **Blocked**: ⚠ (red)

### Section Icons
- 📋 Task
- 📝 Description
- 📄 Details
- ⚡ Status
- 📊 Progress
- 🏷️ Tags
- ⬆️ Parent
- 🕒 Time
- 🔍 Metadata

## Layout Structure

The enhanced task view follows this general structure:

```
┌─────────────────── TASK DETAILS ───────────────────┐
│                                                    │
│ 📋 Task 42: Example Task Title                     │
│                                                    │
│ 📝 DESCRIPTION                                     │
│   This is a brief description of the task that     │
│   explains its purpose and context.                │
│                                                    │
│ 📄 DETAILS                                         │
│   More detailed information about the task with    │
│   specific requirements, steps, or notes.          │
│   Multiple paragraphs can be included here.        │
│                                                    │
│ ⚡ STATUS                                           │
│   ▶ IN PROGRESS                                    │
│   [██████████░░░░░░░░░░] 50%                       │
│   Readiness: ▣ READY                               │
│                                                    │
│ 🏷️ TAGS                                            │
│     UI    backend    important                     │
│                                                    │
│ ⬆️ RELATIONSHIPS                                    │
│   Parent: 23                                       │
│                                                    │
│ 🕒 TIMESTAMPS                                       │
│   Created: May 10, 2024, 09:45 AM                  │
│   Updated: May 15, 2024, 02:30 PM                  │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Terminal Compatibility

The enhanced task display is designed to work well across different terminal environments:

- **Modern Terminals**: Full experience with colors, Unicode, and box drawing
- **Basic Terminals**: Graceful fallback with simplified formatting
- **Plain Text**: Option to disable all formatting features while maintaining structure

## Technical Implementation

The task display uses:
- Terminal width detection for adaptive layout
- Text wrapping for optimal content display
- Unicode box-drawing characters for visual structure
- Color coding for status and emphasis
- Vertical spacing optimization
- Content truncation when appropriate