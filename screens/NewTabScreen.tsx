import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTabsStore } from '../store/tabsStore';
import { resolveToUrlOrSearch } from '../utils/resolveUrl';
import { useRoute } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  isSmallScreen,
} from '../utils/responsive';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface RouteParams {
  tabId: string;
}

export function NewTabScreen() {
  const route = useRoute();
  const { tabId } = route.params as RouteParams;
  const webViewRef = useRef<WebView>(null);
  
  const { activeTabs, updateTabUrl } = useTabsStore();
  const currentTab = activeTabs.find(tab => tab.id === tabId);
  
  const [url, setUrl] = useState(currentTab?.url || 'about:blank');
  const [currentUrl, setCurrentUrl] = useState(currentTab?.url || 'about:blank');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  useEffect(() => {
    if (currentTab) {
      setUrl(currentTab.url);
      setCurrentUrl(currentTab.url);
    }
  }, [currentTab]);

  const handleUrlSubmit = () => {
    if (!url.trim()) return;
    
    const resolvedUrl = resolveToUrlOrSearch(url);
    setCurrentUrl(resolvedUrl);
    
    if (tabId && updateTabUrl) {
      updateTabUrl(tabId, resolvedUrl);
    }
    
    Keyboard.dismiss();
    setIsUrlFocused(false);
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setUrl(navState.url);
    setIsLoading(navState.loading);
    
    // Update tab title and URL
    if (tabId && navState.url && navState.title && updateTabUrl) {
      updateTabUrl(tabId, navState.url);
    }
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

  const reload = () => {
    try {
      webViewRef.current?.reload();
    } catch (error) {
      console.warn('Reload error:', error);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    Alert.alert(
      'Page Load Error',
      'Failed to load the page. Please check your internet connection and try again.',
      [
        { text: 'Retry', onPress: reload },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={styles.container}>
      <AppHeader
        showUrlBar={true}
        url={isUrlFocused ? url : (currentUrl === 'about:blank' ? '' : currentUrl)}
        onUrlChange={setUrl}
        onUrlSubmit={handleUrlSubmit}
        isLoading={isLoading}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
        onReload={reload}
        isUrlFocused={isUrlFocused}
        onUrlFocus={() => setIsUrlFocused(true)}
        onUrlBlur={() => setIsUrlFocused(false)}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* WebView */}
        <View style={styles.webviewContainer}>
          {currentUrl === 'about:blank' ? (
            <View style={styles.blankPage}>
              <View style={styles.blankPageContent}>
                <Ionicons name="globe-outline" size={responsiveIconSize(64)} color={colors.primary} />
                <Text style={styles.blankPageTitle}>New Tab</Text>
                <Text style={styles.blankPageSubtitle}>Enter a URL or search term above to get started</Text>
              </View>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{ uri: currentUrl }}
              style={styles.webview}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={handleError}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              allowsBackForwardNavigationGestures={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo={true}
            />
          )}
        </View>
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
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  blankPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.layout.screenPadding,
  },
  blankPageContent: {
    alignItems: 'center',
  },
  blankPageTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  blankPageSubtitle: {
    fontSize: responsiveFontSize(16),
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: responsiveFontSize(22),
  },
});