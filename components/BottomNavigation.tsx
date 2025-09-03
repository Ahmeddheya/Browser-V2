import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  responsiveSpacing, 
  responsiveIconSize, 
  responsiveWidth, 
  responsiveHeight,
  isSmallScreen
}

interface BottomNavigationProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onTabs: () => void;
  onMenu: () => void;
  onFind?: () => void;
  isHomePage: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onHome,
  onTabs,
  onMenu,
  onFind,
  isHomePage,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.navButton, !canGoBack && !isHomePage && styles.disabledButton]}
        onPress={onBack}
        disabled={!canGoBack && !isHomePage}
      >
        <Ionicons 
          name="chevron-back" 
          size={responsiveIconSize(24)} 
          color={canGoBack || isHomePage ? '#ffffff' : '#666'} 
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, !canGoForward && styles.disabledButton]}
        onPress={onForward}
        disabled={!canGoForward}
      >
        <Ionicons 
          name="chevron-forward" 
          size={responsiveIconSize(24)} 
          color={canGoForward ? '#ffffff' : '#666'} 
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, isHomePage && styles.activeButton]}
        onPress={onHome}
      >
        <Ionicons 
          name="home" 
          size={responsiveIconSize(24)} 
          color={isHomePage ? '#4285f4' : '#ffffff'} 
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onTabs}>
        <Ionicons name="copy-outline" size={responsiveIconSize(24)} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onMenu}>
        <Ionicons name="menu" size={responsiveIconSize(24)} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 27, 58, 0.95)',
    paddingVertical: responsiveSpacing(isSmallScreen() ? 8 : 12),
    paddingHorizontal: responsiveSpacing(isSmallScreen() ? 12 : 20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: responsiveHeight(isSmallScreen() ? 60 : 68),
  },
  navButton: {
    width: responsiveWidth(isSmallScreen() ? 38 : 44),
    height: responsiveHeight(isSmallScreen() ? 38 : 44),
    borderRadius: responsiveWidth(isSmallScreen() ? 19 : 22),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: responsiveSpacing(2),
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
  },
});