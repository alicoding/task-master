/**
 * Keyboard shortcut definitions
 */
export interface Shortcut {
    key: string;
    description: string;
    isGlobal?: boolean;
}
/**
 * Global keyboard shortcuts
 */
export declare const GLOBAL_SHORTCUTS: Shortcut[];
/**
 * Screen-specific shortcuts
 */
export declare const SCREEN_SHORTCUTS: Record<string, Shortcut[]>;
