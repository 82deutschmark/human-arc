/**  Possibly has useful parts, otherwise deprecated
 * Officer Puzzle Selector Component
 * =================================
 * Selector component for choosing ARC puzzles with military academy theming (THEMING is overboard and should be removed)
 * 
 * Key Features:
 * - Real ARC dataset browsing (training, evaluation, etc.)  USEFUL!!!
 * - Officer rank-based filtering and access  VERY BADLY DONE
 * - Puzzle metadata display (difficulty, grid size, completion status)
 * - Military gold/amber theming OVERBOARD needs to be removed
 * - Pagination for large datasets
 */

import { useState, useEffect } from 'react';
import { ChevronDown, Star, Lock, CheckCircle, Grid3x3, Target, Brain, Clock } from 'lucide-react';
import type { ARCDatasetType, OfficerRank } from '@/types/arcTypes';
import { useARCData, type EnhancedPuzzleFile } from '@/services/arcDataService';
import { useModelData } from '@/hooks/useModelData';

// Type alias for backward compatibility
type ARCDataset = ARCDatasetType;

interface OfficerPuzzleSelectorProps {
  /** Currently selected puzzle file */
  selectedPuzzle?: EnhancedPuzzleFile;
  /** Callback when puzzle is selected */
  onPuzzleSelect: (puzzle: EnhancedPuzzleFile) => void;
  /** Player's current officer rank */
  playerRank: OfficerRank;
  /** Completed puzzle IDs for progress tracking */
  completedPuzzles: Set<string>;
  /** Available datasets to browse */
  availableDatasets?: ARCDataset[];
  /** Whether selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function OfficerPuzzleSelector({
  selectedPuzzle,
  onPuzzleSelect,
  playerRank,
  completedPuzzles,
  availableDatasets = ['training', 'evaluation'],
  disabled = false,
  className = ''
}: OfficerPuzzleSelectorProps) {
  const [currentDataset, setCurrentDataset] = useState<ARCDataset>(availableDatasets[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [aiDifficultyFilter, setAiDifficultyFilter] = useState<string>('all');
  const [gridSizeFilter, setGridSizeFilter] = useState<string>('all');
  const [testCaseFilter, setTestCaseFilter] = useState<string>('all');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');
  
  const { 
    puzzleFiles, 
    isLoading, 
    error, 
    loadDataset 
  } = useARCData();

  const { difficulties, isLoading: modelsLoading } = useModelData();

  const PUZZLES_PER_PAGE = 20;

  // Load current dataset
  useEffect(() => {
    loadDataset(currentDataset);
  }, [currentDataset, loadDataset]);

  // Filter puzzles based on search and all filters
  const filteredPuzzles = puzzleFiles.filter(puzzle => {
    const matchesSearch = !searchQuery || 
      puzzle.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      puzzle.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCompletion = showCompleted || 
      !completedPuzzles.has(puzzle.id);
    
    // AI difficulty filter
    const matchesAiDifficulty = aiDifficultyFilter === 'all' || 
      (aiDifficultyFilter === 'has_ai_data' && puzzle.aiPerformance) ||
      (aiDifficultyFilter === 'no_ai_data' && !puzzle.aiPerformance) ||
      (puzzle.aiPerformance?.difficultyCategory === aiDifficultyFilter);
    
    // Grid size filter
    const matchesGridSize = gridSizeFilter === 'all' || 
      (gridSizeFilter === 'small' && puzzle.gridSize.maxWidth <= 5 && puzzle.gridSize.maxHeight <= 5) ||
      (gridSizeFilter === 'medium' && puzzle.gridSize.maxWidth > 5 && puzzle.gridSize.maxWidth <= 10 && puzzle.gridSize.maxHeight > 5 && puzzle.gridSize.maxHeight <= 10) ||
      (gridSizeFilter === 'large' && (puzzle.gridSize.maxWidth > 10 || puzzle.gridSize.maxHeight > 10)) ||
      (gridSizeFilter === 'fixed' && puzzle.gridSize.minWidth === puzzle.gridSize.maxWidth && puzzle.gridSize.minHeight === puzzle.gridSize.maxHeight) ||
      (gridSizeFilter === 'variable' && (puzzle.gridSize.minWidth !== puzzle.gridSize.maxWidth || puzzle.gridSize.minHeight !== puzzle.gridSize.maxHeight));
    
    // Test case filter
    const matchesTestCases = testCaseFilter === 'all' ||
      (testCaseFilter === 'single' && puzzle.testCaseCount === 1) ||
      (testCaseFilter === 'multiple' && puzzle.testCaseCount > 1);
    
    // Complexity filter
    const matchesComplexity = complexityFilter === 'all' ||
      puzzle.complexity.transformationComplexity === complexityFilter;
    
    return matchesSearch && matchesCompletion && matchesAiDifficulty && matchesGridSize && matchesTestCases && matchesComplexity;
  });

  // Paginated puzzles
  const startIndex = (currentPage - 1) * PUZZLES_PER_PAGE;
  const paginatedPuzzles = filteredPuzzles.slice(startIndex, startIndex + PUZZLES_PER_PAGE);
  const totalPages = Math.ceil(filteredPuzzles.length / PUZZLES_PER_PAGE);

  // Check if puzzle is accessible - all puzzles are accessible to all ranks
  const isPuzzleAccessible = (puzzle: EnhancedPuzzleFile): boolean => {
    return true; // All puzzles accessible
  };

  // Get completion status for a puzzle
  const getPuzzleStatus = (puzzle: EnhancedPuzzleFile) => {
    const puzzleId = puzzle.id; // Use the proper puzzle ID
    const isCompleted = completedPuzzles.has(puzzleId);
    const isAccessible = isPuzzleAccessible(puzzle);
    
    return { isCompleted, isAccessible };
  };

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-amber-400 text-sm animate-pulse">
          Loading ARC puzzles from {currentDataset} dataset...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-400 text-sm">
          Error loading puzzles: {error}
        </div>
        <button
          onClick={() => loadDataset(currentDataset)}
          className="mt-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 border border-amber-400 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-amber-400 font-bold text-lg">
          🎖️ Mission Selection
        </h3>
        <div className="text-sm text-amber-300">
          Rank: {playerRank}
        </div>
      </div>

      {/* Dataset Selector */}
      <div className="mb-4">
        <label className="block text-sm text-amber-300 mb-2">Dataset:</label>
        <div className="relative">
          <select
            value={currentDataset}
            onChange={(e) => {
              setCurrentDataset(e.target.value as ARCDataset);
              setCurrentPage(1);
            }}
            disabled={disabled}
            className="w-full bg-slate-700 border border-amber-700 rounded px-3 py-2 text-white text-sm appearance-none cursor-pointer disabled:opacity-50"
          >
            {availableDatasets.map(dataset => (
              <option key={dataset} value={dataset}>
                {dataset.charAt(0).toUpperCase() + dataset.slice(1)} Dataset
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-amber-400 pointer-events-none" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-3 space-y-2">
        <input
          type="text"
          placeholder="Search by puzzle ID..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          disabled={disabled}
          className="w-full bg-slate-700 border border-amber-700 rounded px-3 py-2 text-white text-sm placeholder-slate-400 disabled:opacity-50"
        />
        
        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* AI Difficulty Filter */}
          <div>
            <label className="block text-xs text-amber-300 mb-1">AI Difficulty:</label>
            <select
              value={aiDifficultyFilter}
              onChange={(e) => {
                setAiDifficultyFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={disabled || modelsLoading}
              className="w-full bg-slate-700 border border-amber-700 rounded px-2 py-1 text-white text-xs disabled:opacity-50"
            >
              {modelsLoading ? (
                <option value="all">Loading...</option>
              ) : (
                difficulties.map(diff => (
                  <option key={diff.key} value={diff.key}>
                    {diff.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Grid Size Filter */}
          <div>
            <label className="block text-xs text-amber-300 mb-1">Grid Size:</label>
            <select
              value={gridSizeFilter}
              onChange={(e) => {
                setGridSizeFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={disabled}
              className="w-full bg-slate-700 border border-amber-700 rounded px-2 py-1 text-white text-xs disabled:opacity-50"
            >
              <option value="all">All Sizes</option>
              <option value="small">Small (&le;5×5)</option>
              <option value="medium">Medium (6-10)</option>
              <option value="large">Large (&gt;10)</option>
              <option value="fixed">Fixed Size</option>
              <option value="variable">Variable Size</option>
            </select>
          </div>

          {/* Test Case Filter */}
          <div>
            <label className="block text-xs text-amber-300 mb-1">Test Cases:</label>
            <select
              value={testCaseFilter}
              onChange={(e) => {
                setTestCaseFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={disabled}
              className="w-full bg-slate-700 border border-amber-700 rounded px-2 py-1 text-white text-xs disabled:opacity-50"
            >
              <option value="all">All</option>
              <option value="single">Single Test</option>
              <option value="multiple">Multiple Tests</option>
            </select>
          </div>

          {/* Complexity Filter */}
          <div>
            <label className="block text-xs text-amber-300 mb-1">Complexity:</label>
            <select
              value={complexityFilter}
              onChange={(e) => {
                setComplexityFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={disabled}
              className="w-full bg-slate-700 border border-amber-700 rounded px-2 py-1 text-white text-xs disabled:opacity-50"
            >
              <option value="all">All</option>
              <option value="simple">Simple</option>
              <option value="moderate">Moderate</option>
              <option value="complex">Complex</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
        
        {/* Completion Status Filter */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => {
                setShowCompleted(e.target.checked);
                setCurrentPage(1);
              }}
              disabled={disabled}
              className="accent-amber-500"
            />
            <span className="text-xs text-amber-300">Show completed</span>
          </label>
          
          {/* Filter stats */}
          <div className="text-xs text-slate-400">
            {filteredPuzzles.length} puzzle{filteredPuzzles.length !== 1 ? 's' : ''} match filters
          </div>
        </div>
      </div>

      {/* Puzzle Grid */}
      <div className="mb-4 max-h-96 overflow-y-auto">
        {paginatedPuzzles.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {filteredPuzzles.length === 0 ? 'No puzzles match your filters' : 'No puzzles on this page'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {paginatedPuzzles.map((puzzle) => {
              const { isCompleted, isAccessible } = getPuzzleStatus(puzzle);
              const isSelected = selectedPuzzle?.id === puzzle.id;

              return (
                <button
                  key={puzzle.id}
                  onClick={() => !disabled && isAccessible && onPuzzleSelect(puzzle)}
                  disabled={disabled || !isAccessible}
                  className={`
                    p-4 rounded border text-left transition-all duration-200 min-h-[140px]
                    ${isSelected
                      ? 'bg-amber-900 border-amber-400 text-amber-100'
                      : 'bg-slate-700 border-amber-700 text-white hover:bg-slate-600 hover:border-amber-500'
                    }
                    ${!isAccessible 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                    }
                    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  {/* Header with puzzle ID and status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-mono font-bold">
                      {puzzle.filename.replace('.json', '')}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {!isAccessible && (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Grid size information */}
                  <div className="flex items-center gap-1 mb-1">
                    <Grid3x3 className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-300">
                      {puzzle.gridSize.minWidth === puzzle.gridSize.maxWidth && 
                       puzzle.gridSize.minHeight === puzzle.gridSize.maxHeight
                        ? `${puzzle.gridSize.minWidth}×${puzzle.gridSize.minHeight}`
                        : `${puzzle.gridSize.minWidth}-${puzzle.gridSize.maxWidth}×${puzzle.gridSize.minHeight}-${puzzle.gridSize.maxHeight}`
                      }
                    </span>
                  </div>

                  {/* Test cases and training examples */}
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-300">
                      {puzzle.testCaseCount} test{puzzle.testCaseCount !== 1 ? 's' : ''}, {puzzle.trainingExampleCount} examples
                    </span>
                  </div>

                  {/* Difficulty and complexity */}
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-300">
                      {puzzle.difficulty} • {puzzle.complexity.uniqueColors} colors • {puzzle.complexity.transformationComplexity}
                    </span>
                  </div>

                  {/* AI Performance data if available */}
                  {puzzle.aiPerformance && (
                    <div className="flex items-center gap-1 mb-1">
                      <Brain className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-amber-300">
                        AI: {Math.round(puzzle.aiPerformance.avgAccuracy * 100)}% accuracy
                        {puzzle.aiPerformance.difficultyCategory && (
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            puzzle.aiPerformance.difficultyCategory === 'impossible' ? 'bg-red-800 text-red-200' :
                            puzzle.aiPerformance.difficultyCategory === 'extremely_hard' ? 'bg-orange-800 text-orange-200' :
                            puzzle.aiPerformance.difficultyCategory === 'very_hard' ? 'bg-yellow-800 text-yellow-200' :
                            'bg-green-800 text-green-200'
                          }`}>
                            {puzzle.aiPerformance.difficultyCategory.replace('_', ' ')}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Dataset info */}
                  <div className="text-sm text-slate-400 mt-auto">
                    Dataset: {puzzle.dataset}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-amber-300">
            Page {currentPage} of {totalPages} • {filteredPuzzles.length} puzzles
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || disabled}
              className="px-4 py-2 bg-slate-700 border border-amber-700 rounded text-sm text-amber-400 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || disabled}
              className="px-4 py-2 bg-slate-700 border border-amber-700 rounded text-sm text-amber-400 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Selected Puzzle Info */}
      {selectedPuzzle && (
        <div className="mt-4 pt-4 border-t border-amber-700">
          <div className="text-sm text-amber-300 mb-2">Selected Mission:</div>
          <div className="text-sm text-white font-mono mb-2">
            {selectedPuzzle.filename.replace('.json', '')}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-amber-300 mb-1">Mission Parameters:</div>
              <div className="text-slate-300">
                • Grid: {selectedPuzzle.gridSize.minWidth === selectedPuzzle.gridSize.maxWidth && 
                         selectedPuzzle.gridSize.minHeight === selectedPuzzle.gridSize.maxHeight
                          ? `${selectedPuzzle.gridSize.minWidth}×${selectedPuzzle.gridSize.minHeight}`
                          : `${selectedPuzzle.gridSize.minWidth}-${selectedPuzzle.gridSize.maxWidth}×${selectedPuzzle.gridSize.minHeight}-${selectedPuzzle.gridSize.maxHeight}`
                        }<br />
                • {selectedPuzzle.testCaseCount} test case{selectedPuzzle.testCaseCount !== 1 ? 's' : ''}<br />
                • {selectedPuzzle.trainingExampleCount} training examples<br />
                • {selectedPuzzle.complexity.uniqueColors} colors<br />
                • {selectedPuzzle.complexity.transformationComplexity} complexity
              </div>
            </div>
            
            <div>
              <div className="text-amber-300 mb-1">Intelligence Data:</div>
              <div className="text-slate-300">
                • Difficulty: {selectedPuzzle.difficulty}<br />
                • Dataset: {selectedPuzzle.dataset}<br />
                {selectedPuzzle.aiPerformance && (
                  <>
                    • AI Success: {Math.round(selectedPuzzle.aiPerformance.avgAccuracy * 100)}%<br />
                    {selectedPuzzle.aiPerformance.difficultyCategory && (
                      <span>• Category: {selectedPuzzle.aiPerformance.difficultyCategory.replace('_', ' ')}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-green-400 mt-2 font-bold">
            🎯 Ready for deployment
          </div>
        </div>
      )}
    </div>
  );
}