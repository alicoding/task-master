/**
 * Capability Map Visualizer
 *
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the capability map visualizer.
 *
 * For new code, consider importing directly from the modularized implementation:
 * import { CapabilityMapVisualizer, VisualizationOptions } from './visualizers/index.ts';
 */

// Re-export everything from the modularized implementation
export { 
  CapabilityMapVisualizer, 
  VisualizationFormat, 
  VisualizationOptions 
} from './visualizers/index.ts';