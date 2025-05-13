import create from 'zustand';
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
  // Current screen
  currentScreen: Screen;
  // Current screen parameters
  params: Record<string, unknown>;
  // Navigation history
  history: HistoryEntry[];
  // Whether navigation is in progress
  isNavigating: boolean;
  // Navigation breadcrumbs
  breadcrumbs: string[];
  // Actions
  navigateTo: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  goHome: () => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  addBreadcrumb: (breadcrumb: string) => void;
}

/**
 * Create navigation store
 */
export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentScreen: Screen.MAIN_MENU,
  params: {},
  history: [],
  isNavigating: false,
  breadcrumbs: ['Main Menu'],
  
  navigateTo: (screen, params = {}) => {
    const current = get().currentScreen;
    const currentParams = get().params;
    
    // Add current screen to history
    set(state => ({
      history: [...state.history, { screen: current, params: currentParams }],
      currentScreen: screen,
      params,
      isNavigating: true
    }));
    
    // Reset navigation flag after short delay
    setTimeout(() => {
      set({ isNavigating: false });
    }, 100);
  },
  
  goBack: () => {
    const history = get().history;
    
    if (history.length === 0) {
      // If no history, go to main menu
      set({
        currentScreen: Screen.MAIN_MENU,
        params: {},
        breadcrumbs: ['Main Menu']
      });
      return;
    }
    
    // Get last entry from history
    const lastEntry = history[history.length - 1];
    
    // Update state
    set(state => ({
      currentScreen: lastEntry.screen,
      params: lastEntry.params || {},
      history: state.history.slice(0, -1),
      isNavigating: true
    }));
    
    // Reset navigation flag after short delay
    setTimeout(() => {
      set({ isNavigating: false });
    }, 100);
  },
  
  goHome: () => {
    set({
      currentScreen: Screen.MAIN_MENU,
      params: {},
      history: [],
      breadcrumbs: ['Main Menu'],
      isNavigating: true
    });
    
    // Reset navigation flag after short delay
    setTimeout(() => {
      set({ isNavigating: false });
    }, 100);
  },
  
  setBreadcrumbs: (breadcrumbs) => {
    set({ breadcrumbs });
  },
  
  addBreadcrumb: (breadcrumb) => {
    set(state => ({
      breadcrumbs: [...state.breadcrumbs, breadcrumb]
    }));
  }
}));