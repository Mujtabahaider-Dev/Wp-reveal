export interface ThemeInfo {
  name?: string;
  author?: string;
  version?: string;
  description?: string;
  uri?: string;
  isWordPress: boolean;
  themeUrl?: string;
  detectionMethod?: string;
  plugins?: string[];
  childTheme?: {
    name: string;
    parent: string;
  };
}

export interface DetectionResult {
  success: boolean;
  data?: ThemeInfo;
  error?: string;
}

// Cache for storing detection results
const detectionCache = new Map<string, { result: DetectionResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class WPThemeDetectorService {
  private static readonly TIMEOUT_DURATION = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 2;

  private static async fetchWithTimeout(url: string, timeout = this.TIMEOUT_DURATION): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WPThemeDetector/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private static async fetchWithCors(url: string): Promise<string> {
    let lastError: Error | null = null;

    // Try direct fetch first (fastest) - this will fail due to CORS, but we try anyway
    try {
      const response = await this.fetchWithTimeout(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      lastError = error as Error;
    }

    // Use more reliable CORS proxies with better error handling
    const proxies = [
      { 
        url: `https://corsproxy.io/?${encodeURIComponent(url)}`, 
        parser: 'direct',
        timeout: 15000
      },
      { 
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, 
        parser: 'json',
        timeout: 12000
      },
      { 
        url: `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`, 
        parser: 'json',
        timeout: 12000
      },
      { 
        url: `https://cors.bridged.cc/${url}`, 
        parser: 'direct',
        timeout: 15000
      },
      { 
        url: `https://cors.eu.org/${url}`, 
        parser: 'direct',
        timeout: 15000
      }
    ];

    for (let i = 0; i < proxies.length; i++) {
      const proxy = proxies[i];
      try {
        console.log(`Trying proxy ${i + 1}/${proxies.length}: ${proxy.url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), proxy.timeout);
        
        const response = await fetch(proxy.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WPThemeDetector/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          if (proxy.parser === 'direct') {
            // Direct HTML response
            const content = await response.text();
            if (content && content.length > 100) {
              console.log(`Proxy ${i + 1} succeeded with ${content.length} characters`);
              return content;
            }
          } else if (proxy.parser === 'json') {
            // JSON response that needs parsing
            const data = await response.json();
            if (data && data.contents && data.contents.length > 100) {
              console.log(`Proxy ${i + 1} succeeded with ${data.contents.length} characters`);
              return data.contents;
            }
          }
        }
      } catch (error) {
        console.log(`Proxy ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
        lastError = error as Error;
        continue;
      }
    }
    
    // If all proxies fail, provide a helpful error message
    const errorMessage = lastError?.message || 'Unknown error';
    throw new Error(`Unable to access this website. All CORS proxy methods failed. This is a common limitation when analyzing external websites from your browser. Error: ${errorMessage}`);
  }

  private static extractThemeInfo(cssContent: string): Partial<ThemeInfo> {
    const themeInfo: Partial<ThemeInfo> = {};
    
    // More efficient regex with single pass
    const headerMatch = cssContent.match(/\/\*\s*([\s\S]{0,2000}?)\s*\*\//); // Limit search to first 2000 chars
    if (!headerMatch) return themeInfo;

    const header = headerMatch[1];
    
    // Single regex for all fields
    const patterns = {
      name: /Theme Name:\s*(.+)/i,
      author: /Author:\s*(.+)/i,
      version: /Version:\s*(.+)/i,
      description: /Description:\s*(.+)/i,
      uri: /Theme URI:\s*(.+)/i,
      template: /Template:\s*(.+)/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = header.match(pattern);
      if (match) {
        if (key === 'template') {
          themeInfo.childTheme = {
            name: themeInfo.name || 'Unknown Child Theme',
            parent: match[1].trim()
          };
        } else {
          (themeInfo as Record<string, unknown>)[key] = match[1].trim();
        }
      }
    });
    
    return themeInfo;
  }

  private static detectPlugins(htmlContent: string): string[] {
    const plugins = new Set<string>();
    
    // Optimized single regex for plugin detection
    const pluginPattern = /wp-content\/plugins\/([^/'"?\s]+)/gi;
    let match;
    
    while ((match = pluginPattern.exec(htmlContent)) !== null && plugins.size < 15) {
      const pluginName = match[1];
      if (pluginName && !['index.php', 'readme.txt'].includes(pluginName)) {
        plugins.add(pluginName);
      }
    }

    return Array.from(plugins).slice(0, 10);
  }

  private static extractThemeFromPaths(htmlContent: string): string[] {
    const themeNames = new Set<string>();
    
    // Single optimized regex for theme paths
    const themePattern = /\/wp-content\/themes\/([^/'"?\s]+)/gi;
    let match;
    
    while ((match = themePattern.exec(htmlContent)) !== null && themeNames.size < 5) {
      const themeName = match[1];
      if (themeName && !['plugins', 'uploads', 'cache', 'mu-plugins'].includes(themeName)) {
        themeNames.add(themeName);
      }
    }

    return Array.from(themeNames);
  }

  private static async quickWordPressCheck(htmlContent: string): Promise<boolean> {
    // Fast WordPress detection using most reliable indicators
    const quickIndicators = [
      '/wp-content/',
      'wp-includes',
      'wp-json',
      'wp_head'
    ];

    return quickIndicators.some(indicator => htmlContent.includes(indicator));
  }

  private static async advancedThemeDetection(siteUrl: string, htmlContent: string): Promise<Partial<ThemeInfo>> {
    const detectionMethods: string[] = [];
    const themeInfo: Partial<ThemeInfo> = {};

    // Method 1: Direct CSS detection (most reliable and fastest)
    const themeStyleMatch = htmlContent.match(/href=['"](.*?\/wp-content\/themes\/([^/'"]+)\/style\.css[^'"]*)['"]/i);
    if (themeStyleMatch) {
      detectionMethods.push('Direct CSS');
      const [, themeStyleUrl, themeName] = themeStyleMatch;
      themeInfo.name = themeName;
      themeInfo.themeUrl = themeStyleUrl;
      
      // Fetch CSS details in background (non-blocking)
      this.fetchThemeDetails(themeStyleUrl, themeInfo).catch(() => {
        // Silently fail - we already have the theme name
      });
    }

    // Method 2: Theme folder path extraction (if CSS method failed)
    if (!themeInfo.name) {
      const themeNames = this.extractThemeFromPaths(htmlContent);
      if (themeNames.length > 0) {
        detectionMethods.push('Path Analysis');
        // Get most frequent theme name
        const themeCounts = themeNames.reduce((acc, name) => {
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostCommonTheme = Object.entries(themeCounts)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (mostCommonTheme) {
          themeInfo.name = mostCommonTheme[0];
          themeInfo.themeUrl = `${siteUrl}/wp-content/themes/${themeInfo.name}/style.css`;
        }
      }
    }

    // Method 3: Alternative CSS patterns (broader search)
    if (!themeInfo.name) {
      const cssMatch = htmlContent.match(/href=['"](.*?\/wp-content\/themes\/([^/'"]+)\/[^'"]*\.css[^'"]*)['"]/i);
      if (cssMatch) {
        detectionMethods.push('CSS Pattern');
        themeInfo.name = cssMatch[2];
        themeInfo.themeUrl = cssMatch[1];
      }
    }

    // Method 4: Body class detection (lightweight)
    if (!themeInfo.name) {
      const bodyClassMatch = htmlContent.match(/<body[^>]*class=['"]*[^'"]*theme-([^'">\s]+)/i);
      if (bodyClassMatch) {
        detectionMethods.push('Body Class');
        themeInfo.name = bodyClassMatch[1];
      }
    }

    themeInfo.detectionMethod = detectionMethods.join(', ');
    return themeInfo;
  }

  private static async fetchThemeDetails(cssUrl: string, themeInfo: Partial<ThemeInfo>): Promise<void> {
    try {
      const cssContent = await this.fetchWithCors(cssUrl);
      const cssThemeInfo = this.extractThemeInfo(cssContent);
      Object.assign(themeInfo, cssThemeInfo);
    } catch (error) {
      // Silently fail - we already have basic theme info
    }
  }

  private static normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Remove trailing slash and fragments
    return url.replace(/\/$/, '').split('#')[0].split('?')[0];
  }

  private static getCacheKey(url: string): string {
    return this.normalizeUrl(url);
  }

  private static getFromCache(url: string): DetectionResult | null {
    const cacheKey = this.getCacheKey(url);
    const cached = detectionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }
    
    if (cached) {
      detectionCache.delete(cacheKey); // Remove expired cache
    }
    
    return null;
  }

  private static setCache(url: string, result: DetectionResult): void {
    const cacheKey = this.getCacheKey(url);
    detectionCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean old cache entries (keep cache size manageable)
    if (detectionCache.size > 100) {
      const oldestKey = Array.from(detectionCache.keys())[0];
      detectionCache.delete(oldestKey);
    }
  }

  static async detectTheme(siteUrl: string): Promise<DetectionResult> {
    try {
      const normalizedUrl = this.normalizeUrl(siteUrl);
      
      // Check cache first
      const cachedResult = this.getFromCache(normalizedUrl);
      if (cachedResult) {
        return cachedResult;
      }

      // Fetch the main page with retry logic
      let htmlContent: string;
      let retryCount = 0;
      
      while (retryCount <= this.MAX_RETRIES) {
        try {
          htmlContent = await this.fetchWithCors(normalizedUrl);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount > this.MAX_RETRIES) {
            throw error;
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Quick WordPress check first
      const isWordPress = await this.quickWordPressCheck(htmlContent!);
      
      if (!isWordPress) {
        const result = {
          success: false,
          error: "This doesn't appear to be a WordPress site. No WordPress indicators found."
        };
        this.setCache(normalizedUrl, result);
        return result;
      }

      // Advanced theme detection
      const themeInfo = await this.advancedThemeDetection(normalizedUrl, htmlContent!);
      
      if (!themeInfo.name) {
        const result = {
          success: false,
          error: "WordPress site detected but theme could not be identified. The theme may be heavily customized."
        };
        this.setCache(normalizedUrl, result);
        return result;
      }

      // Detect plugins (lightweight)
      const plugins = this.detectPlugins(htmlContent!);

      const result = {
        success: true,
        data: {
          ...themeInfo,
          plugins,
          isWordPress: true
        }
      };

      // Cache successful results
      this.setCache(normalizedUrl, result);
      return result;

    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze website"
      };
      
      // Don't cache errors for too long
      return result;
    }
  }

  // Utility method to clear cache if needed
  static clearCache(): void {
    detectionCache.clear();
  }

  // Get cache statistics
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: detectionCache.size,
      entries: Array.from(detectionCache.keys())
    };
  }
}