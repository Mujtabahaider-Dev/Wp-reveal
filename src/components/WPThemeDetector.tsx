import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { WPThemeDetectorService, type ThemeInfo } from "@/services/wpThemeDetector";
import { Search, Globe, User, Hash, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

export const WPThemeDetector = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ThemeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDetect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const detection = await WPThemeDetectorService.detectTheme(url.trim());
      
      if (detection.success && detection.data) {
        setResult(detection.data);
        toast({
          title: "Success",
          description: "WordPress theme detected successfully!",
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
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">WP Theme Detector</h1>
          </div>
          <p className="text-white/80 text-lg">
            Discover which WordPress theme any website is using
          </p>
        </div>

        {/* Input Card */}
        <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-xl p-6">
          <form onSubmit={handleDetect} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-gray-700">
                Website URL
              </label>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-400 pr-10"
                  disabled={isLoading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              variant="gradient"
              className="w-full py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Detecting Theme...
                </div>
              ) : (
                "Detect Theme"
              )}
            </Button>
          </form>
        </Card>

        {/* Results Card */}
        {(result || error) && (
          <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-xl p-6">
            {error ? (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center">
                  <div className="p-3 rounded-full bg-red-100">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Detection Failed</h3>
                <p className="text-red-500">{error}</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">WordPress Theme Detected</h3>
                </div>

                <div className="grid gap-4">
                  {result.name && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Theme Name</p>
                        <p className="text-gray-900 font-semibold">{result.name}</p>
                      </div>
                    </div>
                  )}

                  {result.author && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Author</p>
                        <p className="text-gray-900">{result.author}</p>
                      </div>
                    </div>
                  )}

                  {result.version && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <Hash className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Version</p>
                        <p className="text-gray-900">{result.version}</p>
                      </div>
                    </div>
                  )}

                  {result.description && (
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                      <p className="text-gray-900">{result.description}</p>
                    </div>
                  )}

                  {result.uri && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <ExternalLink className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Theme URI</p>
                        <a 
                          href={result.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {result.uri}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/60 text-sm">
            Enter any WordPress website URL to detect its theme
          </p>
        </div>
      </div>
    </div>
  );
};