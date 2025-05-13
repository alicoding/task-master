import { Screen } from '../constants/screens';
/**
 * Navigation history entry
 */
interface HistoryEntry {
    screen: Screen;
    params?: Record<string, unknown>;
}
/**
 * Navigation store state
 */
interface NavigationState {
    currentScreen: Screen;
    params: Record<string, unknown>;
    history: HistoryEntry[];
    isNavigating: boolean;
    breadcrumbs: string[];
    navigateTo: (screen: Screen, params?: Record<string, unknown>) => void;
    goBack: () => void;
    goHome: () => void;
    setBreadcrumbs: (breadcrumbs: string[]) => void;
    addBreadcrumb: (breadcrumb: string) => void;
}
/**
 * Create navigation store
 */
export declare const useNavigationStore: import("zustand").UseBoundStore<NavigationState, import("zustand").StoreApi<NavigationState>>;
export {};
