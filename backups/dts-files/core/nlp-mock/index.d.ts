/**
 * Mock NLP libraries to replace the problematic node-nlp-typescript module
 * This provides all the necessary mock implementations for the NLP functionality
 */
/**
 * Mock NlpManager class
 */
export declare class NlpManager {
    container: any;
    settings: any;
    constructor(settings?: any);
    addNamedEntityText(entity: string, option: string, language: string, texts: string[]): void;
    addDocument(language: string, text: string, intent: string): void;
    load(file: string): Promise<boolean>;
    save(file: string): Promise<void>;
    train(): Promise<any>;
    process(language: string, text: string): Promise<any>;
}
/**
 * Container class mock
 */
export declare class Container {
    constructor();
    get(name: string): any;
    use(instance: any): void;
}
/**
 * TokenizerEn class mock
 */
export declare class TokenizerEn {
    tokenize(text: string): string[];
}
/**
 * StemmerEn class mock
 */
export declare class StemmerEn {
    stem(word: string): string;
}
export declare const LangAll: {
    LangAll: {};
};
export declare const containerBootstrap: () => void;
export declare const defaultContainer: {
    use: () => void;
};
