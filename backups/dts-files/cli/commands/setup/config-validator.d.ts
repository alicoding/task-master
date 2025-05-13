/**
 * Configuration Validator
 * Analyzes and validates Task Master configuration
 */
/**
 * Issue severity levels
 */
export declare enum IssueSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Configuration issue type
 */
export interface ConfigIssue {
    id: string;
    severity: IssueSeverity;
    component: string;
    message: string;
    description: string;
    autoFixable: boolean;
    fix?: () => Promise<boolean>;
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    issues: ConfigIssue[];
}
/**
 * Validate project configuration
 */
export declare function validateConfiguration(): Promise<ValidationResult>;
/**
 * Main function to validate configuration
 */
export declare function runConfigurationValidation(fix?: boolean): Promise<void>;
