import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Mock data for downloads - in a real app, this would come from storage
const mockDownloadsData = [
  { id: '1', filename: 'report.pdf', size: '2.4 MB', progress: 100, date: '2023-10-15 14:30' },
  { id: '2', filename: 'presentation.pptx', size: '5.7 MB', progress: 100, date: '2023-10-14 13:45' },
  { id: '3', filename: 'image.jpg', size: '1.2 MB', progress: 100, date: '2023-10-13 11:20' },
  { id: '4', filename: 'document.docx', size: '3.5 MB', progress: 100, date: '2023-10-12 19:15' },
  { id: '5', filename: 'archive.zip', size: '15.8 MB', progress: 80, date: '2023-10-11 16:30' },
];

export default function DownloadsScreen() {
  const [downloadsData, setDownloadsData] = useState(mockDownloadsData);

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
            setDownloadsData([]);
            Alert.alert('Downloads Cleared', 'Your downloads have been cleared.');
          }
        },
      ]
    );
  };

  const handleItemPress = (item: any) => {
    if (item.progress === 100) {
      Alert.alert('Open File', `Opening ${item.filename}`);
    } else {
      Alert.alert('Download in Progress', `${item.filename} is still downloading (${item.progress}%)`);
    }
  };

  const renderDownloadItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.downloadItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.downloadIcon}>
        <Ionicons 
          name={getFileIcon(item.filename)} 
          size={20} 
          color="#4285f4" 
        />
      </View>
      <View style={styles.downloadContent}>
        <Text style={styles.downloadTitle} numberOfLines={1}>{item.filename}</Text>
        <View style={styles.downloadDetails}>
          <Text style={styles.downloadSize}>{item.size}</Text>
          <Text style={styles.downloadDate}>{item.date}</Text>
        </View>
        {item.progress < 100 && (
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
        )}
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          setDownloadsData(downloadsData.filter(downloadItem => downloadItem.id !== item.id));
        }}
      >
        <Ionicons name="close-circle-outline" size={20} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Helper function to determine icon based on file extension
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'document-text-outline';
      case 'doc':
      case 'docx':
        return 'document-outline';
      case 'xls':
      case 'xlsx':
        return 'grid-outline';
      case 'ppt':
      case 'pptx':
        return 'easel-outline';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image-outline';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'musical-note-outline';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'videocam-outline';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive-outline';
      default:
        return 'document-outline';
    }
  };

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
        </View>

        {/* Downloads List */}
        {downloadsData.length > 0 ? (
          <FlatList
            data={downloadsData}
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
  downloadsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  downloadIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  downloadContent: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  downloadDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  downloadSize: {
    fontSize: 12,
    color: '#aaaaaa',
  },
  downloadDate: {
    fontSize: 12,
    color: '#888',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: 6,
    fontSize: 10,
    color: '#aaaaaa',
  },
  deleteButton: {
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