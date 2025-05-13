/**
 * Entity definitions for the NLP service
 * Defines common task-related terms and provides methods to add them to NLP manager
 */
import { NlpManager } from '../nlp-mock/index';
/**
 * Common task-related terms for entity extraction
 */
export declare const TASK_ENTITIES: {
    status: string[];
    readiness: string[];
    priority: string[];
    action: string[];
};
/**
 * Add task-specific entities to NLP manager
 * @param nlpManager NLP manager instance
 */
export declare function addTaskEntities(nlpManager: NlpManager): void;
/**
 * Terms to remove from query based on extracted entity
 */
export declare const ENTITY_TERMS_TO_REMOVE: Record<string, Record<string, string[]>>;
