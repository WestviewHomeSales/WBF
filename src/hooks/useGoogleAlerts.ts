import { useState, useEffect } from 'react';
import { NewsItem } from '../types/news';

// Multiple RSS feed sources for better reliability
const RSS_SOURCES = [
  // Primary Google Alerts feed
  'https://www.google.com/alerts/feeds/12721170179387732971/15550025776899134461',
  // Backup news sources that work well on mobile
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.cnn.com/rss/edition.rss',
  'https://feeds.reuters.com/reuters/topNews'
];

const CACHE_KEY = 'google_alerts_cache';
const CACHE_TIMESTAMP_KEY = 'google_alerts_timestamp';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Fallback headlines for when all else fails
const FALLBACK_HEADLINES: NewsItem[] = [
  {
    title: "Global Markets Show Mixed Results Amid Economic Uncertainty",
    link: "#",
    description: "Financial markets worldwide display varied performance as investors navigate economic challenges.",
    pubDate: new Date().toISOString(),
    guid: "fallback-1"
  },
  {
    title: "Technology Sector Continues Innovation Drive",
    link: "#",
    description: "Tech companies push forward with new developments despite market volatility.",
    pubDate: new Date().toISOString(),
    guid: "fallback-2"
  },
  {
    title: "International Trade Relations Under Review",
    link: "#",
    description: "Nations reassess trade partnerships in changing global landscape.",
    pubDate: new Date().toISOString(),
    guid: "fallback-3"
  },
  {
    title: "Energy Sector Adapts to Changing Market Dynamics",
    link: "#",
    description: "Energy companies adjust strategies to meet evolving demand patterns.",
    pubDate: new Date().toISOString(),
    guid: "fallback-4"
  },
  {
    title: "Healthcare Innovation Advances Continue",
    link: "#",
    description: "Medical research and healthcare technology show promising developments.",
    pubDate: new Date().toISOString(),
    guid: "fallback-5"
  },
  {
    title: "Infrastructure Development Projects Move Forward",
    link: "#",
    description: "Major infrastructure initiatives progress across multiple regions.",
    pubDate: new Date().toISOString(),
    guid: "fallback-6"
  },
  {
    title: "Educational Systems Embrace Digital Transformation",
    link: "#",
    description: "Schools and universities integrate new technologies for enhanced learning.",
    pubDate: new Date().toISOString(),
    guid: "fallback-7"
  },
  {
    title: "Environmental Initiatives Gain Momentum",
    link: "#",
    description: "Sustainability projects receive increased support and investment.",
    pubDate: new Date().toISOString(),
    guid: "fallback-8"
  },
  {
    title: "Manufacturing Sector Shows Resilience",
    link: "#",
    description: "Industrial production maintains stability despite global challenges.",
    pubDate: new Date().toISOString(),
    guid: "fallback-9"
  },
  {
    title: "Transportation Networks Undergo Modernization",
    link: "#",
    description: "Transit systems implement upgrades to improve efficiency and service.",
    pubDate: new Date().toISOString(),
    guid: "fallback-10"
  }
];

export const useGoogleAlerts = () => {
  const [headlines, setHeadlines] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFromRSS2JSON = async (rssUrl: string): Promise<NewsItem[]> => {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=20&api_key=YOUR_API_KEY`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS2JSON failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok' || !data.items || data.items.length === 0) {
      throw new Error('RSS2JSON returned no items');
    }

    return data.items.map((item: any, index: number) => ({
      title: item.title || `News Item ${index + 1}`,
      link: item.link || item.url || '#',
      description: item.description || item.content || '',
      pubDate: item.pubDate || item.published || new Date().toISOString(),
      guid: item.guid || item.id || `rss2json-${index}`
    }));
  };

  const fetchFromAllOrigins = async (rssUrl: string): Promise<NewsItem[]> => {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`AllOrigins failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.contents || data.contents.trim().length === 0) {
      throw new Error('AllOrigins returned empty content');
    }

    return parseXMLToItems(data.contents);
  };

  const parseXMLToItems = (xmlText: string): NewsItem[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing failed');
    }

    const items: NewsItem[] = [];
    const itemElements = xmlDoc.querySelectorAll('item, entry');
    
    itemElements.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent?.trim() || `News Item ${index + 1}`;
      const link = item.querySelector('link')?.textContent?.trim() || 
                   item.querySelector('link')?.getAttribute('href') || '#';
      const description = item.querySelector('description, summary')?.textContent?.trim() || '';
      const pubDate = item.querySelector('pubDate, published')?.textContent?.trim() || new Date().toISOString();
      const guid = item.querySelector('guid, id')?.textContent?.trim() || `item-${index}`;
      
      items.push({ title, link, description, pubDate, guid });
    });

    return items;
  };

  const fetchHeadlines = async (forceRefresh = false) => {
    console.log(`📱 Starting mobile headline fetch - Force refresh: ${forceRefresh}`);
    setLoading(true);
    setError(null);

    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp);
          const now = Date.now();
          
          if (now - timestamp < CACHE_DURATION) {
            try {
              const parsedData = JSON.parse(cachedData);
              if (parsedData && parsedData.length > 0 && parsedData[0].link !== '#') {
                console.log(`📱 Using cached REAL headlines: ${parsedData.length} items`);
                setHeadlines(parsedData);
                setLastUpdated(new Date(timestamp));
                setLoading(false);
                return;
              }
            } catch (parseError) {
              console.warn('📱 Error parsing cached data');
            }
          }
        }
      }

      console.log('📱 Attempting to fetch fresh headlines...');
      
      let successfulFetch = false;
      let fetchedItems: NewsItem[] = [];

      // Try each RSS source with different methods
      for (const rssUrl of RSS_SOURCES) {
        if (successfulFetch) break;

        try {
          console.log(`📱 Trying RSS2JSON for: ${rssUrl}`);
          fetchedItems = await fetchFromRSS2JSON(rssUrl);
          if (fetchedItems.length > 0) {
            console.log(`✅ RSS2JSON success: ${fetchedItems.length} items`);
            successfulFetch = true;
            break;
          }
        } catch (error) {
          console.warn(`❌ RSS2JSON failed for ${rssUrl}:`, error);
        }

        try {
          console.log(`📱 Trying AllOrigins for: ${rssUrl}`);
          fetchedItems = await fetchFromAllOrigins(rssUrl);
          if (fetchedItems.length > 0) {
            console.log(`✅ AllOrigins success: ${fetchedItems.length} items`);
            successfulFetch = true;
            break;
          }
        } catch (error) {
          console.warn(`❌ AllOrigins failed for ${rssUrl}:`, error);
        }

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (successfulFetch && fetchedItems.length > 0) {
        setHeadlines(fetchedItems);
        const now = Date.now();
        setLastUpdated(new Date(now));
        
        // Cache the successful data
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedItems));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
          console.log('📱 Real headlines cached successfully');
        } catch (storageError) {
          console.warn('📱 Could not cache data:', storageError);
        }
        
        setError(null);
      } else {
        throw new Error('All RSS sources failed');
      }
      
    } catch (fetchError) {
      console.error('📱 All fetch attempts failed:', fetchError);
      
      // Try to use cached data as fallback (even if expired)
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData && parsedData.length > 0 && parsedData[0].link !== '#') {
            console.log('📱 Using expired cached REAL data as fallback');
            setHeadlines(parsedData);
            const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
            if (cachedTimestamp) {
              setLastUpdated(new Date(parseInt(cachedTimestamp)));
            }
            setError('Using cached headlines - limited connectivity');
            setLoading(false);
            return;
          }
        } catch (cacheError) {
          console.error('📱 Error parsing cached data:', cacheError);
        }
      }
      
      // Last resort: use fallback headlines
      console.log('📱 Using fallback headlines');
      setHeadlines(FALLBACK_HEADLINES);
      setLastUpdated(new Date());
      setError('Limited connectivity - showing sample headlines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Immediate fetch
    fetchHeadlines();
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('📱 Periodic refresh triggered');
      fetchHeadlines(true);
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  return {
    headlines,
    loading,
    error,
    lastUpdated,
    refresh: () => {
      console.log('📱 Manual refresh triggered');
      fetchHeadlines(true);
    }
  };
};
