import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Share,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBrowserStore } from '@/store/browserStore';
import { router } from 'expo-router';
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
} from '@/utils/responsive';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  currentUrl?: string;
  onFindInPage?: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ visible, onClose, currentUrl = 'https://google.com', onFindInPage }) => {
  const [showFindInPage, setShowFindInPage] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const { 
    nightMode, 
    toggleNightMode, 
    incognitoMode, 
    toggleIncognitoMode,
    desktopMode,
    toggleDesktopMode,
    addBookmark
  } = useBrowserStore();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this page: ${currentUrl}`,
        url: currentUrl,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while sharing');
    }
  };

  const handleAddBookmark = async () => {
    try {
      if (!currentUrl || currentUrl === 'about:blank') {
        Alert.alert('خطأ', 'لا يمكن إضافة هذه الصفحة للمفضلة');
        return;
      }
      
      // Extract title from URL or use domain
      let title = 'New Bookmark';
      try {
        if (currentUrl.includes('google.com/search')) {
          title = 'Google Search';
        } else {
          const domain = new URL(currentUrl).hostname.replace('www.', '');
          title = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      } catch (error) {
        title = currentUrl.substring(0, 50);
      }
      
      await addBookmark({
        title,
        url: currentUrl,
        folder: 'default',
      });
      
      Alert.alert('نجح', 'تم إضافة الصفحة للمفضلة بنجاح');
      onClose();
    } catch (error) {
      console.error('Bookmark error:', error);
      Alert.alert('خطأ', `فشل في إضافة المفضلة: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  // Consolidated navigation handler
  const navigateTo = (destination: string) => {
    onClose();
    
    switch (destination) {
      case 'Settings':
        router.push('/(tabs)/settings');
        break;
      case 'History':
        router.push('/(tabs)/history');
        break;
      case 'Downloads':
        router.push('/(tabs)/downloads');
        break;
      case 'Bookmarks':
        router.push('/(tabs)/bookmarks');
        break;
      default:
        console.log(`Navigation to ${destination} not implemented`);
        break;
    }
  };

  const handleFindInPage = () => {
    onClose();
    if (onFindInPage) {
      onFindInPage();
    }
  };

  // Flattened menu items without sections for cleaner design
  const menuItems = [
    { icon: 'bookmark-outline', title: 'Add bookmark', active: false, onPress: handleAddBookmark },
    { icon: 'moon-outline', title: 'Night mode', active: nightMode, onPress: toggleNightMode },
    { icon: 'desktop-outline', title: 'Desktop site', active: desktopMode, onPress: toggleDesktopMode },
    { icon: 'settings-outline', title: 'Settings', active: false, onPress: () => navigateTo('Settings') },
    { icon: 'eye-off-outline', title: 'Incognito mode', active: incognitoMode, onPress: toggleIncognitoMode },
    { icon: 'search-outline', title: 'Find in page', active: showFindInPage, onPress: handleFindInPage },
    { icon: 'share-outline', title: 'Share', active: false, onPress: handleShare },
    { icon: 'time-outline', title: 'History', active: false, onPress: () => navigateTo('History') },
    { icon: 'bookmark-outline', title: 'Bookmarks', active: false, onPress: () => navigateTo('Bookmarks') },
    { icon: 'download-outline', title: 'Downloads', active: false, onPress: () => navigateTo('Downloads') },
  ];

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.overlay}>
        <LinearGradient colors={['#0a0b1e', '#1a1b3a']} style={styles.modalContainer}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Browser Menu</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Menu Content */}
              <View style={styles.content}>
                {menuItems && menuItems.length > 0 ? (
                  <View style={styles.menuGrid}>
                    {menuItems.map((item, itemIndex) => (
                      <TouchableOpacity
                        key={itemIndex}
                        style={[styles.menuItem, item.active && styles.activeMenuItem]}
                        onPress={item.onPress}
                      >
                        <View style={styles.menuIcon}>
                          <Ionicons 
                            name={item.icon} 
                            size={responsiveIconSize(24)} 
                            color={item.active ? '#4CAF50' : '#ffffff'} 
                          />
                        </View>
                        <Text style={[styles.menuText, item.active && styles.activeMenuText]}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No menu items available</Text>
                  </View>
                )}
              </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalContainer: {
    height: '50%',
    borderTopLeftRadius: responsiveBorderRadius(20),
    borderTopRightRadius: responsiveBorderRadius(20),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(isSmallScreen() ? 16 : 20),
    paddingVertical: responsiveSpacing(isSmallScreen() ? 12 : 16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: responsiveWidth(isSmallScreen() ? 28 : 32),
    height: responsiveHeight(isSmallScreen() ? 28 : 32),
    borderRadius: responsiveBorderRadius(isSmallScreen() ? 14 : 16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: responsiveSpacing(isSmallScreen() ? 16 : 20),
    paddingTop: responsiveSpacing(isSmallScreen() ? 8 : 12),
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuItem: {
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: responsiveBorderRadius(12),
    padding: responsiveSpacing(isSmallScreen() ? 10 : 12),
    alignItems: 'center',
    marginBottom: responsiveSpacing(isSmallScreen() ? 12 : 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: responsiveHeight(isSmallScreen() ? 75 : 85),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  menuIcon: {
    marginBottom: responsiveSpacing(8),
  },
  menuText: {
    fontSize: responsiveFontSize(isSmallScreen() ? 10 : 12),
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
    numberOfLines: 2,
    ellipsizeMode: 'tail',
  },
  activeMenuText: {
    color: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveSpacing(40),
  },
  emptyText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    textAlign: 'center',
  },

});