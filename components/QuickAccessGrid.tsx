import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageManager } from '../utils/storage';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  responsiveWidth,
  responsiveHeight,
  responsiveBorderRadius,
  getItemsPerRow,
  getGridItemWidth,
  isSmallScreen,
  wp
} from '../utils/responsive';

interface Site {
  name: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isCustom?: boolean;
}

interface QuickAccessGridProps {
  onSitePress: (url: string) => void;
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({ onSitePress }) => {
  const [sites, setSites] = React.useState<Site[]>([
    { name: 'GitHub', url: 'https://github.com', icon: 'logo-github', color: '#333' },
    { name: 'Telegram', url: 'https://web.telegram.org', icon: 'paper-plane', color: '#0088cc' },
    { name: 'WhatsApp', url: 'https://web.whatsapp.com', icon: 'logo-whatsapp', color: '#25d366' },
    { name: 'Instagram', url: 'https://instagram.com', icon: 'logo-instagram', color: '#e4405f' },
    { name: 'X', url: 'https://x.com', icon: 'logo-twitter', color: '#1da1f2' },
    { name: 'Facebook', url: 'https://facebook.com', icon: 'logo-facebook', color: '#1877f2' },
    { name: 'YouTube', url: 'https://youtube.com', icon: 'logo-youtube', color: '#ff0000' },
    { name: 'Google', url: 'https://google.com', icon: 'search', color: '#4285f4' },
  ]);
  
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newSite, setNewSite] = React.useState({
    name: '',
    url: '',
  });

  React.useEffect(() => {
    loadCustomSites();
  }, []);

  const loadCustomSites = async () => {
    try {
      const customSites = await StorageManager.getItem<Site[]>('custom_sites', []);
      setSites(prev => [...prev.filter(s => !s.isCustom), ...customSites]);
    } catch (error) {
      console.error('Failed to load custom sites:', error);
    }
  };

  const handleAddSite = async () => {
    if (!newSite.name.trim() || !newSite.url.trim()) {
      Alert.alert('Error', 'Please enter both name and URL');
      return;
    }

    // Validate URL
    let url = newSite.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    try {
      new URL(url); // Validate URL format
    } catch {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    const customSite: Site = {
      name: newSite.name,
      url,
      icon: 'globe-outline',
      color: '#4285f4',
      isCustom: true,
    };

    try {
      const customSites = await StorageManager.getItem<Site[]>('custom_sites', []);
      
      // Check for duplicates
      const isDuplicate = customSites.some(site => site.url === url);
      if (isDuplicate) {
        Alert.alert('Error', 'This site is already in your quick access');
        return;
      }
      
      const updatedCustomSites = [...customSites, customSite];
      await StorageManager.setItem('custom_sites', updatedCustomSites);
      
      setSites(prev => [...prev, customSite]);
      setNewSite({ name: '', url: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'Site added to quick access');
    } catch (error) {
      Alert.alert('Error', 'Failed to save custom site');
    }
  };

  const handleRemoveSite = (site: Site) => {
    if (!site.isCustom) return;

    Alert.alert(
      'Remove Site',
      `Remove ${site.name} from quick access?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const customSites = await StorageManager.getItem<Site[]>('custom_sites', []);
              const filtered = customSites.filter(s => s.url !== site.url);
              await StorageManager.setItem('custom_sites', filtered);
              
              setSites(prev => prev.filter(s => s.url !== site.url));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove site');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Add Site Button */}
      <TouchableOpacity style={styles.addSiteButton} onPress={() => setShowAddModal(true)}>
        <View style={styles.addSiteIcon}>
          <Ionicons name="add" size={responsiveIconSize(24)} color="#4285f4" />
        </View>
        <View style={styles.addSiteContent}>
          <Text style={styles.addSiteTitle}>Add site</Text>
          <Text style={styles.addSiteSubtitle}>Add your favorite websites to quick access</Text>
        </View>
      </TouchableOpacity>

      {/* Sites Grid */}
      <View style={styles.sitesGrid}>
        {sites.map((site, index) => (
          <TouchableOpacity
            key={index}
            style={styles.siteCard}
            onPress={() => onSitePress(site.url)}
            onLongPress={() => handleRemoveSite(site)}
          >
            <View style={[styles.siteIcon, { backgroundColor: `${site.color}20` }]}>
              <Ionicons name={site.icon} size={24} color={site.color} />
            </View>
            <Text style={styles.siteName}>{site.name}</Text>
            {site.isCustom && (
              <View style={styles.customBadge}>
                <Ionicons name="star" size={12} color="#4CAF50" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Site Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Website</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TextInput
                style={styles.modalInput}
                value={newSite.name}
                onChangeText={(text) => setNewSite(prev => ({ ...prev, name: text }))}
                placeholder="Site Name (e.g., Reddit)"
                placeholderTextColor="#888"
                autoCapitalize="words"
              />

              <TextInput
                style={styles.modalInput}
                value={newSite.url}
                onChangeText={(text) => setNewSite(prev => ({ ...prev, url: text }))}
                placeholder="URL (e.g., reddit.com)"
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddSite}
              >
                <Text style={styles.addButtonText}>Add to Quick Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: responsiveSpacing(isSmallScreen() ? 8 : 12),
    paddingBottom: responsiveSpacing(100),
  },
  addSiteButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: responsiveBorderRadius(12),
    padding: responsiveSpacing(16),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing(24),
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.2)',
  },
  addSiteIcon: {
    width: responsiveWidth(40),
    height: responsiveHeight(40),
    borderRadius: responsiveBorderRadius(20),
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing(12),
  },
  addSiteContent: {
    flex: 1,
  },
  addSiteTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveSpacing(2),
  },
  addSiteSubtitle: {
    fontSize: responsiveFontSize(12),
    color: '#888',
  },
  sitesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSpacing(2),
  },
  siteCard: {
    width: wp(100 / getItemsPerRow() - 2),
    alignItems: 'center',
    marginBottom: responsiveSpacing(isSmallScreen() ? 12 : 16),
    position: 'relative',
    paddingHorizontal: responsiveSpacing(1),
  },
  siteIcon: {
    width: responsiveWidth(isSmallScreen() ? 50 : 60),
    height: responsiveHeight(isSmallScreen() ? 50 : 60),
    borderRadius: responsiveBorderRadius(isSmallScreen() ? 25 : 30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  siteName: {
    fontSize: responsiveFontSize(isSmallScreen() ? 10 : 12),
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  customBadge: {
    position: 'absolute',
    top: -2,
    right: responsiveSpacing(8),
    width: responsiveWidth(isSmallScreen() ? 16 : 20),
    height: responsiveHeight(isSmallScreen() ? 16 : 20),
    borderRadius: responsiveBorderRadius(isSmallScreen() ? 8 : 10),
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1b3a',
    borderRadius: responsiveBorderRadius(20),
    width: wp(90),
    maxWidth: responsiveWidth(400),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveSpacing(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalContent: {
    padding: responsiveSpacing(20),
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: responsiveBorderRadius(8),
    padding: responsiveSpacing(12),
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    marginBottom: responsiveSpacing(16),
  },
  addButton: {
    backgroundColor: '#4285f4',
    borderRadius: responsiveBorderRadius(8),
    padding: responsiveSpacing(16),
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
  },
});