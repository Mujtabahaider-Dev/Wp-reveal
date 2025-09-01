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
import { Search, Globe, User, Hash, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

export const WPThemeDetector = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

    const startTime = performance.now();

    try {
      const detection = await WPThemeDetectorService.detectTheme(url.trim());
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
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [url, isValidUrl, toast]);

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 relative">
      
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20">
                <Globe className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">Detect Any WordPress Theme</h1>
            </div>
            <p className="text-white/90 text-lg md:text-xl drop-shadow-md max-w-2xl mx-auto">
              Instantly discover which WordPress theme any website is using. Get detailed theme information including name, author, version, and more.
            </p>
          </section>

        {/* Input Card */}
        <section className="w-full">
          <Card className="backdrop-blur-sm bg-white/85 dark:bg-black/40 border-white/30 dark:border-white/10 shadow-xl p-6" style={{ boxShadow: 'var(--glass-shadow)' }}>
            <form onSubmit={handleDetect} className="space-y-4" role="search" aria-label="WordPress theme detection">
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Website URL for WordPress Theme Detection
                </label>
                <div className="relative">
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder="https://example.com"
                    className={cn(
                      "w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-400 pr-10 bg-white/80 dark:bg-white/10 dark:text-white transition-colors",
                      isValidUrl ? "border-green-300 dark:border-green-600" : "border-gray-200 dark:border-gray-600"
                    )}
                    disabled={isLoading}
                    aria-describedby="url-help"
                    required
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
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
                    Analyzing Website...
                  </div>
                ) : (
                  `Detect Theme${!isValidUrl && url ? ' (Invalid URL)' : ''}`
                )}
              </Button>
            </form>
          </Card>
        </section>

        {/* Results Card */}
        {(result || error) && (
          <section className="w-full animate-in slide-in-from-bottom-4 duration-300" aria-label="WordPress theme detection results">
            <Card className="backdrop-blur-sm bg-white/85 dark:bg-black/40 border-white/30 dark:border-white/10 shadow-xl p-6" style={{ boxShadow: 'var(--glass-shadow)' }}>
              {error ? (
                <div className="text-center space-y-3" role="alert">
                  <div className="flex items-center justify-center">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                      <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">WordPress Theme Detection Failed</h3>
                  <p className="text-red-500 dark:text-red-400">{error}</p>
                </div>
              ) : result ? (
                <article className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">WordPress Theme Detected Successfully</h3>
                  </div>

                  <dl className="grid gap-4">
                    {result.name && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-in fade-in-50 duration-200">
                        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                        <div>
                          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme Name</dt>
                          <dd className="text-gray-900 dark:text-white font-semibold capitalize">{result.name}</dd>
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

          {/* Call to Action */}
          <section className="text-center">
            <p className="text-white/80 dark:text-white/70 text-sm drop-shadow-sm">
              Free, fast, and accurate WordPress theme detection - Analyze any WordPress site instantly
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};