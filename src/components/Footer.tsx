import { Globe, Heart, Github, Twitter, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full bg-white/5 dark:bg-black/20 backdrop-blur-sm border-t border-white/20 dark:border-white/10 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/20 dark:bg-white/10">
                <Globe className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-white">WP Theme Detector</span>
            </div>
            <p className="text-white/70 text-sm mb-4 max-w-md">
              The fastest and most accurate WordPress theme detection tool. Discover which themes power your favorite websites instantly.
            </p>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400" aria-hidden="true" />
              <span>for the WordPress community</span>
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Tools</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Theme Detector
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Plugin Detector
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  WordPress Analysis
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Speed Test
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  API Access
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 dark:border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-white/60 text-sm">
            © 2024 WP Theme Detector. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Follow us on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Follow us on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="mailto:contact@wpthemedetector.com"
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Contact us via email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};