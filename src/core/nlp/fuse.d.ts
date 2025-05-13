/**
 * Type declaration for Fuse.js - fuzzy search library
 */

declare module 'fuse' {
  export default class Fuse<T> {
    constructor(list: T[], options?: FuseOptions);
    search(pattern: string): Array<{ item: T, score: number }>;
  }
  
  interface FuseOptions {
    keys?: string[];
    includeScore?: boolean;
    threshold?: number;
    location?: number;
    distance?: number;
    minMatchCharLength?: number;
    shouldSort?: boolean;
    tokenize?: boolean;
    matchAllTokens?: boolean;
    findAllMatches?: boolean;
    ignoreLocation?: boolean;
    id?: string;
  }
}