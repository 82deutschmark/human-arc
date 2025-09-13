/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-13
 * PURPOSE: Unified puzzle data repository. Single entry point for all puzzle operations,
 * replacing scattered functionality in arcDataService, puzzlePerformanceService, and officerArcAPI.
 * SRP and DRY check: Pass - Single responsibility (puzzle data orchestration), eliminates duplication
 */

import { arcExplainerClient, type PerformanceData } from './arcExplainerClient';
import { playfabPuzzleClient } from './playfabPuzzleClient';
import { idConverter, type ARCDatasetType } from '@/services/idConverter';
import { metadataCache, CacheManager } from './cacheManager';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

// Unified puzzle data model with optional performance metadata
export interface EnhancedPuzzle extends OfficerTrackPuzzle {
  // AI Performance data (optional)
  aiPerformance?: PerformanceData;
  difficultyCategory?: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging';
  hasPerformanceData: boolean;

  // Additional metadata
  trustworthiness?: number;
  overconfidenceRisk?: boolean;
}

export interface SearchCriteria {
  datasets?: ARCDatasetType[];
  difficulty?: ('impossible' | 'extremely_hard' | 'very_hard' | 'challenging')[];
  hasPerformanceData?: boolean;
  zeroAccuracyOnly?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'id' | 'difficulty' | 'accuracy' | 'complexity';
  sortDirection?: 'asc' | 'desc';
}

export interface SearchResult {
  puzzles: EnhancedPuzzle[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

/**
 * Unified puzzle repository
 * Orchestrates between PlayFab (authoritative data) and arc-explainer (metadata)
 */
export class PuzzleRepository {
  private static instance: PuzzleRepository;

  private constructor() {
    console.log('🏛️ PuzzleRepository initialized');
  }

  public static getInstance(): PuzzleRepository {
    if (!PuzzleRepository.instance) {
      PuzzleRepository.instance = new PuzzleRepository();
    }
    return PuzzleRepository.instance;
  }

  /**
   * Find a single puzzle by ID with optional performance enhancement
   * @param puzzleId - Puzzle identifier
   * @param includePerformance - Whether to fetch AI performance data
   * @param preferArcExplainer - If true, tries arc-explainer first, PlayFab as fallback (for assessment)
   */
  async findById(
    puzzleId: string,
    includePerformance: boolean = true,
    preferArcExplainer: boolean = false
  ): Promise<EnhancedPuzzle | null> {
    const cacheKey = CacheManager.createKey('enhanced-puzzle', puzzleId, includePerformance, preferArcExplainer);

    // Check cache first
    const cached = metadataCache.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for enhanced puzzle: ${puzzleId}`);
      return cached as EnhancedPuzzle;
    }

    try {
      console.log(`🔍 Finding puzzle: ${puzzleId} (prefer arc-explainer: ${preferArcExplainer})`);

      let puzzleData: OfficerTrackPuzzle | null = null;

      if (preferArcExplainer) {
        // Step 1a: Try arc-explainer first (for assessment)
        console.log(`🌐 Trying arc-explainer first for puzzle: ${puzzleId}`);
        const arcData = await arcExplainerClient.getPuzzleById(puzzleId);

        if (arcData) {
          // Convert arc-explainer format to OfficerTrackPuzzle format
          puzzleData = this.convertArcExplainerToOfficerTrack(arcData, puzzleId);
          console.log(`✅ Got puzzle from arc-explainer: ${puzzleId}`);
        } else {
          console.log(`⚠️  Puzzle ${puzzleId} not found in arc-explainer, falling back to PlayFab`);
          // Fallback to PlayFab
          puzzleData = await playfabPuzzleClient.findPuzzleById(puzzleId);
        }
      } else {
        // Step 1b: Get authoritative puzzle data from PlayFab (default behavior)
        puzzleData = await playfabPuzzleClient.findPuzzleById(puzzleId);
      }

      if (!puzzleData) {
        console.log(`❌ Puzzle ${puzzleId} not found in ${preferArcExplainer ? 'arc-explainer or PlayFab' : 'PlayFab'}`);
        return null;
      }

      // Step 2: Enhance with performance data if requested
      let enhanced: EnhancedPuzzle = {
        ...puzzleData,
        hasPerformanceData: false
      };

      if (includePerformance) {
        const performance = await arcExplainerClient.getPuzzlePerformance(puzzleId);
        if (performance) {
          enhanced.aiPerformance = performance;
          enhanced.difficultyCategory = this.categorizeDifficulty(performance.avgAccuracy);
          enhanced.hasPerformanceData = true;
          enhanced.overconfidenceRisk = this.calculateOverconfidenceRisk(performance);
        }
      }

      // Cache the result
      metadataCache.set(cacheKey, enhanced);

      console.log(`✅ Found enhanced puzzle: ${puzzleId} (performance: ${enhanced.hasPerformanceData}, source: ${preferArcExplainer ? 'arc-explainer' : 'playfab'})`);
      return enhanced;

    } catch (error) {
      console.error(`❌ Failed to find puzzle ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Search puzzles with comprehensive filtering
   */
  async search(criteria: SearchCriteria = {}): Promise<SearchResult> {
    const cacheKey = CacheManager.createKey('puzzle-search', criteria);

    // Check cache for search results
    const cached = metadataCache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for puzzle search');
      return cached as SearchResult;
    }

    try {
      console.log('🔍 Searching puzzles with criteria:', criteria);

      const datasets = criteria.datasets || ['training', 'evaluation', 'training2', 'evaluation2'];
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;

      // Step 1: Load base puzzle data from PlayFab
      const allPuzzles: OfficerTrackPuzzle[] = [];

      for (const dataset of datasets) {
        const datasetPuzzles = await playfabPuzzleClient.loadDataset(dataset);
        allPuzzles.push(...datasetPuzzles);
      }

      console.log(`📚 Loaded ${allPuzzles.length} base puzzles from PlayFab`);

      // Step 2: Enhance with performance data in batches
      const puzzleIds = allPuzzles.map(p => p.id);
      const performanceMap = await arcExplainerClient.getBatchPerformance(puzzleIds);

      console.log(`🤖 Got performance data for ${performanceMap.size}/${puzzleIds.length} puzzles`);

      // Step 3: Create enhanced puzzles
      let enhanced: EnhancedPuzzle[] = allPuzzles.map(puzzle => {
        const arcId = idConverter.normalizeToArcId(puzzle.id);
        const performance = arcId ? performanceMap.get(arcId) : undefined;
        const hasPerformanceData = !!performance;

        return {
          ...puzzle,
          aiPerformance: performance,
          difficultyCategory: performance ? this.categorizeDifficulty(performance.avgAccuracy) : undefined,
          hasPerformanceData,
          overconfidenceRisk: performance ? this.calculateOverconfidenceRisk(performance) : false
        };
      });

      // Step 4: Apply filters
      enhanced = this.applyFilters(enhanced, criteria);

      // Step 5: Apply sorting
      enhanced = this.applySorting(enhanced, criteria);

      // Step 6: Apply pagination
      const totalCount = enhanced.length;
      const paginatedPuzzles = enhanced.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      const result: SearchResult = {
        puzzles: paginatedPuzzles,
        totalCount,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined
      };

      // Cache the result
      metadataCache.set(cacheKey, result);

      console.log(`✅ Search complete: ${paginatedPuzzles.length}/${totalCount} puzzles`);
      return result;

    } catch (error) {
      console.error('❌ Search failed:', error);
      return {
        puzzles: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get puzzles by specific difficulty category
   */
  async getByDifficulty(
    category: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging',
    limit: number = 50
  ): Promise<EnhancedPuzzle[]> {
    const result = await this.search({
      difficulty: [category],
      hasPerformanceData: true,
      limit
    });

    return result.puzzles;
  }

  /**
   * Get worst performing puzzles (where AI fails most)
   */
  async getWorstPerforming(limit: number = 50): Promise<EnhancedPuzzle[]> {
    try {
      // Get worst performers directly from arc-explainer
      const worstPuzzles = await arcExplainerClient.getWorstPerformingPuzzles({
        limit,
        sortBy: 'composite'
      });

      console.log(`🎯 Got ${worstPuzzles.length} worst performing puzzles from arc-explainer`);

      // Enhance with PlayFab data where available
      const enhanced: EnhancedPuzzle[] = [];

      for (const apiPuzzle of worstPuzzles) {
        const puzzleId = apiPuzzle.id || apiPuzzle.puzzleId;
        if (!puzzleId) continue;

        // Try to get full puzzle data from PlayFab
        const playfabData = await playfabPuzzleClient.findPuzzleById(puzzleId);

        const enhancedPuzzle: EnhancedPuzzle = {
          // Use PlayFab data if available, otherwise create minimal puzzle
          ...(playfabData || {
            id: puzzleId,
            filename: puzzleId,
            dataset: 'evaluation2' as ARCDatasetType,
            difficulty: 'COLONEL' as any,
            gridSize: { minWidth: 0, maxWidth: 0, minHeight: 0, maxHeight: 0 },
            complexity: { trainingExamples: 0, uniqueColors: 0, transformationComplexity: 'expert' },
            loadedAt: new Date(),
            train: [],
            test: []
          }),
          // Always include performance data from arc-explainer
          aiPerformance: apiPuzzle.performanceData,
          difficultyCategory: apiPuzzle.performanceData ?
            this.categorizeDifficulty(apiPuzzle.performanceData.avgAccuracy) : 'impossible',
          hasPerformanceData: true,
          overconfidenceRisk: apiPuzzle.performanceData ?
            this.calculateOverconfidenceRisk(apiPuzzle.performanceData) : false
        };

        enhanced.push(enhancedPuzzle);
      }

      console.log(`✅ Created ${enhanced.length} enhanced worst performing puzzles`);
      return enhanced;

    } catch (error) {
      console.error('❌ Failed to get worst performing puzzles:', error);
      return [];
    }
  }

  /**
   * Get multiple puzzles by IDs efficiently
   */
  async findByIds(puzzleIds: string[], includePerformance: boolean = true): Promise<Map<string, EnhancedPuzzle>> {
    const results = new Map<string, EnhancedPuzzle>();

    // Check cache for already enhanced puzzles
    const uncachedIds: string[] = [];

    for (const id of puzzleIds) {
      const cacheKey = CacheManager.createKey('enhanced-puzzle', id, includePerformance);
      const cached = metadataCache.get(cacheKey);

      if (cached) {
        results.set(id, cached as EnhancedPuzzle);
      } else {
        uncachedIds.push(id);
      }
    }

    // Load uncached puzzles in batch
    if (uncachedIds.length > 0) {
      const playfabPuzzles = await playfabPuzzleClient.loadPuzzlesByIds(uncachedIds);
      const performanceMap = includePerformance
        ? await arcExplainerClient.getBatchPerformance(uncachedIds)
        : new Map();

      for (const id of uncachedIds) {
        const puzzleData = playfabPuzzles.get(id);
        if (!puzzleData) continue;

        const arcId = idConverter.normalizeToArcId(id);
        const performance = arcId ? performanceMap.get(arcId) : undefined;
        const enhanced: EnhancedPuzzle = {
          ...puzzleData,
          aiPerformance: performance,
          difficultyCategory: performance ? this.categorizeDifficulty(performance.avgAccuracy) : undefined,
          hasPerformanceData: !!performance,
          overconfidenceRisk: performance ? this.calculateOverconfidenceRisk(performance) : false
        };

        results.set(id, enhanced);

        // Cache the enhanced puzzle
        const cacheKey = CacheManager.createKey('enhanced-puzzle', id, includePerformance);
        metadataCache.set(cacheKey, enhanced);
      }
    }

    return results;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    metadataCache.clear();
    playfabPuzzleClient.clearCache();
    arcExplainerClient.clearCache();
    console.log('🧹 Cleared all puzzle repository caches');
  }

  /**
   * Private: Categorize difficulty based on AI accuracy
   */
  private categorizeDifficulty(accuracy: number): 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' {
    const percentage = accuracy * 100;
    if (percentage === 0) return 'impossible';
    if (percentage > 0 && percentage <= 25) return 'extremely_hard';
    if (percentage > 25 && percentage <= 50) return 'very_hard';
    return 'challenging';
  }

  /**
   * Private: Calculate overconfidence risk
   */
  private calculateOverconfidenceRisk(performance: PerformanceData): boolean {
    const lowAccuracy = performance.avgAccuracy < 0.25;
    const highConfidence = (performance.avgConfidence || 0) > 75;
    return lowAccuracy && highConfidence;
  }

  /**
   * Private: Apply search filters
   */
  private applyFilters(puzzles: EnhancedPuzzle[], criteria: SearchCriteria): EnhancedPuzzle[] {
    let filtered = puzzles;

    // Difficulty filter
    if (criteria.difficulty?.length) {
      filtered = filtered.filter(p =>
        p.difficultyCategory && criteria.difficulty!.includes(p.difficultyCategory)
      );
    }

    // Performance data filter
    if (criteria.hasPerformanceData !== undefined) {
      filtered = filtered.filter(p => p.hasPerformanceData === criteria.hasPerformanceData);
    }

    // Zero accuracy only filter
    if (criteria.zeroAccuracyOnly) {
      filtered = filtered.filter(p =>
        p.aiPerformance?.avgAccuracy === 0
      );
    }

    return filtered;
  }

  /**
   * Private: Apply sorting
   */
  /**
   * Private: Convert data from arc-explainer to OfficerTrackPuzzle format
   */
  private convertArcExplainerToOfficerTrack(arcData: any, puzzleId: string): OfficerTrackPuzzle {
    const puzzleContent = arcData.puzzle || arcData; // Handle both nested and flat structures

    return {
      id: puzzleId,
      filename: puzzleContent.name || puzzleId,
      dataset: idConverter.getDatasetFromPlayFabId(puzzleId) || 'evaluation',
      difficulty: puzzleContent.difficulty || 'UNKNOWN',
      gridSize: {
        minWidth: puzzleContent.grid_size_min_width || 0,
        maxWidth: puzzleContent.grid_size_max_width || 0,
        minHeight: puzzleContent.grid_size_min_height || 0,
        maxHeight: puzzleContent.grid_size_max_height || 0,
      },
      complexity: {
        trainingExamples: puzzleContent.training_examples || 0,
        uniqueColors: puzzleContent.number_of_colors || 0,
        transformationComplexity: puzzleContent.transformation_complexity || 'basic',
      },
      loadedAt: new Date(),
      train: puzzleContent.train || [],
      test: puzzleContent.test || [],
    };
  }

  /**
   * Private: Apply sorting
   */
  private applySorting(puzzles: EnhancedPuzzle[], criteria: SearchCriteria): EnhancedPuzzle[] {
    const sortBy = criteria.sortBy || 'id';
    const direction = criteria.sortDirection || 'asc';

    return puzzles.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'difficulty':
          const diffOrder = { impossible: 0, extremely_hard: 1, very_hard: 2, challenging: 3 };
          const aOrder = a.difficultyCategory ? diffOrder[a.difficultyCategory] : 999;
          const bOrder = b.difficultyCategory ? diffOrder[b.difficultyCategory] : 999;
          comparison = aOrder - bOrder;
          break;

        case 'accuracy':
          const aAcc = a.aiPerformance?.avgAccuracy || 0;
          const bAcc = b.aiPerformance?.avgAccuracy || 0;
          comparison = aAcc - bAcc;
          break;

        case 'complexity':
          comparison = (a.complexity?.uniqueColors || 0) - (b.complexity?.uniqueColors || 0);
          break;

        case 'id':
        default:
          comparison = a.id.localeCompare(b.id);
          break;
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }
}

// Export singleton instance
export const puzzleRepository = PuzzleRepository.getInstance();