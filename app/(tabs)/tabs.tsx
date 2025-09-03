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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
} from '@/utils/responsive';

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
    incognitoMode,
  } = useBrowserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    const initializeTabs = async () => {
      await loadTabs();
      setIsLoading(false);
    };
    initializeTabs();
  }, [loadTabs]);

  const handleCreateNewTab = () => {
    try {
      const tabId = createNewTab();
      console.log('New tab created with ID:', tabId);
      // Navigate to browser with Google search
      router.push({
        pathname: '/',
        params: { url: 'https://www.google.com' }
      });
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

  const handleTabPress = (tabId: string) => {
    try {
      // Find the tab and navigate to its URL
      const tab = activeTabs.find(t => t.id === tabId);
      if (tab) {
        router.push({
          pathname: '/',
          params: { url: tab.url }
        });
      }
    } catch (error) {
      console.error('Tab press error:', error);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedTabs(new Set());
  };

  const toggleTabSelection = (tabId: string) => {
    const newSelection = new Set(selectedTabs);
    if (newSelection.has(tabId)) {
      newSelection.delete(tabId);
    } else {
      newSelection.add(tabId);
    }
    setSelectedTabs(newSelection);
  };

  const closeSelectedTabs = () => {
    Alert.alert(
      'Close Selected Tabs',
      `Close ${selectedTabs.size} selected tabs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: () => {
            selectedTabs.forEach(tabId => closeTab(tabId));
            setSelectedTabs(new Set());
            setIsSelectionMode(false);
          }
        }
      ]
    );
  };

  // Incognito mode colors
  const gradientColors = incognitoMode 
    ? ['#2c2c2c', '#1a1a1a'] 
    : ['#0a0b1e', '#1a1b3a', '#2a2b4a'];

  if (isLoading) {
    return (
      <LinearGradient colors={gradientColors} style={styles.container}>
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
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Tabs</Text>
            {incognitoMode && (
              <Text style={styles.incognitoLabel}>Incognito Mode</Text>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={isSelectionMode ? toggleSelectionMode : () => setIsSelectionMode(true)}
            style={styles.headerButton}
          >
            <Ionicons 
              name={isSelectionMode ? "close" : "checkmark-circle-outline"} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>

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

          {/* Selection Mode Actions */}
          {isSelectionMode && selectedTabs.size > 0 && (
            <View style={styles.selectionActions}>
              <TouchableOpacity style={styles.selectionButton} onPress={closeSelectedTabs}>
                <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                <Text style={styles.selectionButtonText}>Close Selected ({selectedTabs.size})</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Tabs Section */}
          {activeTabs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Tabs ({activeTabs.length})</Text>
                {!isSelectionMode && (
                  <TouchableOpacity style={styles.clearAllButton} onPress={handleCloseAllActive}>
                    <Text style={styles.clearAllButtonText}>Close All</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.tabsGrid}>
                {activeTabs.map((tab) => (
                  <TabCard
                    key={tab.id}
                    tab={tab}
                    onClose={() => handleCloseTab(tab.id)}
                    onPress={() => handleTabPress(tab.id)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedTabs.has(tab.id)}
                    onToggleSelection={() => toggleTabSelection(tab.id)}
                  />
                ))}
              </View>
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
              
              {closedTabs.slice(0, 10).map((tab) => (
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
                          // Remove from closed tabs permanently
                          console.log('Permanently delete tab:', tab.id);
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
              
              <TouchableOpacity style={styles.emptyActionButton} onPress={handleCreateNewTab}>
                <LinearGradient
                  colors={['#4285f4', '#5a95f5']}
                  style={styles.emptyActionGradient}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={styles.emptyActionText}>Create First Tab</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Tab Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="layers" size={16} color="#4285f4" />
              <Text style={styles.statText}>{activeTabs.length} Active</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color="#ff9800" />
              <Text style={styles.statText}>{closedTabs.length} Recent</Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerButton: {
    width: responsiveWidth(40),
    height: responsiveHeight(40),
    borderRadius: responsiveBorderRadius(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  selectionActions: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: responsiveBorderRadius(12),
    padding: responsiveSpacing(16),
    marginBottom: responsiveSpacing(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionButtonText: {
    color: '#ff6b6b',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    marginLeft: responsiveSpacing(8),
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
    marginBottom: responsiveSpacing(24),
  },
  emptyActionButton: {
    borderRadius: responsiveBorderRadius(12),
    elevation: 4,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveSpacing(24),
    paddingVertical: responsiveSpacing(12),
    borderRadius: responsiveBorderRadius(12),
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    marginLeft: responsiveSpacing(8),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: responsiveBorderRadius(12),
    padding: responsiveSpacing(16),
    marginTop: responsiveSpacing(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: responsiveSpacing(16),
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    marginLeft: responsiveSpacing(6),
  },
});