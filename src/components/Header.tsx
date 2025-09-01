import { Globe, Github, Twitter } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  return (
    <header className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border-b border-white/20 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm">
            <Globe className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-white">WP Theme Detector</h1>
            <p className="text-white/70 text-sm">Free WordPress Theme Analysis Tool</p>
          </div>
        </div>

        {/* Navigation and Actions */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-white/80 hover:text-white transition-colors text-sm"
              aria-label="Learn how WordPress theme detection works"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-white/80 hover:text-white transition-colors text-sm"
              aria-label="View features of the theme detector"
            >
              Features
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};