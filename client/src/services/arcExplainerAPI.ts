/**POSSIBLY DEPRECATED!!!!
 * arc-explainer HTTP API Client
 * 
 * Makes browser HTTP calls to external arc-explainer server
 * Retrieves AI performance and trustworthiness data for puzzle curation
 * 
 * ARCHITECTURE: Static-only SFMC app calls external API via HTTP
 */

import { idConverter } from '@/services/idConverter';

// Simplified interface for just the performance data we need
export interface AIPuzzlePerformance {
  id: string;                    // Puzzle ID 
  puzzleId?: string;            // Alternative puzzle ID field
  wrongCount?: number;
  avgAccuracy: number;          // Main metric we care about
  avgConfidence?: number;
  totalExplanations?: number;
  negativeFeedback?: number;
  totalFeedback?: number;
  latestAnalysis?: string;
  worstExplanationId?: number;
  compositeScore?: number;
  // We don't need the full puzzle data - just performance metrics
}

export interface WorstPerformingPuzzlesResponse {
  success: boolean;
  data: {
    puzzles: AIPuzzlePerformance[];
    total: number;
  };
}

export interface APIFilters {
  limit?: number;
  sortBy?: 'composite' | 'accuracy' | 'confidence' | 'feedback';
  minAccuracy?: number;
  maxAccuracy?: number;
  zeroAccuracyOnly?: boolean;
}

export interface ModelInfo {
  name: string;
  provider: string;
  capabilities?: string[];
  active: boolean;
}

export interface ModelsResponse {
  success: boolean;
  data: {
    models: ModelInfo[];
    providers: string[];
  };
}

/**
 * HTTP API client for arc-explainer endpoints
 * All calls are made from browser to external server
 */
export class ArcExplainerAPI {
  private static instance: ArcExplainerAPI;
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // For Vite, use import.meta.env instead of process.env
    const envUrl = import.meta.env.VITE_ARC_EXPLAINER_URL || process.env.VITE_ARC_EXPLAINER_URL;
    console.log('🔧 VITE_ARC_EXPLAINER_URL env var:', envUrl);
    console.log('🔧 All VITE env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    this.baseURL = envUrl || 'https://arc-explainer-production.up.railway.app';
    console.log('🌐 ArcExplainerAPI baseURL set to:', this.baseURL);
  }

  public static getInstance(): ArcExplainerAPI {
    if (!ArcExplainerAPI.instance) {
      ArcExplainerAPI.instance = new ArcExplainerAPI();
    }
    return ArcExplainerAPI.instance;
  }

  /**
   * Get worst performing puzzles (hardest for AI)
   * Calls GET /api/puzzle/worst-performing endpoint
   */
  public async getWorstPerformingPuzzles(
    filters: APIFilters = {}
  ): Promise<AIPuzzlePerformance[]> {
    
    const queryParams = new URLSearchParams();
    
    if (filters.limit !== undefined) {
      queryParams.set('limit', filters.limit.toString());
    }
    if (filters.sortBy) {
      queryParams.set('sortBy', filters.sortBy);
    }
    if (filters.minAccuracy !== undefined) {
      queryParams.set('minAccuracy', (filters.minAccuracy / 100).toString());
    }
    if (filters.maxAccuracy !== undefined) {
      queryParams.set('maxAccuracy', (filters.maxAccuracy / 100).toString());
    }
    if (filters.zeroAccuracyOnly) {
      queryParams.set('zeroAccuracyOnly', 'true');
    }

    const url = `/api/puzzle/worst-performing?${queryParams.toString()}`;
    const cacheKey = url;

    // Check cache first
    if (this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    try {
      const response = await this.makeRequest(url);
      const data = await response.json();

      console.log('🔍 Raw API response:', data);
      console.log('🔍 Response structure:', {
        hasSuccess: 'success' in data,
        hasData: 'data' in data,
        dataType: typeof data.data,
        isArray: Array.isArray(data),
        keys: Object.keys(data)
      });

      // Handle different possible response structures
      let rawPuzzles: any[] = [];

      if (Array.isArray(data)) {
        // Response is directly an array of puzzles
        rawPuzzles = data;
        console.log('📋 Direct array response:', rawPuzzles.length, 'puzzles');
      } else if (data.success && data.data?.puzzles) {
        // Wrapped response with success flag
        rawPuzzles = data.data.puzzles;
        console.log('📋 Wrapped response:', rawPuzzles.length, 'puzzles');
      } else if (data.data && Array.isArray(data.data)) {
        // Response has data property that is an array
        rawPuzzles = data.data;
        console.log('📋 Data array response:', rawPuzzles.length, 'puzzles');
      } else {
        console.warn('🚫 Unexpected response structure:', data);
        return [];
      }

      // Extract only the performance metrics we need from performanceData, not full puzzle data
      const puzzles: AIPuzzlePerformance[] = rawPuzzles.map(p => {
        const perf = p.performanceData || {};
        return {
          id: p.id || p.puzzleId || '',
          puzzleId: p.puzzleId || p.id,
          avgAccuracy: perf.avgAccuracy || 0,
          wrongCount: perf.wrongCount,
          avgConfidence: perf.avgConfidence,
          totalExplanations: perf.totalExplanations,
          negativeFeedback: perf.negativeFeedback,
          totalFeedback: perf.totalFeedback,
          latestAnalysis: perf.latestAnalysis,
          worstExplanationId: perf.worstExplanationId,
          compositeScore: perf.compositeScore || 0
          // Deliberately omitting train/test data - we don't need full puzzle content
        };
      }).filter(p => p.id); // Remove any entries without valid IDs

      if (puzzles.length > 0) {
        this.setCache(cacheKey, puzzles);
        console.log('✅ Successfully loaded', puzzles.length, 'worst performing puzzles');
        return puzzles;
      } else {
        console.warn('⚠️  No puzzles in API response');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch worst performing puzzles:', error);
      throw error;
    }
  }

  /**
   * Get performance data for a specific puzzle
   * Handles PlayFab puzzle ID format conversion (ARC-TR-007bbfb7 → 007bbfb7)
   */
  public async getPuzzlePerformance(puzzleId: string): Promise<AIPuzzlePerformance | null> {
    try {
      // Convert PlayFab puzzle ID format to ARC Explainer format
      const cleanPuzzleId = this.convertPlayFabIdToArcId(puzzleId);
      
      // First try to get from worst performing list (cached) - no artificial limits
      const worstPuzzles = await this.getWorstPerformingPuzzles({});
      const found = worstPuzzles.find(p => (p.id || p.puzzleId) === cleanPuzzleId);
      
      if (found) {
        return found;
      }

      // If not found, could implement specific puzzle endpoint here
      // For now, return null as we focus on worst performing puzzles
      return null;
      
    } catch (error) {
      console.error(`Failed to get performance data for puzzle ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Convert PlayFab puzzle ID format to ARC Explainer format
   * ARC-TR-007bbfb7 → 007bbfb7
   * ARC-EV-1ae2feb7 → 1ae2feb7
   * ARC-TR2-123abc45 → 123abc45
   * ARC-EV2-def67890 → def67890
   */
  public convertPlayFabIdToArcId(playFabId: string): string {
    if (!playFabId || typeof playFabId !== 'string') {
      console.warn('convertPlayFabIdToArcId: Invalid input:', playFabId);
      return playFabId || '';
    }
    
    // Use centralized ID converter
    const converted = idConverter.playFabToArc(playFabId);
    
    // Validation: ensure we got a reasonable result
    if (converted === playFabId) {
      console.debug('convertPlayFabIdToArcId: No prefix found, using ID as-is:', playFabId);
    }
    
    return converted;
  }

  /**
   * Convert ARC Explainer ID format to PlayFab format
   * 007bbfb7 → ARC-TR-007bbfb7 (assumes training dataset by default)
   * Note: Cannot definitively determine dataset without additional context
   */
  public convertArcIdToPlayFabId(arcId: string, dataset: 'training' | 'evaluation' | 'training2' | 'evaluation2'): string {
    if (!arcId || typeof arcId !== 'string') {
      console.warn('convertArcIdToPlayFabId: Invalid input:', arcId);
      return arcId || '';
    }

    // If already has ARC prefix, return as-is
    if (arcId.startsWith('ARC-')) {
      return arcId;
    }

    // Use centralized ID converter
    return idConverter.arcToPlayFab(arcId, dataset);
  }

  /**
   * Validate puzzle ID format (both PlayFab and ARC formats)
   */
  public validatePuzzleId(puzzleId: string): { valid: boolean, format: 'playfab' | 'arc' | 'unknown', dataset?: string } {
    if (!puzzleId || typeof puzzleId !== 'string') {
      return { valid: false, format: 'unknown' };
    }

    // Check PlayFab format: ARC-XX-xxxxxxxx (matches upload script format)
    const playfabMatch = puzzleId.match(/^ARC-(TR|EV|T2|E2)-([a-f0-9]{8})$/);
    if (playfabMatch) {
      const datasetMap = {
        'TR': 'training',
        'EV': 'evaluation', 
        'T2': 'training2',    // Fixed: matches upload script
        'E2': 'evaluation2'   // Fixed: matches upload script
      };
      return { 
        valid: true, 
        format: 'playfab', 
        dataset: datasetMap[playfabMatch[1] as keyof typeof datasetMap] 
      };
    }

    // Check ARC format: xxxxxxxx (8 hex characters)
    if (puzzleId.match(/^[a-f0-9]{8}$/)) {
      return { valid: true, format: 'arc' };
    }

    return { valid: false, format: 'unknown' };
  }

  /**
   * Get performance data for multiple puzzles (batch operation)
   */
  public async getBatchPuzzlePerformance(puzzleIds: string[]): Promise<Map<string, AIPuzzlePerformance>> {
    try {
      const performanceMap = new Map<string, AIPuzzlePerformance>();
      
      // Get all worst performing puzzles - no artificial limits for better coverage
      const worstPuzzles = await this.getWorstPerformingPuzzles({});
      
      // Create lookup map for faster searching - handle both id and puzzleId fields
      const arcPerformanceMap = new Map<string, AIPuzzlePerformance>();
      worstPuzzles.forEach(p => {
        const puzzleId = p.id || p.puzzleId || '';
        if (puzzleId) {
          arcPerformanceMap.set(puzzleId, p);
        }
      });
      
      // Match PlayFab IDs to ARC performance data
      puzzleIds.forEach(playFabId => {
        const arcId = this.convertPlayFabIdToArcId(playFabId);
        const performance = arcPerformanceMap.get(arcId);
        if (performance) {
          performanceMap.set(playFabId, performance);
        }
      });
      
      console.log(`Found AI performance data for ${performanceMap.size}/${puzzleIds.length} puzzles`);
      return performanceMap;
      
    } catch (error) {
      console.error('Failed to get batch puzzle performance:', error);
      return new Map();
    }
  }

  /**
   * Get direct performance statistics from arc-explainer API
   * This is the primary method for difficulty card data - no PlayFab dependency
   */
  public async getPerformanceStats(): Promise<{ impossible: number, extremely_hard: number, very_hard: number, challenging: number, total: number }> {
    console.log('🔄 Fetching performance stats from arc-explainer API...');
    
    const response = await this.makeRequest('/api/puzzle/performance-stats');
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('Performance stats endpoint returned invalid data');
    }
    
    // Extract bucket counts from performance stats response
    const stats = data.data;
    const result = {
      impossible: stats.impossible || 0,
      extremely_hard: stats.extremely_hard || stats.extremelyHard || 0,
      very_hard: stats.very_hard || stats.veryHard || 0,
      challenging: stats.challenging || 0,
      total: stats.total || 0
    };
    
    console.log('✅ Got performance stats:', result);
    return result;
  }

  /**
   * Get filtered puzzles from arc-explainer API for Officer Track
   * This replaces complex PlayFab merging - arc-explainer is the source of truth
   */
  public async getFilteredPuzzles(filters: {
    difficulty?: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging';
    zeroAccuracyOnly?: boolean;
    limit?: number;
  }): Promise<AIPuzzlePerformance[]> {
    try {
      console.log('🔄 Getting filtered puzzles from arc-explainer...', filters);
      
      const apiFilters: APIFilters = {
        limit: filters.limit || 50, // Use server max
        sortBy: 'composite'
      };
      
      // Apply difficulty filter as accuracy range
      if (filters.difficulty === 'impossible' || filters.zeroAccuracyOnly) {
        apiFilters.zeroAccuracyOnly = true;
      } else if (filters.difficulty === 'extremely_hard') {
        apiFilters.minAccuracy = 0.01; // Exclude 0%
        apiFilters.maxAccuracy = 0.25;
      } else if (filters.difficulty === 'very_hard') {
        apiFilters.minAccuracy = 0.25;
        apiFilters.maxAccuracy = 0.50;
      } else if (filters.difficulty === 'challenging') {
        apiFilters.minAccuracy = 0.50;
        apiFilters.maxAccuracy = 0.75;
      }
      
      const puzzles = await this.getWorstPerformingPuzzles(apiFilters);
      console.log(`✅ Found ${puzzles.length} puzzles matching ${filters.difficulty || 'all'} difficulty`);
      
      return puzzles;
      
    } catch (error) {
      console.error('❌ Failed to get filtered puzzles:', error);
      throw error;
    }
  }

  /**
   * Get specific puzzle by ID using direct API endpoint
   */
  public async getPuzzleById(puzzleId: string): Promise<any> {
    try {
      const cleanId = this.convertPlayFabIdToArcId(puzzleId);
      const response = await this.makeRequest(`/api/puzzle/task/${cleanId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Failed to get puzzle ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Make HTTP request to arc-explainer server
   * Windows certificate handling: Uses relaxed security for Railway.app certificates
   */
  private async makeRequest(endpoint: string): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 Making API request to: ${url}`);
    
    try {
      // Retry logic for Windows certificate issues
      const makeRequest = async (): Promise<Response> => {
        return fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // For Railway.app certificate issues on Windows
          cache: 'no-cache',
          // Add credentials if your arc-explainer server requires auth
          // credentials: 'include',
        });
      };

      // First attempt
      let response = await makeRequest();
      
      // Retry once if network error (common with Windows certificate issues)
      if (!response.ok && (response.status >= 500 || response.status === 0)) {
        console.log(`⚠️ First attempt failed (${response.status}), retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await makeRequest();
      }

      console.log(`📡 API response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ API Error ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error(`🚫 Network error calling ${url}:`, error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  private isCached(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private getFromCache<T>(key: string): T {
    return this.cache.get(key)!.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get available AI models from arc-explainer
   * Returns current models being tracked - no hardcoded model names
   */
  public async getAvailableModels(): Promise<ModelInfo[]> {
    console.log('🔄 Fetching available models from arc-explainer API...');
    
    const response = await this.makeRequest('/api/models');
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('Models endpoint returned invalid data');
    }
    
    const models: ModelInfo[] = data.data.models || [];
    console.log(`✅ Found ${models.length} available models:`, models.map(m => `${m.provider}/${m.name}`));
    
    return models;
  }

  /**
   * Get models by provider (e.g., all OpenAI models, all Anthropic models)
   */
  public async getModelsByProvider(provider: string): Promise<ModelInfo[]> {
    console.log(`🔄 Fetching ${provider} models from arc-explainer API...`);
    
    const response = await this.makeRequest(`/api/models/${provider}`);
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(`Models endpoint for ${provider} returned invalid data`);
    }
    
    const models: ModelInfo[] = data.data.models || [];
    console.log(`✅ Found ${models.length} ${provider} models:`, models.map(m => m.name));
    
    return models;
  }

  /**
   * Get model-specific performance breakdown
   * Uses dynamic model names from the API, not hardcoded assumptions
   */
  public async getModelPerformanceBreakdown(): Promise<Record<string, { solved: number, total: number, accuracy: number }>> {
    console.log('🔄 Fetching model performance breakdown...');
    
    const response = await this.makeRequest('/api/puzzle/general-stats');
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('General stats endpoint returned invalid data');
    }
    
    // Extract model performance data - structure may vary based on actual API response
    const modelStats = data.data.modelStats || data.data.models || {};
    
    console.log('✅ Got model performance breakdown:', Object.keys(modelStats));
    return modelStats;
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const arcExplainerAPI = ArcExplainerAPI.getInstance();