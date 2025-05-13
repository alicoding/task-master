/**
 * Entity definitions for the NLP service
 * Defines common task-related terms and provides methods to add them to NLP manager
 */
import { NlpManager } from '../nlp-mock/index';

/**
 * Common task-related terms for entity extraction
 */
export const TASK_ENTITIES = {
  status: ['todo', 'in-progress', 'done', 'pending', 'active', 'completed', 'finished'],
  readiness: ['draft', 'ready', 'blocked', 'waiting', 'available'],
  priority: ['high', 'medium', 'low', 'critical', 'urgent', 'important'],
  action: ['create', 'update', 'delete', 'remove', 'add', 'modify', 'fix', 'review']
};

/**
 * Add task-specific entities to NLP manager
 * @param nlpManager NLP manager instance
 */
export function addTaskEntities(nlpManager: NlpManager): void {
  // Add status entity with synonyms
  nlpManager.addNamedEntityText('status', 'todo', ['en'], [
    'todo', 'to-do', 'pending', 'new', 'backlog', 'not started'
  ]);
  nlpManager.addNamedEntityText('status', 'in-progress', ['en'], [
    'in-progress', 'in progress', 'doing', 'working', 'ongoing', 'active', 'current', 'wip'
  ]);
  nlpManager.addNamedEntityText('status', 'done', ['en'], [
    'done', 'completed', 'finished', 'resolved', 'closed', 'fixed'
  ]);
  
  // Add readiness entity with synonyms
  nlpManager.addNamedEntityText('readiness', 'draft', ['en'], [
    'draft', 'planning', 'idea', 'concept', 'proposed', 'preliminary'
  ]);
  nlpManager.addNamedEntityText('readiness', 'ready', ['en'], [
    'ready', 'actionable', 'prepared', 'available', 'good-to-go', 'startable'
  ]);
  nlpManager.addNamedEntityText('readiness', 'blocked', ['en'], [
    'blocked', 'stuck', 'waiting', 'dependent', 'halted', 'paused'
  ]);
  
  // Add priority entity with synonyms
  nlpManager.addNamedEntityText('priority', 'high', ['en'], [
    'high', 'important', 'critical', 'urgent', 'top', 'p1', 'priority 1'
  ]);
  nlpManager.addNamedEntityText('priority', 'medium', ['en'], [
    'medium', 'normal', 'standard', 'average', 'p2', 'priority 2'
  ]);
  nlpManager.addNamedEntityText('priority', 'low', ['en'], [
    'low', 'minor', 'trivial', 'p3', 'priority 3', 'later', 'eventually'
  ]);
}

/**
 * Terms to remove from query based on extracted entity
 */
export const ENTITY_TERMS_TO_REMOVE: Record<string, Record<string, string[]>> = {
  status: {
    todo: ['todo', 'to-do', 'not started', 'pending', 'backlog'],
    'in-progress': ['in progress', 'in-progress', 'ongoing', 'current', 'active'],
    done: ['done', 'completed', 'finished', 'closed']
  },
  readiness: {
    draft: ['draft', 'planning', 'idea'],
    ready: ['ready', 'available', 'prepared'],
    blocked: ['blocked', 'stuck', 'waiting']
  },
  priority: {
    high: ['high', 'important', 'critical', 'urgent'],
    medium: ['medium', 'normal', 'standard', 'average'],
    low: ['low', 'minor', 'trivial']
  },
  action: {
    create: ['create', 'add', 'new'],
    update: ['update', 'modify', 'change'],
    delete: ['delete', 'remove']
  }
};