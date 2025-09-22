/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component arranges a collection of puzzle information cards into a responsive grid layout. It is used to display a browsable list of puzzles to the user.
 * NAMING WARNING: The filename `PuzzleGrid.tsx` is misleading. This component does NOT render the interactive grid for solving a puzzle. Instead, it displays a grid of `PuzzleInfoCard` components. The actual puzzle-solving grid is handled by other components like `ResponsivePuzzleSolver.tsx`.
 * SRP and DRY check: Pass. The component's single responsibility is to create a responsive layout for a list of puzzle cards. It correctly delegates the rendering of individual cards to the `PuzzleInfoCard` component, adhering to SRP.
 */

import { Card, CardContent } from '@/components/ui/card';
import { PuzzleInfoCard } from '@/components/ui/PuzzleInfoCard';
import type { EnhancedPuzzle } from '@/services/core/puzzleRepository';
import type { PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';

interface PuzzleGridProps {
  puzzles: EnhancedPuzzle[];
  loading?: boolean;
  onSelectPuzzle: (puzzle: EnhancedPuzzle) => void;
  attemptStatusMap?: Record<string, PuzzleAttemptStatus>;
}

export function PuzzleGrid({ puzzles, loading, onSelectPuzzle, attemptStatusMap = {} }: PuzzleGridProps) {

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 lg:gap-6 xl:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-slate-800 border-slate-600 min-h-[400px]">
            <CardContent className="p-6 sm:p-8">
              <div className="animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-600 rounded w-16"></div>
                    <div className="h-4 bg-slate-600 rounded w-20"></div>
                  </div>
                  <div className="h-8 bg-slate-600 rounded w-12"></div>
                </div>
                <div className="h-6 bg-slate-600 rounded mb-4 w-24"></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="h-16 bg-slate-600 rounded"></div>
                  <div className="h-16 bg-slate-600 rounded"></div>
                  <div className="h-16 bg-slate-600 rounded"></div>
                  <div className="h-16 bg-slate-600 rounded"></div>
                </div>
                <div className="h-8 bg-slate-600 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (puzzles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-lg mb-2">No puzzles found</div>
        <div className="text-slate-500 text-sm">Try adjusting your filters</div>
      </div>
    );
  }



  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 lg:gap-6 xl:gap-8">
      {puzzles.map((puzzle) => (
        <PuzzleInfoCard
          key={puzzle.id}
          puzzle={puzzle}
          onSelectPuzzle={onSelectPuzzle}
          attemptStatus={attemptStatusMap[puzzle.id] || null}
        />
      ))}
    </div>
  );
}