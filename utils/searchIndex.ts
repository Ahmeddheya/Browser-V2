import { StorageManager, HistoryItem, BookmarkItem } from '@/utils/storage';

// Search index interfaces
export interface SearchIndexItem {
  id: string;
  type: 'history' | 'bookmark';
  title: string;
  url: string;
  content: string;
  keywords: string[];
  score: number;
  lastUpdated: number;
}

export interface SearchResult {
  item: HistoryItem | BookmarkItem;
  type: 'history' | 'bookmark';
  score: number;
  matchedFields: string[];
  snippet?: string;
}

export interface SearchOptions {
  limit?: number;
  includeHistory?: boolean;
  includeBookmarks?: boolean;
  fuzzyMatch?: boolean;
  sortBy?: 'relevance' | 'date' | 'frequency';
}

// Advanced search indexing class
export class SearchIndexManager {
  private static index: Map<string, SearchIndexItem> = new Map();
  private static lastIndexUpdate = 0;
  private static readonly INDEX_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Initialize search index
  static async initialize(): Promise<void> {
    try {
      await this.loadIndex();
      await this.updateIndex();
    } catch (error) {
      console.error('Failed to initialize search index:', error);
      // Continue with empty index
      this.index = new Map();
    }
  }

  // Load index from storage
  private static async loadIndex(): Promise<void> {
    try {
      const storedIndex = await StorageManager.getItem<SearchIndexItem[]>('search_index', []);
      this.index = new Map(storedIndex.map(item => [item.id, item]));
      this.lastIndexUpdate = await StorageManager.getItem<number>('search_index_timestamp', 0);
    } catch (error) {
      console.error('Failed to load search index:', error);
      this.index = new Map();
    }
  }

  // Save index to storage
  private static async saveIndex(): Promise<void> {
    try {
      const indexArray = Array.from(this.index.values());
      await StorageManager.setItem('search_index', indexArray);
      await StorageManager.setItem('search_index_timestamp', Date.now());
    } catch (error) {
      console.error('Failed to save search index:', error);
    }
  }

  // Update search index with latest data
  static async updateIndex(force = false): Promise<void> {
    const now = Date.now();
    
    // Check if update is needed
    if (!force && (now - this.lastIndexUpdate) < this.INDEX_UPDATE_INTERVAL) {
      return;
    }

    try {
      // Clear existing index
      this.index.clear();

      // Index history items
      const history = await StorageManager.getHistory();
      for (const item of history) {
        const indexItem = this.createIndexItem(item, 'history');
        this.index.set(indexItem.id, indexItem);
      }

      // Index bookmark items
      const bookmarks = await StorageManager.getBookmarks();
      for (const item of bookmarks) {
        const indexItem = this.createIndexItem(item, 'bookmark');
        this.index.set(indexItem.id, indexItem);
      }

      this.lastIndexUpdate = now;
      await this.saveIndex();
    } catch (error) {
      console.error('Failed to update search index:', error);
    }
  }

  // Create search index item
  private static createIndexItem(
    item: HistoryItem | BookmarkItem,
    type: 'history' | 'bookmark'
  ): SearchIndexItem {
    const title = item.title.toLowerCase();
    const url = item.url.toLowerCase();
    const domain = this.extractDomain(item.url).toLowerCase();
    
    // Extract keywords
    const keywords = this.extractKeywords(item.title, item.url);
    
    // Add folder for bookmarks
    if (type === 'bookmark' && 'folder' in item) {
      keywords.push(item.folder.toLowerCase());
    }
    
    // Add tags for bookmarks
    if (type === 'bookmark' && 'tags' in item && item.tags) {
      keywords.push(...item.tags.map(tag => tag.toLowerCase()));
    }

    // Calculate base score
    let score = 1.0;
    if (type === 'history' && 'visitCount' in item) {
      score += Math.log(item.visitCount + 1) * 0.1;
    }
    
    // Boost score for recent items
    const timestamp = type === 'history' ? item.timestamp : (item as BookmarkItem).dateAdded;
    const daysSinceUpdate = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - daysSinceUpdate / 30) * 0.2; // Boost recent items

    return {
      id: item.id,
      type,
      title: item.title,
      url: item.url,
      content: `${title} ${url} ${domain}`,
      keywords,
      score,
      lastUpdated: Date.now(),
    };
  }

  // Extract keywords from text
  private static extractKeywords(title: string, url: string): string[] {
    const text = `${title} ${url}`.toLowerCase();
    
    // Remove common words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'http', 'https', 'www', 'com', 'org', 'net', 'edu', 'gov'
    ]);
    
    const words = text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 20); // Limit keywords
    
    return [...new Set(words)]; // Remove duplicates
  }

  // Extract domain from URL
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  // Perform search with advanced scoring
  static async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    // Ensure index is up to date
    await this.updateIndex();

    const {
      limit = 50,
      includeHistory = true,
      includeBookmarks = true,
      fuzzyMatch = true,
      sortBy = 'relevance'
    } = options;

    const queryTerms = this.normalizeQuery(query);
    const results: SearchResult[] = [];

    // Search through index
    for (const indexItem of this.index.values()) {
      // Filter by type
      if (!includeHistory && indexItem.type === 'history') continue;
      if (!includeBookmarks && indexItem.type === 'bookmark') continue;

      const matchResult = this.calculateMatch(indexItem, queryTerms, fuzzyMatch);
      
      if (matchResult.score > 0) {
        // Get original item
        const originalItem = await this.getOriginalItem(indexItem.id, indexItem.type);
        if (originalItem) {
          results.push({
            item: originalItem,
            type: indexItem.type,
            score: matchResult.score,
            matchedFields: matchResult.matchedFields,
            snippet: this.generateSnippet(indexItem, queryTerms),
          });
        }
      }
    }

    // Sort results
    this.sortResults(results, sortBy);

    // Apply limit
    return results.slice(0, limit);
  }

  // Normalize search query
  private static normalizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  // Calculate match score
  private static calculateMatch(
    indexItem: SearchIndexItem,
    queryTerms: string[],
    fuzzyMatch: boolean
  ): { score: number; matchedFields: string[] } {
    let totalScore = 0;
    const matchedFields: string[] = [];

    for (const term of queryTerms) {
      let termScore = 0;
      
      // Exact matches in title (highest weight)
      if (indexItem.title.toLowerCase().includes(term)) {
        termScore += 3.0;
        if (!matchedFields.includes('title')) matchedFields.push('title');
      }
      
      // Exact matches in URL
      if (indexItem.url.toLowerCase().includes(term)) {
        termScore += 2.0;
        if (!matchedFields.includes('url')) matchedFields.push('url');
      }
      
      // Keyword matches
      if (indexItem.keywords.some(keyword => keyword.includes(term))) {
        termScore += 1.5;
        if (!matchedFields.includes('keywords')) matchedFields.push('keywords');
      }
      
      // Fuzzy matching
      if (fuzzyMatch && termScore === 0) {
        const fuzzyScore = this.calculateFuzzyMatch(term, indexItem);
        if (fuzzyScore > 0.7) {
          termScore += fuzzyScore * 0.5;
          if (!matchedFields.includes('fuzzy')) matchedFields.push('fuzzy');
        }
      }
      
      totalScore += termScore;
    }

    // Apply base score multiplier
    totalScore *= indexItem.score;

    // Boost for multiple term matches
    if (queryTerms.length > 1) {
      const matchRatio = matchedFields.length / queryTerms.length;
      totalScore *= (1 + matchRatio * 0.5);
    }

    return { score: totalScore, matchedFields };
  }

  // Calculate fuzzy match score
  private static calculateFuzzyMatch(term: string, indexItem: SearchIndexItem): number {
    const targets = [indexItem.title, indexItem.url, ...indexItem.keywords];
    let maxScore = 0;

    for (const target of targets) {
      const score = this.levenshteinSimilarity(term, target.toLowerCase());
      maxScore = Math.max(maxScore, score);
    }

    return maxScore;
  }

  // Calculate Levenshtein similarity
  private static levenshteinSimilarity(a: string, b: string): number {
    if (a.length === 0) return b.length === 0 ? 1 : 0;
    if (b.length === 0) return 0;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    const maxLength = Math.max(a.length, b.length);
    return (maxLength - matrix[b.length][a.length]) / maxLength;
  }

  // Get original item from storage
  private static async getOriginalItem(
    id: string,
    type: 'history' | 'bookmark'
  ): Promise<HistoryItem | BookmarkItem | null> {
    try {
      if (type === 'history') {
        const history = await StorageManager.getHistory();
        return history.find(item => item.id === id) || null;
      } else {
        const bookmarks = await StorageManager.getBookmarks();
        return bookmarks.find(item => item.id === id) || null;
      }
    } catch {
      return null;
    }
  }

  // Generate search snippet
  private static generateSnippet(indexItem: SearchIndexItem, queryTerms: string[]): string {
    const text = `${indexItem.title} ${indexItem.url}`;
    const maxLength = 150;
    
    // Find best match position
    let bestPosition = 0;
    let bestScore = 0;
    
    for (const term of queryTerms) {
      const position = text.toLowerCase().indexOf(term);
      if (position >= 0) {
        const score = queryTerms.length - queryTerms.indexOf(term);
        if (score > bestScore) {
          bestScore = score;
          bestPosition = Math.max(0, position - 50);
        }
      }
    }
    
    let snippet = text.substring(bestPosition, bestPosition + maxLength);
    if (bestPosition > 0) snippet = '...' + snippet;
    if (bestPosition + maxLength < text.length) snippet += '...';
    
    return snippet;
  }

  // Sort search results
  private static sortResults(results: SearchResult[], sortBy: string): void {
    switch (sortBy) {
      case 'relevance':
        results.sort((a, b) => b.score - a.score);
        break;
      case 'date':
        results.sort((a, b) => {
          const aTime = a.type === 'history' 
            ? (a.item as HistoryItem).timestamp 
            : (a.item as BookmarkItem).dateAdded;
          const bTime = b.type === 'history' 
            ? (b.item as HistoryItem).timestamp 
            : (b.item as BookmarkItem).dateAdded;
          return bTime - aTime;
        });
        break;
      case 'frequency':
        results.sort((a, b) => {
          const aFreq = a.type === 'history' ? (a.item as HistoryItem).visitCount : 1;
          const bFreq = b.type === 'history' ? (b.item as HistoryItem).visitCount : 1;
          return bFreq - aFreq;
        });
        break;
    }
  }

  // Add item to index
  static async addToIndex(item: HistoryItem | BookmarkItem, type: 'history' | 'bookmark'): Promise<void> {
    const indexItem = this.createIndexItem(item, type);
    this.index.set(indexItem.id, indexItem);
    await this.saveIndex();
  }

  // Remove item from index
  static async removeFromIndex(id: string): Promise<void> {
    this.index.delete(id);
    await this.saveIndex();
  }

  // Clear entire index
  static async clearIndex(): Promise<void> {
    this.index.clear();
    await this.saveIndex();
  }

  // Get index statistics
  static getIndexStats(): { totalItems: number; historyItems: number; bookmarkItems: number; lastUpdate: number } {
    const items = Array.from(this.index.values());
    return {
      totalItems: items.length,
      historyItems: items.filter(item => item.type === 'history').length,
      bookmarkItems: items.filter(item => item.type === 'bookmark').length,
      lastUpdate: this.lastIndexUpdate,
    };
  }
}
