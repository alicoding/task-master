/**
 * Mock NLP libraries to replace the problematic node-nlp-typescript module
 * This provides all the necessary mock implementations for the NLP functionality
 */

/**
 * Mock NlpManager class
 */
export class NlpManager {
  container: any;
  settings: any;

  constructor(settings: any = {}) {
    this.settings = settings;
    this.container = {
      get: (name: string) => {
        // Return mock tokenizer and stemmer objects
        if (name === 'tokenizer-en') {
          return {
            tokenize: (text: string) => text.toLowerCase().split(/\s+/)
          };
        }
        if (name === 'stemmer-en') {
          return {
            stem: (word: string) => word.toLowerCase()
          };
        }
        return {};
      },
      use: (instance: any) => {
        // No-op
      }
    };
  }

  // Add named entity
  addNamedEntityText(entity: string, option: string, language: string, texts: string[]) {
    // No-op
  }

  // Add document to train
  addDocument(language: string, text: string, intent: string) {
    // No-op
  }

  // Load trained model
  load(file: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  // Save model
  save(file: string): Promise<void> {
    return Promise.resolve();
  }

  // Train the model
  async train(): Promise<any> {
    return Promise.resolve({ status: 'done' });
  }

  // Process text with NLP
  async process(language: string, text: string): Promise<any> {
    return {
      locale: language,
      utterance: text,
      intent: null,
      score: 0,
      entities: [],
      classifications: []
    };
  }
}

/**
 * Container class mock
 */
export class Container {
  constructor() {
    // No-op
  }

  get(name: string) {
    return null;
  }

  use(instance: any) {
    // No-op
  }
}

/**
 * TokenizerEn class mock
 */
export class TokenizerEn {
  tokenize(text: string): string[] {
    return text.toLowerCase().split(/\s+/);
  }
}

/**
 * StemmerEn class mock
 */
export class StemmerEn {
  stem(word: string): string {
    // Simple stemming - just lowercase
    return word.toLowerCase();
  }
}

// Export constants and utilities for language processing
export const LangAll = {
  LangAll: {}
};

export const containerBootstrap = () => {};
export const defaultContainer = {
  use: () => {}
};