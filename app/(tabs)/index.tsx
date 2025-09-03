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
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBrowserStore } from '@/store/browserStore';
import { CurrencyWidget } from '@/components/CurrencyWidget';
import { QuickAccessGrid } from '@/components/QuickAccessGrid';
import { BottomNavigation } from '@/components/BottomNavigation';
import { MenuModal } from '@/components/MenuModal';
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
import { usePerformanceMonitor } from '@/utils/performance';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SecurityManager } from '@/utils/security';

const { width, height } = Dimensions.get('window');

export default function BrowserScreen() {
  usePerformanceMonitor('BrowserScreen');
  
  const webViewRef = useRef<WebView>(null);
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Debug menu visibility changes
  useEffect(() => {
    console.log('isMenuVisible changed to:', isMenuVisible);
  }, [isMenuVisible]);
  const [showMenu, setShowMenu] = useState(false);
  const [isHomePage, setIsHomePage] = useState(true);
  const [showFindInPage, setShowFindInPage] = useState(false);
  const [findText, setFindText] = useState('');
  const [findMatches, setFindMatches] = useState({ current: 0, total: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { 
    isAdBlockEnabled, 
    toggleAdBlock,
    addTab,
    darkMode,
    nightMode,
    toggleNightMode,
    desktopMode,
    toggleDesktopMode,
    incognitoMode,
    toggleIncognitoMode,
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
        setIsInitialized(true); // Continue even if initialization fails
      }
    };
    
    initializeBrowser();
  }, [initialize]);
  
  // Handle URL parameter from navigation
  useEffect(() => {
    const handleUrlParam = () => {
      // Check if there's a URL parameter from navigation
      // This would be set when navigating from history/bookmarks
      const params = new URLSearchParams(window.location.search);
      const paramUrl = params.get('url');
      if (paramUrl) {
        setUrl(paramUrl);
        setCurrentUrl(paramUrl);
        setIsHomePage(false);
      }
    };
    
    handleUrlParam();
  }, []);
  
  // Find in page functionality
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
    setFindMatches({ current: 0, total: 0 });
  };

  const findInPage = (text) => {
    console.log('Find in page disabled:', text);
  };

  const findNext = () => {
    console.log('Find next disabled');
  };

  const findPrevious = () => {
    console.log('Find previous disabled');
  };

  const handleSearch = () => {
    if (!url.trim()) return;
    
    // Security check
    const sanitizedUrl = SecurityManager.sanitizeInput(url);
    if (SecurityManager.containsMaliciousContent(sanitizedUrl)) {
      Alert.alert('Security Warning', 'The URL contains potentially malicious content');
      return;
    }
    
    let searchUrl = url;
    
    // Get search engine from settings
    const searchEngine = settings?.searchEngine || 'google';
    
    if (!url.includes('http://') && !url.includes('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        // Looks like a URL
        searchUrl = `https://${url}`;
      } else {
        // Search query - use selected search engine
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
    
    // Add to history
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

  // Handle WebView navigation state changes
  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setUrl(navState.url); // Update URL bar to match current page
    setIsLoading(navState.loading);
    
    // Add to history when page loads successfully
    if (!navState.loading && navState.url && navState.title) {
      addToHistory({
        title: navState.title || navState.url,
        url: navState.url,
        favicon: 'globe-outline'
      });
    }
  };
  
  // Handle download requests
  const handleDownloadRequest = async (event) => {
    const { url: downloadUrl } = event.nativeEvent;
    
    try {
      const DownloadManager = (await import('../utils/downloadManager')).default;
      await DownloadManager.downloadFromWebView(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Download Error', 'Failed to start download');
    }
  };

  const handleNewTab = () => {
    const newTabUrl = 'https://www.google.com';
    setCurrentUrl(newTabUrl);
    setUrl(newTabUrl);
    setIsHomePage(false);
  };

  const goHome = () => {
    setIsHomePage(true);
    setCurrentUrl('');
    setUrl('');
  };

  const goBack = () => {
    try {
      webViewRef.current?.goBack();
    } catch (error) {
      console.warn('Go back error:', error);
    }
  };

  const goForward = () => {
    try {
      webViewRef.current?.goForward();
    } catch (error) {
      console.warn('Go forward error:', error);
    }
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

  const openTabs = () => {
    router.push('/(tabs)/tabs');
  };

  // Handle night mode changes dynamically
  // useEffect(() => {
  //   if (webViewRef.current && currentUrl) {
  //     if (nightMode) {
  //       webViewRef.current.injectJavaScript(nightModeCSS);
  //     } else {
  //       webViewRef.current.injectJavaScript(removeNightModeCSS);
  //     }
  //   }
  // }, [nightMode]);

  // Handle desktop mode changes by reloading the page
  // useEffect(() => {
  //   if (webViewRef.current && currentUrl) {
  //     webViewRef.current.reload();
  //   }
  // }, [desktopMode]);



  // Incognito mode colors
  const gradientColors = incognitoMode 
    ? ['#2c2c2c', '#1a1a1a'] 
    : ['#0a0b1e', '#1a1b3a'];
  
  const topBarColor = incognitoMode 
    ? 'rgba(44, 44, 44, 0.9)' 
    : 'rgba(26, 27, 58, 0.9)';

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
      <LinearGradient colors={gradientColors} style={styles.container}>
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
              <Ionicons 
                name="refresh-outline" 
                size={24} 
                color="#ffffff" 
              />
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

          {/* Bottom Navigation */}
          <BottomNavigation
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={goBack}
            onForward={goForward}
            onHome={goHome}
            onTabs={openTabs}
            onMenu={() => {
              console.log('Menu button pressed, setting isMenuVisible to true');
              setIsMenuVisible(true);
            }}
            isHomePage={isHomePage}
          />
        </SafeAreaView>

        <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)}
        currentUrl={currentUrl}
        onFindInPage={toggleFindInPage}
      />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
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
            <Ionicons 
              name="refresh-outline" 
              size={24} 
              color="#ffffff" 
            />
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

        {/* WebView */}
        <View style={styles.webviewContainer}>
          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4285f4" />
            </View>
          )}
          
          {/* Find in page bar */}
          {showFindInPage && (
            <View style={styles.findInPageContainer}>
              <TextInput
                style={styles.findInput}
                value={findText}
                onChangeText={(text) => {
                  setFindText(text);
                  if (text) findInPage(text);
                }}
                placeholder="Find in page"
                placeholderTextColor="#999"
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => findInPage(findText)}
              />
              <Text style={styles.findCounter}>
                {findMatches.total > 0 ? `${findMatches.current}/${findMatches.total}` : 'No matches'}
              </Text>
              <TouchableOpacity onPress={findPrevious} style={styles.findButton}>
                <Ionicons name="chevron-up" size={responsiveIconSize(20)} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={findNext} style={styles.findButton}>
                <Ionicons name="chevron-down" size={responsiveIconSize(20)} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFindInPage} style={styles.findButton}>
                <Ionicons name="close" size={responsiveIconSize(20)} color="#007AFF" />
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
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsBackForwardNavigationGestures={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            userAgent={desktopMode ? desktopUserAgent : mobileUserAgent}
            {...SecurityManager.getSecureWebViewProps()}
          />
        </View>

        {/* Bottom Navigation */}
        <BottomNavigation
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={goBack}
          onForward={goForward}
          onHome={goHome}
          onTabs={openTabs}
          onMenu={() => {
              console.log('Menu button pressed (WebView), setting isMenuVisible to true');
              setIsMenuVisible(true);
            }}
          isHomePage={false}
        />
      </SafeAreaView>

      <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)}
        currentUrl={currentUrl}
        onFindInPage={toggleFindInPage}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  findInPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: responsiveSpacing(10),
    paddingVertical: responsiveSpacing(8),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 2,
  },
  findInput: {
    flex: 1,
    height: responsiveHeight(36),
    backgroundColor: '#fff',
    borderRadius: responsiveBorderRadius(18),
    paddingHorizontal: responsiveSpacing(15),
    marginRight: responsiveSpacing(10),
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: responsiveFontSize(14),
  },
  findCounter: {
    marginRight: responsiveSpacing(10),
    fontSize: responsiveFontSize(14),
    color: '#666',
  },
  findButton: {
    padding: responsiveSpacing(5),
    marginLeft: responsiveSpacing(5),
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(isSmallScreen() ? 12 : 16),
    paddingVertical: responsiveSpacing(isSmallScreen() ? 8 : 12),
    paddingTop: responsiveSpacing(isSmallScreen() ? 45 : 50),
    backgroundColor: 'rgba(26, 27, 58, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: responsiveHeight(isSmallScreen() ? 80 : 90),
  },
  topButton: {
    width: responsiveWidth(isSmallScreen() ? 38 : 44),
    height: responsiveHeight(isSmallScreen() ? 38 : 44),
    borderRadius: responsiveBorderRadius(isSmallScreen() ? 19 : 22),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  incognitoButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: responsiveFontSize(isSmallScreen() ? 20 : 24),
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
    fontSize: responsiveFontSize(isSmallScreen() ? 8 : 10),
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: responsiveSpacing(2),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlContainer: {
    flex: 1,
    marginHorizontal: responsiveSpacing(isSmallScreen() ? 8 : 12),
  },
  urlInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: responsiveBorderRadius(20),
    paddingHorizontal: responsiveSpacing(isSmallScreen() ? 12 : 16),
    paddingVertical: responsiveSpacing(isSmallScreen() ? 6 : 8),
    color: '#ffffff',
    fontSize: responsiveFontSize(isSmallScreen() ? 14 : 16),
    minHeight: responsiveHeight(isSmallScreen() ? 36 : 40),
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: responsiveSpacing(isSmallScreen() ? 16 : 20),
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: responsiveBorderRadius(25),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(isSmallScreen() ? 12 : 16),
    paddingVertical: responsiveSpacing(isSmallScreen() ? 10 : 12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: responsiveHeight(isSmallScreen() ? 44 : 48),
  },
  searchIcon: {
    marginRight: responsiveSpacing(12),
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: responsiveFontSize(isSmallScreen() ? 14 : 16),
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
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
});