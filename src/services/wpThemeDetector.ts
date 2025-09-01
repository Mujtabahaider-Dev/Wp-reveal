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

    // Use multiple CORS proxies as fallbacks
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const data = await response.json();
          return data.contents || data;
        }
      } catch (error) {
        console.log(`Proxy ${proxyUrl} failed, trying next...`);
      }
    }
    
    throw new Error('All proxy methods failed');
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

      // Check for child theme
      const templateMatch = header.match(/Template:\s*(.+)/i);
      if (templateMatch) {
        themeInfo.childTheme = {
          name: themeInfo.name || 'Unknown Child Theme',
          parent: templateMatch[1].trim()
        };
      }
    }
    
    return themeInfo;
  }

  private static detectPlugins(htmlContent: string): string[] {
    const plugins: string[] = [];
    
    // Common plugin patterns
    const pluginPatterns = [
      /wp-content\/plugins\/([^\/'"]+)/g,
      /wp_register_script\(['"]([^'"]+)['"]/g,
      /wp_enqueue_script\(['"]([^'"]+)['"]/g
    ];

    pluginPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(htmlContent)) !== null) {
        const pluginName = match[1];
        if (!plugins.includes(pluginName)) {
          plugins.push(pluginName);
        }
      }
    });

    return plugins.slice(0, 10); // Limit to first 10 plugins
  }

  private static async advancedThemeDetection(siteUrl: string, htmlContent: string): Promise<Partial<ThemeInfo>> {
    const detectionMethods = [];
    let themeInfo: Partial<ThemeInfo> = {};

    // Method 1: Standard theme stylesheet detection
    const themeStyleMatch = htmlContent.match(/href=['"](.*?\/wp-content\/themes\/[^\/]+\/style\.css[^'"]*)['"]/i);
    if (themeStyleMatch) {
      detectionMethods.push('Standard CSS');
      const themeStyleUrl = themeStyleMatch[1];
      const themeNameMatch = themeStyleUrl.match(/\/themes\/([^\/]+)\//);
      
      if (themeNameMatch) {
        themeInfo.name = themeNameMatch[1];
        themeInfo.themeUrl = themeStyleUrl;
        
        try {
          const cssContent = await this.fetchWithCors(themeStyleUrl);
          const cssThemeInfo = this.extractThemeInfo(cssContent);
          themeInfo = { ...themeInfo, ...cssThemeInfo };
        } catch (error) {
          console.log('Could not fetch CSS details');
        }
      }
    }

    // Method 2: Meta generator detection
    const generatorMatch = htmlContent.match(/<meta name=['"](generator|theme)['"]\s+content=['"](.*?)['"]/i);
    if (generatorMatch && !themeInfo.name) {
      detectionMethods.push('Meta Generator');
      themeInfo.name = generatorMatch[2];
    }

    // Method 3: CSS file name patterns
    const cssPatterns = [
      /href=['"](.*?\/wp-content\/themes\/([^\/'"]+)\/[^'"]*\.css[^'"]*)['"]/gi,
      /href=['"](.*?\/themes\/([^\/'"]+)\/[^'"]*\.css[^'"]*)['"]/gi
    ];

    for (const pattern of cssPatterns) {
      let match;
      while ((match = pattern.exec(htmlContent)) !== null && !themeInfo.name) {
        detectionMethods.push('CSS Pattern');
        themeInfo.name = match[2];
        themeInfo.themeUrl = match[1];
        break;
      }
    }

    // Method 4: JavaScript file detection
    const jsThemeMatch = htmlContent.match(/src=['"](.*?\/wp-content\/themes\/([^\/'"]+)\/[^'"]*\.js[^'"]*)['"]/i);
    if (jsThemeMatch && !themeInfo.name) {
      detectionMethods.push('JavaScript Pattern');
      themeInfo.name = jsThemeMatch[2];
    }

    // Method 5: Image file detection
    const imgThemeMatch = htmlContent.match(/src=['"](.*?\/wp-content\/themes\/([^\/'"]+)\/[^'"]*\.(png|jpg|jpeg|gif|svg)[^'"]*)['"]/i);
    if (imgThemeMatch && !themeInfo.name) {
      detectionMethods.push('Image Pattern');
      themeInfo.name = imgThemeMatch[2];
    }

    // Method 6: Template directory detection
    const templateMatch = htmlContent.match(/template-directory['"]\s*:\s*['"](.*?\/wp-content\/themes\/([^\/'"]+))['"]/i);
    if (templateMatch && !themeInfo.name) {
      detectionMethods.push('Template Directory');
      themeInfo.name = templateMatch[2];
    }

    // Method 7: Body class detection
    const bodyClassMatch = htmlContent.match(/<body[^>]*class=['"]*[^'"]*theme-([^'">\s]+)/i);
    if (bodyClassMatch && !themeInfo.name) {
      detectionMethods.push('Body Class');
      themeInfo.name = bodyClassMatch[1];
    }

    // Method 8: WordPress theme directory API check
    if (themeInfo.name) {
      try {
        const apiUrl = `https://api.wordpress.org/themes/info/1.1/?action=theme_information&request[slug]=${themeInfo.name}`;
        const apiResponse = await fetch(apiUrl);
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData && !apiData.error) {
            detectionMethods.push('WordPress API');
            themeInfo.author = apiData.author?.display_name || themeInfo.author;
            themeInfo.version = apiData.version || themeInfo.version;
            themeInfo.description = apiData.description || themeInfo.description;
            themeInfo.uri = apiData.homepage || themeInfo.uri;
          }
        }
      } catch (error) {
        console.log('WordPress API check failed');
      }
    }

    themeInfo.detectionMethod = detectionMethods.join(', ');
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
      
      // Enhanced WordPress detection
      const wpIndicators = [
        '/wp-content/',
        'wp-includes',
        'wordpress',
        'wp-json',
        'wp-admin',
        'wp_head',
        'wp_footer',
        'wp-embed',
        'wlwmanifest',
        'xmlrpc.php'
      ];

      const isWordPress = wpIndicators.some(indicator => 
        htmlContent.toLowerCase().includes(indicator.toLowerCase())
      );

      if (!isWordPress) {
        // Try alternative detection for heavily customized sites
        const alternativeCheck = await this.checkWordPressAlternative(siteUrl);
        if (!alternativeCheck) {
          return {
            success: false,
            error: "Could not detect a WordPress theme. This doesn't appear to be a WordPress site."
          };
        }
      }

      // Advanced theme detection
      const themeInfo = await this.advancedThemeDetection(siteUrl, htmlContent);
      
      if (!themeInfo.name) {
        return {
          success: false,
          error: "WordPress site detected but theme could not be identified. The theme may be heavily customized or use a non-standard structure."
        };
      }

      // Detect plugins
      const plugins = this.detectPlugins(htmlContent);

      return {
        success: true,
        data: {
          ...themeInfo,
          plugins,
          isWordPress: true
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze website"
      };
    }
  }

  private static async checkWordPressAlternative(siteUrl: string): Promise<boolean> {
    const checkUrls = [
      `${siteUrl}/wp-json/`,
      `${siteUrl}/wp-admin/`,
      `${siteUrl}/xmlrpc.php`,
      `${siteUrl}/wp-login.php`
    ];

    for (const checkUrl of checkUrls) {
      try {
        const response = await fetch(checkUrl, { method: 'HEAD' });
        if (response.status === 200 || response.status === 403) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  }
}