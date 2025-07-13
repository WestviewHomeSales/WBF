import { NewsItem, RSSFeed } from '../types/news';

export class RSSParser {
  static async fetchAndParse(url: string): Promise<RSSFeed> {
    // This class is now simplified and used as a backup
    // The main logic has been moved to useGoogleAlerts hook for better mobile handling
    
    try {
      console.log(`📱 RSSParser fallback attempt for: ${url}`);
      
      // Try RSS2JSON as the most reliable mobile option
      const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=30`;
      
      const response = await fetch(rss2jsonUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        console.log(`✅ RSSParser RSS2JSON success: ${data.items.length} items`);
        return this.parseRSS2JSONResponse(data);
      } else {
        throw new Error(`RSS2JSON error: ${data.message || 'No items found'}`);
      }
      
    } catch (error) {
      console.error('RSSParser failed:', error);
      throw error;
    }
  }
  
  private static parseRSS2JSONResponse(data: any): RSSFeed {
    const items: NewsItem[] = data.items.slice(0, 30).map((item: any, index: number) => ({
      title: item.title || `News Item ${index + 1}`,
      link: item.link || item.url || '#',
      description: item.description || item.content || item.summary || '',
      pubDate: item.pubDate || item.published || new Date().toISOString(),
      guid: item.guid || item.id || `rss2json-${index}`
    }));
    
    return {
      title: data.feed?.title || 'Work Brings Freedom News',
      description: data.feed?.description || 'Latest news updates',
      items
    };
  }
}
