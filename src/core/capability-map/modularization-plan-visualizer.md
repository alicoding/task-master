# Modularization Plan for visualizer.ts

## 1. Directory Structure

```
core/capability-map/
├── visualizers/
│   ├── index.ts                 # Re-exports the visualizer class and types
│   ├── options.ts               # Types for visualization options
│   ├── utils/
│   │   ├── index.ts             # Re-exports utility functions
│   │   ├── colors.ts            # Color-related utility functions
│   │   ├── formatting.ts        # Text formatting utilities
│   │   ├── wrapping.ts          # Text wrapping utilities
│   ├── renderers/
│   │   ├── index.ts             # Re-exports all renderers
│   │   ├── base-renderer.ts     # Base renderer class
│   │   ├── text-renderer.ts     # Text visualization renderer
│   │   ├── mermaid-renderer.ts  # Mermaid diagram renderer
│   │   ├── dot-renderer.ts      # DOT/Graphviz renderer
│   │   ├── json-renderer.ts     # JSON output renderer
```

## 2. Module Breakdown

### 2.1. `options.ts`
- Define common types and interfaces:
  - `VisualizationFormat`
  - `VisualizationOptions`

### 2.2. Utils Modules

#### 2.2.1. `utils/colors.ts`
- `getColorForConfidence()`
- `getNodeColorByTypeAndConfidence()`
- `adjustColorSaturation()`

#### 2.2.2. `utils/formatting.ts`
- `getDotEdgeStyle()`

#### 2.2.3. `utils/wrapping.ts`
- `wrapText()`

### 2.3. Renderer Modules

#### 2.3.1. `renderers/base-renderer.ts`
- Abstract base renderer class with common functionality

#### 2.3.2. `renderers/text-renderer.ts`
- Responsible for text-based visualization
- Implements `renderTextVisualization()`

#### 2.3.3. `renderers/mermaid-renderer.ts`
- Responsible for Mermaid.js diagrams
- Implements `renderMermaidDiagram()`

#### 2.3.4. `renderers/dot-renderer.ts`
- Responsible for DOT syntax generation
- Implements `renderDotDiagram()`

#### 2.3.5. `renderers/json-renderer.ts`
- Responsible for JSON output
- Implements `renderJsonOutput()`

### 2.4. Main Module

#### 2.4.1. `visualizers/index.ts`
- Re-exports types from options.ts
- Define and export the main `CapabilityMapVisualizer` class
- Contains the `visualize()` method that selects the appropriate renderer

## 3. Implementation Strategy

1. Create the directory structure
2. Extract common types to options.ts
3. Extract utility functions to respective modules
4. Create the base renderer class
5. Implement specialized renderers
6. Update the main visualizer class to use the renderers
7. Update imports/exports to maintain the same public API
8. Test to ensure everything works as before