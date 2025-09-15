/**Author: UNKNOWN
 * Date: 2025 UNKNOWN
 * Purpose: UNKNOWN!  
 * SRP and DRY check: UNKNOWN
 * Used by: UNKNOWN
 * LLM Comparison Selector
 * Simple puzzle selection interface for comparing human vs AI performance
 * Uses real data from arc-explainer API - no hardcoded assumptions
 */

import { useState, useEffect } from 'react';
import { Brain, Target, Clock } from 'lucide-react';
import { arcExplainerAPI, type AIPuzzlePerformance } from '@/services/arcExplainerAPI';

interface LLMComparisonSelectorProps {
  onPuzzleSelect: (puzzleId: string, aiPerformance: AIPuzzlePerformance) => void;
  className?: string;
}

export function LLMComparisonSelector({ onPuzzleSelect, className = '' }: LLMComparisonSelectorProps) {
  const [puzzles, setPuzzles] = useState<AIPuzzlePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<AIPuzzlePerformance | null>(null);
  
  // Simple filtering without hardcoded categories
  const [accuracyFilter, setAccuracyFilter] = useState<'all' | 'low' | 'zero'>('all');
  const [sortBy, setSortBy] = useState<'accuracy' | 'confidence' | 'composite'>('accuracy');

  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get raw puzzle data from arc-explainer - let user decide what's interesting
        const puzzleData = await arcExplainerAPI.getWorstPerformingPuzzles({
          limit: 50, // Use API maximum
          sortBy: sortBy
        });

        setPuzzles(puzzleData);
      } catch (err) {
        console.error('Failed to load puzzle data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load puzzle data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPuzzles();
  }, [sortBy]);

  // Filter puzzles based on user selection
  const filteredPuzzles = puzzles.filter(puzzle => {
    if (accuracyFilter === 'zero') {
      return puzzle.avgAccuracy === 0;
    } else if (accuracyFilter === 'low') {
      return puzzle.avgAccuracy > 0 && puzzle.avgAccuracy < 0.3;
    }
    return true; // 'all'
  });

  const handlePuzzleClick = (puzzle: AIPuzzlePerformance) => {
    setSelectedPuzzle(puzzle);
    onPuzzleSelect(puzzle.id, puzzle);
  };

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-amber-400 text-sm animate-pulse">
          Loading AI performance data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-400 text-sm">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 border border-amber-400 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-amber-400 font-bold text-lg">
          🤖 AI vs Human Challenge
        </h3>
        <div className="text-sm text-amber-300">
          {filteredPuzzles.length} puzzles available
        </div>
      </div>

      {/* Simple filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-amber-300 mb-1">AI Accuracy:</label>
          <select
            value={accuracyFilter}
            onChange={(e) => setAccuracyFilter(e.target.value as any)}
            className="w-full bg-slate-700 border border-amber-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="all">All Puzzles</option>
            <option value="zero">AI Failed Completely (0%)</option>
            <option value="low">AI Struggled (&lt;30%)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-amber-300 mb-1">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-700 border border-amber-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="accuracy">Accuracy</option>
            <option value="confidence">Confidence</option>
            <option value="composite">Overall Score</option>
          </select>
        </div>
      </div>

      {/* Puzzle grid */}
      <div className="max-h-96 overflow-y-auto">
        {filteredPuzzles.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No puzzles match the selected filters
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPuzzles.map((puzzle) => (
              <button
                key={puzzle.id}
                onClick={() => handlePuzzleClick(puzzle)}
                className={`
                  p-4 rounded border text-left transition-all duration-200
                  ${selectedPuzzle?.id === puzzle.id
                    ? 'bg-amber-900 border-amber-400 text-amber-100'
                    : 'bg-slate-700 border-amber-700 text-white hover:bg-slate-600 hover:border-amber-500'
                  }
                  cursor-pointer hover:scale-105 active:scale-95
                `}
              >
                {/* Puzzle ID */}
                <div className="font-mono font-bold text-base mb-2 text-amber-300">
                  {puzzle.id}
                </div>

                {/* AI Performance */}
                <div className="flex items-center gap-1 mb-2">
                  <Brain className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">
                    AI: {Math.round(puzzle.avgAccuracy * 100)}% accuracy
                  </span>
                </div>

                {/* Additional metrics if available */}
                {puzzle.avgConfidence && (
                  <div className="flex items-center gap-1 mb-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span className="text-sm">
                      Confidence: {Math.round(puzzle.avgConfidence * 100)}%
                    </span>
                  </div>
                )}

                {puzzle.totalExplanations && (
                  <div className="text-xs text-slate-400">
                    {puzzle.totalExplanations} AI attempts
                  </div>
                )}

                {/* Challenge indicator */}
                {puzzle.avgAccuracy === 0 && (
                  <div className="mt-2 px-2 py-1 bg-red-800 text-red-200 text-xs rounded">
                    🔥 AI Impossible
                  </div>
                )}
                {puzzle.avgAccuracy > 0 && puzzle.avgAccuracy < 0.3 && (
                  <div className="mt-2 px-2 py-1 bg-orange-800 text-orange-200 text-xs rounded">
                    💪 Can you beat AI?
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected puzzle info */}
      {selectedPuzzle && (
        <div className="mt-4 pt-4 border-t border-amber-700">
          <div className="text-sm text-amber-300 mb-2">Selected Challenge:</div>
          <div className="text-sm text-white font-mono mb-2">
            Puzzle ID: {selectedPuzzle.id}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-amber-300 mb-1">AI Performance:</div>
              <div className="text-slate-300">
                • Accuracy: {Math.round(selectedPuzzle.avgAccuracy * 100)}%<br />
                {selectedPuzzle.avgConfidence && (
                  <>• Confidence: {Math.round(selectedPuzzle.avgConfidence * 100)}%<br /></>
                )}
                {selectedPuzzle.totalExplanations && (
                  <>• Attempts: {selectedPuzzle.totalExplanations}<br /></>
                )}
                {selectedPuzzle.wrongCount && (
                  <>• Failures: {selectedPuzzle.wrongCount}<br /></>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-amber-300 mb-1">Challenge Level:</div>
              <div className="text-slate-300">
                {selectedPuzzle.avgAccuracy === 0 ? (
                  <span className="text-red-400 font-bold">AI Impossible - Can you solve it?</span>
                ) : selectedPuzzle.avgAccuracy < 0.3 ? (
                  <span className="text-orange-400 font-bold">AI Struggles - Your chance to shine!</span>
                ) : (
                  <span className="text-yellow-400">Good challenge - Test your skills</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-green-400 mt-2 font-bold">
            🎯 Ready to challenge the AI
          </div>
        </div>
      )}
    </div>
  );
}