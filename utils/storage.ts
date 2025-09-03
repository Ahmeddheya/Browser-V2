import { Platform } from 'react-native';

// Conditional import for AsyncStorage
let AsyncStorage: any = null;

if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (error) {
    console.warn('AsyncStorage not available:', error);
  }
} else {
  // Web fallback using localStorage
  AsyncStorage = {
    async getItem(key: string): Promise<string | null> {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        throw new Error(`Failed to save ${key}`);
      }
    },
    async removeItem(key: string): Promise<void> {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        throw new Error(`Failed to remove ${key}`);
      }
    },
    async clear(): Promise<void> {
      try {
        localStorage.clear();
      } catch (error) {
        throw new Error('Failed to clear storage');
      }
    }
  };
}

// Storage keys
export const STORAGE_KEYS = {
  HISTORY: '@browser_history',
  BOOKMARKS: '@browser_bookmarks',
  DOWNLOADS: '@browser_downloads',
  SETTINGS: '@browser_settings',
  SEARCH_INDEX: '@search_index',
} as const;

// Types
export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: number;
  favicon?: string;
  visitCount: number;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  folder: string;
  dateAdded: number;
  tags?: string[];
}

export interface DownloadItem {
  id: string;
  name: string;
  url: string;
  localPath?: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  dateStarted: number;
  dateCompleted?: number;
  error?: string;
}

export interface BrowserSettings {
  darkMode: boolean;
  nightMode: boolean;
  incognitoMode: boolean;
  desktopMode: boolean;
  adBlockEnabled: boolean;
  searchEngine: string;
  homepage: string;
  autoSaveHistory: boolean;
  maxHistoryItems: number;
}

// Storage utility class
export class StorageManager {
  // Generic storage methods
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw new Error(`Failed to save ${key}`);
    }
  }

  static async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue == null) {
        return defaultValue;
      }
      
      const parsed = JSON.parse(jsonValue);
      
      // Ensure arrays are properly handled
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        console.warn(`Expected array for ${key}, but got:`, typeof parsed);
        return defaultValue;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      // Clear corrupted data
      try {
        await AsyncStorage.removeItem(key);
      } catch (clearError) {
        console.error(`Error clearing corrupted ${key}:`, clearError);
      }
      return defaultValue;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw new Error(`Failed to remove ${key}`);
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  // Reset corrupted data to defaults
  static async resetCorruptedData(): Promise<void> {
    try {
      // Reset all array-based storage to empty arrays
      await this.setItem(STORAGE_KEYS.HISTORY, []);
      await this.setItem(STORAGE_KEYS.BOOKMARKS, []);
      await this.setItem(STORAGE_KEYS.DOWNLOADS, []);
      
      // Reset settings to defaults
      const defaultSettings: BrowserSettings = {
        darkMode: false,
        nightMode: false,
        incognitoMode: false,
        desktopMode: false,
        adBlockEnabled: true,
        searchEngine: 'google',
        homepage: 'https://www.google.com',
        autoSaveHistory: true,
        maxHistoryItems: 1000,
      };
      await this.setItem(STORAGE_KEYS.SETTINGS, defaultSettings);
      
      console.log('Successfully reset corrupted data to defaults');
    } catch (error) {
      console.error('Error resetting corrupted data:', error);
    }
  }

  // History management
  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const result = await this.getItem<HistoryItem[]>(STORAGE_KEYS.HISTORY, []);
      // Double-check that result is an array
      if (!Array.isArray(result)) {
        console.warn('History data is not an array, resetting to empty array');
        await this.setItem(STORAGE_KEYS.HISTORY, []);
        return [];
      }
      return result;
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  static async addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp' | 'visitCount'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const existingIndex = history.findIndex(h => h.url === item.url);
      
      if (existingIndex >= 0) {
        // Update existing item
        history[existingIndex] = {
          ...history[existingIndex],
          title: item.title,
          timestamp: Date.now(),
          visitCount: history[existingIndex].visitCount + 1,
        };
      } else {
        // Add new item
        const newItem: HistoryItem = {
          ...item,
          id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          visitCount: 1,
        };
        history.unshift(newItem);
      }

      // Limit history size
      const settings = await this.getSettings();
      if (history.length > settings.maxHistoryItems) {
        history.splice(settings.maxHistoryItems);
      }

      await this.setItem(STORAGE_KEYS.HISTORY, history);
    } catch (error) {
      console.error('Error adding history item:', error);
      throw error;
    }
  }

  static async clearHistory(): Promise<void> {
    await this.setItem(STORAGE_KEYS.HISTORY, []);
  }

  static async searchHistory(query: string): Promise<HistoryItem[]> {
    const history = await this.getHistory();
    const lowercaseQuery = query.toLowerCase();
    
    return history.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.url.toLowerCase().includes(lowercaseQuery)
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Bookmarks management
  static async getBookmarks(): Promise<BookmarkItem[]> {
    try {
      const result = await this.getItem<BookmarkItem[]>(STORAGE_KEYS.BOOKMARKS, []);
      // Double-check that result is an array
      if (!Array.isArray(result)) {
        console.warn('Bookmarks data is not an array, resetting to empty array');
        await this.setItem(STORAGE_KEYS.BOOKMARKS, []);
        return [];
      }
      return result;
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  static async addBookmark(item: Omit<BookmarkItem, 'id' | 'dateAdded'>): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      const existingIndex = bookmarks.findIndex(b => b.url === item.url);
      
      if (existingIndex >= 0) {
        throw new Error('Bookmark already exists');
      }

      const newBookmark: BookmarkItem = {
        ...item,
        id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: Date.now(),
      };

      bookmarks.unshift(newBookmark);
      await this.setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  static async removeBookmark(id: string): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      const filteredBookmarks = bookmarks.filter(b => b.id !== id);
      await this.setItem(STORAGE_KEYS.BOOKMARKS, filteredBookmarks);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  static async removeHistoryItem(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(h => h.id !== id);
      await this.setItem(STORAGE_KEYS.HISTORY, filteredHistory);
    } catch (error) {
      console.error('Error removing history item:', error);
      throw error;
    }
  }
  static async updateBookmark(id: string, updates: Partial<BookmarkItem>): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      const index = bookmarks.findIndex(b => b.id === id);
      
      if (index >= 0) {
        bookmarks[index] = { ...bookmarks[index], ...updates };
        await this.setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }

  static async searchBookmarks(query: string): Promise<BookmarkItem[]> {
    const bookmarks = await this.getBookmarks();
    const lowercaseQuery = query.toLowerCase();
    
    return bookmarks.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.url.toLowerCase().includes(lowercaseQuery) ||
      item.folder.toLowerCase().includes(lowercaseQuery) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }

  // Downloads management
  static async getDownloads(): Promise<DownloadItem[]> {
    try {
      const result = await this.getItem<DownloadItem[]>(STORAGE_KEYS.DOWNLOADS, []);
      // Double-check that result is an array
      if (!Array.isArray(result)) {
        console.warn('Downloads data is not an array, resetting to empty array');
        await this.setItem(STORAGE_KEYS.DOWNLOADS, []);
        return [];
      }
      return result;
    } catch (error) {
      console.error('Error getting downloads:', error);
      return [];
    }
  }

  static async addDownload(item: Omit<DownloadItem, 'id' | 'dateStarted'>): Promise<string> {
    try {
      const downloads = await this.getDownloads();
      const newDownload: DownloadItem = {
        ...item,
        id: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dateStarted: Date.now(),
      };

      downloads.unshift(newDownload);
      await this.setItem(STORAGE_KEYS.DOWNLOADS, downloads);
      return newDownload.id;
    } catch (error) {
      console.error('Error adding download:', error);
      throw error;
    }
  }

  static async updateDownload(id: string, updates: Partial<DownloadItem>): Promise<void> {
    try {
      const downloads = await this.getDownloads();
      const index = downloads.findIndex(d => d.id === id);
      
      if (index >= 0) {
        downloads[index] = { ...downloads[index], ...updates };
        if (updates.status === 'completed') {
          downloads[index].dateCompleted = Date.now();
        }
        await this.setItem(STORAGE_KEYS.DOWNLOADS, downloads);
      }
    } catch (error) {
      console.error('Error updating download:', error);
      throw error;
    }
  }

  static async removeDownload(id: string): Promise<void> {
    try {
      const downloads = await this.getDownloads();
      const filteredDownloads = downloads.filter(d => d.id !== id);
      await this.setItem(STORAGE_KEYS.DOWNLOADS, filteredDownloads);
    } catch (error) {
      console.error('Error removing download:', error);
      throw error;
    }
  }

  // Settings management
  static async getSettings(): Promise<BrowserSettings> {
    const defaultSettings: BrowserSettings = {
      darkMode: false,
      nightMode: false,
      incognitoMode: false,
      desktopMode: false,
      adBlockEnabled: true,
      searchEngine: 'google',
      homepage: 'https://www.google.com',
      autoSaveHistory: true,
      maxHistoryItems: 1000,
    };
    
    return this.getItem<BrowserSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  static async updateSettings(updates: Partial<BrowserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...updates };
      await this.setItem(STORAGE_KEYS.SETTINGS, newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}

// Export default instance
export default StorageManager;