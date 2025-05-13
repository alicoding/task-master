/**
 * ESM-compatible wrapper for NlpManager
 *
 * This module provides an ESM-compatible version of the NlpManager from node-nlp-typescript.
 * It implements the same interface but uses ESM-compatible imports and exports.
 */
import { NlpManagerOptions } from '../types';
declare class Container {
    private components;
    use(name: string, component: any): void;
    get(name: string): any;
}
/**
 * ESM-compatible NlpManager
 */
export declare class NlpManager {
    container: Container;
    private languages;
    private forceNER;
    constructor(options?: NlpManagerOptions);
    /**
     * Add a document for intent classification
     */
    addDocument(language: string, text: string, intent: string): void;
    /**
     * Add a named entity
     */
    addNamedEntityText(entity: string, option: string, languages: string[], texts: string[]): void;
    /**
     * Train the NLP manager
     */
    train(): Promise<void>;
    /**
     * Process a text with the trained NLP manager
     */
    process(language: string, text: string): Promise<any>;
    /**
     * Save the trained model
     */
    save(filename: string): Promise<void>;
    /**
     * Load a trained model
     */
    load(filename: string): Promise<boolean>;
}
export {};
