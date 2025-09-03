import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tab, ClosedTab, TabsState, TabsActions } from '../types/tabs';
import { resolveToUrlOrSearch, generateTabTitle } from '../utils/resolveUrl';

const TABS_STORAGE_KEY = '@browser_tabs';
const CLOSED_TABS_STORAGE_KEY = '@browser_closed_tabs';

interface TabsStore extends TabsState, TabsActions {}

export const useTabsStore = create<TabsStore>((set, get) => ({
  // Initial state
  activeTabs: [],
  closedTabs: [],
  currentTabId: undefined,

  // Actions
  createNewTab: (url?: string) => {
    const resolvedUrl = url ? resolveToUrlOrSearch(url) : 'about:blank';
    const newTab: Tab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: generateTabTitle(resolvedUrl),
      url: resolvedUrl,
      faviconUrl: undefined,
      screenshotUrl: undefined,
      createdAt: Date.now(),
      isActive: true,
    };

    set((state) => ({
      activeTabs: [...state.activeTabs, newTab],
      currentTabId: newTab.id,
    }));

    get().saveTabs();
    return newTab.id;
  },

  closeTab: (id: string) => {
    const state = get();
    const tabToClose = state.activeTabs.find(tab => tab.id === id);
    
    if (tabToClose) {
      const closedTab: ClosedTab = {
        ...tabToClose,
        closedAt: Date.now(),
      };
      delete (closedTab as any).isActive;

      set((state) => ({
        activeTabs: state.activeTabs.filter(tab => tab.id !== id),
        closedTabs: [closedTab, ...state.closedTabs].slice(0, 50), // Keep only last 50 closed tabs
        currentTabId: state.currentTabId === id ? 
          (state.activeTabs.find(tab => tab.id !== id)?.id || undefined) : 
          state.currentTabId,
      }));

      get().saveTabs();
    }
  },

  closeAllActive: () => {
    const state = get();
    const closedTabs: ClosedTab[] = state.activeTabs.map(tab => ({
      ...tab,
      closedAt: Date.now(),
    })).map(tab => {
      delete (tab as any).isActive;
      return tab as ClosedTab;
    });

    set((state) => ({
      activeTabs: [],
      closedTabs: [...closedTabs, ...state.closedTabs].slice(0, 50),
      currentTabId: undefined,
    }));

    get().saveTabs();
  },

  restoreClosedTab: (id: string) => {
    const state = get();
    const tabToRestore = state.closedTabs.find(tab => tab.id === id);
    
    if (tabToRestore) {
      const restoredTab: Tab = {
        ...tabToRestore,
        isActive: true,
        createdAt: Date.now(), // Update creation time
      };
      delete (restoredTab as any).closedAt;

      set((state) => ({
        activeTabs: [...state.activeTabs, restoredTab],
        closedTabs: state.closedTabs.filter(tab => tab.id !== id),
        currentTabId: restoredTab.id,
      }));

      get().saveTabs();
    }
  },

  clearAllClosed: () => {
    set({ closedTabs: [] });
    get().saveTabs();
  },

  updateTabUrl: (id: string, url: string) => {
    const resolvedUrl = resolveToUrlOrSearch(url);
    const title = generateTabTitle(resolvedUrl);

    set((state) => ({
      activeTabs: state.activeTabs.map(tab => 
        tab.id === id 
          ? { ...tab, url: resolvedUrl, title }
          : tab
      ),
    }));

    get().saveTabs();
  },

  setActiveTab: (id: string) => {
    set({ currentTabId: id });
  },

  loadTabs: async () => {
    try {
      const [activeTabsData, closedTabsData] = await Promise.all([
        AsyncStorage.getItem(TABS_STORAGE_KEY),
        AsyncStorage.getItem(CLOSED_TABS_STORAGE_KEY),
      ]);

      const activeTabs = activeTabsData ? JSON.parse(activeTabsData) : [];
      const closedTabs = closedTabsData ? JSON.parse(closedTabsData) : [];

      set({
        activeTabs,
        closedTabs,
        currentTabId: activeTabs.length > 0 ? activeTabs[0].id : undefined,
      });
    } catch (error) {
      console.error('Failed to load tabs from storage:', error);
    }
  },

  saveTabs: async () => {
    try {
      const { activeTabs, closedTabs } = get();
      await Promise.all([
        AsyncStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(activeTabs)),
        AsyncStorage.setItem(CLOSED_TABS_STORAGE_KEY, JSON.stringify(closedTabs)),
      ]);
    } catch (error) {
      console.error('Failed to save tabs to storage:', error);
    }
  },
}));