# Task Master Interactive UI

The Task Master Interactive UI provides a rich, polished terminal interface with full navigation controls, visual styling, and a comprehensive menu system.

## Overview

The interactive UI transforms Task Master from a basic command-line tool into a full-fledged terminal application with:

- **Modern Visual Design**: Colors, borders, icons, and proper spacing
- **Full Navigation**: Navigate backwards, jump to the main menu, or cancel operations at any point
- **Keyboard Shortcuts**: Comprehensive keyboard navigation with on-screen hints
- **Intuitive Workflows**: Multi-step forms with progress tracking
- **Search & Filter**: Fast search and filtering for longer lists
- **Progress Saving**: Save your work and resume later
- **Contextual Help**: Access help information without losing your context

## Getting Started

Launch the interactive UI with:

```bash
tm interactive
# or use the short alias
tm ui
```

## Navigation

The UI provides consistent navigation patterns throughout the application:

### Global Keyboard Shortcuts

| Key       | Action                 |
|-----------|------------------------|
| Esc       | Go back / Cancel       |
| Ctrl+H    | Show help overlay      |
| Ctrl+Q    | Return to main menu    |
| Tab       | Cycle through options  |
| ↑/↓       | Navigate items         |
| Enter     | Select / Confirm       |
| Ctrl+S    | Save current progress  |

### Screen-Specific Shortcuts

Each screen provides its own shortcuts, which are displayed at the bottom of the screen or in the help overlay (Ctrl+H).

### Breadcrumb Navigation

The top of the screen shows your current location in the application hierarchy, making it easy to understand where you are.

## Features

### Main Menu

The main menu provides access to all major features of Task Master:

- **Configuration**: Manage AI providers, database settings, export/import
- **Task Management**: Create, view, and manage tasks
- **Project Initialization**: Set up new Task Master projects
- **Validation**: Validate configuration settings
- **Connection Testing**: Test AI provider connections

### Multi-Tab Interfaces

Many screens feature tab-based navigation for switching between related sections without returning to a menu.

### Search & Filter

Long lists include search capabilities:

- Press `/` to enter search mode
- Type to filter items
- Results update in real-time
- Escape to exit search mode

### Auto-Complete

Text inputs support auto-completion:

- Type to see matching suggestions
- Arrow keys to navigate suggestions
- Tab to accept suggestion

### Progress Tracking

Multi-step processes include progress tracking:

- Visual indication of current step
- Percentage complete
- Ability to navigate between steps
- Save progress and resume later

### Confirmation Dialogs

Destructive actions require confirmation:

- Clear visual indication of potential consequences
- Keyboard shortcuts for quick confirmation
- Option to cancel safely

## Screen Tour

### Main Menu

The main entry point with access to all features. Press `/` to search for specific functionality.

### Configuration

A multi-tab interface for managing various settings:

- **AI Providers**: Select and configure AI providers and models
- **Database**: Configure database location and settings
- **Export/Import**: Save and load configuration

### Task Management

Create and manage tasks with an intuitive workflow:

- **Task Creation**: Step-by-step task creation with progress tracking
- **Task List**: View, sort, and filter tasks
- **Task Details**: View comprehensive task information

## Customization

The interactive UI uses a consistent theme system that can be customized:

- **Colors**: Primary, secondary, accent, and status colors
- **Spacing**: Consistent spacing units
- **Borders**: Various border styles for different containers
- **Icons**: Visual indicators for different states and actions

## Technical Details

The interactive UI is built with:

- **React**: Component-based architecture
- **Ink**: React for the terminal
- **Zustand**: State management
- **TypeScript**: Type-safe implementation

## Tips & Tricks

- Use Tab/Shift+Tab to quickly navigate between form fields
- Press Ctrl+S at any time to save your current progress
- Use keyboard number keys (1-9) to quickly switch tabs
- Press `/` in any list to filter items
- Press Ctrl+H to see all available keyboard shortcuts