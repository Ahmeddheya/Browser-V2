import { create } from 'zustand';
import { StorageManager, BrowserSettings, HistoryItem, BookmarkItem } from '../utils/storage';
import SearchIndexManager from '../utils/searchIndex';
import DownloadManager from '../utils/downloadManager';
import { AdvancedBrowserSettings } from '../types/settings';
import { Tab, ClosedTab } from '../types/tabs';
import { resolveToUrlOrSearch, generateTabTitle } from '../utils/resolveUrl';

interface BrowserState {
  // Settings
  settings: AdvancedBrowserSettings;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AdvancedBrowserSettings>(key: K, value: AdvancedBrowserSettings[K]) => Promise<void>;
  
  // Ad blocking
  isAdBlockEnabled: boolean;
  toggleAdBlock: () => Promise<void>;
  
  // Tabs management
  tabs: Tab[];
  activeTabs: Tab[];
  closedTabs: ClosedTab[];
  currentTabId?: string;
  addTab: (url: string, title: string) => string;
  createNewTab: (url?: string) => string;
  closeTab: (tabId: string) => void;
  closeAllActive: () => void;
  restoreTab: (tabId: string) => void;
  restoreClosedTab: (tabId: string) => void;
  clearAllClosed: () => void;
  updateTabUrl: (id: string, url: string) => void;
  setActiveTab: (id: string) => void;
  loadTabs: () => Promise<void>;
  saveTabs: () => Promise<void>;
  
  // Theme and appearance
  darkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  
  // Night mode
  nightMode: boolean;
  toggleNightMode: () => Promise<void>;
  
  // Desktop mode
  desktopMode: boolean;
  toggleDesktopMode: () => Promise<void>;
  
  // Incognito mode
  incognitoMode: boolean;
  toggleIncognitoMode: () => Promise<void>;
  
  // History management
  history: HistoryItem[];
  loadHistory: () => Promise<void>;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'visitCount'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  searchHistory: (query: string) => Promise<HistoryItem[]>;
  
  // Bookmarks management
  bookmarks: BookmarkItem[];
  loadBookmarks: () => Promise<void>;
  addBookmark: (item: Omit<BookmarkItem, 'id' | 'dateAdded'>) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  updateBookmark: (id: string, updates: Partial<BookmarkItem>) => Promise<void>;
  searchBookmarks: (query: string) => Promise<BookmarkItem[]>;
  
  // Search functionality
  initializeSearch: () => Promise<void>;
  performSearch: (query: string, options?: any) => Promise<any[]>;
  
  // Downloads
  initializeDownloads: () => Promise<void>;
  
  // Initialization
  initialize: () => Promise<void>;
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
  // Settings state
  settings: {
    darkMode: false,
    nightMode: false,
    incognitoMode: false,
    desktopMode: false,
    adBlockEnabled: true,
    searchEngine: 'google',
    homepage: 'https://www.google.com',
    autoSaveHistory: true,
    maxHistoryItems: 1000,
    customSearchEngine: '',
    passwordManager: {
      savePasswords: true,
      autoSignIn: true,
      biometricAuth: false,
    },
    paymentMethods: {
      saveAndFill: true,
    },
    addresses: {
      saveAndFill: true,
    },
    notifications: {
      permissionRequests: true,
      downloadComplete: true,
      securityAlerts: true,
    },
    privacy: {
      safeBrowsing: 'standard',
      httpsFirst: true,
      paymentMethodDetection: true,
      preloadPages: true,
      secureDNS: 'automatic',
      doNotTrack: false,
      privacySandbox: false,
    },
    appearance: {
      theme: 'system',
      fontSize: 16,
      pageZoom: 100,
      toolbarLayout: 'default',
    },
    accessibility: {
      textToSpeech: false,
      screenReaderSupport: false,
      navigationAssistance: false,
    },
    sitePermissions: {
      camera: 'ask',
      location: 'ask',
      microphone: 'ask',
      notifications: 'ask',
    },
    language: {
      preferredLanguage: 'en',
      translationEnabled: true,
    },
    downloads: {
      storageLocation: 'internal',
      wifiOnlyDownloads: false,
      askDownloadLocation: true,
    },
  },
  
  loadSettings: async () => {
    try {
      const basicSettings = await StorageManager.getSettings();
      const advancedSettings = await StorageManager.getItem<AdvancedBrowserSettings>('advanced_settings', get().settings);
      
      // Merge basic settings with advanced settings
      const settings = { ...advancedSettings, ...basicSettings };
      
      set({ 
        settings,
        darkMode: settings.darkMode || false,
        nightMode: settings.nightMode || false,
        incognitoMode: settings.incognitoMode || false,
        desktopMode: settings.desktopMode || false,
        isAdBlockEnabled: settings.adBlockEnabled !== undefined ? settings.adBlockEnabled : true,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Reset to default values on error
      set({
        darkMode: false,
        nightMode: false,
        incognitoMode: false,
        desktopMode: false,
        isAdBlockEnabled: true,
      });
    }
  },
  
  updateSetting: async (key, value) => {
    try {
      const currentSettings = get().settings;
      const newSettings = { ...currentSettings, [key]: value };
      
      // Update basic settings in old format for compatibility
      if (['darkMode', 'nightMode', 'incognitoMode', 'desktopMode', 'adBlockEnabled', 'searchEngine', 'homepage', 'autoSaveHistory', 'maxHistoryItems'].includes(key as string)) {
        await StorageManager.updateSettings({ [key]: value });
      }
      
      // Update advanced settings
      await StorageManager.setItem('advanced_settings', newSettings);
      
      set({ settings: newSettings });
      
      // Update corresponding state variables
      if (key === 'darkMode') set({ darkMode: value as boolean });
      if (key === 'nightMode') set({ nightMode: value as boolean });
      if (key === 'incognitoMode') set({ incognitoMode: value as boolean });
      if (key === 'desktopMode') set({ desktopMode: value as boolean });
      if (key === 'adBlockEnabled') set({ isAdBlockEnabled: value as boolean });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  },
  
  // Ad blocking state
  isAdBlockEnabled: true,
  toggleAdBlock: async () => {
    const newValue = !get().isAdBlockEnabled;
    await get().updateSetting('adBlockEnabled', newValue);
  },
  
  // Tabs state
  tabs: [],
  activeTabs: [],
  closedTabs: [],
  currentTabId: undefined,
  
  addTab: (url: string, title: string) => {
    const newTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      url,
      faviconUrl: undefined,
      screenshotUrl: undefined,
      createdAt: Date.now(),
      isActive: true,
    };
    
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabs: [...state.activeTabs, newTab],
      currentTabId: newTab.id,
    }));
    
    get().saveTabs();
    return newTab.id;
  },
  
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
      tabs: [...state.tabs, newTab],
      activeTabs: [...state.activeTabs, newTab],
      currentTabId: newTab.id,
    }));

    get().saveTabs();
    return newTab.id;
  },
  
  closeTab: (tabId: string) => {
    set((state) => {
      const tab = state.activeTabs.find(t => t.id === tabId);
      if (tab) {
        const closedTab: ClosedTab = {
          ...tab,
          closedAt: Date.now(),
        };
        delete (closedTab as any).isActive;
        
        return {
          tabs: state.tabs.filter(t => t.id !== tabId),
          activeTabs: state.activeTabs.filter(t => t.id !== tabId),
          closedTabs: [closedTab, ...state.closedTabs].slice(0, 50),
          currentTabId: state.currentTabId === tabId ? 
            (state.activeTabs.find(tab => tab.id !== tabId)?.id || undefined) : 
            state.currentTabId,
        };
      }
      return state;
    });
    get().saveTabs();
  },
  
  closeAllActive: () => {
    set((state) => {
      const closedTabs: ClosedTab[] = state.activeTabs.map(tab => ({
        ...tab,
        closedAt: Date.now(),
      })).map(tab => {
        delete (tab as any).isActive;
        return tab as ClosedTab;
      });

      return {
        tabs: [],
        activeTabs: [],
        closedTabs: [...closedTabs, ...state.closedTabs].slice(0, 50),
        currentTabId: undefined,
      };
    });
    get().saveTabs();
  },
  
  restoreTab: (tabId: string) => {
    set((state) => {
      const tab = state.closedTabs.find(t => t.id === tabId);
      if (tab) {
        const { closedAt, ...restoreTab } = tab;
        const restoredTab: Tab = {
          ...restoreTab,
          isActive: true,
          createdAt: Date.now(),
        };
        
        return {
          tabs: [...state.tabs, restoredTab],
          closedTabs: state.closedTabs.filter(t => t.id !== tabId),
          activeTabs: [...state.activeTabs, restoredTab],
          currentTabId: restoredTab.id,
        };
      }
      return state;
    });
    get().saveTabs();
  },
  
  restoreClosedTab: (tabId: string) => {
    get().restoreTab(tabId);
  },
  
  clearAllClosed: () => {
    set((state) => ({
      closedTabs: [],
    }));
    get().saveTabs();
  },
  
  updateTabUrl: (id: string, url: string) => {
    const resolvedUrl = resolveToUrlOrSearch(url);
    const title = generateTabTitle(resolvedUrl);

    set((state) => ({
      tabs: state.tabs.map(tab => 
        tab.id === id 
          ? { ...tab, url: resolvedUrl, title }
          : tab
      ),
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
        StorageManager.getItem<Tab[]>('browser_active_tabs', []),
        StorageManager.getItem<ClosedTab[]>('browser_closed_tabs', []),
      ]);

      set({
        tabs: activeTabsData,
        activeTabs: activeTabsData,
        closedTabs: closedTabsData,
        currentTabId: activeTabsData.length > 0 ? activeTabsData[0].id : undefined,
      });
    } catch (error) {
      console.error('Failed to load tabs from storage:', error);
    }
  },

  saveTabs: async () => {
    try {
      const { activeTabs, closedTabs } = get();
      await Promise.all([
        StorageManager.setItem('browser_active_tabs', activeTabs),
        StorageManager.setItem('browser_closed_tabs', closedTabs),
      ]);
    } catch (error) {
      console.error('Failed to save tabs to storage:', error);
    }
  },
  
  // Theme state
  darkMode: false,
  toggleDarkMode: async () => {
    const newValue = !get().darkMode;
    await get().updateSetting('darkMode', newValue);
  },
  
  // Night mode state
  nightMode: false,
  toggleNightMode: async () => {
    const newValue = !get().nightMode;
    await get().updateSetting('nightMode', newValue);
  },
  
  // Desktop mode state
  desktopMode: false,
  toggleDesktopMode: async () => {
    const newValue = !get().desktopMode;
    await get().updateSetting('desktopMode', newValue);
  },
  
  // Incognito mode state
  incognitoMode: false,
  toggleIncognitoMode: async () => {
    const newValue = !get().incognitoMode;
    await get().updateSetting('incognitoMode', newValue);
  },
  
  // History state
  history: [],
  loadHistory: async () => {
    try {
      const history = await StorageManager.getHistory();
      // Ensure history is always an array
      const validHistory = Array.isArray(history) ? history : [];
      set({ history: validHistory });
    } catch (error) {
      console.error('Failed to load history:', error);
      set({ history: [] });
    }
  },
  
  addToHistory: async (item) => {
    try {
      const settings = get().settings;
      if (!settings.autoSaveHistory || get().incognitoMode) {
        return;
      }
      
      await StorageManager.addHistoryItem(item);
      await SearchIndexManager.addToIndex({ ...item, id: '', timestamp: Date.now(), visitCount: 1 }, 'history');
      await get().loadHistory();
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  },
  
  clearHistory: async () => {
    try {
      await StorageManager.clearHistory();
      await get().loadHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },
  
  searchHistory: async (query) => {
    try {
      return await StorageManager.searchHistory(query);
    } catch (error) {
      console.error('Failed to search history:', error);
      return [];
    }
  },
  
  // Bookmarks state
  bookmarks: [],
  loadBookmarks: async () => {
    try {
      const bookmarks = await StorageManager.getBookmarks();
      // Ensure bookmarks is always an array
      const validBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
      set({ bookmarks: validBookmarks });
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      set({ bookmarks: [] });
    }
  },
  
  addBookmark: async (item) => {
    try {
      await StorageManager.addBookmark(item);
      await SearchIndexManager.addToIndex({ ...item, id: '', dateAdded: Date.now() }, 'bookmark');
      await get().loadBookmarks();
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      throw error;
    }
  },
  
  removeBookmark: async (id) => {
    try {
      await StorageManager.removeBookmark(id);
      await SearchIndexManager.removeFromIndex(id);
      await get().loadBookmarks();
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  },
  
  updateBookmark: async (id, updates) => {
    try {
      await StorageManager.updateBookmark(id, updates);
      await get().loadBookmarks();
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      throw error;
    }
  },
  
  searchBookmarks: async (query) => {
    try {
      return await StorageManager.searchBookmarks(query);
    } catch (error) {
      console.error('Failed to search bookmarks:', error);
      return [];
    }
  },
  
  // Search functionality
  initializeSearch: async () => {
    try {
      await SearchIndexManager.initialize();
    } catch (error) {
      console.error('Failed to initialize search:', error);
    }
  },
  
  performSearch: async (query, options = {}) => {
    try {
      return await SearchIndexManager.search(query, options);
    } catch (error) {
      console.error('Failed to perform search:', error);
      return [];
    }
  },
  
  // Downloads
  initializeDownloads: async () => {
    try {
      await DownloadManager.initialize();
    } catch (error) {
      console.error('Failed to initialize downloads:', error);
    }
  },
  
  // Initialization
  initialize: async () => {
    try {
      await get().loadSettings();
      await get().loadTabs();
      await get().loadHistory();
      await get().loadBookmarks();
      await get().initializeSearch();
      await get().initializeDownloads();
    } catch (error) {
      console.error('Failed to initialize browser store:', error);
      // If initialization fails due to corrupted data, reset and try again
      try {
        console.log('Attempting to reset corrupted data...');
        await StorageManager.resetCorruptedData();
        await get().loadSettings();
        await get().loadTabs();
        await get().loadHistory();
        await get().loadBookmarks();
      } catch (resetError) {
        console.error('Failed to reset and reinitialize:', resetError);
      }
    }
  },
}));