import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { responsiveSpacing, responsiveFontSize, responsiveIconSize } from '../utils/responsive';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <LinearGradient colors={['#0a0b1e', '#1a1b3a']} style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={responsiveIconSize(64)} color="#ff6b6b" />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={responsiveIconSize(20)} color="#ffffff" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(40),
  },
  iconContainer: {
    marginBottom: responsiveSpacing(24),
  },
  title: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: responsiveSpacing(12),
    textAlign: 'center',
  },
  message: {
    fontSize: responsiveFontSize(16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: responsiveFontSize(22),
    marginBottom: responsiveSpacing(32),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285f4',
    borderRadius: 12,
    paddingHorizontal: responsiveSpacing(24),
    paddingVertical: responsiveSpacing(12),
  },
  retryText: {
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    marginLeft: responsiveSpacing(8),
  },
});