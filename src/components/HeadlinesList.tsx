import React from 'react';
import { NewsItem } from '../types/news';

interface HeadlinesListProps {
  headlines: NewsItem[];
  className?: string;
}

export const HeadlinesList: React.FC<HeadlinesListProps> = ({ headlines, className = '' }) => {
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const cleanGoogleRedirectUrl = (url: string): string => {
    if (!url || url === '#') return url;
    
    try {
      // Handle Google redirect URLs
      if (url.includes('google.com/url')) {
        const urlObj = new URL(url);
        const actualUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
        if (actualUrl) {
          return decodeURIComponent(actualUrl);
        }
      }
      
      // Handle other common redirect patterns
      if (url.includes('rct=j&sa=t&url=')) {
        const match = url.match(/url=([^&]+)/);
        if (match && match[1]) {
          return decodeURIComponent(match[1]);
        }
      }
      
      return url;
    } catch (error) {
      console.warn('Error cleaning URL:', error);
      return url;
    }
  };

  const extractHeadlineOnly = (title: string) => {
    // Remove HTML tags first
    let cleanedTitle = stripHtml(title);
    
    let headline = cleanedTitle;
    
    // Method 1: Extract from title using various patterns
    // Pattern 1: "Headline - Source Name"
    const dashPattern = cleanedTitle.match(/^(.+?)\s*-\s*([^-]+)$/);
    if (dashPattern && dashPattern[2].length < 50 && dashPattern[1].length > 10) {
      headline = dashPattern[1].trim();
    }
    
    // Pattern 2: "Headline | Source Name"
    else if (cleanedTitle.includes(' | ')) {
      const pipePattern = cleanedTitle.match(/^(.+?)\s*\|\s*([^|]+)$/);
      if (pipePattern && pipePattern[2].length < 50 && pipePattern[1].length > 10) {
        headline = pipePattern[1].trim();
      }
    }
    
    // Pattern 3: Multiple dashes - take all but last part
    else if (cleanedTitle.includes(' - ')) {
      const parts = cleanedTitle.split(' - ');
      if (parts.length >= 2) {
        const potentialSource = parts[parts.length - 1].trim();
        const potentialHeadline = parts.slice(0, -1).join(' - ').trim();
        
        // Check if last part looks like a source (not too long, starts with capital)
        if (potentialSource.length < 50 && potentialSource.length > 2 && 
            /^[A-Z]/.test(potentialSource) && potentialHeadline.length > 15) {
          headline = potentialHeadline;
        }
      }
    }
    
    // Clean up headline
    headline = headline
      .replace(/\s*-\s*Google.*$/i, '')
      .replace(/^Google\s*-\s*/i, '')
      .replace(/\s*\.\.\.$/, '')
      .trim();
    
    // Final validation
    if (headline.length < 10) {
      headline = cleanedTitle;
    }
    
    return headline;
  };

  if (headlines.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        No headlines available
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {headlines.map((headline, index) => {
        const actualHeadline = extractHeadlineOnly(headline.title);
        const cleanedLink = cleanGoogleRedirectUrl(headline.link);
        const isPlaceholder = cleanedLink === '#';
        
        return (
          <div key={headline.guid || index} className="border-b border-gray-200 pb-4">
            {isPlaceholder ? (
              <div className="block group cursor-default">
                <h3 className="text-base md:text-lg font-normal text-gray-700 leading-snug mb-2">
                  {actualHeadline}
                </h3>
                <p className="text-xs text-orange-500 italic font-medium">
                  📱 Sample content - network connection needed for live news
                </p>
              </div>
            ) : (
              <a 
                href={cleanedLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group"
              >
                <h3 className="text-base md:text-lg font-normal text-blue-600 hover:text-blue-800 underline transition-colors leading-snug">
                  {actualHeadline}
                </h3>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};
