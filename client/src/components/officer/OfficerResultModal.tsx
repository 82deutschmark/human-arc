/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component was intended to be a modal for displaying the results of a puzzle attempt in the Officer Track, including success/failure status, experience points, and rank progression.
 * DEPRECATION NOTICE: This component is deprecated and should not be used. It is inextricably linked to the non-existent Officer Rank and progression system, making it a "hallucinated" feature that is not part of the actual application. It depends on other deprecated components like `OfficerRankBadge`.
 * SRP and DRY check: Fail. This component was built for a feature that does not exist, making it a prime example of unnecessary code and a violation of the "You Aren't Gonna Need It" (YAGNI) principle.
 */

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Star, Award, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { getRandomOfficer } from '@/constants/trainers';
import type { ARCGrid, OfficerRank, OfficerTrackPlayer, OfficerTrackPuzzle } from '@/types/arcTypes';
import { OfficerDisplayGrid } from './OfficerGrid';
import { OfficerRankBadge } from './OfficerRankBadge';

interface OfficerResultModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Whether puzzle was solved correctly */
  success: boolean;
  /** The puzzle that was attempted */
  puzzle: OfficerTrackPuzzle;
  /** Player's submitted solution */
  submittedSolution: ARCGrid;
  /** Expected correct solution */
  expectedSolution: ARCGrid;
  /** Time taken to solve (in seconds) */
  timeSpent?: number;
  /** Experience points earned */
  experienceEarned: number;
  /** Player's rank before this attempt */
  previousRank: OfficerRank;
  /** Player's rank after this attempt */
  currentRank: OfficerRank;
  /** Updated player data */
  playerData: OfficerTrackPlayer;
  /** Callback when continuing to next puzzle */
  onNextPuzzle?: () => void;
  /** Callback when retrying current puzzle */
  onRetryPuzzle?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function OfficerResultModal({
  isOpen,
  onClose,
  success,
  puzzle,
  submittedSolution,
  expectedSolution,
  timeSpent,
  experienceEarned,
  previousRank,
  currentRank,
  playerData,
  onNextPuzzle,
  onRetryPuzzle,
  className = ''
}: OfficerResultModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [officer] = useState(() => getRandomOfficer()); // Fixed officer for this modal instance

  const rankUp = previousRank !== currentRank;

  // Animation effects on open
  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      if (rankUp) {
        setTimeout(() => setShowRankUp(true), 1000);
      }
    } else {
      setShowAnimation(false);
      setShowRankUp(false);
    }
  }, [isOpen, rankUp]);

  if (!isOpen) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate accuracy percentage
  const calculateAccuracy = (): number => {
    if (!submittedSolution || !expectedSolution) return 0;
    
    let totalCells = 0;
    let correctCells = 0;
    
    for (let i = 0; i < expectedSolution.length; i++) {
      for (let j = 0; j < expectedSolution[i].length; j++) {
        totalCells++;
        if (submittedSolution[i]?.[j] === expectedSolution[i][j]) {
          correctCells++;
        }
      }
    }
    
    return totalCells > 0 ? Math.round((correctCells / totalCells) * 100) : 0;
  };

  const accuracy = calculateAccuracy();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        className={`
          bg-slate-900 border-2 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto
          ${success ? 'border-green-500' : 'border-red-500'}
          ${showAnimation ? 'animate-in fade-in zoom-in duration-500' : ''}
          ${className}
        `}
      >
        {/* Header */}
        <div className={`
          p-6 border-b flex items-center justify-between
          ${success 
            ? 'bg-gradient-to-r from-green-900/50 to-amber-900/50 border-green-800' 
            : 'bg-gradient-to-r from-red-900/50 to-slate-900/50 border-red-800'
          }
        `}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={officer.image} 
                alt={`${officer.rank} ${officer.name}`}
                className="w-16 h-16 rounded-full border-3 border-amber-400 object-cover"
              />
              {success ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {success ? 'Mission Accomplished!' : 'Mission Failed'}
              </h2>
              <p className="text-amber-300">
                {success 
                  ? `Outstanding work, Officer! ${officer.rank} ${officer.name} commends your tactical analysis.`
                  : `Mission incomplete. ${officer.rank} ${officer.name} recommends regrouping and analyzing tactical approach.`
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Rank Up Celebration */}
        {rankUp && showRankUp && (
          <div className="p-6 bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-b border-yellow-800">
            <div className="text-center">
              <div className="text-yellow-400 text-3xl font-bold mb-2 animate-pulse">
                🎖️ PROMOTION! 🎖️
              </div>
              <div className="text-lg text-white mb-4">
                Congratulations on your promotion to {currentRank}!
              </div>
              <div className="flex items-center justify-center gap-4">
                <OfficerRankBadge rank={previousRank} size="medium" />
                <ArrowRight className="w-6 h-6 text-yellow-400" />
                <OfficerRankBadge rank={currentRank} size="medium" />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mission Summary */}
          <div className="bg-slate-800 rounded-lg p-4 border border-amber-700">
            <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Mission Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-amber-300 font-semibold">Puzzle ID</div>
                <div className="text-white font-mono">{puzzle.filename.replace('.json', '')}</div>
              </div>
              <div>
                <div className="text-amber-300 font-semibold">Dataset</div>
                <div className="text-white">{puzzle.dataset}</div>
              </div>
              <div>
                <div className="text-amber-300 font-semibold">Status</div>
                <div className={success ? 'text-green-400' : 'text-red-400'}>
                  {success ? 'COMPLETED' : 'FAILED'}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-amber-700 text-center">
              <div className="text-amber-300 text-sm font-semibold mb-1">Experience</div>
              <div className="text-2xl font-bold text-white">+{experienceEarned}</div>
              <div className="text-xs text-slate-400">XP Earned</div>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-4 border border-amber-700 text-center">
              <div className="text-amber-300 text-sm font-semibold mb-1">Accuracy</div>
              <div className={`text-2xl font-bold ${accuracy === 100 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {accuracy}%
              </div>
              <div className="text-xs text-slate-400">Grid Match</div>
            </div>
            
            {timeSpent && (
              <div className="bg-slate-800 rounded-lg p-4 border border-amber-700 text-center">
                <div className="text-amber-300 text-sm font-semibold mb-1">Time</div>
                <div className="text-2xl font-bold text-white">{formatTime(timeSpent)}</div>
                <div className="text-xs text-slate-400">Duration</div>
              </div>
            )}
            
            <div className="bg-slate-800 rounded-lg p-4 border border-amber-700 text-center">
              <div className="text-amber-300 text-sm font-semibold mb-1">Total Missions</div>
              <div className="text-2xl font-bold text-white">{playerData.completedPuzzles}</div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
          </div>

          {/* Solution Comparison */}
          <div className="bg-slate-800 rounded-lg p-4 border border-amber-700">
            <h3 className="text-amber-400 font-bold mb-4">Solution Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Solution */}
              <div>
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${success ? 'bg-green-400' : 'bg-red-400'}`} />
                  Your Solution
                </h4>
                <OfficerDisplayGrid
                  grid={submittedSolution}
                  cellSize={32}
                  className="mb-2"
                />
                <div className="text-xs text-slate-400">
                  Status: {success ? 'Correct' : 'Incorrect'}
                </div>
              </div>

              {/* Expected Solution */}
              <div>
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  Expected Solution
                </h4>
                <OfficerDisplayGrid
                  grid={expectedSolution}
                  cellSize={32}
                  className="mb-2"
                />
                <div className="text-xs text-slate-400">
                  Target pattern achieved
                </div>
              </div>
            </div>
          </div>

          {/* Current Rank Progress */}
          <div className="bg-slate-800 rounded-lg p-4 border border-amber-700">
            <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Officer Status
            </h3>
            <OfficerRankBadge
              rank={currentRank}
              playerData={playerData}
              showDetails={true}
              size="large"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-800 border-t border-slate-700 flex flex-wrap gap-3 justify-between">
          <div className="flex gap-3">
            {!success && onRetryPuzzle && (
              <button
                onClick={onRetryPuzzle}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Retry Mission
              </button>
            )}
            
            {onNextPuzzle && (
              <button
                onClick={onNextPuzzle}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Next Mission
              </button>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold transition-colors"
          >
            Return to Base
          </button>
        </div>
      </div>
    </div>
  );
}