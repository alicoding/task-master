/**
 * NLP helper functions for advanced text processing
 * These functions provide improved natural language processing capabilities
 * for task search and similarity detection
 */

/**
 * Simple stemmer that handles common English word endings
 * @param word Word to stem
 * @returns Stemmed version of the word
 */
export function stemWord(word: string): string {
  // Convert to lowercase
  word = word.toLowerCase();
  
  // Remove plurals
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }
  
  if (word.endsWith('es')) {
    return word.slice(0, -2);
  }
  
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  
  // Handle common verb endings
  if (word.endsWith('ing')) {
    // Check for doubled consonant
    if (word.length > 4 && 
        word.charAt(word.length - 4) === word.charAt(word.length - 5) &&
        isConsonant(word.charAt(word.length - 4))) {
      return word.slice(0, -4);
    }
    return word.slice(0, -3);
  }
  
  if (word.endsWith('ed')) {
    // Check for doubled consonant
    if (word.length > 3 && 
        word.charAt(word.length - 3) === word.charAt(word.length - 4) &&
        isConsonant(word.charAt(word.length - 3))) {
      return word.slice(0, -3);
    }
    return word.slice(0, -2);
  }
  
  // Handle -ly
  if (word.endsWith('ly')) {
    return word.slice(0, -2);
  }
  
  return word;
}

/**
 * Helper function to check if a character is a consonant
 * @param char Single character
 * @returns true if consonant, false otherwise
 */
function isConsonant(char: string): boolean {
  const vowels = 'aeiou';
  return !vowels.includes(char.toLowerCase());
}

/**
 * Tokenize and normalize a string for search operations
 * @param text Input text
 * @returns Array of normalized tokens
 */
export function tokenizeAndNormalize(text: string): string[] {
  // Lowercase and split on non-alphanumeric characters
  const tokens = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2); // Filter out short tokens
    
  // Stem each token and remove duplicates
  const stemmed = tokens.map(token => stemWord(token));
  return [...new Set(stemmed)];
}

/**
 * Calculate Levenshtein edit distance between two strings
 * @param s1 First string
 * @param s2 Second string
 * @returns Edit distance (lower is more similar)
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const track = Array(s2.length + 1).fill(null).map(() => 
    Array(s1.length + 1).fill(null));
    
  for (let i = 0; i <= s1.length; i++) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= s2.length; j++) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return track[s2.length][s1.length];
}

/**
 * Calculate fuzzy similarity score between two strings
 * using normalized Levenshtein distance
 * @param s1 First string
 * @param s2 Second string
 * @returns Similarity score (0-1, with 1 being identical)
 */
export function fuzzyScore(s1: string, s2: string): number {
  // Normalize strings
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  
  // If either string is empty, return 0
  if (!s1.length || !s2.length) return 0;
  
  // If strings are identical, return 1
  if (s1 === s2) return 1;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  
  // Normalize by the length of the longer string
  const maxLength = Math.max(s1.length, s2.length);
  
  // Convert distance to a similarity score (0-1)
  return 1 - (distance / maxLength);
}

// A simple mapping of common synonyms for task management terms
export const synonymMap: Record<string, string[]> = {
  // Status synonyms
  'todo': ['pending', 'new', 'backlog', 'later', 'upcoming'],
  'in-progress': ['doing', 'working', 'ongoing', 'active', 'current', 'wip'],
  'done': ['completed', 'finished', 'resolved', 'closed'],
  
  // Readiness synonyms
  'draft': ['planning', 'idea', 'concept', 'proposed'],
  'ready': ['actionable', 'prepared', 'available', 'good-to-go'],
  'blocked': ['stuck', 'waiting', 'dependent', 'halted'],
  
  // Common action verbs in tasks
  'create': ['make', 'build', 'develop', 'implement', 'add'],
  'update': ['modify', 'change', 'edit', 'revise', 'improve'],
  'remove': ['delete', 'eliminate', 'destroy', 'drop', 'uninstall'],
  'fix': ['repair', 'resolve', 'correct', 'debug'],
  'review': ['examine', 'analyze', 'check', 'inspect', 'audit']
};

/**
 * Expand a search query with synonyms to improve search results
 * @param query Original search query
 * @returns Expanded query with synonyms
 */
export function expandWithSynonyms(query: string): string[] {
  // Tokenize query and normalize
  const tokens = tokenizeAndNormalize(query);
  const expanded = [...tokens];
  
  // Add synonyms for each token
  for (const token of tokens) {
    // Look for direct matches in the synonym map
    for (const [word, synonyms] of Object.entries(synonymMap)) {
      if (token === word || synonyms.includes(token)) {
        // Add the main word and all its synonyms
        expanded.push(word);
        expanded.push(...synonyms);
      }
    }
  }
  
  // Remove duplicates and return
  return [...new Set(expanded)];
}