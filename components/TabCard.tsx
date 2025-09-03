import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Tab } from '../types/tabs';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  responsiveWidth,
  responsiveHeight,
  responsiveBorderRadius,
  isSmallScreen,
} from '../utils/responsive';

interface TabCardProps {
  tab: Tab;
  onClose: () => void;
  onPress?: () => void;
  isPressed?: boolean;
}

export const TabCard: React.FC<TabCardProps> = ({ 
  tab, 
  onClose, 
  onPress,
  isPressed = false 
}) => {
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getPreviewBackground = () => {
    if (tab.url === 'about:blank') {
      return ['rgba(66, 133, 244, 0.1)', 'rgba(66, 133, 244, 0.05)'];
    }
    if (tab.url.includes('google.com')) {
      return ['rgba(66, 133, 244, 0.15)', 'rgba(66, 133, 244, 0.08)'];
    }
    if (tab.url.includes('youtube.com')) {
      return ['rgba(255, 0, 0, 0.15)', 'rgba(255, 0, 0, 0.08)'];
    }
    if (tab.url.includes('github.com')) {
      return ['rgba(36, 41, 46, 0.15)', 'rgba(36, 41, 46, 0.08)'];
    }
    return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
  };

  return (
    <Pressable
      style={[styles.container, isPressed && styles.containerPressed]}
      onPress={onPress}
    >
      <LinearGradient
        colors={getPreviewBackground()}
        style={styles.gradient}
      >
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={responsiveIconSize(16)} color="#ff6b6b" />
        </TouchableOpacity>

        {/* Preview Area */}
        <View style={styles.previewArea}>
          <View style={styles.faviconContainer}>
            <Ionicons 
              name={tab.url === 'about:blank' ? 'add-outline' : 'globe-outline'} 
              size={responsiveIconSize(32)} 
              color="#4285f4" 
            />
          </View>
          
          {/* URL Preview Bar */}
          <View style={styles.urlPreview}>
            <Ionicons name="lock-closed" size={responsiveIconSize(12)} color="#4CAF50" />
            <Text style={styles.urlText} numberOfLines={1}>
              {getDomainFromUrl(tab.url)}
            </Text>
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
        </View>

        {/* Active Indicator */}
        <View style={styles.activeIndicator}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: isSmallScreen() ? '100%' : '48%',
    marginBottom: responsiveSpacing(16),
    borderRadius: responsiveBorderRadius(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  containerPressed: {
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    borderRadius: responsiveBorderRadius(16),
    padding: responsiveSpacing(16),
    minHeight: responsiveHeight(140),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: responsiveSpacing(8),
    right: responsiveSpacing(8),
    width: responsiveWidth(28),
    height: responsiveHeight(28),
    borderRadius: responsiveBorderRadius(14),
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    zIndex: 1,
  },
  previewArea: {
    alignItems: 'center',
    marginBottom: responsiveSpacing(12),
  },
  faviconContainer: {
    width: responsiveWidth(56),
    height: responsiveHeight(56),
    borderRadius: responsiveBorderRadius(28),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing(8),
    borderWidth: 2,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: responsiveBorderRadius(12),
    paddingHorizontal: responsiveSpacing(8),
    paddingVertical: responsiveSpacing(4),
    maxWidth: '90%',
  },
  urlText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(10),
    marginLeft: responsiveSpacing(4),
    fontWeight: '500',
  },
  tabInfo: {
    alignItems: 'center',
    marginBottom: responsiveSpacing(8),
  },
  tabTitle: {
    color: '#ffffff',
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: responsiveSpacing(2),
  },
  tabDomain: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsiveFontSize(11),
    textAlign: 'center',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: responsiveBorderRadius(12),
    paddingHorizontal: responsiveSpacing(8),
    paddingVertical: responsiveSpacing(4),
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  activeDot: {
    width: responsiveWidth(6),
    height: responsiveHeight(6),
    borderRadius: responsiveBorderRadius(3),
    backgroundColor: '#4CAF50',
    marginRight: responsiveSpacing(4),
  },
  activeText: {
    color: '#4CAF50',
    fontSize: responsiveFontSize(10),
    fontWeight: '600',
  },
});