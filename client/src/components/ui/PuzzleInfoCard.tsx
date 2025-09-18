/**
 * Puzzle Info Card
 * 
 * Reusable UI component to display a rich summary of a puzzle's metadata.
 * Designed for use in grids, lists, or dashboards.
 * 
 * Author: Cascade
 * Date: 2025-09-14
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttemptCounter } from '@/components/ui/AttemptCounter';
import { attemptTracker, type PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';
import type { OfficerPuzzle } from '@/types/arcTypes';

interface PuzzleInfoCardProps {
  puzzle: OfficerPuzzle;
  onSelectPuzzle: (puzzle: OfficerPuzzle) => void;
  attemptStatus?: PuzzleAttemptStatus | null;
}

// Helper functions for badge styling
const getDifficultyBadge = (difficulty: string) => {
  const colorMap = {
    impossible: 'bg-red-500 text-white',
    extremely_hard: 'bg-orange-500 text-white',
    very_hard: 'bg-amber-500 text-black',
    challenging: 'bg-sky-500 text-white',
  };
  const displayName = {
    impossible: 'Impossible',
    extremely_hard: 'Extremely Hard',
    very_hard: 'Very Hard',
    challenging: 'Challenging',
  };
  return {
    className: colorMap[difficulty as keyof typeof colorMap] || 'bg-slate-600',
    label: displayName[difficulty as keyof typeof displayName] || difficulty,
  };
};

const getAnalysisQualityBadge = (puzzle: OfficerPuzzle) => {
  const attempts = puzzle.totalExplanations;
  if (attempts <= 0) return { label: 'No Analysis', className: 'bg-slate-600 text-slate-100' };
  if (attempts >= 40) return { label: 'Extensive', className: 'bg-green-500 text-white' };
  if (attempts >= 20) return { label: 'Well-Analyzed', className: 'bg-cyan-500 text-white' };
  if (attempts >= 5) return { label: 'Minimal', className: 'bg-sky-500 text-white' };
  return { label: 'Limited Data', className: 'bg-amber-600 text-white' };
};

const getDatasetBadge = (dataset?: string) => {
  const defaultStyle = { label: 'ARC AGI', className: 'bg-slate-500 text-white' };
  if (!dataset) return defaultStyle;

  const styleMap: { [key: string]: { label: string; className: string } } = {
    'training': { label: 'ARC 1 Training', className: 'bg-yellow-500 text-black' },
    'evaluation': { label: 'ARC 1 Evaluation', className: 'bg-yellow-600 text-black' },
    'training2': { label: 'ARC 2 Training', className: 'bg-orange-500 text-white' },
    'evaluation2': { label: 'ARC 2 Evaluation', className: 'bg-orange-800 text-white' },
    'community': { label: 'Community', className: 'bg-purple-500 text-white' },
    'arc-agi': { label: 'ARC AGI', className: 'bg-slate-500 text-white' },
  };

  return styleMap[dataset] || { label: dataset.toUpperCase(), className: defaultStyle.className };
};

export function PuzzleInfoCard({ puzzle, onSelectPuzzle, attemptStatus: propAttemptStatus }: PuzzleInfoCardProps) {
  // Use passed attemptStatus prop, or fall back to individual loading if not provided
  const [individualAttemptStatus, setIndividualAttemptStatus] = useState<PuzzleAttemptStatus | null>(null);

  // Load attempt status individually only if not provided as prop
  useEffect(() => {
    if (propAttemptStatus !== undefined) return; // Skip if provided as prop

    const loadAttemptStatus = async () => {
      if (!puzzle?.id) return;

      try {
        const status = await attemptTracker.getPuzzleAttemptStatus(puzzle.id);
        setIndividualAttemptStatus(status);
      } catch (error) {
        console.error(`Failed to load attempt status for ${puzzle.id}:`, error);
        // Set default status on error
        setIndividualAttemptStatus({
          status: 'available',
          attemptsRemaining: 2,
          totalAttempts: 0,
          canAttempt: true,
          lockedAt: null
        });
      }
    };

    loadAttemptStatus();
  }, [puzzle?.id, propAttemptStatus]);

  // Use prop attempt status if available, otherwise use individual loading result
  const attemptStatus = propAttemptStatus !== undefined ? propAttemptStatus : individualAttemptStatus;
  const difficultyBadge = getDifficultyBadge(puzzle.difficulty);
  const analysisQualityBadge = getAnalysisQualityBadge(puzzle);
  const datasetBadge = getDatasetBadge(puzzle.dataset);

  const isLocked = attemptStatus?.status === 'locked';
  const isCompleted = attemptStatus?.status === 'completed';

  const handleCardClick = () => {
    if (!isLocked) {
      onSelectPuzzle(puzzle);
    }
  };

  return (
    <Card
      key={puzzle.id}
      className={`bg-slate-800/50 border-slate-700 transition-all duration-200 min-h-[280px] flex flex-col ${
        isLocked
          ? 'border-red-500/50 cursor-not-allowed opacity-75'
          : 'hover:border-cyan-500 cursor-pointer group hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20'
      } ${isCompleted ? 'border-green-500/50' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 flex flex-col flex-grow">
        {/* Header */}
        <div className="mb-2">
          <div className="text-cyan-300 font-mono text-lg font-bold tracking-tighter truncate">
            {puzzle.id}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge className={`text-xs px-2 py-0.5 ${analysisQualityBadge.className} font-semibold`}>
            {analysisQualityBadge.label}
          </Badge>
          <Badge className={`text-xs px-2 py-0.5 ${difficultyBadge.className} font-semibold`}>
            {difficultyBadge.label}
          </Badge>
          <Badge className={`text-xs px-2 py-0.5 ${datasetBadge.className} font-semibold`}>
            {datasetBadge.label}
          </Badge>
        </div>

        {/* Attempt Status */}
        <div className="mb-3">
          <AttemptCounter
            puzzleId={puzzle.id}
            size="sm"
            showLabel={false}
            className="w-full justify-center"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-slate-700/50 rounded p-1.5">
            <div className="text-slate-400">Success</div>
            <div
              className={`font-bold ${
                puzzle.avgAccuracy === 0
                  ? 'text-red-400'
                  : puzzle.avgAccuracy < 0.5
                  ? 'text-amber-400'
                  : 'text-green-400'
              }`}
            >
              {(puzzle.avgAccuracy * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-700/50 rounded p-1.5">
            <div className="text-slate-400">Attempts</div>
            <div className="font-bold text-sky-300">
              {puzzle.totalExplanations.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded p-1.5">
            <div className="text-slate-400">Confidence</div>
            <div className="font-bold text-sky-300">
              {puzzle.avgConfidence ? `${Math.round(puzzle.avgConfidence)}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded p-1.5">
            <div className="text-slate-400">Grid Size</div>
            <div className="font-bold text-sky-300">{puzzle.gridSize || 'N/A'}</div>
          </div>
        </div>

        {/* Spacer to push button down */}
        <div className="flex-grow"></div>

        {/* Action Button */}
        <Button
          size="sm"
          disabled={isLocked}
          className={`w-full font-semibold text-sm py-2 mt-2 transition-colors ${
            isLocked
              ? 'bg-red-600 text-white cursor-not-allowed'
              : isCompleted
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white group-hover:bg-cyan-500'
          }`}
        >
          {isLocked ? '🔒 Locked' : isCompleted ? '✓ Completed' : 'Solve Puzzle'}
        </Button>
      </CardContent>
    </Card>
  );
}
