export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  change24h: number;
  lastUpdated: number;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: number;
}

export class CurrencyAPI {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static currencyCache: Map<string, { data: CurrencyRate[], timestamp: number }> = new Map();
  private static cryptoCache: Map<string, { data: CryptoPrice[], timestamp: number }> = new Map();

  // Get real-time currency rates from exchangerate-api
  static async getCurrencyRates(baseCurrency = 'USD'): Promise<CurrencyRate[]> {
    const cacheKey = baseCurrency;
    const cached = this.currencyCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const currencies: CurrencyRate[] = [
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          rate: baseCurrency === 'USD' ? 1 : (1 / data.rates.USD),
          change24h: 0, // Base currency has no change
          lastUpdated: Date.now(),
        },
        {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          rate: data.rates.EUR || 0.85,
          change24h: Math.random() * 2 - 1, // Simulated change
          lastUpdated: Date.now(),
        },
        {
          code: 'GBP',
          name: 'British Pound',
          symbol: '£',
          rate: data.rates.GBP || 0.73,
          change24h: Math.random() * 2 - 1, // Simulated change
          lastUpdated: Date.now(),
        },
        {
          code: 'JPY',
          name: 'Japanese Yen',
          symbol: '¥',
          rate: data.rates.JPY || 110,
          change24h: Math.random() * 2 - 1, // Simulated change
          lastUpdated: Date.now(),
        },
      ];

      this.currencyCache.set(cacheKey, { data: currencies, timestamp: Date.now() });
      return currencies;
    } catch (error) {
      console.error('Failed to fetch currency rates:', error);
      
      // Return fallback data
      return [
        { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.00, change24h: 0, lastUpdated: Date.now() },
        { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85, change24h: -0.2, lastUpdated: Date.now() },
        { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73, change24h: 0.1, lastUpdated: Date.now() },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110, change24h: 0.3, lastUpdated: Date.now() },
      ];
    }
  }

  // Get real-time crypto prices from CoinGecko
  static async getCryptoPrices(): Promise<CryptoPrice[]> {
    const cacheKey = 'crypto';
    const cached = this.cryptoCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const cryptos: CryptoPrice[] = [
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: data.bitcoin?.usd || 43000,
          change24h: data.bitcoin?.usd_24h_change || 0,
          marketCap: data.bitcoin?.usd_market_cap || 0,
          volume24h: data.bitcoin?.usd_24h_vol || 0,
          lastUpdated: Date.now(),
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          price: data.ethereum?.usd || 2300,
          change24h: data.ethereum?.usd_24h_change || 0,
          marketCap: data.ethereum?.usd_market_cap || 0,
          volume24h: data.ethereum?.usd_24h_vol || 0,
          lastUpdated: Date.now(),
        },
        {
          id: 'cardano',
          symbol: 'ADA',
          name: 'Cardano',
          price: data.cardano?.usd || 0.35,
          change24h: data.cardano?.usd_24h_change || 0,
          marketCap: data.cardano?.usd_market_cap || 0,
          volume24h: data.cardano?.usd_24h_vol || 0,
          lastUpdated: Date.now(),
        },
        {
          id: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          price: data.solana?.usd || 95,
          change24h: data.solana?.usd_24h_change || 0,
          marketCap: data.solana?.usd_market_cap || 0,
          volume24h: data.solana?.usd_24h_vol || 0,
          lastUpdated: Date.now(),
        },
      ];

      this.cryptoCache.set(cacheKey, { data: cryptos, timestamp: Date.now() });
      return cryptos;
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      
      // Return fallback data
      return [
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 43000, change24h: 2.5, marketCap: 0, volume24h: 0, lastUpdated: Date.now() },
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 2300, change24h: -1.2, marketCap: 0, volume24h: 0, lastUpdated: Date.now() },
        { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.35, change24h: 3.1, marketCap: 0, volume24h: 0, lastUpdated: Date.now() },
        { id: 'solana', symbol: 'SOL', name: 'Solana', price: 95, change24h: -0.8, marketCap: 0, volume24h: 0, lastUpdated: Date.now() },
      ];
    }
  }

  // Clear cache
  static clearCache(): void {
    this.currencyCache.clear();
    this.cryptoCache.clear();
  }
}