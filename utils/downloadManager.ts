import { Platform, Alert } from 'react-native';
import { StorageManager, DownloadItem } from '@/utils/storage';
import { StorageManager, DownloadItem } from './storage';

// Conditional imports for native modules
let FileSystem: any = null;
let MediaLibrary: any = null;

if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
    MediaLibrary = require('expo-media-library');
  } catch (error) {
    console.warn('Native modules not available:', error);
  }
}

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}

export interface DownloadOptions {
  headers?: Record<string, string>;
  resumable?: boolean;
  timeout?: number;
}

export class DownloadManager {
  private static activeDownloads = new Map<string, FileSystem.DownloadResumable>();
  private static progressCallbacks = new Map<string, (progress: DownloadProgress) => void>();

  // Initialize download manager
  static async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('Download manager initialized for web (limited functionality)');
      return;
    }
    
    try {
      if (MediaLibrary) {
        // Request media library permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Media library permission not granted');
        }
      }
    } catch (error) {
      console.error('Failed to initialize download manager:', error);
      // Don't throw error, continue with limited functionality
    }
  }

  // Start a new download
  static async startDownload(
    url: string,
    filename?: string,
    options: DownloadOptions = {},
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid download URL');
      }

      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename(url);
      
      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(finalFilename);
      
      // Create download directory
      const downloadDir = `${FileSystem.documentDirectory}downloads/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      
      const localUri = `${downloadDir}${sanitizedFilename}`;

      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        const timestamp = Date.now();
        const name = sanitizedFilename.replace(/\.[^/.]+$/, '');
        const ext = sanitizedFilename.match(/\.[^/.]+$/)?.[0] || '';
        const newFilename = `${name}_${timestamp}${ext}`;
        const newLocalUri = `${downloadDir}${newFilename}`;
        
        return this.startDownload(url, newFilename, options, onProgress);
      }

      // Create download item in storage
      const downloadId = await StorageManager.addDownload({
        name: sanitizedFilename,
        url,
        localPath: localUri,
        size: 0,
        type: this.getFileType(sanitizedFilename),
        progress: 0,
        status: 'pending',
      });

      // Create download resumable
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {
          headers: options.headers || {},
        },
        (downloadProgress) => {
          const progress: DownloadProgress = {
            totalBytesWritten: downloadProgress.totalBytesWritten,
            totalBytesExpectedToWrite: downloadProgress.totalBytesExpectedToWrite,
            progress: downloadProgress.totalBytesExpectedToWrite > 0 
              ? (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
              : 0,
          };

          // Update storage
          StorageManager.updateDownload(downloadId, {
            progress: Math.round(progress.progress),
            size: downloadProgress.totalBytesExpectedToWrite,
            status: 'downloading',
          });

          // Call progress callback
          if (onProgress) {
            onProgress(progress);
          }

          // Call stored callback
          const storedCallback = this.progressCallbacks.get(downloadId);
          if (storedCallback) {
            storedCallback(progress);
          }
        }
      );

      // Store active download
      this.activeDownloads.set(downloadId, downloadResumable);
      if (onProgress) {
        this.progressCallbacks.set(downloadId, onProgress);
      }

      // Start download with timeout
      const timeoutMs = options.timeout || 30000; // 30 seconds default
      const downloadPromise = downloadResumable.downloadAsync();
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Download timeout')), timeoutMs);
      });

      try {
        const result = await Promise.race([downloadPromise, timeoutPromise]);
        
        if (result) {
          // Download completed successfully
          await StorageManager.updateDownload(downloadId, {
            progress: 100,
            status: 'completed',
            localPath: result.uri,
          });

          // Save to media library if it's a media file
          if (this.isMediaFile(sanitizedFilename)) {
            try {
              await MediaLibrary.saveToLibraryAsync(result.uri);
            } catch (error) {
              console.warn('Failed to save to media library:', error);
            }
          }

          // Clean up
          this.activeDownloads.delete(downloadId);
          this.progressCallbacks.delete(downloadId);

          return downloadId;
        } else {
          throw new Error('Download failed - no result');
        }
      } catch (error) {
        // Download failed
        await StorageManager.updateDownload(downloadId, {
          status: 'failed',
          error: error.message,
        });

        // Clean up
        this.activeDownloads.delete(downloadId);
        this.progressCallbacks.delete(downloadId);

        throw error;
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Pause download
  static async pauseDownload(downloadId: string): Promise<void> {
    try {
      const downloadResumable = this.activeDownloads.get(downloadId);
      if (downloadResumable) {
        await downloadResumable.pauseAsync();
        await StorageManager.updateDownload(downloadId, { status: 'paused' });
      }
    } catch (error) {
      console.error('Failed to pause download:', error);
      throw error;
    }
  }

  // Resume download
  static async resumeDownload(downloadId: string): Promise<void> {
    try {
      const downloadResumable = this.activeDownloads.get(downloadId);
      if (downloadResumable) {
        await downloadResumable.resumeAsync();
        await StorageManager.updateDownload(downloadId, { status: 'downloading' });
      }
    } catch (error) {
      console.error('Failed to resume download:', error);
      throw error;
    }
  }

  // Cancel download
  static async cancelDownload(downloadId: string): Promise<void> {
    try {
      const downloadResumable = this.activeDownloads.get(downloadId);
      if (downloadResumable) {
        await downloadResumable.pauseAsync();
        
        // Delete partial file
        const downloads = await StorageManager.getDownloads();
        const download = downloads.find(d => d.id === downloadId);
        if (download?.localPath) {
          try {
            await FileSystem.deleteAsync(download.localPath);
          } catch (error) {
            console.warn('Failed to delete partial file:', error);
          }
        }
      }

      // Remove from storage
      await StorageManager.removeDownload(downloadId);
      
      // Clean up
      this.activeDownloads.delete(downloadId);
      this.progressCallbacks.delete(downloadId);
    } catch (error) {
      console.error('Failed to cancel download:', error);
      throw error;
    }
  }

  // Get download progress
  static getDownloadProgress(downloadId: string): DownloadProgress | null {
    const downloadResumable = this.activeDownloads.get(downloadId);
    if (downloadResumable) {
      // This would need to be implemented based on the current state
      // For now, return null and rely on storage for progress info
    }
    return null;
  }

  // Utility methods
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static generateFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'download';
      
      // If no extension, try to determine from URL or use generic
      if (!filename.includes('.')) {
        return `${filename}.bin`;
      }
      
      return filename;
    } catch {
      return `download_${Date.now()}.bin`;
    }
  }

  private static sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255); // Limit length
  }

  private static getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      // Images
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
      // Videos
      mp4: 'video', avi: 'video', mov: 'video', wmv: 'video', flv: 'video', webm: 'video',
      // Audio
      mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio',
      // Documents
      pdf: 'document', doc: 'document', docx: 'document', txt: 'document', rtf: 'document',
      // Archives
      zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
      // Applications
      apk: 'application', exe: 'application', dmg: 'application', pkg: 'application',
    };

    return typeMap[extension || ''] || 'unknown';
  }

  private static isMediaFile(filename: string): boolean {
    const type = this.getFileType(filename);
    return ['image', 'video', 'audio'].includes(type);
  }

  // Public utility to download from WebView
  static async downloadFromWebView(
    url: string,
    filename?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, use browser's native download
      try {
        // Create a more robust web download
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || this.generateFilename(url);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(downloadUrl);
        
        Alert.alert('Success', 'Download started using browser');
      } catch (error) {
        console.error('Web download error:', error);
        Alert.alert('Error', `Download failed: ${error.message}`);
      }
      return;
    }
    
    try {
      await this.initialize();
      
      Alert.alert(
        'Download',
        `Do you want to download ${filename || 'this file'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async () => {
              try {
                await this.startDownload(url, filename, {}, onProgress);
                Alert.alert('Success', 'Download started successfully');
              } catch (error) {
                Alert.alert('Error', `Download failed: ${error.message}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Cannot start download: ${error.message}`);
    }
  }

  // Clear all downloads
  static async clearAllDownloads(): Promise<void> {
    try {
      // Cancel all active downloads
      const activeIds = Array.from(this.activeDownloads.keys());
      await Promise.all(activeIds.map(id => this.cancelDownload(id)));
      
      // Clear storage
      await StorageManager.setItem('downloads', []);
    } catch (error) {
      console.error('Failed to clear downloads:', error);
      throw error;
    }
  }
}

export default DownloadManager;