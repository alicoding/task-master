# Enhanced Visualizer Modularization Plan

The `enhanced-visualizer.ts` file (1814 lines) needs to be broken down into smaller, focused components.

## Directory Structure

```
core/capability-map/
  ├── visualizers/
  │   ├── index.ts                         # Export all visualizer components
  │   ├── options.ts                       # Shared visualization options interface
  │   ├── enhanced/
  │   │   ├── index.ts                     # Main enhanced visualizer class
  │   │   ├── text-renderer.ts             # Text-based visualization
  │   │   ├── mermaid-renderer.ts          # Mermaid diagram renderer
  │   │   ├── dot-renderer.ts              # DOT (GraphViz) renderer
  │   │   └── json-renderer.ts             # JSON output renderer
  │   └── utils/
  │       ├── progress.ts                  # Progress calculation utilities
  │       ├── formatting.ts                # Text formatting utilities
  │       ├── grouping.ts                  # Node grouping utilities
  │       ├── naming.ts                    # Name normalization utilities
  │       ├── styles.ts                    # Visual styling utilities
  │       └── progress-bar.ts              # Progress bar rendering
  │
  └── types/                              # (Keep existing types or move here)
      └── index.ts                        # Export capability map types
```

## Component Breakdown

### 1. options.ts
- EnhancedVisualizationOptions interface (lines 17-38)

### 2. index.ts (enhanced/ directory)
- Main EnhancedCapabilityMapVisualizer class
- Core visualization method selecting the appropriate renderer
- Import and use the renderers from respective modules

### 3. text-renderer.ts
- renderEnhancedTextVisualization method (lines 76-443)
- renderFocusedCapability method (lines 453-583)
- renderTaskDetails method (lines 592-681)

### 4. mermaid-renderer.ts
- renderEnhancedMermaidDiagram method (lines 1265-1272)
- renderMermaidDiagram method (lines 1280-1450)

### 5. dot-renderer.ts
- renderEnhancedDotDiagram method (lines 1458-1465)
- renderDotDiagram method (lines 1473-1641)
- getEdgeStyle method (lines 1661-1700)

### 6. json-renderer.ts
- renderEnhancedJsonOutput method (lines 1709-1779)

### 7. utils/progress.ts
- getCapabilityProgress method (lines 757-765)
- getProgressStatus method (lines 772-777)
- calculateOverallProgress method (lines 1242-1257)
- getColorForProgress method (lines 796-801)
- getProgressColor method (lines 1648-1654)

### 8. utils/formatting.ts
- formatRelationshipType method (lines 808-823)
- formatGroupName method (lines 830-844)
- getTypeLabel method (lines 904-912)
- wrapText method (lines 1788-1814)

### 9. utils/grouping.ts
- createHierarchicalGroups method (lines 1026-1041)
- createRelationshipBasedGroups method (lines 1045-1129)
- createDomainBasedGroups method (lines 1134-1236)

### 10. utils/naming.ts
- normalizeCapabilityNames method (lines 969-1018)
- enhanceDescription method (lines 851-897)
- getCategoryIcon method (lines 921-962)

### 11. utils/styles.ts
- getColoredStatusIndicator method (lines 784-789)
- getProgressColoredText method (lines 745-750)

### 12. utils/progress-bar.ts
- renderProgressBar method (lines 690-737)

## Implementation Strategy

1. Create the directory structure
2. Extract shared interfaces and types
3. Implement utility modules first (they have fewer dependencies)
4. Implement renderers with dependencies on utilities
5. Create the main visualizer class that uses all components
6. Update imports and exports
7. Test each component independently
8. Test the full integration