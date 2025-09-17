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

export type SortStrategy = 'composite' | 'accuracy' | 'explanations' | 'difficulty' | 'recent';

export interface UseOfficerPuzzlesReturn {
  // Data
  puzzles: OfficerPuzzle[];
  stats: DifficultyStats;
  filteredPuzzles: OfficerPuzzle[];
  total: number; // Total puzzles in database

  // State
  loading: boolean;
  error: string | null;
  loadingProgress: number; // Progress percentage (0-100)
  loadingMessage: string; // Current loading status message
  
  // Actions
  filterByDifficulty: (difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' | null) => void;
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
    impossible: 0,
    extremely_hard: 0,
    very_hard: 0,
    challenging: 0,
    total: 0
  });
  const [filteredPuzzles, setFilteredPuzzles] = useState<OfficerPuzzle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);
  const [currentSortStrategy, setCurrentSortStrategy] = useState<SortStrategy>(initialSort);

  // Load evaluation2 puzzles with rich metadata from arc-explainer
  const loadData = async (limit: number = currentLimit, sortBy: SortStrategy = currentSortStrategy) => {
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingMessage('Connecting to puzzle database...');

      // Reduced console logging - progress now shown in UI
      console.log(`🎖️ Loading evaluation2 puzzles from arc-explainer API`);

      setLoadingProgress(10);
      setLoadingMessage('Fetching puzzle metadata...');

      // Load evaluation2 puzzles with rich metadata from arc-explainer
      const puzzleResponse = await getEvaluation2Puzzles();

      setLoadingProgress(50);
      setLoadingMessage('Processing difficulty analysis...');
      
      // Calculate stats from loaded puzzles
      const statsData: DifficultyStats = {
        impossible: 0,
        extremely_hard: 0,
        very_hard: 0,
        challenging: 0,
        total: puzzleResponse.total
      };
      
      puzzleResponse.puzzles.forEach(puzzle => {
        statsData[puzzle.difficulty]++;
      });

      setLoadingProgress(70);
      setLoadingMessage(`Sorting ${puzzleResponse.puzzles.length} puzzles by ${sortBy}...`);

      // Apply sorting based on strategy
      let sortedPuzzles = [...puzzleResponse.puzzles];

      if (sortBy === 'accuracy') {
        sortedPuzzles.sort((a, b) => a.avgAccuracy - b.avgAccuracy); // Lowest accuracy first (hardest)
      } else if (sortBy === 'explanations') {
        sortedPuzzles.sort((a, b) => b.totalExplanations - a.totalExplanations); // Most explanations first (most analyzed)
      } else if (sortBy === 'composite') {
        sortedPuzzles.sort((a, b) => a.compositeScore - b.compositeScore); // Worst composite score first
      }
      // 'difficulty' keeps arc-explainer's default sorting (hardest first)

      setLoadingProgress(85);

      // Apply limit if specified
      if (limit && limit < sortedPuzzles.length) {
        setLoadingMessage(`Applying limit: selecting top ${limit} puzzles...`);
        sortedPuzzles = sortedPuzzles.slice(0, limit);
        // Applied limit logged to console for debugging
        console.log(`📊 Showing ${limit} of ${puzzleResponse.total} evaluation2 puzzles`);
      }

      setLoadingProgress(95);
      setLoadingMessage('Finalizing puzzle data...');
      
      setPuzzles(sortedPuzzles);
      setTotal(puzzleResponse.total);
      setStats(statsData);
      setFilteredPuzzles(sortedPuzzles);

      setLoadingProgress(100);
      setLoadingMessage('Puzzle library ready!');

      // Summary logging - detailed stats now shown in UI
      console.log(`✅ Loaded ${sortedPuzzles.length} evaluation2 puzzles with metadata`);

      if (sortedPuzzles.length > 0) {
        const avgAccuracy = sortedPuzzles.reduce((sum, p) => sum + p.avgAccuracy, 0) / sortedPuzzles.length;
        const impossibleCount = sortedPuzzles.filter(p => p.difficulty === 'impossible').length;
        console.log(`📊 Average AI accuracy: ${(avgAccuracy * 100).toFixed(1)}%, ${impossibleCount} impossible puzzles`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load evaluation2 puzzles from arc-explainer';
      setError(errorMessage);
      setLoadingMessage('Failed to load puzzle data');
      console.error('❌ Failed to load evaluation2 puzzles from arc-explainer:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter puzzles by difficulty
  const filterByDifficulty = async (difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' | null) => {
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

    // State
    loading,
    error,
    loadingProgress,
    loadingMessage,

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