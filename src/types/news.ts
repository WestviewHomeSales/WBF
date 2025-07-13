export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export interface RSSFeed {
  title: string;
  description: string;
  items: NewsItem[];
}
