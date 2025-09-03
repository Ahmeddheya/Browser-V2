import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBrowserStore } from '../../store/browserStore';
import { HistoryItem, StorageManager } from '../../utils/storage';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  responsiveWidth,
  responsiveHeight,
  responsiveBorderRadius,
  isSmallScreen,
} from '@/utils/responsive';

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [groupBy, setGroupBy] = useState<'date' | 'site'>('date');
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  
  const { history, loadHistory, clearHistory, searchHistory, nightMode, incognitoMode } = useBrowserStore();

  // Colors based on mode
  const gradientColors = incognitoMode 
    ? ['#2c2c2c', '#1a1a1a'] 
    : nightMode 
    ? ['#000000', '#1a1a1a']
    : ['#0a0b1e', '#1a1b3a'];

  // Load history on component mount
  useEffect(() => {
    const initializeHistory = async () => {
      setIsLoading(true);
      try {
        await loadHistory();
        setFilteredHistory(history);
      } catch (error) {
        console.error('Failed to load history:', error);
        Alert.alert('Error', 'Failed to load browsing history');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeHistory();
  }, []);
  
  // Update filtered history when history changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    }
  }, [history, searchQuery]);
  
  // Handle search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchHistory(searchQuery);
          setFilteredHistory(results);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setFilteredHistory(history);
      }
    }, 300);
    
    return () => clearTimeout(searchTimeout);
  }, [searchQuery, searchHistory, history]);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Browsing History',
      'Are you sure you want to clear all browsing history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              setFilteredHistory([]);
              Alert.alert('Success', 'Your browsing history has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        },
      ]
    );
  };

  const handleItemPress = (url: string) => {
    // Navigate back to browser with the selected URL
    router.push({ pathname: '/', params: { url } });
  };
  
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const handleDeleteItem = async (item: HistoryItem) => {
    Alert.alert(
      'Delete History Item',
      `Remove "${item.title}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from filtered list immediately for better UX
              setFilteredHistory(prev => prev.filter(h => h.id !== item.id));
              
              // Delete individual history item
              const currentHistory = await StorageManager.getHistory();
              const updatedHistory = currentHistory.filter(h => h.id !== item.id);
              await StorageManager.setItem('@browser_history', updatedHistory);
              
              // Update the main store
              await loadHistory();
              
              Alert.alert('Success', 'History item deleted');
            } catch (error) {
              console.error('Delete history error:', error);
              Alert.alert('Error', 'Failed to delete history item');
              await loadHistory(); // Reload on error
            }
          }
        }
      ]
    );
  };

  const groupHistoryByDate = (historyItems: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    historyItems.forEach(item => {
      const date = new Date(item.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString();
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  };

  const groupHistoryBySite = (historyItems: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    historyItems.forEach(item => {
      try {
        const domain = new URL(item.url).hostname.replace('www.', '');
        if (!groups[domain]) {
          groups[domain] = [];
        }
        groups[domain].push(item);
      } catch {
        if (!groups['Other']) {
          groups['Other'] = [];
        }
        groups['Other'].push(item);
      }
    });
    
    return groups;
  };

  const renderGroupedHistory = () => {
    const groups = groupBy === 'date' 
      ? groupHistoryByDate(filteredHistory)
      : groupHistoryBySite(filteredHistory);
    
    return Object.entries(groups).map(([groupName, items]) => (
      <View key={groupName} style={styles.historyGroup}>
        <Text style={styles.groupTitle}>{groupName}</Text>
        {items.map(item => renderHistoryItem({ item }))}
      </View>
    ));
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => handleItemPress(item.url)}
    >
      <View style={styles.historyIcon}>
        <Ionicons name="globe-outline" size={20} color="#4285f4" />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.historyUrl} numberOfLines={1}>{item.url}</Text>
        <View style={styles.historyMeta}>
          <Text style={styles.historyDate}>{formatTimestamp(item.timestamp)}</Text>
          {item.visitCount > 1 && (
            <Text style={styles.visitCount}>• {item.visitCount} visits</Text>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item)}
      >
        <Ionicons name="close" size={16} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={responsiveIconSize(24)} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>History</Text>
            {incognitoMode && (
              <Text style={styles.incognitoLabel}>Incognito Mode</Text>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setShowGroupOptions(!showGroupOptions)}
              style={styles.headerButton}
            >
              <Ionicons name="options-outline" size={responsiveIconSize(20)} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearHistory} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={responsiveIconSize(20)} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group Options */}
        {showGroupOptions && (
          <View style={styles.groupOptions}>
            <TouchableOpacity
              style={[styles.groupOption, groupBy === 'date' && styles.activeGroupOption]}
              onPress={() => {
                setGroupBy('date');
                setShowGroupOptions(false);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={groupBy === 'date' ? '#4CAF50' : '#888'} />
              <Text style={[styles.groupOptionText, groupBy === 'date' && styles.activeGroupOptionText]}>
                By Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.groupOption, groupBy === 'site' && styles.activeGroupOption]}
              onPress={() => {
                setGroupBy('site');
                setShowGroupOptions(false);
              }}
            >
              <Ionicons name="globe-outline" size={16} color={groupBy === 'site' ? '#4CAF50' : '#888'} />
              <Text style={[styles.groupOptionText, groupBy === 'site' && styles.activeGroupOptionText]}>
                By Site
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInputField}
            placeholder="Search history..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {(isSearching || searchQuery.length > 0) && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#888" />
              ) : (
                <Ionicons name="close-circle" size={20} color="#888" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* History List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : filteredHistory.length > 0 ? (
          <ScrollView 
            contentContainerStyle={styles.historyList}
            showsVerticalScrollIndicator={false}
          >
            {renderGroupedHistory()}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No matching history' : 'No browsing history'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery 
                ? 'Try a different search term'
                : 'Your browsing history will appear here'
              }
            </Text>
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
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(20),
    paddingVertical: responsiveSpacing(16),
    paddingTop: responsiveSpacing(50),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 11, 30, 0.95)',
    elevation: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: responsiveSpacing(16),
  },
  headerTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  incognitoLabel: {
    fontSize: responsiveFontSize(10),
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: responsiveSpacing(2),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: responsiveWidth(36),
    height: responsiveHeight(36),
    borderRadius: responsiveBorderRadius(18),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveSpacing(8),
  },
  groupOptions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: responsiveSpacing(20),
    marginVertical: responsiveSpacing(8),
    borderRadius: responsiveBorderRadius(8),
    padding: responsiveSpacing(4),
  },
  groupOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing(8),
    borderRadius: responsiveBorderRadius(6),
  },
  activeGroupOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  groupOptionText: {
    color: '#888',
    fontSize: responsiveFontSize(12),
    fontWeight: '500',
    marginLeft: responsiveSpacing(4),
  },
  activeGroupOptionText: {
    color: '#4CAF50',
  },
  historyGroup: {
    marginBottom: responsiveSpacing(20),
  },
  groupTitle: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: responsiveSpacing(12),
    paddingHorizontal: responsiveSpacing(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputField: {
    flex: 1,
    height: 24,
    color: '#ffffff',
    fontSize: 14,
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
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  historyList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  historyUrl: {
    fontSize: 12,
    color: '#aaaaaa',
    marginBottom: 2,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 10,
    color: '#888',
  },
  visitCount: {
    fontSize: 10,
    color: '#4285f4',
    marginLeft: 4,
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