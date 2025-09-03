import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBrowserStore } from '@/store/browserStore';
import { router } from 'expo-router';
import { SearchEngineSettings } from '@/components/settings/SearchEngineSettings';
import { PasswordManagerSettings } from '@/components/settings/PasswordManagerSettings';
import { PaymentMethodsSettings } from '@/components/settings/PaymentMethodsSettings';
import { AddressesSettings } from '@/components/settings/AddressesSettings';
import { PrivacySecuritySettings } from '@/components/settings/PrivacySecuritySettings';
import { NotificationsSettings } from '@/components/settings/NotificationsSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { 
  AdvancedBrowserSettings, 
  AccessibilitySettings,
  SitePermissions,
  LanguageSettings,
  DownloadSettings 
} from '@/types/settings';

type SettingsView = 
  | 'main' 
  | 'search-engine' 
  | 'password-manager' 
  | 'payment-methods' 
  | 'addresses' 
  | 'privacy-security'
  | 'notifications'
  | 'appearance'
  | 'accessibility'
  | 'site-settings'
  | 'languages'
  | 'downloads';

export default function SettingsScreen() {
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedBrowserSettings>({
    darkMode: false,
    nightMode: false,
    incognitoMode: false,
    desktopMode: false,
    adBlockEnabled: true,
    searchEngine: 'google',
    homepage: 'https://www.google.com',
    autoSaveHistory: true,
    maxHistoryItems: 1000,
    customSearchEngine: '',
    passwordManager: {
      savePasswords: true,
      autoSignIn: true,
      biometricAuth: false,
    },
    paymentMethods: {
      saveAndFill: true,
    },
    addresses: {
      saveAndFill: true,
    },
    notifications: {
      permissionRequests: true,
      downloadComplete: true,
      securityAlerts: true,
    },
    privacy: {
      safeBrowsing: 'standard',
      httpsFirst: true,
      paymentMethodDetection: true,
      preloadPages: true,
      secureDNS: 'automatic',
      doNotTrack: false,
      privacySandbox: false,
    },
    appearance: {
      theme: 'system',
      fontSize: 16,
      pageZoom: 100,
      toolbarLayout: 'default',
    },
    accessibility: {
      textToSpeech: false,
      screenReaderSupport: false,
      navigationAssistance: false,
    },
    sitePermissions: {
      camera: 'ask',
      location: 'ask',
      microphone: 'ask',
      notifications: 'ask',
    },
    language: {
      preferredLanguage: 'en',
      translationEnabled: true,
    },
    downloads: {
      storageLocation: 'internal',
      wifiOnlyDownloads: false,
      askDownloadLocation: true,
    },
  });

  const { 
    darkMode, 
    isAdBlockEnabled, 
    toggleDarkMode, 
    toggleAdBlock,
    incognitoMode,
    toggleIncognitoMode,
    desktopMode,
    toggleDesktopMode,
    nightMode,
    toggleNightMode,
    updateSetting,
  } = useBrowserStore();

  // Sync with browser store
  useEffect(() => {
    setAdvancedSettings(prev => ({
      ...prev,
      darkMode,
      nightMode,
      incognitoMode,
      desktopMode,
      adBlockEnabled: isAdBlockEnabled,
    }));
  }, [darkMode, nightMode, incognitoMode, desktopMode, isAdBlockEnabled]);

  const handleSettingChange = async (section: string, key: string, value: any) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof AdvancedBrowserSettings],
        [key]: value,
      },
    }));

    // Update browser store for core settings
    if (section === 'core') {
      await updateSetting(key as any, value);
    }
  };

  const handleBasicSettingChange = async (key: string, value: any) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    // Update browser store
    await updateSetting(key as any, value);
  };

  // Render different views based on currentView
  if (currentView === 'search-engine') {
    return (
      <SearchEngineSettings
        currentEngine={advancedSettings.searchEngine}
        onEngineChange={(engine) => handleBasicSettingChange('searchEngine', engine)}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'password-manager') {
    return (
      <PasswordManagerSettings
        settings={advancedSettings.passwordManager}
        onSettingChange={(key, value) => handleSettingChange('passwordManager', key, value)}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'payment-methods') {
    return (
      <PaymentMethodsSettings
        saveAndFill={advancedSettings.paymentMethods.saveAndFill}
        onToggleSaveAndFill={(value) => handleSettingChange('paymentMethods', 'saveAndFill', value)}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'addresses') {
    return (
      <AddressesSettings
        saveAndFill={advancedSettings.addresses.saveAndFill}
        onToggleSaveAndFill={(value) => handleSettingChange('addresses', 'saveAndFill', value)}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'privacy-security') {
    return (
      <PrivacySecuritySettings
        settings={advancedSettings.privacy}
        onSettingChange={(key, value) => handleSettingChange('privacy', key, value)}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'notifications') {
    return (
      <NotificationsSettings
        settings={advancedSettings.notifications}
        onSettingChange={(key, value) => handleSettingChange('notifications', key, value)}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'appearance') {
    return (
      <AppearanceSettings
        settings={advancedSettings.appearance}
        onSettingChange={(key, value) => handleSettingChange('appearance', key, value)}
        onBack={() => setCurrentView('main')}
      />
    );
  }

  // Main settings view
  const settingsGroups = [
    {
      title: 'Basics',
      items: [
        {
          icon: 'search-outline',
          title: 'Search engine',
          subtitle: advancedSettings.searchEngine === 'google' ? 'Google' : 
                   advancedSettings.searchEngine === 'bing' ? 'Bing' :
                   advancedSettings.searchEngine === 'duckduckgo' ? 'DuckDuckGo' :
                   advancedSettings.searchEngine === 'yahoo' ? 'Yahoo' :
                   advancedSettings.searchEngine === 'ecosia' ? 'Ecosia' : 'Custom',
          type: 'navigate',
          onPress: () => setCurrentView('search-engine'),
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          icon: 'key-outline',
          title: 'Password Manager',
          subtitle: 'Manage saved passwords and security',
          type: 'navigate',
          onPress: () => setCurrentView('password-manager'),
        },
        {
          icon: 'card-outline',
          title: 'Payment methods',
          subtitle: 'Manage payment cards and apps',
          type: 'navigate',
          onPress: () => setCurrentView('payment-methods'),
        },
        {
          icon: 'location-outline',
          title: 'Addresses and more',
          subtitle: 'Manage saved addresses and contact info',
          type: 'navigate',
          onPress: () => setCurrentView('addresses'),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy and security',
          subtitle: 'Advanced privacy and security settings',
          type: 'navigate',
          onPress: () => setCurrentView('privacy-security'),
        },
        {
          icon: 'shield-outline',
          title: 'Ad Blocking',
          subtitle: 'Block ads and trackers',
          type: 'switch',
          value: isAdBlockEnabled,
          onToggle: toggleAdBlock,
        },
        {
          icon: 'eye-off-outline',
          title: 'Incognito Mode',
          subtitle: 'Browse privately',
          type: 'switch',
          value: incognitoMode,
          onToggle: toggleIncognitoMode,
        },
      ],
    },
    {
      title: 'Appearance & Experience',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          type: 'navigate',
          onPress: () => setCurrentView('notifications'),
        },
        {
          icon: 'color-palette-outline',
          title: 'Appearance',
          subtitle: 'Theme, fonts, and layout',
          type: 'navigate',
          onPress: () => setCurrentView('appearance'),
        },
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          subtitle: 'Always use dark theme',
          type: 'switch',
          value: darkMode,
          onToggle: toggleDarkMode,
        },
        {
          icon: 'moon',
          title: 'Night Mode',
          subtitle: 'Apply night filter to web pages',
          type: 'switch',
          value: nightMode,
          onToggle: toggleNightMode,
        },
        {
          icon: 'desktop-outline',
          title: 'Desktop Site',
          subtitle: 'Request desktop version',
          type: 'switch',
          value: desktopMode,
          onToggle: toggleDesktopMode,
        },
      ],
    },
    {
      title: 'Advanced',
      items: [
        {
          icon: 'accessibility-outline',
          title: 'Accessibility',
          subtitle: 'Screen reader and navigation assistance',
          type: 'navigate',
          onPress: () => setCurrentView('accessibility'),
        },
        {
          icon: 'settings-outline',
          title: 'Site Settings',
          subtitle: 'Camera, location, microphone permissions',
          type: 'navigate',
          onPress: () => setCurrentView('site-settings'),
        },
        {
          icon: 'language-outline',
          title: 'Languages',
          subtitle: 'Language and translation settings',
          type: 'navigate',
          onPress: () => setCurrentView('languages'),
        },
        {
          icon: 'download-outline',
          title: 'Downloads',
          subtitle: 'Download location and preferences',
          type: 'navigate',
          onPress: () => setCurrentView('downloads'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any, index: number) => {
    return (
      <TouchableOpacity 
        key={index} 
        style={[
          styles.settingItem,
          item.value && styles.activeSettingItem
        ]}
        onPress={item.type === 'navigate' ? item.onPress : undefined}
        activeOpacity={0.7}
      >
        <View style={[
          styles.settingIcon,
          item.value && styles.activeSettingIcon
        ]}>
          <Ionicons 
            name={item.icon} 
            size={22} 
            color={item.value ? '#4CAF50' : '#4285f4'} 
          />
        </View>
        
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>

        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#333', true: '#4CAF50' }}
            thumbColor={item.value ? '#ffffff' : '#666'}
            ios_backgroundColor="#333"
          />
        )}

        {item.type === 'navigate' && (
          <Ionicons name="chevron-forward" size={18} color="#aaaaaa" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0a0b1e', '#1a1b3a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={() => Alert.alert('Help', 'Settings help information')}>
            <Ionicons name="help-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {settingsGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.settingGroup}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.groupContainer}>
                {group.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
              </View>
            </View>
          ))}

          {/* App Info */}
          <View style={styles.appInfo}>
            <View style={styles.appIconContainer}>
              <Ionicons name="globe" size={48} color="#4285f4" />
            </View>
            <Text style={styles.appName}>Aura Browser</Text>
            <Text style={styles.appVersion}>Version 2.0.0</Text>
            <Text style={styles.appDescription}>
              A fast, secure, and feature-rich browser with advanced privacy controls,
              password management, and seamless browsing experience.
            </Text>
            
            <View style={styles.appActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="star-outline" size={20} color="#4285f4" />
                <Text style={styles.actionButtonText}>Rate App</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color="#4285f4" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 11, 30, 0.95)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  settingGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  groupContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeSettingItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeSettingIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#aaaaaa',
    lineHeight: 16,
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  appActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  actionButtonText: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});