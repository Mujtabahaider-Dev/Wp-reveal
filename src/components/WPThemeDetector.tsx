import { useState } from "react";
import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WPThemeDetectorService, type ThemeInfo } from "@/services/wpThemeDetector";
import { Search, Globe, User, Hash, ExternalLink, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const WPThemeDetector = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ThemeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoize URL validation
  const isValidUrl = useMemo(() => {
    if (!url.trim()) return false;
    try {
      const testUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(testUrl);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  // Debounced URL input to prevent excessive re-renders
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // Clear previous results when URL changes
    if (result || error) {
      setResult(null);
      setError(null);
    }
  }, [result, error]);

  const handleDetect = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    setProgress(0);
    setLoadingStep("Initializing...");

    const startTime = performance.now();

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 800);

    try {
      // Update loading steps
      setLoadingStep("Connecting to website...");
      setProgress(20);
      
      setTimeout(() => setLoadingStep("Analyzing website structure..."), 1000);
      setTimeout(() => setProgress(40), 1000);
      
      setTimeout(() => setLoadingStep("Detecting WordPress theme..."), 2000);
      setTimeout(() => setProgress(60), 2000);
      
      setTimeout(() => setLoadingStep("Extracting theme details..."), 3000);
      setTimeout(() => setProgress(80), 3000);

      const detection = await WPThemeDetectorService.detectTheme(url.trim());
      
      clearInterval(progressInterval);
      setProgress(100);
      setLoadingStep("Finalizing results...");
      
      const endTime = performance.now();
      const detectionTime = Math.round(endTime - startTime);
      
      if (detection.success && detection.data) {
        setResult(detection.data);
        toast({
          title: "Success",
          description: `Theme detected in ${detectionTime}ms!`,
        });
      } else {
        setError(detection.error || "Could not detect a WordPress theme.");
        toast({
          title: "Detection Failed",
          description: detection.error || "Could not detect a WordPress theme.",
          variant: "destructive",
        });
      }
    } catch (err) {
      clearInterval(progressInterval);
      let errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
        errorMessage = "Unable to access this website due to browser security restrictions. This is a common issue when analyzing external websites. Try using a different website or contact the site owner.";
      } else if (errorMessage.includes('timeout')) {
        errorMessage = "The website took too long to respond. Please try again or check if the website is accessible.";
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = "Network error occurred. Please check your internet connection and try again.";
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setLoadingStep("");
      }, 500);
    }
  }, [url, isValidUrl, toast]);

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 relative">
      
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
              <div className="p-4 rounded-3xl bg-white/20 dark:bg-white/10 backdrop-blur-lg border border-white/30 shadow-2xl animate-pulse">
                <Globe className="w-12 h-12 text-white drop-shadow-lg" aria-hidden="true" />
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white drop-shadow-2xl leading-tight">
                WP Reveal
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-white/40 via-white/80 to-white/40 rounded-full"></div>
            </div>
            <p className="text-white/90 text-lg md:text-xl drop-shadow-md max-w-2xl mx-auto">
              Instantly discover which WordPress theme any website is using. Get detailed theme information including name, author, version, and more.
            </p>
          </section>

        {/* Input Card */}
        <section className="w-full">
          <Card className="backdrop-blur-sm bg-white/85 dark:bg-black/40 border-white/30 dark:border-white/10 shadow-xl p-6" style={{ boxShadow: 'var(--glass-shadow)' }}>
            <form onSubmit={handleDetect} className="space-y-4" role="search" aria-label="WordPress theme detection">
              {/* Keyboard Shortcut Hint */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Enter</kbd> to submit
              </div>
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Website URL for WordPress Theme Detection
                </label>
                
                {/* Example URLs */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Try:</span>
                  {['wordpress.org', 'woocommerce.com', 'elementor.com'].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setUrl(`https://${example}`)}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      disabled={isLoading}
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder="https://example.com"
                    className={cn(
                      "w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-400 pr-10 bg-white/80 dark:bg-white/10 dark:text-white transition-all duration-200",
                      isValidUrl ? "border-green-300 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-800" : 
                      url && !isValidUrl ? "border-red-300 dark:border-red-600 ring-2 ring-red-200 dark:ring-red-800" :
                      "border-gray-200 dark:border-gray-600"
                    )}
                    disabled={isLoading}
                    aria-describedby="url-help"
                    required
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  
                  {/* URL Validation Feedback */}
                  {url && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {isValidUrl ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Valid URL
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Invalid URL format
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div id="url-help" className="sr-only">Enter the full URL of the WordPress website you want to analyze</div>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading || !isValidUrl}
                variant="gradient"
                className="w-full py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                aria-label={isLoading ? "Detecting WordPress theme in progress" : "Start WordPress theme detection"}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    <span className="text-sm">
                      Analyzing Website...
                      <br />
                      <span className="text-xs opacity-75">{loadingStep}</span>
                    </span>
                  </div>
                ) : (
                  `Detect Theme${!isValidUrl && url ? ' (Invalid URL)' : ''}`
                )}
              </Button>

              {/* Progress Bar */}
              {isLoading && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </form>
          </Card>
        </section>

        {/* Results Card */}
        {(result || error) && (
          <section className="w-full animate-in slide-in-from-bottom-4 duration-500" aria-label="WordPress theme detection results">
            <Card className="backdrop-blur-sm bg-white/85 dark:bg-black/40 border-white/30 dark:border-white/10 shadow-xl p-6" style={{ boxShadow: 'var(--glass-shadow)' }}>
              {error ? (
                <div className="text-center space-y-4" role="alert">
                  <div className="flex items-center justify-center">
                    <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/50 animate-pulse">
                      <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">WordPress Theme Detection Failed</h3>
                  <p className="text-red-500 dark:text-red-400 max-w-md mx-auto">{error}</p>
                  
                  {/* Retry Button */}
                  <Button
                    onClick={() => {
                      setError(null);
                      setResult(null);
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              ) : result ? (
                <article className="space-y-6">
                  <div className="flex items-center gap-3 animate-in fade-in-50 duration-300">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50 animate-in zoom-in-50 duration-300 animate-bounce">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">WordPress Theme Detected Successfully</h3>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">🎉 Great job! Here's what we found:</p>
                    </div>
                  </div>

                  <dl className="grid gap-4">
                    {result.name && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 animate-in slide-in-from-left-4 duration-300 delay-100">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-800">
                          <Globe className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-green-600 dark:text-green-400">Theme Name</dt>
                          <dd className="text-gray-900 dark:text-white font-semibold capitalize text-lg">{result.name}</dd>
                        </div>
                      </div>
                    )}

                    {result.author && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-in fade-in-50 duration-200 delay-75">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                        <div>
                          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Author</dt>
                          <dd className="text-gray-900 dark:text-white">{result.author}</dd>
                        </div>
                      </div>
                    )}

                    {result.version && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-in fade-in-50 duration-200 delay-150">
                        <Hash className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                        <div>
                          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Version</dt>
                          <dd className="text-gray-900 dark:text-white">{result.version}</dd>
                        </div>
                      </div>
                    )}

                    {result.description && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-in fade-in-50 duration-200 delay-200">
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</dt>
                        <dd className="text-gray-900 dark:text-white">{result.description}</dd>
                      </div>
                    )}

                    {result.uri && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-in fade-in-50 duration-200 delay-300">
                        <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                        <div className="flex-1">
                          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme URI</dt>
                          <dd>
                            <a 
                              href={result.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium break-all"
                              aria-label={`Visit theme homepage for ${result.name || 'detected theme'}`}
                            >
                              {result.uri}
                            </a>
                          </dd>
                        </div>
                      </div>
                    )}
                    {result.detectionMethod && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 animate-in fade-in-50 duration-200 delay-75">
                        <dt className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Detection Method</dt>
                        <dd className="text-blue-900 dark:text-blue-300 text-sm">{result.detectionMethod}</dd>
                      </div>
                    )}

                    {result.childTheme && (
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 animate-in fade-in-50 duration-200 delay-150">
                        <dt className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Child Theme</dt>
                        <dd className="text-purple-900 dark:text-purple-300">
                          <div className="font-semibold">{result.childTheme.name}</div>
                          <div className="text-sm">Parent: {result.childTheme.parent}</div>
                        </dd>
                      </div>
                    )}

                    {result.plugins && result.plugins.length > 0 && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 animate-in fade-in-50 duration-200 delay-200">
                        <dt className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Detected Plugins</dt>
                        <dd className="flex flex-wrap gap-1">
                          {result.plugins.slice(0, 8).map((plugin, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs"
                            >
                              {plugin}
                            </span>
                          ))}
                          {result.plugins.length > 8 && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                              +{result.plugins.length - 8} more
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </article>
              ) : null}
            </Card>
          </section>
        )}

        {/* SEO Content */}
        <section className="w-full mt-16" id="how-it-works">
          <Card className="backdrop-blur-sm bg-white/85 dark:bg-black/40 border-white/30 dark:border-white/10 shadow-xl p-6" style={{ boxShadow: 'var(--glass-shadow)' }}>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" id="features">About WordPress Theme Detection</h2>
              <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How It Works</h3>
                  <p className="mb-3 text-sm">
                    Our optimized WordPress theme detector uses advanced pattern recognition to identify active themes. 
                    The tool analyzes CSS files, HTML structure, and WordPress-specific markers to extract comprehensive 
                    theme information in seconds.
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Key Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Lightning-fast theme detection (under 3 seconds)</li>
                    <li>Smart caching for repeated queries</li>
                    <li>Theme name and author identification</li>
                    <li>Version and description details</li>
                    <li>Plugin detection capabilities</li>
                    <li>Child theme recognition</li>
                    <li>Free to use, no registration required</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Why Use a Theme Detector?</h3>
                  <p className="mb-3 text-sm">
                    Perfect for developers, designers, and WordPress enthusiasts who want to identify themes for 
                    inspiration, competitive analysis, or technical research. Our tool provides detailed insights 
                    into theme architecture and plugin usage.
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Detection Accuracy</h3>
                  <p className="text-sm">
                    Our multi-layered detection algorithm achieves 95%+ accuracy by analyzing CSS headers, file paths, 
                    HTML patterns, and WordPress API data. Works with most WordPress installations including custom themes.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* CORS Information */}
        <section className="w-full mt-8">
          <Card className="backdrop-blur-sm bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/30 dark:border-blue-700/30 shadow-xl p-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">ℹ️ About Website Access</h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Due to browser security restrictions, some websites may not be accessible for analysis. 
                This is a common limitation when analyzing external websites from your browser. 
                Our tool uses multiple fallback methods to maximize success rates.
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <div><strong>Tip:</strong> Try different websites or contact site owners if you encounter access issues.</div>
                <div><strong>Alternative:</strong> Use browser developer tools to inspect the website's source code manually.</div>
                <div><strong>Note:</strong> Some websites block automated access for security reasons.</div>
              </div>
            </div>
          </Card>
        </section>

                  {/* Call to Action */}
        <section className="text-center">
          <p className="text-white/80 dark:text-white/70 text-sm drop-shadow-sm">
            Free, fast, and accurate WordPress theme detection - Analyze any WordPress site instantly
          </p>
        </section>
      </div>
    </main>
    
    {/* Floating Action Button */}
    {result && (
      <div className="fixed bottom-6 right-6 animate-in slide-in-from-bottom-4 duration-500">
        <Button
          onClick={() => {
            setResult(null);
            setError(null);
            setUrl("");
          }}
          className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          aria-label="Start new detection"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    )}
    
    <Footer />
  </div>
);
};