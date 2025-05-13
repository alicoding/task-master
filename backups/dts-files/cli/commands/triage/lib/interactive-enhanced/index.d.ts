/**
 * Enhanced interactive mode for triage command
 * Provides an improved UI for working with tasks
 */
import { TaskRepository } from '../../../../../core/repo';
import { NlpService } from '../../../../../core/nlp-service-mock';
import { ProcessingOptions, TriageResults } from '../utils';
/**
 * Run enhanced interactive triage mode
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Triage results to update
 * @param options Processing options
 */
export declare function runInteractiveMode(repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
