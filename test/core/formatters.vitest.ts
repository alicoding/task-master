import { describe, it, expect } from 'vitest';
import * as uiConfig from '../../core/graph/formatters/ui-config';
import { createUiConfig, parseCliOptions, getStatusColor, getReadinessColor } from '../../core/graph/formatters/ui-config';
import { formatBoxedTask } from '../../core/graph/formatters/boxed-task';
import { formatPolishedTask } from '../../core/graph/formatters/polished-task';
import { Task } from '../../db/schema';

// Sample task for testing
const sampleTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'in-progress',
  priority: 'high',
  tags: ['test', 'important'],
  parentId: null,
  createdAt: new Date('2023-01-01T12:00:00Z'),
  updatedAt: new Date('2023-01-02T12:00:00Z'),
  metadata: {
    readiness: 'ready',
    complexity: 'medium',
    effort: 3
  }
} as Task;

describe('UI Config', () => {
  describe('createUiConfig', () => {
    it('should return default configuration when no options are provided', () => {
      const config = createUiConfig();
      expect(config).toEqual(uiConfig.DEFAULT_UI_CONFIG);
    });
    
    it('should override defaults with provided options', () => {
      const options = {
        useColor: false,
        showTags: false,
        titleMaxLength: 20
      };
      
      const config = createUiConfig(options);
      
      expect(config.useColor).toBe(false);
      expect(config.showTags).toBe(false);
      expect(config.titleMaxLength).toBe(20);
      
      // Other properties should maintain defaults
      expect(config.useUnicode).toBe(uiConfig.DEFAULT_UI_CONFIG.useUnicode);
      expect(config.dateFormat).toBe(uiConfig.DEFAULT_UI_CONFIG.dateFormat);
    });
  });
  
  describe('parseCliOptions', () => {
    it('should convert CLI options to UI config', () => {
      const cliOptions = {
        color: false,
        unicode: false,
        showDescription: false,
        titleMaxLength: 25
      };
      
      const config = parseCliOptions(cliOptions);
      
      expect(config.useColor).toBe(false);
      expect(config.useUnicode).toBe(false);
      expect(config.showDescription).toBe(false);
      expect(config.titleMaxLength).toBe(25);
    });
    
    it('should use LOW_COMPAT_UI_CONFIG when compatibilityMode is true', () => {
      const cliOptions = {
        compatibilityMode: true,
        titleMaxLength: 30 // This should be ignored
      };
      
      const config = parseCliOptions(cliOptions);
      
      expect(config).toEqual(uiConfig.LOW_COMPAT_UI_CONFIG);
    });
    
    it('should handle boolean options correctly', () => {
      const cliOptions = {
        color: false,
        boxes: false,
        tables: false,
        compact: true
      };
      
      const config = parseCliOptions(cliOptions);
      
      expect(config.useColor).toBe(false);
      expect(config.useBoxes).toBe(false);
      expect(config.useTables).toBe(false);
      expect(config.compactMode).toBe(true);
    });
  });
  
  describe('getStatusColor', () => {
    it('should return correct color for known statuses', () => {
      expect(getStatusColor('todo')).toBe('white');
      expect(getStatusColor('in-progress')).toBe('yellow');
      expect(getStatusColor('done')).toBe('green');
    });
    
    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('white');
    });
  });
  
  describe('getReadinessColor', () => {
    it('should return correct color for known readiness levels', () => {
      expect(getReadinessColor('draft')).toBe('blue');
      expect(getReadinessColor('ready')).toBe('magenta');
      expect(getReadinessColor('blocked')).toBe('red');
    });
    
    it('should return default color for unknown readiness', () => {
      expect(getReadinessColor('unknown')).toBe('white');
    });
  });
});

describe('Boxed Task Formatter', () => {
  it('should return a promise', () => {
    const result = formatBoxedTask(sampleTask, {
      useColor: false,
      useUnicode: true,
      showDescription: true
    });
    
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('Polished Task Formatter', () => {
  it('should return a promise', () => {
    const result = formatPolishedTask(sampleTask, {
      useColor: false,
      useUnicode: true,
      showDescription: true,
      showTags: true,
      showDates: true
    });
    
    expect(result).toBeInstanceOf(Promise);
  });
});