# Modularization Plan for NLP Components

## 1. Current Structure

The current NLP components are spread across several files:
- `core/nlp-helpers.ts`: Utility functions for NLP operations
- `core/nlp-service.ts`: Main NLP service implementation
- `core/nlp-service-mock.ts`: Mock implementation of NLP service
- `core/nlp/types.ts`: Type definitions for NLP operations
- `core/nlp/entities.ts`: Entity definitions for NLP processing
- `core/nlp/fuzzy-matcher.ts`: Fuzzy matching functionality
- `core/nlp/processor.ts`: Text processing functionality
- `core/nlp/trainer.ts`: Model training functionality

## 2. New Directory Structure

```
core/nlp/
├── services/
│   ├── index.ts                # Re-exports all services
│   ├── base-service.ts         # Base NLP service class 
│   ├── nlp-service.ts          # Main NLP service implementation
│   └── mock-service.ts         # Mock NLP service for testing
├── utils/
│   ├── index.ts                # Re-exports all utilities
│   ├── stemming.ts             # Word stemming functionality
│   ├── tokenization.ts         # Text tokenization functionality
│   ├── distance.ts             # String distance/similarity metrics
│   └── synonyms.ts             # Synonym expansion functionality
├── matchers/
│   ├── index.ts                # Re-exports all matchers
│   ├── fuzzy-matcher.ts        # Fuzzy matching functionality
│   └── semantic-matcher.ts     # Semantic matching functionality
├── processing/
│   ├── index.ts                # Re-exports processing functionality
│   ├── entities.ts             # Entity extraction and management
│   ├── processor.ts            # Core text processing
│   └── trainer.ts              # Model training functionality
├── types.ts                    # Type definitions
└── index.ts                    # Main entry point
```

## 3. Module Breakdown

### 3.1. `services/`
- `base-service.ts`: Abstract base class for NLP services with common interface
- `nlp-service.ts`: Main implementation using full NLP capabilities
- `mock-service.ts`: Simplified implementation for testing without dependencies

### 3.2. `utils/`
- `stemming.ts`: Functions for word stemming
- `tokenization.ts`: Functions for text tokenization
- `distance.ts`: String distance and similarity metrics
- `synonyms.ts`: Synonym expansion functionality

### 3.3. `matchers/`
- `fuzzy-matcher.ts`: Functionality for fuzzy text matching
- `semantic-matcher.ts`: Functionality for semantic matching

### 3.4. `processing/`
- `entities.ts`: Entity management for NLP
- `processor.ts`: Core text processing functionality
- `trainer.ts`: Model training and management

### 3.5. Root Files
- `types.ts`: Shared type definitions
- `index.ts`: Main entry point that re-exports key functionality

## 4. Implementation Strategy

1. Create the directory structure
2. Move and refactor current functionality into appropriate modules
3. Create base classes and interfaces
4. Update import/export statements
5. Create backward compatibility wrappers for the original files
6. Test with existing functionality

## 5. Backward Compatibility

The original files (`nlp-service.ts`, `nlp-service-mock.ts`, `nlp-helpers.ts`) will be kept as wrappers that:
1. Import from the new modular implementation
2. Re-export the necessary classes and functions
3. Include documentation pointing to the new implementation