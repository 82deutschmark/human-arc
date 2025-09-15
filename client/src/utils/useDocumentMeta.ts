/*
 * Author: Cascade using Claude 3.5 Sonnet (Enhanced from Claude Code using Sonnet 4)
 * Date: 2025-09-14T22:52:58-04:00
 * PURPOSE: React hook for dynamically updating document title, favicon, and social media preview images
 * Allows different pages to have custom branding (title/icon/social images) while maintaining the same codebase
 * Enhanced to support Open Graph and Twitter Card images for rich social media previews
 * SRP and DRY check: Pass - Single responsibility of managing document metadata with social preview support
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface DocumentMetaConfig {
  title: string;
  favicon: string | null;
  description?: string;
  ogImage?: string; // Open Graph image for social sharing
  twitterImage?: string; // Twitter Card image (optional, defaults to ogImage)
  canonicalUrl?: string; // Route-specific canonical URL
}

const ROUTE_CONFIGS: Record<string, DocumentMetaConfig> = {
  '/': {
    title: 'HARC Platform - Human vs AI Reasoning Research',
    favicon: null,
    description: 'Compare your cognitive abilities against state-of-the-art AI on abstract reasoning tasks',
    canonicalUrl: 'https://human-arc.gptpluspro.com'
  },
  '/assessment': {
    title: 'ARC Assessment - Human Cognitive Benchmarking',
    favicon: '/assessment-favicon.svg',
    description: 'Test your pattern recognition abilities with curated ARC puzzles',
    canonicalUrl: 'https://human-arc.gptpluspro.com/assessment'
  },
  '/puzzles': {
    title: 'HARC Puzzle Library - AI Research Challenges',
    favicon: null,
    description: 'Practice on puzzles that challenge the most advanced AI systems',
    canonicalUrl: 'https://human-arc.gptpluspro.com/puzzles'
  },
  '/dashboard': {
    title: 'HARC Dashboard - Your Cognitive Performance',
    favicon: null,
    description: 'View your performance analysis and comparison with AI models',
    canonicalUrl: 'https://human-arc.gptpluspro.com/dashboard'
  },
  '/space-force': {
    title: 'Mission Control 2050 - Space Force Operations Center',
    favicon: null,
    description: 'Join the Space Force Operations Center where cadets solve ARC-style puzzles to advance through military ranks',
    canonicalUrl: 'https://human-arc.gptpluspro.com/space-force'
  },
  // Default fallback for HARC routes
  default: {
    title: 'HARC Platform - Human vs AI Reasoning Research',
    favicon: null,
    description: 'Research platform comparing human and artificial intelligence on abstract reasoning tasks',
    canonicalUrl: 'https://human-arc.gptpluspro.com'
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

    // Update canonical URL if specified
    if (config.canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', config.canonicalUrl);
      }
    }

    // Update favicon if specified
    if (config.favicon) {
      // Remove existing favicon links (but preserve the comprehensive favicon system)
      const existingDynamicFavicons = document.querySelectorAll('link[rel="icon"][data-dynamic="true"]');
      existingDynamicFavicons.forEach(link => link.remove());

      // Add new favicon
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/svg+xml';
      faviconLink.href = config.favicon;
      faviconLink.setAttribute('data-dynamic', 'true');
      document.head.appendChild(faviconLink);
    }

    // Update Open Graph meta tags for social sharing
    const updateMetaTag = (selector: string, content: string) => {
      let metaTag = document.querySelector(selector);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      }
    };

    // Update Open Graph title and description
    updateMetaTag('meta[property="og:title"]', config.title);
    updateMetaTag('meta[name="title"]', config.title);
    
    if (config.description) {
      updateMetaTag('meta[property="og:description"]', config.description);
    }

    // Update Open Graph URL
    if (config.canonicalUrl) {
      updateMetaTag('meta[property="og:url"]', config.canonicalUrl);
    }

    // Update Open Graph image if specified (placeholder for when social preview images are provided)
    if (config.ogImage) {
      updateMetaTag('meta[property="og:image"]', config.ogImage);
      
      // Use ogImage for Twitter Card if no specific Twitter image is provided
      const twitterImage = config.twitterImage || config.ogImage;
      updateMetaTag('meta[property="twitter:image"]', twitterImage);
    }

    // Update Twitter Card meta tags
    updateMetaTag('meta[property="twitter:title"]', config.title);
    updateMetaTag('meta[property="twitter:url"]', config.canonicalUrl || location);
    
    if (config.description) {
      updateMetaTag('meta[property="twitter:description"]', config.description);
    }

  }, [location]);
}