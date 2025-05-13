/**
 * Naming and description utilities for capability map visualization
 * 
 * This module provides utilities for normalizing capability names,
 * generating enhanced descriptions, and selecting appropriate icons.
 */

import { CapabilityNode } from '@/core/capability-map/index';
import { getTypeLabel } from '@/core/capability-map/visualizers/utils/formatting';

/**
 * Normalize capability names to ensure consistency
 * @param nodes List of capability nodes
 * @returns Nodes with normalized names
 */
export function normalizeCapabilityNames(nodes: CapabilityNode[]): CapabilityNode[] {
  return nodes.map(node => {
    let name = node.name;

    // Fix duplication like "Enhancement enhancement"
    const words = name.split(/\s+/);
    if (words.length >= 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
      name = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }

    // Ensure proper capitalization
    name = name.charAt(0).toUpperCase() + name.slice(1);

    // Handle special cases for natural sounding names
    if (name === "AI/MLs") name = "AI/ML";
    if (name === "UIs") name = "UI";
    if (name === "UXs") name = "UX";
    if (name === "UI/UXs") name = "UI/UX";
    if (name === "DevOpss") name = "DevOps";
    if (name === "APIs") name = "API";

    // For regular terms, keep singular for technical concepts, plural for activity areas
    const technicalTerms = ["Core", "API", "UI", "UX", "CLI", "Database", "Backend", "Frontend", "Infrastructure"];
    const activityAreas = ["Feature", "Enhancement", "Test", "Documentation", "Integration"];

    // Only apply pluralization to activity areas, not technical concepts
    if (words.length === 1 && !name.endsWith('s') &&
        !name.endsWith('ing') && !name.endsWith('ion')) {
      // Check if it's an activity area that should be plural
      if (activityAreas.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
        name += 's';
      }
      // Don't pluralize technical terms
      else if (!technicalTerms.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
        // For other names, use natural language plural forms
        if (name.endsWith('y')) {
          name = name.slice(0, -1) + 'ies';
        } else {
          name += 's';
        }
      }
    }

    // Remove redundant words
    name = name.replace(/\s+management$/i, '');
    name = name.replace(/\s+functionality$/i, '');

    return {...node, name};
  });
}

/**
 * Enhance a capability description with more specifics
 * @param node Capability node
 * @returns Enhanced description
 */
export function enhanceDescription(node: CapabilityNode): string {
  // Start with a standardized description format
  let description = '';

  // Get type-specific prefix
  const typeLabel = getTypeLabel(node.type);

  // Get task stats
  const taskCount = node.tasks.length;

  // Get status counts if available
  const metadata = node.metadata || {};
  const statusCounts = metadata.statusCounts || {};
  const doneCount = statusCounts.done || 0;
  const inProgressCount = statusCounts['in-progress'] || 0;
  const todoCount = statusCounts.todo || 0;

  // Generate a clean set of keywords without duplicates
  const uniqueKeywords = new Set(node.keywords.map(k => k.toLowerCase()));
  const cleanKeywords = Array.from(uniqueKeywords)
    .filter(k => k.length > 2) // Remove very short keywords
    .slice(0, 5);

  // Build first part of description with type and task count
  description = `${typeLabel} with ${taskCount} task${taskCount !== 1 ? 's' : ''}`;

  // Add status breakdown if we have it
  if (doneCount > 0 || inProgressCount > 0 || todoCount > 0) {
    description += ` (${doneCount} done, ${inProgressCount} in progress, ${todoCount} todo)`;
  }

  // Add focus areas with clean keywords
  if (cleanKeywords.length > 0) {
    description += `. Focus areas: ${cleanKeywords.join(', ')}`;
  }

  // Add specific details from original description if it had unique content
  const originalDescription = node.description || '';
  if (originalDescription.length > 0 &&
      !originalDescription.includes('tasks') &&
      !originalDescription.includes('focusing on') &&
      !originalDescription.toLowerCase().includes(node.name.toLowerCase())) {
    description += `. ${originalDescription}`;
  }

  return description;
}

/**
 * Get an icon for a capability category
 * @param type The capability type
 * @param name The capability name
 * @returns An appropriate icon
 */
export function getCategoryIcon(type: string, name: string): string {
  const nameLower = name.toLowerCase();

  // Technical domains
  if (nameLower.includes('api')) return '🔌';
  if (nameLower.includes('ui') || nameLower.includes('ux') || nameLower.includes('interface')) return '🖼️';
  if (nameLower.includes('frontend')) return '🖥️';
  if (nameLower.includes('backend')) return '⚙️';
  if (nameLower.includes('database') || nameLower.includes('data')) return '💾';
  if (nameLower.includes('infra') || nameLower.includes('server')) return '🏗️';
  if (nameLower.includes('security') || nameLower.includes('auth')) return '🔒';
  if (nameLower.includes('test') || nameLower.includes('qa')) return '🧪';
  if (nameLower.includes('doc') || nameLower.includes('guide')) return '📚';
  if (nameLower.includes('devops') || nameLower.includes('deploy')) return '🚀';
  if (nameLower.includes('ai') || nameLower.includes('ml')) return '🧠';
  if (nameLower.includes('analytics') || nameLower.includes('report')) return '📊';
  if (nameLower.includes('mobile') || nameLower.includes('app')) return '📱';
  if (nameLower.includes('cli') || nameLower.includes('command')) return '💻';

  // Feature types
  if (nameLower.includes('feature')) return '✨';
  if (nameLower.includes('enhancement') || nameLower.includes('improve')) return '🔧';
  if (nameLower.includes('refactor')) return '♻️';
  if (nameLower.includes('optimiz') || nameLower.includes('performance')) return '⚡';
  if (nameLower.includes('fix') || nameLower.includes('bug')) return '🐛';

  // Project aspects
  if (nameLower.includes('planning') || nameLower.includes('schedule')) return '📅';
  if (nameLower.includes('integration')) return '🔄';
  if (nameLower.includes('management')) return '📋';
  if (nameLower.includes('monitor')) return '📈';

  // Default icons based on type
  if (type === 'domain') return '🔧';
  if (type === 'feature-area') return '✨';
  if (type === 'concept') return '💡';
  if (type === 'workflow') return '🔄';
  if (type.includes('phase')) return '📅';

  // Generic fallback
  return '📦';
}