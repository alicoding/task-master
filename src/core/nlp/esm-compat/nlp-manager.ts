/**
 * ESM-compatible wrapper for NlpManager
 * 
 * This module provides an ESM-compatible version of the NlpManager from node-nlp-typescript.
 * It implements the same interface but uses ESM-compatible imports and exports.
 */

import { INlpManager, NlpManagerOptions } from '@/core/nlp/types';

// Container class to mimic the container property of NlpManager
class Container {
  private components: Map<string, any> = new Map();
  
  use(name: string, component: any): void {
    if (component && component.register) {
      component.register(this);
    } else {
      this.components.set(name, component);
    }
  }
  
  get(name: string): any {
    return this.components.get(name) || {};
  }
}

/**
 * ESM-compatible NlpManager
 */
export class NlpManager {
  public container: Container;
  private languages: string[];
  private forceNER: boolean;
  
  constructor(options: NlpManagerOptions = { languages: ['en'], forceNER: true }) {
    this.languages = options.languages;
    this.forceNER = options.forceNER;
    this.container = new Container();
    
    // Add default tokenizer and stemmer for English
    this.container.use('tokenizer-en', {
      tokenize: (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean)
    });
    
    this.container.use('stemmer-en', {
      stem: (word: string) => word.toLowerCase()
    });
  }
  
  /**
   * Add a document for intent classification
   */
  addDocument(language: string, text: string, intent: string): void {
    // In a real implementation, this would add the document for training
    console.log(`[Mock] Added document "${text}" for intent "${intent}"`);
  }
  
  /**
   * Add a named entity
   */
  addNamedEntityText(entity: string, option: string, languages: string[], texts: string[]): void {
    // In a real implementation, this would add the entity
    console.log(`[Mock] Added entity "${entity}" with texts: ${texts.join(', ')}`);
  }
  
  /**
   * Train the NLP manager
   */
  async train(): Promise<void> {
    console.log('[Mock] Training NLP manager');
    // Simulate training delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  /**
   * Process a text with the trained NLP manager
   */
  async process(language: string, text: string): Promise<any> {
    // Return a basic response
    return {
      locale: language,
      utterance: text,
      language: language,
      classifications: [],
      intent: '',
      score: 0,
      entities: [],
      sentiment: {
        score: 0
      }
    };
  }
  
  /**
   * Save the trained model
   */
  async save(filename: string): Promise<void> {
    console.log(`[Mock] Saving model to ${filename}`);
  }
  
  /**
   * Load a trained model
   */
  async load(filename: string): Promise<boolean> {
    console.log(`[Mock] Loading model from ${filename}`);
    return true;
  }
}