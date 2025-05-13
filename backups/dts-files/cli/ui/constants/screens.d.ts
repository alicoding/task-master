/**
 * Screen identifiers for navigation
 */
export declare enum Screen {
    MAIN_MENU = "MAIN_MENU",
    HELP = "HELP",
    CONFIG_MENU = "CONFIG_MENU",
    CONFIG_AI = "CONFIG_AI",
    CONFIG_DATABASE = "CONFIG_DATABASE",
    CONFIG_EXPORT = "CONFIG_EXPORT",
    CONFIG_IMPORT = "CONFIG_IMPORT",
    TASK_MENU = "TASK_MENU",
    TASK_CREATE = "TASK_CREATE",
    TASK_LIST = "TASK_LIST",
    TASK_DETAIL = "TASK_DETAIL",
    TASK_EDIT = "TASK_EDIT",
    PROJECT_INIT = "PROJECT_INIT",
    VALIDATION = "VALIDATION",
    CONNECTION_TEST = "CONNECTION_TEST"
}
/**
 * Screen metadata
 */
export interface ScreenInfo {
    id: Screen;
    title: string;
    description: string;
    shortcut?: string;
}
/**
 * Screen information lookup
 */
export declare const SCREEN_INFO: Record<Screen, ScreenInfo>;
