/**
 * Author: Claude Code using Sonnet 4
 * Date: September 14, 2025
 * PURPOSE: LMArena-style explanation comparison dashboard for rating AI model explanations
 * Shows side-by-side puzzle explanations from different authors (mostly AI vs AI)
 * Users vote on which explanation is better, updates ELO ratings for ranking models
 * SRP and DRY check: Pass - Single responsibility for explanation comparison interface
 * Used by: Pages that want to display explanation voting interfaces
 */

import { useState, useEffect } from 'react';
import { ThumbsUp, RotateCcw, Loader2 } from 'lucide-react';
import { eloRatingService } from '@/services/eloRatingService';
import { playFabTasks } from '@/services/playfab';

interface ExplanationData {
  id: string;
  text: string;
  author: string;
  modelName?: string;
  type: 'ai' | 'human';
  puzzleId: string;
}

interface ExplanationMatch {
  puzzleId: string;
  puzzleData: any;
  explanationA: ExplanationData;
  explanationB: ExplanationData;
  leftSide: 'A' | 'B'; // Which explanation is on the left (randomized)
}

interface VoteResult {
  winner: string;
  ratingChanges: {
    playerA: number;
    playerB: number;
  };
}

interface ExplanationArenaProps {
  className?: string;
  onVoteComplete?: (result: VoteResult) => void;
}

export function ExplanationArena({ className = '', onVoteComplete }: ExplanationArenaProps) {
  const [currentMatch, setCurrentMatch] = useState<ExplanationMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ sessionComparisons: 0 });
  const [showResults, setShowResults] = useState(false);
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null);

  useEffect(() => {
    loadRandomComparison();
  }, []);

  /**
   * Load a random puzzle and pair of explanations for comparison
   */
  const loadRandomComparison = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowResults(false);

      // Get a random puzzle from PlayFab tasks
      const allTasks = await playFabTasks.getAllTasks();
      if (allTasks.length === 0) {
        throw new Error('No puzzles available');
      }

      const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];
      const puzzleId = randomTask.id;

      console.log(`[ExplanationArena] Loading explanations for puzzle: ${puzzleId}`);

      // Get explanations for this puzzle from arc-explainer API
      const explanationsResponse = await fetch(
        `https://arc-explainer-production.up.railway.app/api/puzzle/${puzzleId}/explanations`
      );

      if (!explanationsResponse.ok) {
        throw new Error(`Failed to fetch explanations: ${explanationsResponse.statusText}`);
      }

      const explanationsData = await explanationsResponse.json();
      console.log('[ExplanationArena] Explanations response:', explanationsData);

      // Extract explanations array from response
      const explanations = explanationsData.data?.explanations || explanationsData.explanations || [];

      if (explanations.length < 2) {
        // If not enough explanations, try another puzzle
        console.log(`[ExplanationArena] Not enough explanations for puzzle ${puzzleId}, trying another...`);
        setTimeout(loadRandomComparison, 100);
        return;
      }

      // Pick two random explanations
      const shuffled = [...explanations].sort(() => 0.5 - Math.random());
      const [expA, expB] = shuffled.slice(0, 2);

      // Convert to our format
      const explanationA: ExplanationData = {
        id: expA.id || `${expA.modelName || 'unknown'}_${puzzleId}`,
        text: expA.explanation || expA.text || 'No explanation provided',
        author: expA.modelName || expA.author || 'Unknown',
        modelName: expA.modelName,
        type: expA.type === 'human' ? 'human' : 'ai',
        puzzleId
      };

      const explanationB: ExplanationData = {
        id: expB.id || `${expB.modelName || 'unknown'}_${puzzleId}`,
        text: expB.explanation || expB.text || 'No explanation provided',
        author: expB.modelName || expB.author || 'Unknown',
        modelName: expB.modelName,
        type: expB.type === 'human' ? 'human' : 'ai',
        puzzleId
      };

      // Randomize which explanation goes on which side
      const leftSide: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';

      const match: ExplanationMatch = {
        puzzleId,
        puzzleData: randomTask,
        explanationA,
        explanationB,
        leftSide
      };

      setCurrentMatch(match);
      console.log('[ExplanationArena] Loaded comparison match:', match);

    } catch (err) {
      console.error('[ExplanationArena] Failed to load comparison:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle user voting on which explanation is better
   */
  const handleVote = async (winner: 'left' | 'right' | 'tie') => {
    if (!currentMatch) return;

    try {
      setIsLoading(true);

      // Determine which explanation won based on randomized sides
      let result: 'A_WINS' | 'B_WINS' | 'DRAW';
      if (winner === 'tie') {
        result = 'DRAW';
      } else if (winner === 'left') {
        result = currentMatch.leftSide === 'A' ? 'A_WINS' : 'B_WINS';
      } else {
        result = currentMatch.leftSide === 'A' ? 'B_WINS' : 'A_WINS';
      }

      console.log(`[ExplanationArena] Processing vote: ${winner} -> ${result}`);

      // Process ELO rating update
      const { changes } = await eloRatingService.processMatchResult(
        currentMatch.explanationA.id,
        currentMatch.explanationB.id,
        result,
        {
          type: currentMatch.explanationA.type,
          name: currentMatch.explanationA.author,
          modelName: currentMatch.explanationA.modelName
        },
        {
          type: currentMatch.explanationB.type,
          name: currentMatch.explanationB.author,
          modelName: currentMatch.explanationB.modelName
        }
      );

      // Update user stats
      setUserStats(prev => ({
        sessionComparisons: prev.sessionComparisons + 1
      }));

      // Show results briefly
      const winnerName = winner === 'tie' ? 'Tie' :
        winner === 'left' ?
          (currentMatch.leftSide === 'A' ? currentMatch.explanationA.author : currentMatch.explanationB.author) :
          (currentMatch.leftSide === 'A' ? currentMatch.explanationB.author : currentMatch.explanationA.author);

      const voteResult: VoteResult = {
        winner: winnerName,
        ratingChanges: changes
      };

      setLastVoteResult(voteResult);
      setShowResults(true);

      // Call callback if provided
      if (onVoteComplete) {
        onVoteComplete(voteResult);
      }

      // Auto-load next comparison after showing results
      setTimeout(() => {
        loadRandomComparison();
      }, 2000);

    } catch (err) {
      console.error('[ExplanationArena] Failed to process vote:', err);
      setError('Failed to process vote. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('[ExplanationArena] Skipping current comparison');
    loadRandomComparison();
  };

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
        <div className="text-blue-400 text-sm">
          {currentMatch ? 'Processing vote...' : 'Loading explanation comparison...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-400 text-sm mb-4">
          Error: {error}
        </div>
        <button
          onClick={loadRandomComparison}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-slate-400 text-sm">
          No comparison available
        </div>
      </div>
    );
  }

  // Get left and right explanations based on randomized sides
  const leftExplanation = currentMatch.leftSide === 'A' ? currentMatch.explanationA : currentMatch.explanationB;
  const rightExplanation = currentMatch.leftSide === 'A' ? currentMatch.explanationB : currentMatch.explanationA;

  return (
    <div className={`bg-slate-800 border border-blue-400 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-blue-400 font-bold text-lg">
          🥊 Explanation Arena
        </h3>
        <div className="text-sm text-blue-300">
          {userStats.sessionComparisons} comparisons this session
        </div>
      </div>

      {/* Show results if just voted */}
      {showResults && lastVoteResult && (
        <div className="mb-4 p-3 bg-green-800 border border-green-600 rounded text-center">
          <div className="text-green-200 font-bold">Winner: {lastVoteResult.winner}</div>
          <div className="text-green-300 text-sm mt-1">
            Rating changes: A({lastVoteResult.ratingChanges.playerA > 0 ? '+' + lastVoteResult.ratingChanges.playerA : lastVoteResult.ratingChanges.playerA}), B({lastVoteResult.ratingChanges.playerB > 0 ? '+' + lastVoteResult.ratingChanges.playerB : lastVoteResult.ratingChanges.playerB})
          </div>
        </div>
      )}

      {/* Puzzle Info */}
      <div className="mb-4 p-3 bg-slate-700 rounded">
        <div className="text-blue-300 font-semibold mb-2">Puzzle: {currentMatch.puzzleId}</div>
        <div className="text-slate-300 text-sm">
          {currentMatch.puzzleData.description || 'ARC-AGI Pattern Recognition Task'}
        </div>
      </div>

      {/* Explanation Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Left Explanation */}
        <div className="bg-slate-700 border border-blue-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-400 font-bold">Explanation A</div>
            <div className="text-slate-400 text-sm">{leftExplanation.type === 'ai' ? '🤖' : '👤'}</div>
          </div>
          <div className="text-slate-300 text-sm mb-3 leading-relaxed max-h-32 overflow-y-auto">
            {leftExplanation.text}
          </div>
          <div className="text-slate-500 text-xs">
            Author: {leftExplanation.author}
          </div>
        </div>

        {/* Right Explanation */}
        <div className="bg-slate-700 border border-red-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-red-400 font-bold">Explanation B</div>
            <div className="text-slate-400 text-sm">{rightExplanation.type === 'ai' ? '🤖' : '👤'}</div>
          </div>
          <div className="text-slate-300 text-sm mb-3 leading-relaxed max-h-32 overflow-y-auto">
            {rightExplanation.text}
          </div>
          <div className="text-slate-500 text-xs">
            Author: {rightExplanation.author}
          </div>
        </div>
      </div>

      {/* Voting Interface */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => handleVote('left')}
          disabled={isLoading || showResults}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          A is Better
        </button>

        <button
          onClick={() => handleVote('tie')}
          disabled={isLoading || showResults}
          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
        >
          Tie
        </button>

        <button
          onClick={() => handleVote('right')}
          disabled={isLoading || showResults}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          B is Better
        </button>
      </div>

      {/* Skip/Next */}
      <div className="flex justify-center gap-2">
        <button
          onClick={handleSkip}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-slate-300 rounded transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Skip
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-blue-700">
        <div className="text-center text-sm text-slate-400">
          Session: {userStats.sessionComparisons} comparisons
        </div>
      </div>
    </div>
  );
}