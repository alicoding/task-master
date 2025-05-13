/**
 * Enhanced Model Selection for AI Configuration
 * Provides fuzzy search, grouping, and detailed model information
 */
interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    description: string;
    capabilities: string[];
    pricing?: string;
    tokenLimit?: number;
    recommended?: boolean;
    isDefault?: boolean;
    beta?: boolean;
}
/**
 * Select model with enhanced interactive UI
 */
export declare function selectModel(provider: string, currentModel?: string): Promise<string | undefined>;
/**
 * Get model information by ID
 */
export declare function getModelById(modelId: string): ModelInfo | undefined;
export {};
