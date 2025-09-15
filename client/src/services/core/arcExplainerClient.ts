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
  totalAttempts: number;
  modelPerformance: ModelPerformance[];
  dataset: string;
  dangerousOverconfidence?: boolean;
}

// NEW: Types for the proper explanations endpoint
export interface ExplanationRecord {
  id: number;
  puzzleId: string;
  patternDescription: string;
  solvingStrategy: string;
  hints: string;
  confidence: number;
  modelName: string;
  predictedOutputGrid: any[][];
  isPredictionCorrect: boolean;
  predictionAccuracyScore: number;
  hasMultiplePredictions: boolean;
  multiplePredictedOutputs?: any[];
  multiTestResults?: any[];
  multiTestAllCorrect?: boolean;
  multiTestAverageAccuracy?: number;
  createdAt: string;
  helpfulVotes: number;
  notHelpfulVotes: number;
}

// Aggregated stats from explanations
export interface AggregatedAIStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageConfidence: number;
  modelBreakdown: ModelStats[];
  hasData: boolean;
}

export interface ModelStats {
  modelName: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avgConfidence: number;
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

// Types for user solution submission
export interface UserSolution {
  id: string;
  puzzleId: string;
  strategy: string;
  userId?: string;
  metadata?: {
    userAgent?: string;
    timestamp?: string;
    sessionId?: string;
  };
  votes?: {
    helpful: number;
    notHelpful: number;
  };
  createdAt: string;
}

export interface SolutionSubmissionRequest {
  strategy: string;
  metadata?: {
    userAgent?: string;
    sessionId?: string;
    assessmentMode?: boolean;
  };
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
        console.error(`❌ Invalid puzzle ID for performance lookup: ${puzzleId}`);
        return null;
      }

      console.log(`🌐 Making API request for puzzle: ${arcId}`);
      const endpoint = `/api/puzzle/task/${arcId}`;
      const response = await this.request<any>(endpoint);

      console.log(`📡 API Response for ${arcId}:`, {
        success: response?.success,
        hasData: !!response?.data,
        hasPerformanceData: !!(response?.data?.performanceData),
        dataKeys: response?.data ? Object.keys(response.data) : [],
        avgAccuracy: response?.data?.avgAccuracy
      });

      // The API returns the performance data nested inside a `data` object.
      // The structure is { success: true, data: { puzzle: {...}, performanceData: {...} } }
      if (response.success && response.data && response.data.performanceData) {
        console.log(`✅ Found performance data in nested structure for ${arcId}`);
        return response.data.performanceData;
      }

      // It's also possible the performance data is at the root of the data object
      if (response.success && response.data?.avgAccuracy !== undefined) {
        console.log(`✅ Found performance data at root level for ${arcId}`);
        return response.data;
      }

      console.warn(`⚠️ No performance data found for ${arcId}`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to get performance for ${puzzleId}:`, error);
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
    console.log(`🔍 getBatchPerformance called with IDs:`, puzzleIds);
    const performanceMap = new Map<string, PerformanceData>();

    // Create an array of promises to fetch performance for each puzzle
    const performancePromises = puzzleIds.map(async (puzzleId) => {
      console.log(`🔄 Processing puzzle ID: ${puzzleId}`);

      // First, check if this is already an ARC ID
      const arcId = idConverter.normalizeToArcId(puzzleId);
      console.log(`🔗 ID conversion: ${puzzleId} -> ${arcId}`);

      if (!arcId) {
        console.error(`❌ Failed to convert ID: ${puzzleId}`);
        return { id: puzzleId, arcId: null, performance: null };
      }

      console.log(`📡 Fetching performance for ARC ID: ${arcId}`);
      const performance = await this.getPuzzlePerformance(arcId);
      console.log(`📊 Performance result for ${arcId}:`, performance ? 'SUCCESS' : 'FAILED');

      return { id: puzzleId, arcId, performance };
    });

    // Wait for all promises to resolve
    const results = await Promise.all(performancePromises);

    // Populate the map with the results
    for (const result of results) {
      if (result.arcId && result.performance) {
        performanceMap.set(result.arcId, result.performance);
        console.log(`✅ Added to map: ${result.arcId}`);
      } else {
        console.warn(`⚠️ Skipped (no performance data): ${result.id} -> ${result.arcId}`);
      }
    }

    console.log(`🤖 Final result: ${performanceMap.size}/${puzzleIds.length} puzzles with performance data`);
    console.log(`📋 Map contents:`, Array.from(performanceMap.keys()));
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
   * Get performance metrics for all puzzles (NEW ENDPOINT)
   */
  async getAllPuzzlesStats(): Promise<any> {
    console.log('🌐 Calling NEW endpoint: /api/puzzles/stats');
    const response = await this.request<any>('/api/puzzles/stats');
    console.log('📊 /api/puzzles/stats response structure:', {
      success: response?.success,
      hasData: !!response?.data,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      sampleData: response?.data ? JSON.stringify(response.data).substring(0, 200) + '...' : null
    });
    return response;
  }

  /**
   * Get accuracy stats from feedback controller (NEW ENDPOINT)
   * This endpoint returns rich performance data including model rankings
   */
  async getFeedbackAccuracyStats(): Promise<any> {
    console.log('🌐 Calling NEW endpoint: /api/feedback/accuracy-stats');
    const response = await this.request<any>('/api/feedback/accuracy-stats');
    console.log('📊 /api/feedback/accuracy-stats response structure:', {
      success: response?.success,
      hasData: !!response?.data,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      sampleData: response?.data ? JSON.stringify(response.data).substring(0, 200) + '...' : null
    });
    return response;
  }

  /**
   * Get accuracy stats for a specific puzzle using feedback controller
   * Returns: { totalSolverAttempts, totalCorrectPredictions, overallAccuracyPercentage, modelAccuracyRankings[] }
   */
  async getPuzzleAccuracyStats(puzzleId: string): Promise<any> {
    const arcId = idConverter.normalizeToArcId(puzzleId);
    if (!arcId) {
      console.error(`❌ Invalid puzzle ID for accuracy stats: ${puzzleId}`);
      return null;
    }

    console.log(`🎯 Getting accuracy stats for puzzle: ${arcId}`);
    const endpoint = `/api/feedback/accuracy-stats?puzzleId=${arcId}`;
    const response = await this.request<any>(endpoint);

    if (response?.success && response?.data) {
      console.log(`✅ Accuracy stats for ${arcId}:`, {
        overallAccuracy: response.data.overallAccuracyPercentage,
        totalAttempts: response.data.totalSolverAttempts,
        modelCount: response.data.modelAccuracyRankings?.length
      });
      return response.data;
    }

    console.warn(`⚠️ No accuracy stats found for ${arcId}`);
    return null;
  }

  /**
   * Get accuracy stats for multiple puzzles in batch
   * More efficient than individual calls
   */
  async getBatchAccuracyStats(puzzleIds: string[]): Promise<Map<string, any>> {
    console.log(`🔍 Getting batch accuracy stats for ${puzzleIds.length} puzzles`);
    const statsMap = new Map<string, any>();

    const promises = puzzleIds.map(async (puzzleId) => {
      const arcId = idConverter.normalizeToArcId(puzzleId);
      if (!arcId) return { puzzleId, arcId: null, stats: null };

      const stats = await this.getPuzzleAccuracyStats(arcId);
      return { puzzleId, arcId, stats };
    });

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result.arcId && result.stats) {
        // Store using the original ARC ID for consistent lookup
        statsMap.set(result.arcId, result.stats);
      }
    }

    console.log(`📊 Batch accuracy stats complete: ${statsMap.size}/${puzzleIds.length} puzzles`);
    return statsMap;
  }

  /**
   * Get AI explanations for a specific puzzle (PROPER ENDPOINT)
   * Returns array of explanation records with performance data
   */
  async getPuzzleExplanations(puzzleId: string): Promise<ExplanationRecord[]> {
    const arcId = idConverter.normalizeToArcId(puzzleId);
    if (!arcId) {
      console.error(`❌ Invalid puzzle ID for explanations: ${puzzleId}`);
      return [];
    }

    console.log(`🤖 Getting AI explanations for puzzle: ${arcId}`);
    const endpoint = `/api/puzzle/${arcId}/explanations`;

    try {
      const response = await this.request<any>(endpoint);

      if (response?.success && Array.isArray(response?.data)) {
        console.log(`✅ Found ${response.data.length} explanations for ${arcId}`);
        return response.data;
      }

      console.warn(`⚠️ No explanations found for ${arcId}`);
      return [];
    } catch (error) {
      console.error(`❌ Failed to get explanations for ${arcId}:`, error);
      return [];
    }
  }

  /**
   * Aggregate AI performance stats from explanations array
   */
  aggregateAIStats(explanations: ExplanationRecord[]): AggregatedAIStats {
    if (explanations.length === 0) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageConfidence: 0,
        modelBreakdown: [],
        hasData: false
      };
    }

    const totalAttempts = explanations.length;
    const correctAttempts = explanations.filter(exp => exp.isPredictionCorrect).length;
    const accuracy = (correctAttempts / totalAttempts) * 100;

    // Calculate average confidence
    const validConfidences = explanations
      .map(exp => exp.confidence)
      .filter(conf => typeof conf === 'number' && !isNaN(conf));
    const averageConfidence = validConfidences.length > 0
      ? validConfidences.reduce((sum, conf) => sum + conf, 0) / validConfidences.length
      : 0;

    // Calculate per-model breakdown
    const modelMap = new Map<string, { attempts: number; correct: number; confidences: number[] }>();

    for (const exp of explanations) {
      if (!modelMap.has(exp.modelName)) {
        modelMap.set(exp.modelName, { attempts: 0, correct: 0, confidences: [] });
      }

      const modelData = modelMap.get(exp.modelName)!;
      modelData.attempts++;
      if (exp.isPredictionCorrect) modelData.correct++;
      if (typeof exp.confidence === 'number' && !isNaN(exp.confidence)) {
        modelData.confidences.push(exp.confidence);
      }
    }

    const modelBreakdown: ModelStats[] = Array.from(modelMap.entries()).map(([modelName, data]) => ({
      modelName,
      attempts: data.attempts,
      correct: data.correct,
      accuracy: (data.correct / data.attempts) * 100,
      avgConfidence: data.confidences.length > 0
        ? data.confidences.reduce((sum, conf) => sum + conf, 0) / data.confidences.length
        : 0
    }));

    // Sort by accuracy descending
    modelBreakdown.sort((a, b) => b.accuracy - a.accuracy);

    return {
      totalAttempts,
      correctAttempts,
      accuracy,
      averageConfidence,
      modelBreakdown,
      hasData: true
    };
  }

  /**
   * Get aggregated AI performance stats for multiple puzzles using explanations
   * This is the CORRECT method to use instead of getBatchAccuracyStats
   */
  async getBatchExplanationsStats(puzzleIds: string[]): Promise<Map<string, AggregatedAIStats>> {
    console.log(`🔍 Getting batch explanations for ${puzzleIds.length} puzzles`);
    const statsMap = new Map<string, AggregatedAIStats>();

    const promises = puzzleIds.map(async (puzzleId) => {
      const arcId = idConverter.normalizeToArcId(puzzleId);
      if (!arcId) return { puzzleId, arcId: null, stats: null };

      const explanations = await this.getPuzzleExplanations(arcId);
      const stats = this.aggregateAIStats(explanations);

      return { puzzleId, arcId, stats };
    });

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result.arcId && result.stats) {
        statsMap.set(result.arcId, result.stats);
      }
    }

    const puzzlesWithData = Array.from(statsMap.values()).filter(stats => stats.hasData).length;
    console.log(`📊 Batch explanations complete: ${puzzlesWithData}/${puzzleIds.length} puzzles have AI data`);

    return statsMap;
  }

  /**
   * Get model reliability statistics (NEW ENDPOINT)
   */
  async getModelReliabilityStats(): Promise<any> {
    console.log('🌐 Calling NEW endpoint: /api/metrics/reliability');
    const response = await this.request<any>('/api/metrics/reliability');
    console.log('📊 /api/metrics/reliability response structure:', {
      success: response?.success,
      hasData: !!response?.data,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      sampleData: response?.data ? JSON.stringify(response.data).substring(0, 200) + '...' : null
    });
    return response;
  }

  /**
   * Get comprehensive dashboard data (NEW ENDPOINT)
   */
  async getComprehensiveDashboard(): Promise<any> {
    console.log('🌐 Calling NEW endpoint: /api/metrics/comprehensive-dashboard');
    const response = await this.request<any>('/api/metrics/comprehensive-dashboard');
    console.log('📊 /api/metrics/comprehensive-dashboard response structure:', {
      success: response?.success,
      hasData: !!response?.data,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      sampleData: response?.data ? JSON.stringify(response.data).substring(0, 500) + '...' : null
    });
    return response;
  }

  /**
   * Submit user solution/strategy for a puzzle
   */
  async submitUserSolution(
    puzzleId: string,
    solutionData: SolutionSubmissionRequest
  ): Promise<UserSolution | null> {
    try {
      const arcId = idConverter.normalizeToArcId(puzzleId);
      if (!arcId) {
        console.error(`❌ Invalid puzzle ID for solution submission: ${puzzleId}`);
        return null;
      }

      console.log(`💭 Submitting user solution for puzzle: ${arcId}`);
      const endpoint = `/api/puzzles/${arcId}/solutions`;

      const response = await this.request<any>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          explanation: solutionData.strategy, // API expects 'explanation' field
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            ...solutionData.metadata
          }
        })
      }, false); // Don't cache POST requests

      if (response?.success && response?.data) {
        console.log(`✅ Successfully submitted solution for ${arcId}`);
        return response.data;
      }

      console.warn(`⚠️ Failed to submit solution for ${arcId}: Invalid response`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to submit solution for ${puzzleId}:`, error);
      throw error;
    }
  }

  /**
   * Get user solutions for a puzzle
   */
  async getUserSolutions(puzzleId: string): Promise<UserSolution[]> {
    try {
      const arcId = idConverter.normalizeToArcId(puzzleId);
      if (!arcId) {
        console.error(`❌ Invalid puzzle ID for solutions retrieval: ${puzzleId}`);
        return [];
      }

      console.log(`📖 Getting user solutions for puzzle: ${arcId}`);
      const endpoint = `/api/puzzles/${arcId}/solutions`;
      const response = await this.request<any>(endpoint);

      if (response?.success && Array.isArray(response?.data)) {
        console.log(`✅ Found ${response.data.length} user solutions for ${arcId}`);
        return response.data;
      }

      console.warn(`⚠️ No user solutions found for ${arcId}`);
      return [];
    } catch (error) {
      console.error(`❌ Failed to get solutions for ${puzzleId}:`, error);
      return [];
    }
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