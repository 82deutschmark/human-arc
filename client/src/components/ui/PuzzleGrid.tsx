/**
 * Author: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-22 7:52 PM
 * PURPOSE: This component arranges a collection of puzzle information cards into a responsive grid layout. It is used to display a browsable list of puzzles to the user. Migrated from deprecated officer/ folder to ui/ folder as part of HARC UI refactor.
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
  // Loading state with skeleton placeholders
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 lg:gap-6 xl:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-card border-border min-h-[400px]">
            <CardContent className="p-6 sm:p-8">
              <div className="animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-12"></div>
                </div>
                <div className="h-6 bg-muted rounded mb-4 w-24"></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (puzzles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">No puzzles found</div>
        <div className="text-muted-foreground/70 text-sm">Try adjusting your filters</div>
      </div>
    );
  }

  // Main grid layout with responsive columns
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
