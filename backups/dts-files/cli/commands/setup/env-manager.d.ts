/**
 * Environment Variable Manager
 * Handles loading, saving, backing up, and merging .env files
 */
/**
 * Interface for environment handling options
 */
export interface EnvManagerOptions {
    backupOnSave?: boolean;
    mergeStrategy?: 'overwrite' | 'keep-existing' | 'prompt';
}
/**
 * Environment Variable Manager class
 */
export declare class EnvManager {
    private envPath;
    private backupDir;
    private options;
    private envVars;
    /**
     * Create a new Environment Manager
     *
     * @param options Configuration options
     */
    constructor(options?: EnvManagerOptions);
    /**
     * Load environment variables from .env file
     */
    load(): Promise<Record<string, string>>;
    /**
     * Create a backup of the .env file
     */
    backup(): Promise<string | null>;
    /**
     * Save environment variables to .env file with backup
     *
     * @param envVars Environment variables to save
     */
    save(envVars?: Record<string, string>): Promise<void>;
    /**
     * Merge new environment variables with existing ones
     *
     * @param newEnvVars New environment variables to merge
     * @param strategy Override merge strategy
     */
    merge(newEnvVars: Record<string, string>, strategy?: 'overwrite' | 'keep-existing' | 'prompt'): Promise<Record<string, string>>;
    /**
     * List all available backups
     */
    listBackups(): Promise<string[]>;
    /**
     * Restore from a backup file
     *
     * @param backupName Name of the backup file
     */
    restoreFromBackup(backupName: string): Promise<boolean>;
    /**
     * Get a specific environment variable
     *
     * @param key Environment variable name
     */
    get(key: string): string | undefined;
    /**
     * Set a specific environment variable
     *
     * @param key Environment variable name
     * @param value Environment variable value
     */
    set(key: string, value: string): void;
    /**
     * Get all environment variables
     */
    getAll(): Record<string, string>;
}
