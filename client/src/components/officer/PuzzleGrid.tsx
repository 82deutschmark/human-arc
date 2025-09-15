/**MISLEADING!!!  THIS IS for displaying puzzle CARDS displaying data, not for solving puzzles!!!
 * Simple Responsive Puzzle Grid
 * 
 * CSS Grid that adapts to screen size:
 * - Mobile: 1 column
 * - Tablet: 2-3 columns  
 * - Desktop: 4+ columns
 */

import { Card, CardContent } from '@/components/ui/card';
import { PuzzleInfoCard } from '@/components/ui/PuzzleInfoCard';
import type { OfficerPuzzle } from '@/types/arcTypes';

interface PuzzleGridProps {
  puzzles: OfficerPuzzle[];
  loading?: boolean;
  onSelectPuzzle: (puzzle: OfficerPuzzle) => void;
}

export function PuzzleGrid({ puzzles, loading, onSelectPuzzle }: PuzzleGridProps) {

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
        />
      ))}
    </div>
  );
}