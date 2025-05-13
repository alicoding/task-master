/**
 * Performance profiling utilities for NLP operations
 *
 * This module provides tools for measuring and analyzing the performance of
 * NLP operations in the Task Master application. It allows for detailed timing
 * of critical operations, identification of bottlenecks, and logging of performance
 * metrics for optimization.
 *
 * @module NlpProfilerUtils
 */
interface ProfilerResult {
    operation: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
}
/**
 * Class for profiling NLP operations
 */
export declare class NlpProfiler {
    private static instance;
    private results;
    private enabled;
    private timers;
    /**
     * Get the singleton profiler instance
     * @returns The NlpProfiler instance
     */
    static getInstance(): NlpProfiler;
    /**
     * Enable or disable profiling
     * @param enable Whether to enable profiling
     */
    setEnabled(enable: boolean): void;
    /**
     * Start timing an operation
     * @param operation Name of the operation
     */
    startTimer(operation: string): void;
    /**
     * Stop timing an operation and record the result
     * @param operation Name of the operation
     * @param metadata Optional metadata about the operation
     */
    stopTimer(operation: string, metadata?: Record<string, any>): void;
    /**
     * Clear all profiling results
     */
    clearResults(): void;
    /**
     * Get all profiling results
     * @returns Array of profiling results
     */
    getResults(): ProfilerResult[];
    /**
     * Get summary statistics for profiled operations
     * @returns Object containing statistics for each operation
     */
    getSummary(): Record<string, {
        count: number;
        totalTime: number;
        avgTime: number;
        maxTime: number;
    }>;
    /**
     * Print a formatted summary of profiling results to the console
     */
    printSummary(): void;
    /**
     * Profile a function call
     * @param operation Name of the operation
     * @param fn Function to profile
     * @param args Arguments to pass to the function
     * @returns The result of the function call
     */
    profileSync<T>(operation: string, fn: (...args: any[]) => T, ...args: any[]): T;
    /**
     * Profile an async function call
     * @param operation Name of the operation
     * @param fn Async function to profile
     * @param args Arguments to pass to the function
     * @returns Promise resolving to the result of the function call
     */
    profileAsync<T>(operation: string, fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
}
/**
 * Decorator for profiling class methods
 * @param operationPrefix Prefix for the operation name in profiling results
 * @returns Method decorator
 */
export declare function profileMethod(operationPrefix?: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Get a singleton instance of the NLP profiler
 * @returns The NlpProfiler instance
 */
export declare function getNlpProfiler(): NlpProfiler;
export {};
