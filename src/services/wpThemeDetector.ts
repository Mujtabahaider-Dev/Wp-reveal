export interface ThemeInfo {
  name?: string;
  author?: string;
  version?: string;
  description?: string;
  uri?: string;
  isWordPress: boolean;
  themeUrl?: string;
}

export interface DetectionResult {
  success: boolean;
  data?: ThemeInfo;
  error?: string;
}

export class WPThemeDetectorService {
  private static async fetchWithCors(url: string): Promise<string> {
    try {
      // Try direct fetch first
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      // If direct fetch fails due to CORS, we'll use a CORS proxy
      console.log('Direct fetch failed, trying with CORS proxy');
    }

    // Use a CORS proxy as fallback
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const data = await response.json();
    return data.contents;
  }

  private static extractThemeInfo(cssContent: string): Partial<ThemeInfo> {
    const themeInfo: Partial<ThemeInfo> = {};
    
    // Extract theme information from CSS header comment
    const headerMatch = cssContent.match(/\/\*\s*([\s\S]*?)\s*\*\//);
    if (headerMatch) {
      const header = headerMatch[1];
      
      const nameMatch = header.match(/Theme Name:\s*(.+)/i);
      if (nameMatch) themeInfo.name = nameMatch[1].trim();
      
      const authorMatch = header.match(/Author:\s*(.+)/i);
      if (authorMatch) themeInfo.author = authorMatch[1].trim();
      
      const versionMatch = header.match(/Version:\s*(.+)/i);
      if (versionMatch) themeInfo.version = versionMatch[1].trim();
      
      const descriptionMatch = header.match(/Description:\s*(.+)/i);
      if (descriptionMatch) themeInfo.description = descriptionMatch[1].trim();
      
      const uriMatch = header.match(/Theme URI:\s*(.+)/i);
      if (uriMatch) themeInfo.uri = uriMatch[1].trim();
    }
    
    return themeInfo;
  }

  static async detectTheme(siteUrl: string): Promise<DetectionResult> {
    try {
      // Normalize URL
      if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
        siteUrl = 'https://' + siteUrl;
      }

      // Fetch the main page
      const htmlContent = await this.fetchWithCors(siteUrl);
      
      // Check for WordPress indicators
      const isWordPress = htmlContent.includes('/wp-content/') || 
                         htmlContent.includes('wp-includes') ||
                         htmlContent.includes('wordpress');

      if (!isWordPress) {
        return {
          success: false,
          error: "Could not detect a WordPress theme. This doesn't appear to be a WordPress site."
        };
      }

      // Look for theme stylesheet link
      const themeStyleMatch = htmlContent.match(/href=['"](.*?\/wp-content\/themes\/[^\/]+\/style\.css[^'"]*)['"]/i);
      
      if (!themeStyleMatch) {
        return {
          success: false,
          error: "Could not detect a WordPress theme. Theme stylesheet not found."
        };
      }

      const themeStyleUrl = themeStyleMatch[1];
      
      // Extract theme name from URL
      const themeNameMatch = themeStyleUrl.match(/\/themes\/([^\/]+)\//);
      const themeName = themeNameMatch ? themeNameMatch[1] : 'Unknown';

      try {
        // Fetch theme CSS to get detailed info
        const cssContent = await this.fetchWithCors(themeStyleUrl);
        const themeInfo = this.extractThemeInfo(cssContent);

        return {
          success: true,
          data: {
            name: themeInfo.name || themeName,
            author: themeInfo.author,
            version: themeInfo.version,
            description: themeInfo.description,
            uri: themeInfo.uri,
            isWordPress: true,
            themeUrl: themeStyleUrl
          }
        };
      } catch (cssError) {
        // If we can't fetch CSS, return basic info
        return {
          success: true,
          data: {
            name: themeName,
            isWordPress: true,
            themeUrl: themeStyleUrl
          }
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze website"
      };
    }
  }
}