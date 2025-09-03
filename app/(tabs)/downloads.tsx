import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBrowserStore } from '@/store/browserStore';
import DownloadManager from '@/utils/downloadManager';
import { DownloadItem, StorageManager } from '@/utils/storage';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { initializeDownloads } = useBrowserStore();

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      setIsLoading(true);
      await initializeDownloads();
      
      // Load real downloads from storage
      const realDownloads = await StorageManager.getDownloads();
      setDownloads(realDownloads);
    } catch (error) {
      console.error('Failed to load downloads:', error);
      Alert.alert('Error', 'Failed to load downloads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTestDownload = async () => {
    try {
      const testUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      await DownloadManager.downloadFromWebView(testUrl, 'test-document.pdf');
      // Reload downloads after starting
      setTimeout(loadDownloads, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to start test download');
    }
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'Clear Downloads',
      'Are you sure you want to clear all downloads?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            try {
              StorageManager.setItem('downloads', []);
              setDownloads([]);
              Alert.alert('Success', 'Downloads cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear downloads');
            }
          }
        },
      ]
    );
  };

  const handleItemPress = (item: DownloadItem) => {
    if (item.status === 'completed') {
      Alert.alert('Open File', `Opening ${item.name}`);
    } else if (item.status === 'downloading') {
      Alert.alert('Download in Progress', `${item.name} is ${item.progress}% complete`);
    } else {
      Alert.alert('Download Failed', `${item.name} failed to download`);
    }
  };

  const handleCancelDownload = async (item: DownloadItem) => {
    if (item.status === 'downloading') {
      try {
        await DownloadManager.cancelDownload(item.id);
        setDownloads(prev => prev.filter(d => d.id !== item.id));
        Alert.alert('Success', 'Download cancelled');
      } catch (error) {
        Alert.alert('Error', 'Failed to cancel download');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'document': return 'document-text-outline';
      case 'image': return 'image-outline';
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-note-outline';
      case 'archive': return 'archive-outline';
      default: return 'document-outline';
    }
  };

  const getStatusColor = (status: DownloadItem['status']): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'downloading': return '#4285f4';
      case 'paused': return '#ff9800';
      case 'failed': return '#f44336';
      default: return '#888';
    }
  };

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
    <TouchableOpacity
      style={styles.downloadItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getFileIcon(item.type)} size={24} color={getStatusColor(item.status)} />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemSize}>
          {formatFileSize(item.size)} • {formatDate(item.dateStarted)}
        </Text>
        
        {item.status === 'downloading' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
        )}
        
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          if (item.status === 'downloading') {
            handleCancelDownload(item);
          } else {
            setDownloads(prev => prev.filter(d => d.id !== item.id));
          }
        }}
      >
        <Ionicons 
          name={item.status === 'downloading' ? 'stop-circle-outline' : 'trash-outline'} 
          size={20} 
          color="#888" 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0a0b1e', '#1a1b3a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Downloads</Text>
          <TouchableOpacity onPress={handleClearDownloads}>
            <Ionicons name="trash-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStartTestDownload} style={{ marginLeft: 12 }}>
            <Ionicons name="add-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Downloads List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text style={styles.loadingText}>Loading downloads...</Text>
          </View>
        ) : downloads.length > 0 ? (
          <FlatList
            data={downloads}
            renderItem={renderDownloadItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.downloadsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="download-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No downloads</Text>
            <Text style={styles.emptyStateSubtext}>Your downloaded files will appear here</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 11, 30, 0.95)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  downloadsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#4285f4',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});