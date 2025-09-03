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
import { Ionicons } from '@expo/vector-icons';
import { useTabsStore } from '../store/tabsStore';
import { TabCard } from '../components/TabCard';
import { RecentClosedItem } from '../components/RecentClosedItem';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AppHeader } from '../components/AppHeader';
import { useNavigation } from '@react-navigation/native';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  responsiveWidth,
  responsiveHeight,
  responsiveBorderRadius,
  isSmallScreen,
  wp,
  hp
} from '../utils/responsive';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function MyTabsScreen() {
  const navigation = useNavigation();
  const {
    activeTabs,
    closedTabs,
    createNewTab,
    closeTab,
    closeAllActive,
    restoreClosedTab,
    clearAllClosed,
    loadTabs,
  } = useTabsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    destructive?: boolean;
  }>({ visible: false, title: '', message: '', onConfirm: () => {}, destructive: false });

  useEffect(() => {
    const initializeTabs = async () => {
      await loadTabs();
      setIsLoading(false);
    };
    initializeTabs();
  }, [loadTabs]);

  const handleCreateNewTab = () => {
    const tabId = createNewTab();
    navigation.navigate('NewTab' as never, { tabId } as never);
  };

  const handleTabPress = (tabId: string) => {
    navigation.navigate('NewTab' as never, { tabId } as never);
  };

  const handleCloseTab = (tabId: string) => {
    closeTab(tabId);
  };

  const handleRestoreTab = (tabId: string) => {
    restoreClosedTab(tabId);
  };

  const handleDeleteClosedTab = (tabId: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Delete Tab',
      message: 'Are you sure you want to permanently delete this tab? This action cannot be undone.',
      onConfirm: () => {
        // For now, we'll just remove it from closed tabs
        // In a real implementation, you might want a separate delete function
        setConfirmDialog({ ...confirmDialog, visible: false });
      },
      destructive: true,
    });
  };

  const handleClearAllClosed = () => {
    setConfirmDialog({
      visible: true,
      title: 'Clear All Recently Closed',
      message: 'Are you sure you want to clear all recently closed tabs? This action cannot be undone.',
      onConfirm: () => {
        clearAllClosed();
        setConfirmDialog({ ...confirmDialog, visible: false });
      },
      destructive: true,
    });
  };

  const handleCloseAllActive = () => {
    setConfirmDialog({
      visible: true,
      title: 'Close All Active Tabs',
      message: 'Are you sure you want to close all active tabs? They will be moved to recently closed.',
      onConfirm: () => {
        closeAllActive();
        setConfirmDialog({ ...confirmDialog, visible: false });
      },
      destructive: true,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, visible: false });
  };

  if (isLoading) {
    return (
      <LinearGradient colors={colors.gradients.background} style={styles.container}>
        <AppHeader title="My Tabs" />
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
    <LinearGradient colors={colors.gradients.background} style={styles.container}>
      <AppHeader title="My Tabs" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Enhanced Create New Tab Button */}
          <Pressable
            style={[styles.newTabButton, pressedButton === 'newTab' && styles.newTabButtonPressed]}
            onPressIn={() => setPressedButton('newTab')}
            onPressOut={() => setPressedButton(null)}
            onPress={handleCreateNewTab}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.newTabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.newTabIconContainer}>
                <Ionicons name="add-circle-outline" size={responsiveIconSize(24)} color={colors.text.primary} />
              </View>
              <View style={styles.newTabTextContainer}>
                <Text style={styles.newTabText}>Create New Tab</Text>
                <Text style={styles.newTabSubtext}>Start browsing or search</Text>
              </View>
              <Ionicons name="arrow-forward" size={responsiveIconSize(20)} color="rgba(255, 255, 255, 0.8)" />
            </LinearGradient>
          </Pressable>

          {/* Active Tabs Section */}
          {activeTabs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={colors.gradients.primary.slice(0, 2)}
                  style={styles.sectionIndicator}
                />
                <Text style={styles.sectionTitle}>Active Tabs</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{activeTabs.length}</Text>
                </View>
              </View>

              {/* Close All Active Tabs Button */}
              <Pressable
                style={[styles.clearAllButton, pressedButton === 'closeAll' && styles.clearAllButtonPressed]}
                onPressIn={() => setPressedButton('closeAll')}
                onPressOut={() => setPressedButton(null)}
                onPress={handleCloseAllActive}
              >
                <Ionicons name="close-circle-outline" size={responsiveIconSize(18)} color={colors.error} />
                <Text style={styles.clearAllText}>Close All Active Tabs</Text>
              </Pressable>

              <View style={styles.tabsGrid}>
                {activeTabs.map((tab) => (
                  <TabCard
                    key={tab.id}
                    tab={tab}
                    onClose={() => handleCloseTab(tab.id)}
                    onPress={() => handleTabPress(tab.id)}
                    isPressed={pressedTab === tab.id}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Recently Closed Section */}
          {closedTabs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={colors.gradients.secondary}
                  style={styles.sectionIndicator}
                />
                <Text style={styles.sectionTitle}>Recently Closed</Text>
                <View style={[styles.sectionBadge, styles.recentClosedBadge]}>
                  <Text style={styles.sectionBadgeText}>{closedTabs.length}</Text>
                </View>
              </View>

              {/* Clear All Recent Closed Button */}
              <Pressable
                style={[styles.clearAllButton, pressedButton === 'clearAll' && styles.clearAllButtonPressed]}
                onPressIn={() => setPressedButton('clearAll')}
                onPressOut={() => setPressedButton(null)}
                onPress={handleClearAllClosed}
              >
                <Ionicons name="trash-outline" size={responsiveIconSize(18)} color={colors.error} />
                <Text style={styles.clearAllText}>Clear All Recently Closed</Text>
              </Pressable>

              {closedTabs.map((tab) => (
                <RecentClosedItem
                  key={tab.id}
                  tab={tab}
                  onRestore={() => handleRestoreTab(tab.id)}
                  onDelete={() => handleDeleteClosedTab(tab.id)}
                  isRestorePressed={pressedButton === `restore-${tab.id}`}
                  isDeletePressed={pressedButton === `delete-${tab.id}`}
                />
              ))}
            </View>
          )}

          {/* Empty State */}
          {activeTabs.length === 0 && closedTabs.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="layers-outline" size={responsiveIconSize(64)} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Tabs Yet</Text>
              <Text style={styles.emptySubtitle}>Create your first tab to start browsing</Text>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          visible={confirmDialog.visible}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirmDialog}
          destructive={confirmDialog.destructive}
        />
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
    color: colors.text.primary,
    fontSize: responsiveFontSize(16),
    marginTop: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.layout.screenPadding,
    paddingTop: spacing.lg,
  },
  // New Tab Button
  newTabButton: {
    borderRadius: responsiveBorderRadius(16),
    marginBottom: spacing.layout.sectionSpacing,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  newTabButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  newTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg + 2,
    borderRadius: responsiveBorderRadius(16),
  },
  newTabIconContainer: {
    width: responsiveWidth(48),
    height: responsiveHeight(48),
    borderRadius: responsiveBorderRadius(24),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  newTabTextContainer: {
    flex: 1,
  },
  newTabText: {
    color: colors.text.primary,
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  newTabSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(13),
    marginTop: spacing.xs / 2,
  },
  
  // Section Styles
  section: {
    marginBottom: spacing.layout.sectionSpacing + 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  sectionIndicator: {
    width: responsiveWidth(12),
    height: responsiveHeight(12),
    borderRadius: responsiveBorderRadius(6),
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    letterSpacing: 0.3,
  },
  sectionBadge: {
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderRadius: responsiveBorderRadius(12),
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  recentClosedBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  sectionBadgeText: {
    color: colors.text.primary,
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  
  // Clear All Button
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: responsiveBorderRadius(12),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  clearAllButtonPressed: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    transform: [{ scale: 0.98 }],
  },
  clearAllText: {
    color: colors.error,
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  
  // Tabs Grid
  tabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: responsiveSpacing(60),
    paddingHorizontal: responsiveSpacing(40),
  },
  emptyIconContainer: {
    width: responsiveWidth(120),
    height: responsiveHeight(120),
    borderRadius: responsiveBorderRadius(60),
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.layout.sectionSpacing,
    borderWidth: 2,
    borderColor: 'rgba(66, 133, 244, 0.2)',
  },
  emptyTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(16),
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: responsiveFontSize(22),
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: spacing.layout.sectionSpacing + 16,
  },
});