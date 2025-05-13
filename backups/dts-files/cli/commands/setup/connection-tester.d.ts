/**
 * Connection Tester
 * Enhanced testing for AI provider connections with detailed diagnostics
 */
/**
 * Connection test result
 */
export interface ConnectionTestResult {
    success: boolean;
    providerName: string;
    modelName?: string;
    responseTime?: number;
    error?: {
        message: string;
        code?: string;
        type: string;
        details?: string;
        suggestion?: string;
    };
    warnings?: string[];
    details?: string;
}
/**
 * Test connection with detailed diagnostics
 */
export declare function testConnection(providerType?: string, verbose?: boolean): Promise<ConnectionTestResult>;
/**
 * Display connection test results
 */
export declare function displayConnectionResults(result: ConnectionTestResult): void;
/**
 * Run an interactive connection test
 */
export declare function runConnectionTest(providerType?: string): Promise<void>;
