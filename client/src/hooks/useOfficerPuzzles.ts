/**OLD FILE POSSIBLE STILL SERVING CRITICAL FUNCTIONALITY
 * NEEDS REVIEW!
 * Smart hook for Officer Track puzzle data
 * 
 * Leverages arc-explainer API rich metadata for dynamic puzzle selection
 * Uses worst-performing algorithms with multiple sorting strategies
 */

import { useState, useEffect } from 'react';
import {
  getEvaluation2Puzzles,
  getDifficultyStats,
  getPuzzlesByDifficulty,
  searchPuzzleById,
  type OfficerPuzzle,
  type DifficultyStats
} from '@/services/officerArcAPI';
import {
  LoadingStage,
  DetailedStatus,
  PerformanceMetrics,
  EnhancedError,
  PUZZLE_LOADING_STAGES,
  calculateProgress,
  getCurrentStage,
  updateStageStatus,
  calculateMetrics
} from '@/types/loadingTypes';

export type SortStrategy = 'composite' | 'accuracy' | 'explanations' | 'difficulty' | 'recent';

export interface UseOfficerPuzzlesReturn {
  // Data
  puzzles: OfficerPuzzle[];
  stats: DifficultyStats;
  filteredPuzzles: OfficerPuzzle[];
  total: number; // Total puzzles in database

  // Enhanced loading state
  loading: boolean;
  error: string | null;
  loadingProgress: number; // Real progress percentage (0-100)
  loadingMessage: string; // Current loading status message
  loadingStages: LoadingStage[];
  currentStage: string;
  detailedStatus: DetailedStatus;
  performanceMetrics: PerformanceMetrics;
  enhancedError: EnhancedError | null;
  
  // Actions
  filterByDifficulty: (difficulty: 'practically_impossible' | 'most_llms_fail' | 'unreliable' | null) => void;
  searchById: (id: string) => Promise<OfficerPuzzle | null>;
  addSearchResult: (puzzle: OfficerPuzzle) => void;
  refresh: (limit?: number, sortBy?: SortStrategy) => Promise<void>;
  setLimit: (limit: number) => void;
  setSortStrategy: (strategy: SortStrategy) => void;
  
  // Current filter state
  currentFilter: string | null;
  currentLimit: number;
  currentSortStrategy: SortStrategy;
}

export function useOfficerPuzzles(
  initialLimit: number = 120, // Default to all evaluation2 puzzles (120 total)
  initialSort: SortStrategy = 'difficulty' // Default to difficulty sorting (hardest first)
): UseOfficerPuzzlesReturn {
  const [puzzles, setPuzzles] = useState<OfficerPuzzle[]>([]);
  const [stats, setStats] = useState<DifficultyStats>({
    practically_impossible: 0,
    most_llms_fail: 0,
    unreliable: 0,
    total: 0
  });
  const [filteredPuzzles, setFilteredPuzzles] = useState<OfficerPuzzle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>([...PUZZLE_LOADING_STAGES]);
  const [detailedStatus, setDetailedStatus] = useState<DetailedStatus>({
    primaryMessage: 'Initializing puzzle loading system...'
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalPuzzles: 0,
    processedPuzzles: 0
  });
  const [enhancedError, setEnhancedError] = useState<EnhancedError | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);
  const [currentSortStrategy, setCurrentSortStrategy] = useState<SortStrategy>(initialSort);

  // Helper function to update stages and progress
  const updateStage = (stageId: string, status: LoadingStage['status'], details?: string) => {
    setLoadingStages(prev => {
      const updated = updateStageStatus(prev, stageId, status, details);
      setLoadingProgress(calculateProgress(updated));

      const current = getCurrentStage(updated);
      if (current) {
        setLoadingMessage(current.name);
        setDetailedStatus({
          primaryMessage: current.name,
          secondaryMessage: details,
          technicalDetails: current.details
        });
      }

      return updated;
    });
  };

  // Load evaluation2 puzzles with rich metadata and real progress tracking
  const loadData = async (limit: number = currentLimit, sortBy: SortStrategy = currentSortStrategy) => {
    try {
      setLoading(true);
      setError(null);
      setEnhancedError(null);
      setLoadStartTime(Date.now());

      // Reset stages
      setLoadingStages([...PUZZLE_LOADING_STAGES]);

      // Stage 1: Initialize
      updateStage('init', 'active', 'Setting up connection to arc-explainer API...');
      console.log(`🎖️ Loading evaluation2 puzzles from arc-explainer API`);
      updateStage('init', 'complete', 'Connection initialized');

      // Stage 2: API Call
      updateStage('api-call', 'active', '🌐 Calling https://arc-explainer-production.up.railway.app/api/puzzle/worst-performing');
      const puzzleResponse = await getEvaluation2Puzzles();
      updateStage('api-call', 'complete', `📊 Received ${puzzleResponse.puzzles.length} puzzle records from arc-explainer`);

      // Stage 3: Data Processing
      updateStage('data-fetch', 'active', `Processing ${puzzleResponse.puzzles.length} puzzle metadata records...`);

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        totalPuzzles: puzzleResponse.total,
        processedPuzzles: puzzleResponse.puzzles.length
      }));

      // Calculate stats from loaded puzzles
      const statsData: DifficultyStats = {
        practically_impossible: 0,
        most_llms_fail: 0,
        unreliable: 0,
        total: puzzleResponse.total
      };

      puzzleResponse.puzzles.forEach(puzzle => {
        statsData[puzzle.difficulty]++;
      });

      updateStage('data-fetch', 'complete', `Analyzed difficulty distribution for ${puzzleResponse.puzzles.length} puzzles`);

      // Stage 4: Processing Difficulty Analysis
      updateStage('processing', 'active', 'Calculating performance statistics...');

      const avgAccuracy = puzzleResponse.puzzles.length > 0
        ? puzzleResponse.puzzles.reduce((sum, p) => sum + p.avgAccuracy, 0) / puzzleResponse.puzzles.length
        : 0;
      const impossibleCount = puzzleResponse.puzzles.filter(p => p.difficulty === 'practically_impossible').length;

      // Update performance metrics with calculated stats
      setPerformanceMetrics(prev => ({
        ...prev,
        averageAccuracy: avgAccuracy,
        impossibleCount,
        ...calculateMetrics(loadStartTime, puzzleResponse.puzzles.length, puzzleResponse.total)
      }));

      const performanceStats = `📊 Average AI accuracy: ${(avgAccuracy * 100).toFixed(1)}%, ${impossibleCount} impossible puzzles`;
      updateStage('processing', 'complete', performanceStats);
      console.log(performanceStats);

      // Stage 5: Sorting
      updateStage('sorting', 'active', `Sorting ${puzzleResponse.puzzles.length} puzzles by ${sortBy}...`);

      let sortedPuzzles = [...puzzleResponse.puzzles];
      if (sortBy === 'accuracy') {
        sortedPuzzles.sort((a, b) => a.avgAccuracy - b.avgAccuracy);
      } else if (sortBy === 'explanations') {
        sortedPuzzles.sort((a, b) => b.totalExplanations - a.totalExplanations);
      } else if (sortBy === 'composite') {
        sortedPuzzles.sort((a, b) => a.compositeScore - b.compositeScore);
      }

      updateStage('sorting', 'complete', `Sorted ${sortedPuzzles.length} puzzles by ${sortBy}`);

      // Apply limit if specified
      if (limit && limit < sortedPuzzles.length) {
        const limitMessage = `Applying limit: selecting top ${limit} of ${sortedPuzzles.length} puzzles`;
        setDetailedStatus(prev => ({ ...prev, secondaryMessage: limitMessage }));
        sortedPuzzles = sortedPuzzles.slice(0, limit);
        console.log(`📊 Showing ${limit} of ${puzzleResponse.total} evaluation2 puzzles`);
      }

      // Stage 6: Finalize
      updateStage('finalize', 'active', 'Finalizing puzzle data...');

      setPuzzles(sortedPuzzles);
      setTotal(puzzleResponse.total);
      setStats(statsData);
      setFilteredPuzzles(sortedPuzzles);

      updateStage('finalize', 'complete', `✅ Loaded ${sortedPuzzles.length} puzzles with enhanced metadata`);

      // Update final status
      setDetailedStatus({
        primaryMessage: 'Puzzle library ready!',
        secondaryMessage: `${sortedPuzzles.length} puzzles loaded successfully`,
        performanceStats: `Average AI accuracy: ${(avgAccuracy * 100).toFixed(1)}%, ${impossibleCount} impossible puzzles`,
        technicalDetails: `Data source: arc-explainer API | Sort: ${sortBy} | Limit: ${limit}`
      });

      console.log(`✅ Loaded ${sortedPuzzles.length} evaluation2 puzzles with metadata`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load evaluation2 puzzles from arc-explainer';
      setError(errorMessage);

      // Enhanced error with context
      const enhancedErr: EnhancedError = {
        title: 'Puzzle Loading Failed',
        message: 'Unable to load puzzle data from the arc-explainer API',
        context: 'The puzzle database service may be temporarily unavailable or experiencing high load',
        suggestions: [
          'Check your internet connection',
          'Wait a few moments and try refreshing the page',
          'Try reducing the number of puzzles to load',
          'Contact support if the problem persists'
        ],
        technicalDetails: err instanceof Error ? err.message : 'Unknown error'
      };

      setEnhancedError(enhancedErr);

      // Update current stage to error
      const currentStage = getCurrentStage(loadingStages);
      if (currentStage) {
        updateStage(currentStage.id, 'error', `Failed: ${errorMessage}`);
      }

      console.error('❌ Failed to load evaluation2 puzzles from arc-explainer:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter puzzles by difficulty
  const filterByDifficulty = async (difficulty: 'practically_impossible' | 'most_llms_fail' | 'unreliable' | null) => {
    try {
      setCurrentFilter(difficulty);
      
      if (!difficulty) {
        // No filter - show all
        setFilteredPuzzles(puzzles);
        return;
      }
      
      // Filter to specific difficulty
      const filtered = puzzles.filter(p => p.difficulty === difficulty);
      setFilteredPuzzles(filtered);
      
      console.log(`🔧 Filtered to ${difficulty}: ${filtered.length} puzzles`);
      
    } catch (err) {
      console.error('❌ Filter error:', err);
    }
  };

  // Search for specific puzzle
  const searchById = async (id: string): Promise<OfficerPuzzle | null> => {
    try {
      return await searchPuzzleById(id);
    } catch (err) {
      console.error('❌ Search error:', err);
      return null;
    }
  };

  // Add search result to the displayed puzzles
  const addSearchResult = (puzzle: OfficerPuzzle) => {
    // Check if puzzle already exists in current filtered display
    const isAlreadyDisplayed = filteredPuzzles.some(p => p.id === puzzle.id);
    if (!isAlreadyDisplayed) {
      // Add to the beginning of the filtered list for prominence
      setFilteredPuzzles([puzzle, ...filteredPuzzles]);
      console.log(`🎯 Added search result "${puzzle.id}" to display grid`);
    } else {
      console.log(`🔄 Puzzle "${puzzle.id}" already in display grid`);
    }
  };

  // Enhanced refresh with strategy support
  const refresh = async (limit?: number, sortBy?: SortStrategy) => {
    const newLimit = limit || currentLimit;
    const newSort = sortBy || currentSortStrategy;
    
    console.log(`🔄 Refreshing with limit: ${newLimit}, sort: ${newSort}`);
    await loadData(newLimit, newSort);
    
    // Reapply current filter if any
    if (currentFilter) {
      filterByDifficulty(currentFilter as any);
    }
  };

  // Set new limit and reload data
  const setLimit = (limit: number) => {
    console.log(`📊 Changing limit from ${currentLimit} to ${limit}`);
    setCurrentLimit(limit);
    loadData(limit, currentSortStrategy);
  };

  // Set new sort strategy and reload data  
  const setSortStrategy = (strategy: SortStrategy) => {
    console.log(`🔄 Changing sort strategy from ${currentSortStrategy} to ${strategy}`);
    setCurrentSortStrategy(strategy);
    loadData(currentLimit, strategy);
  };

  // Load data on mount
  useEffect(() => {
    console.log(`🎖️ Initializing HARC puzzle browser with ${initialLimit} puzzles, sorted by ${initialSort}`);
    loadData(currentLimit, currentSortStrategy);
  }, []);

  return {
    // Data
    puzzles,
    stats,
    filteredPuzzles,
    total,

    // Enhanced loading state
    loading,
    error,
    loadingProgress,
    loadingMessage,
    loadingStages,
    currentStage: getCurrentStage(loadingStages)?.name || '',
    detailedStatus,
    performanceMetrics,
    enhancedError,

    // Actions
    filterByDifficulty,
    searchById,
    addSearchResult,
    refresh,
    setLimit,
    setSortStrategy,

    // Current state
    currentFilter,
    currentLimit,
    currentSortStrategy
  };
}