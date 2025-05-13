# Task Master Wizard

The Task Master Wizard provides a comprehensive, intuitive interface for managing tasks and configuring your Task Master installation.

## Overview

Task Master now features a unified wizard experience that:

- Launches automatically when you run `tm` with no parameters
- Provides a guided setup for first-time users
- Offers a rich, interactive interface for returning users
- Combines setup and task management in one cohesive experience

## First-Time Experience

When you first run Task Master (or if no configuration is found), the wizard automatically guides you through an initial setup process:

1. **Welcome Screen**: Introduction to Task Master
2. **Database Configuration**: Choose where to store your tasks
3. **AI Provider Setup**: Configure AI capabilities (can start with mock provider)
4. **Configuration Review**: Confirm your settings
5. **Completion**: Launch into the main interface

No need to run separate setup commands - the wizard handles everything automatically.

## Main Interface

For returning users, the wizard launches directly into the main interface with these sections:

### Dashboard

The dashboard provides an overview of your tasks:
- Task counts by status
- Next tasks to work on
- Recent activity
- Quick actions

### Tasks

The tasks section allows you to manage your tasks:
- View all tasks with filtering options
- Create new tasks
- Edit existing tasks
- Mark tasks as complete
- Organize with tags and priorities

### Settings

The settings section lets you configure Task Master:
- Database settings
- AI provider configuration
- User preferences
- Appearance options

### Help

The help section provides guidance on using Task Master:
- Keyboard shortcuts
- Command documentation
- Tips and best practices

## Keyboard Navigation

The wizard supports comprehensive keyboard navigation:

- **Tab/Arrow Keys**: Navigate between elements
- **Enter**: Select/confirm
- **Escape**: Go back/cancel
- **Ctrl+Q**: Exit to command line
- **Ctrl+H**: Show help overlay
- Section-specific shortcuts:
  - **d**: Dashboard
  - **t**: Tasks
  - **s**: Settings
  - **h**: Help

## Power User Options

While the wizard provides a comprehensive interface, you can still use direct commands for quick operations:

```bash
# Using the wizard (default)
tm

# Direct commands for specific operations
tm add --title "New task"
tm show
tm update --id 123 --status done
```

## Technical Details

The wizard is built with:

- **React**: Component-based UI architecture
- **Ink**: Terminal UI framework
- **TypeScript**: Type-safe implementation

## Configuration Detection

The wizard automatically detects your setup status:

- **No Configuration**: Shows the first-time setup
- **Existing Configuration**: Goes directly to the main interface
- **Partial Configuration**: Prompts only for missing information

## Features

- **Context-Aware Flow**: Adapts based on your setup state
- **Rich Visual Interface**: Colors, borders, and spacing for readability
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
- **Intuitive Navigation**: Tab-based interface with clear sections
- **Visual Feedback**: Real-time status updates and confirmations

## Benefits

The unified wizard approach offers several advantages:

1. **Simplified Mental Model**: Just run `tm` to get started
2. **Reduced Learning Curve**: Guided experience for new users
3. **Consistent Interface**: Same experience regardless of task
4. **Progressive Disclosure**: Basic features first, advanced options available
5. **No Mode Switching**: Setup and management in one interface