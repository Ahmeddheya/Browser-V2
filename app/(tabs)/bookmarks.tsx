import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useBrowserStore } from '../../store/browserStore';
import { BookmarkItem } from '../../utils/storage';

const BookmarksScreen = () => {
  const router = useRouter();
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkItem | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  
  const { bookmarks, loadBookmarks, removeBookmark, updateBookmark, searchBookmarks } = useBrowserStore();

  // Load bookmarks on component mount
  useEffect(() => {
    const initializeBookmarks = async () => {
      setIsLoading(true);
      try {
        await loadBookmarks();
        setFilteredBookmarks(bookmarks);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
        Alert.alert('Error', 'Failed to load bookmarks');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeBookmarks();
  }, []);
  
  // Update filtered bookmarks when bookmarks change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookmarks(bookmarks);
    }
  }, [bookmarks, searchQuery]);
  
  // Handle search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchBookmarks(searchQuery);
          setFilteredBookmarks(results);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setFilteredBookmarks(bookmarks);
      }
    }, 300);
    
    return () => clearTimeout(searchTimeout);
  }, [searchQuery, searchBookmarks, bookmarks]);

  const clearBookmarks = () => {
    Alert.alert(
      'Clear Bookmarks',
      'Are you sure you want to clear all bookmarks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all bookmarks individually
              await Promise.all(bookmarks.map(bookmark => removeBookmark(bookmark.id)));
              setFilteredBookmarks([]);
              Alert.alert('Success', 'All bookmarks have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear bookmarks');
            }
          },
        },
      ]
    );
  };

  const handleItemPress = (url: string) => {
    router.push({ pathname: '/', params: { url } });
  };

  const handleEditBookmark = (item: BookmarkItem) => {
    setSelectedBookmark(item);
    Alert.alert(
      'Bookmark Options',
      `Manage "${item.title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add to Folder', 
          onPress: () => {
            setNewFolderName(item.folder);
            setShowFolderModal(true);
          }
        },
        { 
          text: 'Edit', 
          onPress: () => {
            Alert.prompt(
              'Edit Bookmark',
              'Enter new title:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Save', 
                  onPress: async (newTitle) => {
                    if (newTitle && newTitle.trim()) {
                      try {
                        await updateBookmark(item.id, { title: newTitle.trim() });
                        Alert.alert('Success', 'Bookmark updated');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to update bookmark');
                      }
                    }
                  }
                }
              ],
              'plain-text',
              item.title
            );
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBookmark(item.id);
              setFilteredBookmarks(prev => prev.filter(b => b.id !== item.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bookmark');
            }
          },
        },
      ]
    );
  };

  const handleSaveFolder = async () => {
    if (!selectedBookmark || !newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      await updateBookmark(selectedBookmark.id, { folder: newFolderName.trim() });
      setShowFolderModal(false);
      setSelectedBookmark(null);
      setNewFolderName('');
      Alert.alert('Success', `Moved to "${newFolderName}" folder`);
    } catch (error) {
      Alert.alert('Error', 'Failed to move bookmark');
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getFaviconName = (url: string): string => {
    const domain = url.toLowerCase();
    if (domain.includes('google')) return 'globe-outline';
    if (domain.includes('youtube')) return 'play-circle-outline';
    if (domain.includes('github')) return 'logo-github';
    if (domain.includes('stackoverflow')) return 'help-circle-outline';
    return 'bookmark-outline';
  };

  const renderBookmarkItem = ({ item }: { item: BookmarkItem }) => (
    <TouchableOpacity
      style={styles.bookmarkItem}
      onPress={() => handleItemPress(item.url)}
      onLongPress={() => handleEditBookmark(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getFaviconName(item.url) as any} size={24} color="#007AFF" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemUrl} numberOfLines={1}>
          {item.url}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemFolder}>{item.folder}</Text>
          <Text style={styles.itemDate}>• {formatDate(item.dateAdded)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => handleEditBookmark(item)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <TouchableOpacity onPress={clearBookmarks} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookmarks"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {(isSearching || searchQuery.length > 0) && (
          <TouchableOpacity 
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#999" />
            ) : (
              <Ionicons name="close-circle" size={20} color="#999" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
        </View>
      ) : filteredBookmarks.length > 0 ? (
        <FlatList
          data={filteredBookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching bookmarks' : 'No bookmarks found'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Saved bookmarks will appear here'}
          </Text>
        </View>
      )}

      {/* Folder Modal */}
      <Modal visible={showFolderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move to Folder</Text>
              <TouchableOpacity onPress={() => setShowFolderModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.modalInput}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Enter folder name"
                placeholderTextColor="#888"
                autoFocus
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveFolder}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  bookmarkItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 5,
    padding: 15,
    elevation: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 15,
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  itemUrl: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemFolder: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  moreButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1b3a',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContent: {
    padding: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#4285f4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookmarksScreen;