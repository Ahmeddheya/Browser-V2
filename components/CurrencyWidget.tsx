import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CurrencyAPI, CurrencyRate, CryptoPrice } from '@/utils/currencyApi';
import {
  responsiveSpacing,
  responsiveFontSize,
  responsiveIconSize,
  responsiveWidth,
  responsiveHeight,
  responsiveBorderRadius,
  isSmallScreen,
  wp
} from '@/utils/responsive';

export const CurrencyWidget: React.FC = () => {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, fadeAnim]);
  const loadData = async () => {
    try {
      // Animate refresh button
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
      });
      
      setIsLoading(true);
      const [currencyData, cryptoData] = await Promise.all([
        CurrencyAPI.getCurrencyRates(),
        CurrencyAPI.getCryptoPrices(),
      ]);
      
      setCurrencies(currencyData.slice(0, 3)); // Show top 3 currencies
      setCryptos(cryptoData.slice(0, 2)); // Show top 2 cryptos
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return price.toFixed(2);
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header with refresh */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market Data</Text>
        <Animated.View style={{
          transform: [{
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            })
          }]
        }}>
          <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#4285f4" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Currency Rates */}
      <View style={styles.section}>
        <View style={styles.currencyGrid}>
          {currencies.map((currency, index) => (
            <TouchableOpacity key={index} style={styles.currencyCard}>
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <Text style={styles.currencyCode}>{currency.code}</Text>
              <Text style={styles.currencyRate}>{formatPrice(currency.rate)}</Text>
              <Text style={[
                styles.currencyChange,
                { color: currency.change24h >= 0 ? '#4CAF50' : '#f44336' }
              ]}>
                {formatChange(currency.change24h)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Crypto Prices */}
      <View style={styles.section}>
        <View style={styles.cryptoGrid}>
          {cryptos.map((crypto, index) => (
            <TouchableOpacity key={index} style={styles.cryptoCard}>
              <View style={styles.cryptoHeader}>
                <View style={styles.cryptoIcon}>
                  <Ionicons 
                    name={crypto.symbol === 'BTC' ? 'logo-bitcoin' : 
                          crypto.symbol === 'ETH' ? 'diamond-outline' :
                          crypto.symbol === 'ADA' ? 'heart-outline' : 'flash-outline'} 
                    size={20} 
                    color={crypto.symbol === 'BTC' ? '#f7931a' : 
                           crypto.symbol === 'ETH' ? '#627eea' :
                           crypto.symbol === 'ADA' ? '#0033ad' : '#00d4aa'} 
                  />
                </View>
                <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
              </View>
              <Text style={styles.cryptoName}>{crypto.name}</Text>
              <Text style={styles.cryptoPrice}>${formatPrice(crypto.price)}</Text>
              <Text style={[
                styles.cryptoChange, 
                { color: crypto.change24h >= 0 ? '#4CAF50' : '#f44336' }
              ]}>
                {formatChange(crypto.change24h)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Last Update Info */}
      {lastUpdate > 0 && (
        <View style={styles.updateInfo}>
          <Ionicons name="time-outline" size={16} color="#888" />
          <Text style={styles.updateText}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: responsiveSpacing(isSmallScreen() ? 16 : 20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing(isSmallScreen() ? 16 : 20),
  },
  headerTitle: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshButton: {
    padding: responsiveSpacing(8),
  },
  section: {
    marginBottom: responsiveSpacing(isSmallScreen() ? 16 : 20),
  },
  sectionTitle: {
    fontSize: responsiveFontSize(isSmallScreen() ? 12 : 14),
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: responsiveSpacing(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  currencyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: responsiveBorderRadius(12),
    padding: responsiveSpacing(isSmallScreen() ? 12 : 16),
    alignItems: 'center',
    minWidth: responsiveWidth(isSmallScreen() ? 80 : 90),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    marginHorizontal: responsiveSpacing(2),
  },
  currencySymbol: {
    fontSize: responsiveFontSize(isSmallScreen() ? 20 : 24),
    fontWeight: 'bold',
    color: '#4285f4',
    marginBottom: responsiveSpacing(4),
  },
  currencyCode: {
    fontSize: responsiveFontSize(isSmallScreen() ? 10 : 12),
    color: '#888',
    marginBottom: responsiveSpacing(4),
  },
  currencyRate: {
    fontSize: responsiveFontSize(isSmallScreen() ? 14 : 16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveSpacing(4),
  },
  currencyChange: {
    fontSize: responsiveFontSize(isSmallScreen() ? 10 : 12),
    fontWeight: '500',
  },
  cryptoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cryptoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: responsiveBorderRadius(12),
    padding: responsiveSpacing(isSmallScreen() ? 12 : 16),
    flex: 1,
    marginHorizontal: responsiveSpacing(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing(8),
  },
  cryptoIcon: {
    marginRight: responsiveSpacing(6),
  },
  cryptoSymbol: {
    fontSize: responsiveFontSize(isSmallScreen() ? 12 : 14),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cryptoName: {
    fontSize: responsiveFontSize(isSmallScreen() ? 10 : 12),
    color: '#888',
    marginBottom: responsiveSpacing(4),
  },
  cryptoPrice: {
    fontSize: responsiveFontSize(isSmallScreen() ? 14 : 16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveSpacing(4),
  },
  cryptoChange: {
    fontSize: responsiveFontSize(isSmallScreen() ? 10 : 12),
    fontWeight: '500',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveSpacing(10),
  },
  updateText: {
    fontSize: responsiveFontSize(isSmallScreen() ? 10 : 12),
    color: '#888',
    marginLeft: responsiveSpacing(4),
  },
});