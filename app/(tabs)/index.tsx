import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBrowserStore } from '@/store/browserStore';
import { CurrencyWidget } from '@/components/CurrencyWidget';
import { QuickAccessGrid } from '@/components/QuickAccessGrid';
import { MenuModal } from '@/components/MenuModal';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { SecurityManager } from '@/utils/security';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const { width, height } = Dimensions.get('window');

export default function BrowserScreen() {
  usePerformanceMonitor('BrowserScreen');
  const params = useLocalSearchParams();
  
  const webViewRef = useRef<WebView>(null);
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isHomePage, setIsHomePage] = useState(true);
  const [showFindInPage, setShowFindInPage] = useState(false);
  const [findText, setFindText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { 
    isAdBlockEnabled,
    createNewTab,
    darkMode,
    nightMode,
    desktopMode,
    incognitoMode,
    addToHistory,
    initialize,
    settings
  } = useBrowserStore();
  
  // Initialize the browser store on component mount
  useEffect(() => {
    const initializeBrowser = async () => {
      try {
        await initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize browser:', error);
        setIsInitialized(true);
      }
    };
    
    initializeBrowser();
  }, [initialize]);
  
  // Handle URL parameter from navigation
  useEffect(() => {
    if (params.url) {
      const paramUrl = params.url as string;
      setUrl(paramUrl);
      setCurrentUrl(paramUrl);
      setIsHomePage(false);
    }
  }, [params.url]);
  
  const toggleFindInPage = () => {
    setShowFindInPage(!showFindInPage);
    if (showFindInPage) {
      clearFindInPage();
    }
  };

  const clearFindInPage = () => {
    const clearScript = `
      (function() {
        window.getSelection().removeAllRanges();
        window.findInPage = {};
        return true;
      })();
    `;
    
    webViewRef.current?.injectJavaScript(clearScript);
    setFindText('');
  };

  const handleSearch = () => {
    if (!url.trim()) return;
    
    const sanitizedUrl = SecurityManager.sanitizeInput(url);
    if (SecurityManager.containsMaliciousContent(sanitizedUrl)) {
      Alert.alert('Security Warning', 'The URL contains potentially malicious content');
      return;
    }
    
    let searchUrl = url;
    const searchEngine = settings?.searchEngine || 'google';
    
    if (!url.includes('http://') && !url.includes('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        searchUrl = `https://${url}`;
      } else {
        switch (searchEngine) {
          case 'bing':
            searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(url)}`;
            break;
          case 'duckduckgo':
            searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
            break;
          case 'yahoo':
            searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(url)}`;
            break;
          case 'ecosia':
            searchUrl = `https://www.ecosia.org/search?q=${encodeURIComponent(url)}`;
            break;
          default:
            searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        }
      }
    }
    
    setCurrentUrl(searchUrl);
    setIsHomePage(false);
    
    addToHistory({
      title: url.includes('http') ? url : `Search: ${url}`,
      url: searchUrl,
      favicon: 'search-outline'
    });
  };

  const handleUrlSubmit = () => {
    handleSearch();
    Keyboard.dismiss();
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setUrl(navState.url);
    setIsLoading(navState.loading);
    
    if (!navState.loading && navState.url && navState.title) {
      addToHistory({
        title: navState.title || navState.url,
        url: navState.url,
        favicon: 'globe-outline'
      });
    }
  };
  
  const handleDownloadRequest = async (event: any) => {
    const { url: downloadUrl } = event.nativeEvent;
    
    try {
      const DownloadManager = (await import('@/utils/downloadManager')).default;
      await DownloadManager.downloadFromWebView(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Download Error', 'Failed to start download');
    }
  };

  const handleNewTab = () => {
    const tabId = createNewTab('https://www.google.com');
    setCurrentUrl('https://www.google.com');
    setUrl('https://www.google.com');
    setIsHomePage(false);
  };

  const goHome = () => {
    setIsHomePage(true);
    setCurrentUrl('');
    setUrl('');
  };

  const goBack = () => {
    if (isHomePage) {
      router.back();
    } else {
      try {
        webViewRef.current?.goBack();
      } catch (error) {
        console.warn('Go back error:', error);
      }
    }
  };

  const goForward = () => {
    try {
      webViewRef.current?.goForward();
    } catch (error) {
      console.warn('Go forward error:', error);
    }
  };

  const openTabs = () => {
    router.push('/(tabs)/tabs');
  };

  // Night mode CSS injection
  const nightModeCSS = `
    (function() {
      if (window.nightModeApplied) return;
      window.nightModeApplied = true;
      
      const style = document.createElement('style');
      style.id = 'night-mode-filter';
      style.innerHTML = \`
        html { 
          filter: invert(1) hue-rotate(180deg) brightness(0.8) contrast(1.2) !important;
          background: #1a1a1a !important;
        }
        img, video, iframe, svg, [style*="background-image"] {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        [data-theme="dark"], [class*="dark"] {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      \`;
      document.head.appendChild(style);
    })();
  `;

  const removeNightModeCSS = `
    (function() {
      const style = document.getElementById('night-mode-filter');
      if (style) style.remove();
      window.nightModeApplied = false;
    })();
  `;

  // Desktop mode user agent
  const desktopUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  const mobileUserAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';

  // Handle night mode changes dynamically
  useEffect(() => {
    if (webViewRef.current && currentUrl && !isHomePage) {
      if (nightMode) {
        webViewRef.current.injectJavaScript(nightModeCSS);
      } else {
        webViewRef.current.injectJavaScript(removeNightModeCSS);
      }
    }
  }, [nightMode]);

  // Handle desktop mode changes by reloading the page
  useEffect(() => {
    if (webViewRef.current && currentUrl && !isHomePage) {
      webViewRef.current.reload();
    }
  }, [desktopMode]);

  // Incognito mode colors
  const gradientColors = incognitoMode 
    ? ['#2c2c2c', '#1a1a1a'] 
    : nightMode 
    ? ['#000000', '#1a1a1a']
    : ['#0a0b1e', '#1a1b3a'];
  
  const topBarColor = incognitoMode 
    ? 'rgba(44, 44, 44, 0.9)' 
    : nightMode
    ? 'rgba(0, 0, 0, 0.9)'
    : 'rgba(26, 27, 58, 0.9)';

  // Apply night mode to entire app
  const appBackgroundStyle = nightMode ? {
    backgroundColor: '#000000',
  } : {};

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <LinearGradient colors={gradientColors} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={32} color="#4285f4" />
            <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 16 }}>Initializing...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (isHomePage) {
    return (
      <LinearGradient colors={gradientColors} style={[styles.container, appBackgroundStyle]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={[styles.topBar, { backgroundColor: topBarColor }]}>
            <TouchableOpacity
              style={styles.topButton}
              onPress={() => {
                try {
                  webViewRef.current?.reload();
                } catch (error) {
                  console.warn('Reload error:', error);
                }
              }}
            >
              <Ionicons name="refresh-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Text style={[styles.logoText, incognitoMode && styles.incognitoText]}>Aura</Text>
              {incognitoMode && (
                <Text style={styles.incognitoLabel}>Incognito</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.topButton}
              onPress={handleNewTab}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Google or type a URL"
                  placeholderTextColor="#888"
                  value={url}
                  onChangeText={setUrl}
                  onSubmitEditing={handleSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Market Data */}
            <CurrencyWidget />

            {/* Quick Access */}
            <QuickAccessGrid onSitePress={(siteUrl) => {
              setCurrentUrl(siteUrl);
              setIsHomePage(false);
            }} />
          </ScrollView>

          {/* Menu Modal */}
          <MenuModal 
            visible={isMenuVisible} 
            onClose={() => setIsMenuVisible(false)}
            currentUrl={currentUrl}
            onFindInPage={toggleFindInPage}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={[styles.container, appBackgroundStyle]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={[styles.topBar, { backgroundColor: topBarColor }]}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              try {
                webViewRef.current?.reload();
              } catch (error) {
                console.warn('Reload error:', error);
              }
            }}
          >
            <Ionicons name="refresh-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.urlContainer}>
            <TextInput
              style={styles.urlInput}
              value={url}
              onChangeText={setUrl}
              onSubmitEditing={handleUrlSubmit}
              placeholder="Search Google or type a URL"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.topButton}
            onPress={handleNewTab}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* WebView Container */}
        <View style={styles.webviewContainer}>
          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4285f4" />
            </View>
          )}
          
          {/* Find in page bar */}
          {showFindInPage && (
            <View style={styles.findInPageContainer}>
              <TextInput
                style={styles.findInput}
                value={findText}
                onChangeText={setFindText}
                placeholder="Find in page"
                placeholderTextColor="#999"
                autoFocus
                returnKeyType="search"
              />
              <TouchableOpacity onPress={toggleFindInPage} style={styles.findButton}>
                <Ionicons name="close" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
          
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            userAgent={desktopMode ? desktopUserAgent : mobileUserAgent}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            allowsBackForwardNavigationGestures={true}
            injectedJavaScript={nightMode ? nightModeCSS : removeNightModeCSS}
            onFileDownload={handleDownloadRequest}
          />
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navButton, !canGoBack && styles.disabledButton]}
            onPress={goBack}
            disabled={!canGoBack}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={canGoBack ? '#ffffff' : '#666'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, !canGoForward && styles.disabledButton]}
            onPress={goForward}
            disabled={!canGoForward}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={canGoForward ? '#ffffff' : '#666'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, isHomePage && styles.activeButton]}
            onPress={goHome}
          >
            <Ionicons 
              name="home" 
              size={24} 
              color={isHomePage ? '#4285f4' : '#ffffff'} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={openTabs}>
            <Ionicons name="copy-outline" size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => setIsMenuVisible(true)}
          >
            <Ionicons name="menu" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Menu Modal */}
        <MenuModal 
          visible={isMenuVisible} 
          onClose={() => setIsMenuVisible(false)}
          currentUrl={currentUrl}
          onFindInPage={toggleFindInPage}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: 'rgba(26, 27, 58, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 90,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  incognitoText: {
    color: '#ff6b6b',
  },
  incognitoLabel: {
    fontSize: 10,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  urlInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 40,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 27, 58, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findInPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 2,
  },
  findInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  findButton: {
    padding: 5,
    marginLeft: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 27, 58, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 68,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
  },
});