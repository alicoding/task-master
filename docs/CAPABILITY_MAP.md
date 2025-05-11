# TaskMaster Capability Map

The Capability Map is a powerful, self-learning feature that automatically discovers, analyzes, and visualizes capabilities from your task data. Unlike traditional capability mapping tools that require manual categorization and maintenance, TaskMaster's capability map is entirely dynamic, requiring zero manual configuration or upkeep.

## Overview

The Capability Map dynamically discovers capabilities, features, and technical domains from your task content using advanced AI/NLP techniques. It then visualizes the relationships between these capabilities in a variety of formats. As your tasks evolve, the capability map adapts automatically, ensuring it always reflects your current project's state.

## Key Features

- **Zero Manual Configuration**: No predefined categories, taxonomies, or relationships
- **Self-Learning**: The system autonomously derives all structure from task content
- **Adaptive**: Evolves naturally as your tasks change and grow
- **Confidence Scoring**: Each capability and relationship includes a confidence score
- **Multiple Visualization Formats**: Terminal text, Mermaid.js diagrams, DOT (Graphviz) diagrams, and JSON
- **AI-Powered Analysis**: Uses large language models to understand task semantics
- **Dynamic Relationship Discovery**: Automatically infers meaningful connections between capabilities

## Usage

Access the capability map through the CLI:

```bash
# Generate a basic capability map
tm map

# Change the visualization format
tm map --format mermaid

# Filter by confidence level
tm map --min-confidence 0.7

# Limit the number of nodes
tm map --max-nodes 15

# Group capabilities by automatically discovered types
tm map --group-by-type

# Include completed tasks in the analysis
tm map --include-completed

# Show confidence scores and task counts
tm map --show-confidence --show-task-count

# Export to a file
tm map --format mermaid --export capabilities.md

# Use without API key (uses fallback algorithms)
tm map --ai-model mock
```

## Understanding the Map

The Capability Map consists of two main components:

1. **Capability Nodes**: These represent features, domains, or aspects of your project that have been discovered in your tasks. Each node includes:
   - A name (derived from task content)
   - A type (discovered automatically)
   - A description of the capability
   - A confidence score
   - Related tasks
   - Keywords found in associated tasks

2. **Relationship Edges**: These represent relationships between capabilities, discovered through:
   - Task overlap (capabilities sharing the same tasks)
   - Semantic similarity (capabilities with related concepts)
   - Hierarchical relationships (derived from task parent-child relationships)
   - AI-inferred relationships (sophisticated connections discovered by AI analysis)

## Visualization Formats

The capability map can be rendered in several formats:

### Text Format (Default)

A clean terminal-friendly visualization showing capabilities and their relationships using Unicode characters and color (when available). Perfect for quick exploration.

### Mermaid Format

Generates a [Mermaid.js](https://mermaid.js.org/) flowchart diagram that can be embedded in markdown files. Ideal for documentation.

Example:
```
tm map --format mermaid --export capability-map.md
```

### DOT Format

Produces a [DOT language](https://graphviz.org/doc/info/lang.html) diagram for use with Graphviz. Best for creating sophisticated visualizations.

Example:
```
tm map --format dot --export capability-map.dot
graphviz -Tpng capability-map.dot -o capability-map.png
```

### JSON Format

Outputs the map in a structured JSON format for use with other visualization or analysis tools.

Example:
```
tm map --format json --export capability-map.json
```

## Technical Implementation

The Capability Map consists of several components:

1. **CapabilityMapGenerator**: Analyzes tasks to discover capabilities and relationships
2. **CapabilityMapVisualizer**: Renders the discovered capabilities in various formats
3. **AI Provider Integration**: Leverages language models for semantic understanding

The discovery process uses multiple techniques:

- **AI-Based Capability Discovery**: Uses AI to identify inherent capabilities in task data
- **Task Overlap Analysis**: Identifies capabilities that share tasks
- **Semantic Similarity**: Analyzes linguistic patterns and concepts
- **Hierarchical Relationship Discovery**: Leverages task dependencies
- **Fallback Heuristics**: Tag-based clustering as a backup when AI isn't available

## Customization

The capability map can be customized in several ways:

- **Confidence Threshold**: Control how confident the system must be to include a capability
- **Node Limit**: Limit the map to the most relevant capabilities
- **Display Options**: Control what metadata is shown in the visualization
- **AI Model Selection**: Choose which AI model to use for analysis

## Benefits

- **Discover Hidden Structure**: Identify capabilities you didn't know existed
- **Track Project Evolution**: Watch how capabilities evolve as your project grows
- **Improve Team Communication**: Share a common understanding of project structure
- **Identify Gaps**: Find areas that may need more attention
- **Zero Maintenance Overhead**: Never worry about manually updating the map

## Technical Notes

- The capability map uses vector embeddings and semantic similarity to understand task relationships
- The system balances between stability (not changing categories too much) and adaptability
- All relationships include confidence scores to indicate certainty
- The system works best with descriptive task titles, descriptions, and bodies
- Classification improves with more tasks and richer task content

## Running Without an API Key

If you don't have an OpenAI API key or want to test the capability map without using API credits, use the mock AI provider:

```bash
tm map --ai-model mock
```

In this mode, the system:
- Uses fallback algorithms for capability discovery based on tags, task titles, and hierarchies
- Creates relationships through simpler heuristics like task overlap and keyword matching
- Still produces a useful capability map without external AI services
- May have lower quality or confidence scores than the AI-powered version