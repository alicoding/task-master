import { TaskRepository } from '../../../../core/repo';
import { NlpService } from '../../../../core/nlp-service';
import { ProcessingOptions, TriageResults } from './utils';
/**
 * Run interactive triage mode
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export declare function runInteractiveMode(repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
