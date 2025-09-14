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
  '/': {
    title: 'HARC Platform - Human vs AI Reasoning Research',
    favicon: null,
    description: 'Compare your cognitive abilities against state-of-the-art AI on abstract reasoning tasks'
  },
  '/assessment': {
    title: 'ARC Assessment - Human Cognitive Benchmarking',
    favicon: '/assessment-favicon.svg',
    description: 'Test your pattern recognition abilities with curated ARC puzzles'
  },
  '/puzzles': {
    title: 'HARC Puzzle Library - AI Research Challenges',
    favicon: null,
    description: 'Practice on puzzles that challenge the most advanced AI systems'
  },
  '/dashboard': {
    title: 'HARC Dashboard - Your Cognitive Performance',
    favicon: null,
    description: 'View your performance analysis and comparison with AI models'
  },
  '/space-force': {
    title: 'Mission Control 2050 - Space Force Operations Center',
    favicon: null,
    description: 'Join the Space Force Operations Center where cadets solve ARC-style puzzles to advance through military ranks'
  },
  // Default fallback for HARC routes
  default: {
    title: 'HARC Platform - Human vs AI Reasoning Research',
    favicon: null,
    description: 'Research platform comparing human and artificial intelligence on abstract reasoning tasks'
  }
};

export function useDocumentMeta() {
  const [location] = useLocation();

  useEffect(() => {
    // Match specific route patterns (including subpaths)
    let config: DocumentMetaConfig;
    
    if (location.startsWith('/assessment')) {
      config = ROUTE_CONFIGS['/assessment'];
    } else if (location.startsWith('/puzzles')) {
      config = ROUTE_CONFIGS['/puzzles'];
    } else if (location.startsWith('/dashboard')) {
      config = ROUTE_CONFIGS['/dashboard'];
    } else if (location.startsWith('/space-force')) {
      config = ROUTE_CONFIGS['/space-force'];
    } else {
      config = ROUTE_CONFIGS[location] || ROUTE_CONFIGS.default;
    }

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