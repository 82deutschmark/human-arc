/**MISLEADING!!!  THIS IS for displaying puzzle CARDS displaying data, not for solving puzzles!!!
 * Simple Responsive Puzzle Grid
 * 
 * CSS Grid that adapts to screen size:
 * - Mobile: 1 column
 * - Tablet: 2-3 columns  
 * - Desktop: 4+ columns
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OfficerPuzzle } from '@/types/arcTypes';

interface PuzzleGridProps {
  puzzles: OfficerPuzzle[];
  loading?: boolean;
  onSelectPuzzle: (puzzle: OfficerPuzzle) => void;
}

export function PuzzleGrid({ puzzles, loading, onSelectPuzzle }: PuzzleGridProps) {
  
  // Difficulty colors
  const getDifficultyBadge = (difficulty: string) => {
    const colorMap = {
      'impossible': 'bg-red-500 text-white',
      'extremely_hard': 'bg-orange-500 text-white', 
      'very_hard': 'bg-amber-500 text-black',
      'challenging': 'bg-sky-500 text-white'
    };
    
    const displayName = {
      'impossible': 'Impossible',
      'extremely_hard': 'Extremely Hard',
      'very_hard': 'Very Hard', 
      'challenging': 'Challenging'
    };
    
    return {
      className: colorMap[difficulty as keyof typeof colorMap] || 'bg-slate-600',
      label: displayName[difficulty as keyof typeof displayName] || difficulty
    };
  };

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


  // Get analysis quality badge based on arc-explainer metadata
  const getAnalysisQualityBadge = (puzzle: OfficerPuzzle) => {
    const attempts = puzzle.totalExplanations;
    const hasData = attempts > 0;
    
    if (!hasData) return { label: 'No Analysis', className: 'bg-slate-600 text-slate-100' };
    if (attempts >= 50) return { label: 'Extensive', className: 'bg-green-500 text-white' };
    if (attempts >= 20) return { label: 'Well-Analyzed', className: 'bg-cyan-500 text-white' };
    if (attempts >= 5) return { label: 'Analyzed', className: 'bg-sky-500 text-white' };
    return { label: 'Limited Data', className: 'bg-amber-600 text-white' };
  };

  // Get dataset badge style
  const getDatasetBadge = (dataset?: string) => {
    const defaultStyle = { label: 'ARC-AGI', className: 'bg-slate-600 text-slate-100' };
    if (!dataset) return defaultStyle;

    const styleMap: { [key: string]: { label: string; className: string } } = {
      evaluation: { label: 'Evaluation', className: 'bg-amber-500 text-black' },
      training: { label: 'Training', className: 'bg-green-500 text-white' },
      community: { label: 'Community', className: 'bg-purple-500 text-white' },
      evaluation2: { label: 'Eval 2.0', className: 'bg-amber-600 text-white' },
    };

    return styleMap[dataset] || { label: dataset, className: defaultStyle.className };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 lg:gap-6 xl:gap-8">
      {puzzles.map((puzzle) => {
        const difficultyBadge = getDifficultyBadge(puzzle.difficulty);
        const analysisQualityBadge = getAnalysisQualityBadge(puzzle);
        const datasetBadge = getDatasetBadge(puzzle.dataset);

        return (
          <Card
            key={puzzle.id}
            className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-all duration-200 cursor-pointer group min-h-[280px] hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 flex flex-col"
            onClick={() => onSelectPuzzle(puzzle)}
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
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white group-hover:bg-cyan-500 font-semibold text-sm py-2 mt-2 transition-colors"
              >
                Solve Puzzle
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}