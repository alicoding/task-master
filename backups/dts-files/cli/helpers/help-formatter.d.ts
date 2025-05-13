/**
 * Enhanced Help Formatter
 * Provides comprehensive and consistent formatting for command help messages
 * with examples, notes, flag documentation, and more.
 */
import { Command } from 'commander';
/**
 * Interface for command example
 */
export interface CommandExample {
    command: string;
    description: string;
    output?: string;
}
/**
 * Interface for flag documentation
 */
export interface FlagDoc {
    flag: string;
    description: string;
    default?: string;
    required?: boolean;
    choices?: string[];
}
/**
 * Configuration options for enhanced help
 */
export interface EnhancedHelpOptions {
    usage?: string;
    description: string;
    arguments?: {
        name: string;
        description: string;
        optional?: boolean;
        defaultValue?: string;
    }[];
    flags?: FlagDoc[];
    examples?: CommandExample[];
    notes?: string[];
    seeAlso?: string[];
    footer?: string;
}
/**
 * Format text for command help output with improved organization and style
 */
declare class HelpFormatter {
    /**
     * Width for text wrapping
     */
    private textWidth;
    /**
     * Add enhanced help to a command
     * @param command Commander.js command to enhance
     * @param options Help options including examples, flags, and notes
     */
    enhanceHelp(command: Command, options: EnhancedHelpOptions): Command;
    /**
     * Automatically document command options from Command instance
     * @param command Commander.js command to document
     */
    private documentCommandOptions;
    /**
     * Wrap a long text string to a specified width
     * @param text Text to wrap
     * @param width Maximum line width (default: 80)
     * @returns Wrapped text
     */
    wrapText(text: string, width?: number): string;
    /**
     * Generate markdown documentation for a command
     * @param command Commander.js command to document
     * @returns Markdown documentation string
     */
    generateMarkdownDocs(command: Command): string;
}
export declare const helpFormatter: HelpFormatter;
export {};
