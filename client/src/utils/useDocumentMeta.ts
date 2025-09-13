/*
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-13
 * PURPOSE: React hook for dynamically updating document title and favicon based on current route
 * Allows different pages to have custom branding (title/icon) while maintaining the same codebase
 * SRP and DRY check: Pass - Single responsibility of managing document metadata
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface DocumentMetaConfig {
  title: string;
  favicon: string | null;
  description?: string;
}

const ROUTE_CONFIGS: Record<string, DocumentMetaConfig> = {
  '/assessment': {
    title: 'ARC Assessment - Human Cognitive Benchmarking',
    favicon: '/assessment-favicon.svg',
    description: 'Test your pattern recognition abilities with curated ARC puzzles'
  },
  // Default fallback for all other routes
  default: {
    title: 'Mission Control 2050 - Space Force Operations Center',
    favicon: null, // Will use default (none currently set)
    description: 'Join the Space Force Operations Center where cadets solve ARC-style puzzles to advance through military ranks'
  }
};

export function useDocumentMeta() {
  const [location] = useLocation();

  useEffect(() => {
    // Match paths that start with /assessment (including subpaths)
    const config = location.startsWith('/assessment') 
      ? ROUTE_CONFIGS['/assessment'] 
      : ROUTE_CONFIGS[location] || ROUTE_CONFIGS.default;

    // Update title
    document.title = config.title;

    // Update description meta tag
    if (config.description) {
      let descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) {
        descriptionMeta.setAttribute('content', config.description);
      }
    }

    // Update favicon if specified
    if (config.favicon) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());

      // Add new favicon
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/svg+xml';
      faviconLink.href = config.favicon;
      document.head.appendChild(faviconLink);
    }

    // Update Open Graph title for social sharing
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', config.title);
    }

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription && config.description) {
      ogDescription.setAttribute('content', config.description);
    }

  }, [location]);
}