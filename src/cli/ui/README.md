# Task Master Interactive UI

This directory contains the interactive terminal UI for Task Master, built with React and Ink.

## Quick Start

Launch the interactive UI with:

```bash
npm run dev -- interactive
# or use the short alias
npm run dev -- ui
```

## Directory Structure

- **components/**: Reusable UI components
- **constants/**: UI constants and definitions
- **context/**: State management and contexts
- **hooks/**: Custom React hooks
- **screens/**: Individual screen components
- **utils/**: Utility functions

## Available Screens

The demonstration includes these screens:

- **Main Menu**: Entry point with access to all features
- **Configuration Menu**: Hub for configuration options
- **AI Configuration**: Detailed AI provider setup with model selection
- **Task Creation**: Multi-step task creation form

## Navigation

### Keyboard Shortcuts

- **Esc**: Go back to previous screen
- **Ctrl+H**: Show help overlay
- **Ctrl+Q**: Return to main menu from anywhere
- **Tab/Shift+Tab**: Navigate between form fields
- **Arrow keys**: Navigate options
- **Enter**: Select/confirm
- **Ctrl+S**: Save current progress

## Components

The UI is built from these core components:

- **Layout**: Main layout with header, footer, and content
- **Menu**: Interactive menu with filtering and search
- **TextInput**: Enhanced text input with autocomplete
- **Button**: Styled button with multiple variants
- **Tabs**: Tab navigation component
- **Progress**: Multi-step progress tracking
- **ConfirmDialog**: Confirmation dialog for destructive actions
- **StatusBar**: Status notifications and feedback
- **HelpOverlay**: Contextual help and keyboard shortcuts

## State Management

Navigation state is managed using Zustand, providing:

- Screen navigation (forward/back)
- Breadcrumb tracking
- Navigation history
- Parameter passing between screens

## Styling

The UI uses a consistent theme system defined in `constants/theme.ts`:

- Color palette
- Spacing units
- Border styles
- Icons
- UI dimensions

## Adding New Screens

To add a new screen:

1. Create a new component in the `screens/` directory
2. Add the screen to the `Screen` enum in `constants/screens.ts`
3. Add screen information to `SCREEN_INFO` in `constants/screens.ts`
4. Add the screen to the `renderCurrentScreen` function in `App.tsx`

## Development

Build or modify components using React and Ink APIs. Refer to the following resources:

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Extending

This UI framework can be extended with additional features:

- Persistent state using file-based storage
- Advanced form validation
- Animation and transitions
- Custom component creation
- Theme customization