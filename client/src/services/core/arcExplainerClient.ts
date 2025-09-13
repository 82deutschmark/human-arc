/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-13
 * PURPOSE: Single HTTP client for arc-explainer API. Replaces duplicate implementations in
 * arcExplainerAPI.ts, arcExplainerService.ts, and officerArcAPI.ts. Pure HTTP operations only.
 * SRP and DRY check: Pass - Single responsibility (HTTP communication), no business logic
 */

import { idConverter } from '@/services/idConverter';
import { apiCache, CacheManager } from './cacheManager';

// Response types from arc-explainer API
export interface ModelPerformance {
  modelName: string;
  accuracy: number;
  avgConfidence?: number;
}

export interface PerformanceData {
  avgAccuracy: number;
  avgConfidence?: number;
  wrongCount?: number;
  totalExplanations?: number;
  negativeFeedback?: number;
  totalFeedback?: number;
  latestAnalysis?: string;
  worstExplanationId?: number;
  compositeScore?: number;
  totalAttempts: number;
  modelPerformance: ModelPerformance[];
  dataset: string;
  dangerousOverconfidence?: boolean;
}

export interface PuzzleWithPerformance {
  id: string;
  puzzleId?: string;
  performanceData?: PerformanceData;
  puzzle?: any; // Raw puzzle data if included
}

export interface PerformanceStatsResponse {
  impossible: number;
  extremely_hard: number;
  very_hard: number;
  challenging: number;
  total: number;
}

export interface ModelInfo {
  name: string;
  provider: string;
  capabilities?: string[];
  active: boolean;
}

/**
 * Pure HTTP client for arc-explainer API
 * No business logic, just API communication
 */
export class ArcExplainerClient {
  private static instance: ArcExplainerClient;
  private readonly baseURL: string;

  private constructor() {
    const envUrl = import.meta.env.VITE_ARC_EXPLAINER_URL;
    this.baseURL = envUrl || 'https://arc-explainer-production.up.railway.app';
    console.log('🌐 ArcExplainerClient initialized with:', this.baseURL);
  }

  public static getInstance(): ArcExplainerClient {
    if (!ArcExplainerClient.instance) {
      ArcExplainerClient.instance = new ArcExplainerClient();
    }
    return ArcExplainerClient.instance;
  }

  /**
   * Generic HTTP request with retry logic and caching
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = CacheManager.createKey('arc-explainer', endpoint, options.body);

    // Check cache first
    if (useCache) {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit for: ${endpoint}`);
        return cached as T;
      }
    }

    console.log(`🌐 API request to: ${url}`);

    try {
      // First attempt
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      // Retry once on server error
      if (!response.ok && response.status >= 500) {
        console.log(`⚠️ Retrying after ${response.status} error...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await fetch(url, { ...options });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Cache successful response
      if (useCache) {
        apiCache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get worst performing puzzles (where AI struggles most)
   */
  async getWorstPerformingPuzzles(params: {
    limit?: number;
    sortBy?: 'composite' | 'accuracy' | 'confidence' | 'feedback';
    minAccuracy?: number;
    maxAccuracy?: number;
    zeroAccuracyOnly?: boolean;
  } = {}): Promise<PuzzleWithPerformance[]> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.minAccuracy !== undefined) queryParams.set('minAccuracy', params.minAccuracy.toString());
    if (params.maxAccuracy !== undefined) queryParams.set('maxAccuracy', params.maxAccuracy.toString());
    if (params.zeroAccuracyOnly) queryParams.set('zeroAccuracyOnly', 'true');

    const endpoint = `/api/puzzle/worst-performing?${queryParams.toString()}`;
    const response = await this.request<any>(endpoint);

    // Handle different response structures from the API
    if (Array.isArray(response)) {
      return response;
    } else if (response.data?.puzzles) {
      return response.data.puzzles;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    console.warn('Unexpected response structure:', response);
    return [];
  }

  /**
   * Get performance stats for a specific puzzle
   */
  async getPuzzlePerformance(puzzleId: string): Promise<PerformanceData | null> {
    try {
      // Convert PlayFab ID to ARC ID if needed
      const arcId = idConverter.normalizeToArcId(puzzleId);
      if (!arcId) {
        console.error(`Invalid puzzle ID: ${puzzleId}`);
        return null;
      }

      const endpoint = `/api/puzzle/task/${arcId}`;
      const response = await this.request<any>(endpoint);

      if (response.success && response.data) {
        return response.data.performanceData || null;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get performance for ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Get performance statistics summary
   */
  async getPerformanceStats(): Promise<PerformanceStatsResponse> {
    const response = await this.request<any>('/api/puzzle/performance-stats');

    if (!response.success || !response.data) {
      throw new Error('Invalid performance stats response');
    }

    return {
      impossible: response.data.impossible || 0,
      extremely_hard: response.data.extremely_hard || response.data.extremelyHard || 0,
      very_hard: response.data.very_hard || response.data.veryHard || 0,
      challenging: response.data.challenging || 0,
      total: response.data.total || 0
    };
  }

  /**
   * Get full puzzle data including content
   */
  async getPuzzleById(puzzleId: string): Promise<any | null> {
    try {
      const arcId = idConverter.normalizeToArcId(puzzleId);
      if (!arcId) return null;

      const endpoint = `/api/puzzle/task/${arcId}`;
      const response = await this.request<any>(endpoint);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get puzzle ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Get batch performance data for multiple puzzles
   */
  async getBatchPerformance(puzzleIds: string[]): Promise<Map<string, PerformanceData>> {
    const performanceMap = new Map<string, PerformanceData>();

    // For now, use worst-performing endpoint and filter
    // In future, could add a batch endpoint to arc-explainer
    const worstPuzzles = await this.getWorstPerformingPuzzles({ limit: 200 });

    puzzleIds.forEach(playFabId => {
      const arcId = idConverter.normalizeToArcId(playFabId);
      if (!arcId) return;

      const found = worstPuzzles.find(p =>
        (p.id === arcId) || (p.puzzleId === arcId)
      );

      if (found && found.performanceData) {
        performanceMap.set(playFabId, found.performanceData);
      }
    });

    return performanceMap;
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    const response = await this.request<any>('/api/models');

    if (!response.success || !response.data) {
      throw new Error('Invalid models response');
    }

    return response.data.models || [];
  }

  /**
   * Get models by provider
   */
  async getModelsByProvider(provider: string): Promise<ModelInfo[]> {
    const response = await this.request<any>(`/api/models/${provider}`);

    if (!response.success || !response.data) {
      throw new Error(`Invalid models response for ${provider}`);
    }

    return response.data.models || [];
  }

  /**
   * Get general statistics
   */
  async getGeneralStats(): Promise<any> {
    const response = await this.request<any>('/api/puzzle/general-stats');

    if (!response.success || !response.data) {
      throw new Error('Invalid general stats response');
    }

    return response.data;
  }

  /**
   * Clear API cache
   */
  clearCache(): void {
    apiCache.clear();
    console.log('🧹 Cleared arc-explainer API cache');
  }
}

// Export singleton instance
export const arcExplainerClient = ArcExplainerClient.getInstance();