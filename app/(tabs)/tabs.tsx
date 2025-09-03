import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useBrowserStore } from '@/store/browserStore';
import { TabCard } from '@/components/TabCard';
import { RecentClosedItem } from '@/components/RecentClosedItem';
import { router } from 'expo-router';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  responsiveWidth,
  responsiveHeight,
  responsiveBorderRadius,
  isSmallScreen,
} from '../../utils/responsive';

export default function TabsScreen() {
  const {
    activeTabs,
    closedTabs,
    createNewTab,
    closeTab,
    closeAllActive,
    restoreClosedTab,
    clearAllClosed,
    loadTabs,
  } = useBrowserStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTabs = async () => {
      await loadTabs();
      setIsLoading(false);
    };
    initializeTabs();
  }, [loadTabs]);

  const handleCreateNewTab = () => {
    try {
      const tabId = createNewTab('https://www.google.com');
      console.log('New tab created with ID:', tabId);
      // Navigate to home page to browse the new tab
      router.push('/');
    } catch (error) {
      console.error('Create tab error:', error);
      Alert.alert('Error', 'Failed to create new tab');
    }
  };

  const handleCloseTab = (tabId: string) => {
    try {
      closeTab(tabId);
      console.log('Tab closed:', tabId);
    } catch (error) {
      console.error('Close tab error:', error);
      Alert.alert('Error', 'Failed to close tab');
    }
  };

  const handleRestoreTab = (tabId: string) => {
    try {
      restoreClosedTab(tabId);
      console.log('Tab restored:', tabId);
    } catch (error) {
      console.error('Restore tab error:', error);
      Alert.alert('Error', 'Failed to restore tab');
    }
  };

  const handleClearAllClosed = () => {
    Alert.alert(
      'Clear All Recently Closed',
      'Are you sure you want to clear all recently closed tabs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllClosed }
      ]
    );
  };

  const handleCloseAllActive = () => {
    Alert.alert(
      'Close All Active Tabs',
      'Are you sure you want to close all active tabs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close All', style: 'destructive', onPress: closeAllActive }
      ]
    );
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#0a0b1e', '#1a1b3a', '#2a2b4a']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text style={styles.loadingText}>Loading tabs...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0b1e', '#1a1b3a', '#2a2b4a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Create New Tab Button */}
          <TouchableOpacity style={styles.createNewTabButton} onPress={handleCreateNewTab}>
            <LinearGradient
              colors={['#4285f4', '#5a95f5']}
              style={styles.createNewTabGradient}
            >
              <Ionicons name="add-circle-outline" size={responsiveIconSize(24)} color="#ffffff" />
              <Text style={styles.createNewTabText}>Create New Tab</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Active Tabs Section */}
          {activeTabs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Tabs ({activeTabs.length})</Text>
                <TouchableOpacity style={styles.clearAllButton} onPress={handleCloseAllActive}>
                  <Text style={styles.clearAllButtonText}>Close All</Text>
                </TouchableOpacity>
              </View>
              
              {activeTabs.map((tab) => (
                <TabCard
                  key={tab.id}
                  tab={tab}
                  onClose={() => handleCloseTab(tab.id)}
                  onPress={() => router.push('/')}
                />
              ))}
            </View>
          )}

          {/* Recent Closed Section */}
          {closedTabs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Closed ({closedTabs.length})</Text>
                <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAllClosed}>
                  <Text style={styles.clearAllButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              
              {closedTabs.map((tab) => (
                <RecentClosedItem
                  key={tab.id}
                  tab={tab}
                  onRestore={() => handleRestoreTab(tab.id)}
                  onDelete={() => {
                    Alert.alert(
                      'Delete Tab',
                      'Are you sure you want to permanently delete this tab?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => {
                          // Remove from closed tabs
                          // In a real implementation, you might want a separate delete function
                        }}
                      ]
                    );
                  }}
                />
              ))}
            </View>
          )}

          {/* Empty State */}
          {activeTabs.length === 0 && closedTabs.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="layers-outline" size={responsiveIconSize(64)} color="#4285f4" />
              <Text style={styles.emptyTitle}>No Tabs Yet</Text>
              <Text style={styles.emptySubtitle}>Create your first tab to start browsing</Text>
            </View>
          )}
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    marginTop: responsiveSpacing(16),
  },
  content: {
    flex: 1,
    padding: responsiveSpacing(20),
  },
  createNewTabButton: {
    borderRadius: responsiveBorderRadius(16),
    marginBottom: responsiveSpacing(24),
    elevation: 4,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createNewTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveSpacing(20),
    paddingVertical: responsiveSpacing(16),
    borderRadius: responsiveBorderRadius(16),
  },
  createNewTabText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    marginLeft: responsiveSpacing(12),
  },
  section: {
    marginBottom: responsiveSpacing(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing(16),
  },
  sectionTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: '#ffffff',
  },
  clearAllButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: responsiveBorderRadius(8),
    paddingHorizontal: responsiveSpacing(12),
    paddingVertical: responsiveSpacing(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  clearAllButtonText: {
    color: '#ff6b6b',
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  tabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: responsiveSpacing(60),
    paddingHorizontal: responsiveSpacing(40),
  },
  emptyTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: responsiveSpacing(16),
    marginBottom: responsiveSpacing(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(16),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: responsiveFontSize(22),
  },
});