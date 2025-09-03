import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ClosedTab } from '@/types/tabs';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  responsiveWidth,
  responsiveHeight,
  responsiveBorderRadius,
} from '@/utils/responsive';

interface RecentClosedItemProps {
  tab: ClosedTab;
  onRestore: () => void;
  onDelete: () => void;
  isRestorePressed?: boolean;
  isDeletePressed?: boolean;
}

export const RecentClosedItem: React.FC<RecentClosedItemProps> = React.memo(({ 
  tab, 
  onRestore, 
  onDelete,
  isRestorePressed = false,
  isDeletePressed = false
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(255, 152, 0, 0.08)', 'rgba(255, 152, 0, 0.04)']}
        style={styles.gradient}
      >
        {/* Tab Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.tabIcon}>
            <Ionicons name="time-outline" size={responsiveIconSize(20)} color="#ff9800" />
          </View>
        </View>

        {/* Tab Info */}
        <View style={styles.tabInfo}>
          <Text style={styles.tabTitle} numberOfLines={1}>
            {tab.title}
          </Text>
          <Text style={styles.tabDomain} numberOfLines={1}>
            {getDomainFromUrl(tab.url)}
          </Text>
          <Text style={styles.timeAgo}>
            {getTimeAgo(tab.closedAt)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Restore Button */}
          <Pressable
            style={[
              styles.actionButton,
              styles.restoreButton,
              isRestorePressed && styles.actionButtonPressed
            ]}
            onPress={onRestore}
          >
            <MaterialIcons 
              name="restore" 
              size={responsiveIconSize(18)} 
              color="#4285f4" 
            />
          </Pressable>

          {/* Delete Button */}
          <Pressable
            style={[
              styles.actionButton,
              styles.deleteButton,
              isDeletePressed && styles.actionButtonPressed
            ]}
            onPress={onDelete}
          >
            <MaterialCommunityIcons 
              name="trash-can-outline" 
              size={responsiveIconSize(18)} 
              color="#ff6b6b" 
            />
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: responsiveSpacing(12),
    borderRadius: responsiveBorderRadius(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSpacing(16),
    borderRadius: responsiveBorderRadius(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  iconContainer: {
    marginRight: responsiveSpacing(12),
  },
  tabIcon: {
    width: responsiveWidth(40),
    height: responsiveHeight(40),
    borderRadius: responsiveBorderRadius(20),
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  tabInfo: {
    flex: 1,
    marginRight: responsiveSpacing(12),
  },
  tabTitle: {
    color: '#ffffff',
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    marginBottom: responsiveSpacing(2),
  },
  tabDomain: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsiveFontSize(12),
    marginBottom: responsiveSpacing(2),
  },
  timeAgo: {
    color: 'rgba(255, 152, 0, 0.8)',
    fontSize: responsiveFontSize(10),
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: responsiveWidth(36),
    height: responsiveHeight(36),
    borderRadius: responsiveBorderRadius(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveSpacing(8),
    borderWidth: 1,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.9 }],
  },
  restoreButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderColor: 'rgba(66, 133, 244, 0.4)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
});