import { create } from 'zustand';
import { StorageManager, BrowserSettings, HistoryItem, BookmarkItem } from '../utils/storage';
import SearchIndexManager from '../utils/searchIndex';
import DownloadManager from '../utils/downloadManager';
import { AdvancedBrowserSettings } from '../types/settings';

interface BrowserState {
  // Settings
  settings: AdvancedBrowserSettings;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AdvancedBrowserSettings>(key: K, value: AdvancedBrowserSettings[K]) => Promise<void>;
  
  // Ad blocking
  isAdBlockEnabled: boolean;
  toggleAdBlock: () => Promise<void>;
  
  // Tabs management
  tabs: Array<{ id: string; title: string; url: string; isActive: boolean }>;
  activeTabs: Array<{ id: string; title: string; url: string }>;
  suspendedTabs: Array<{ id: string; title: string; url: string; suspendedAt: number }>;
  addTab: (url: string, title: string) => string;
  closeTab: (tabId: string) => void;
  restoreTab: (tabId: string) => void;
  clearAllSuspendedTabs: () => void;
  closeAllTabs: () => void;
  
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
  suspendedTabs: [],
  addTab: (url: string, title: string) => {
    const newTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      url,
      isActive: true,
    };
    
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabs: [...state.activeTabs, newTab],
    }));
    
    return newTab.id;
  },
  closeTab: (tabId: string) => {
    set((state) => {
      const tab = state.activeTabs.find(t => t.id === tabId);
      if (tab) {
        return {
          activeTabs: state.activeTabs.filter(t => t.id !== tabId),
          suspendedTabs: [...state.suspendedTabs, { ...tab, suspendedAt: Date.now() }],
        };
      }
      return state;
    });
  },
  restoreTab: (tabId: string) => {
    set((state) => {
      const tab = state.suspendedTabs.find(t => t.id === tabId);
      if (tab) {
        const { suspendedAt, ...restoreTab } = tab;
        return {
          suspendedTabs: state.suspendedTabs.filter(t => t.id !== tabId),
          activeTabs: [...state.activeTabs, restoreTab],
        };
      }
      return state;
    });
  },
  clearAllSuspendedTabs: () => {
    set((state) => ({
      suspendedTabs: [],
    }));
  },
  closeAllTabs: () => {
    set((state) => ({
      activeTabs: [],
      suspendedTabs: [...state.suspendedTabs, ...state.activeTabs.map(tab => ({ ...tab, suspendedAt: Date.now() }))],
    }));
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
    }
  },
  
  updateBookmark: async (id, updates) => {
    try {
      await StorageManager.updateBookmark(id, updates);
      await get().loadBookmarks();
    } catch (error) {
      console.error('Failed to update bookmark:', error);
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
        await get().loadHistory();
        await get().loadBookmarks();
      } catch (resetError) {
        console.error('Failed to reset and reinitialize:', resetError);
      }
    }
  },
}));