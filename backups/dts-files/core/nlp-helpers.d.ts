/**
 * NLP helper functions for advanced text processing
 *
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the NLP utilities.
 *
 * For new code, consider importing directly from the modularized implementation:
 * import { stemWord, tokenizeAndNormalize, ... } from './nlp/utils/index.ts';
 */
export { stemWord, tokenizeAndNormalize, levenshteinDistance, fuzzyScore, expandWithSynonyms } from './nlp/utils/index';
export { synonymMap } from './nlp/utils/synonyms';
