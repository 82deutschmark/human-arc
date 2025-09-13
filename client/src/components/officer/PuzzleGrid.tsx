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
      'impossible': 'bg-red-600 text-white',
      'extremely_hard': 'bg-orange-600 text-white', 
      'very_hard': 'bg-yellow-600 text-black',
      'challenging': 'bg-blue-600 text-white'
    };
    
    const displayName = {
      'impossible': 'Impossible',
      'extremely_hard': 'Extremely Hard',
      'very_hard': 'Very Hard', 
      'challenging': 'Challenging'
    };
    
    return {
      className: colorMap[difficulty as keyof typeof colorMap] || 'bg-gray-600',
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
    
    if (!hasData) return { label: 'No Analysis', className: 'bg-gray-600 text-white' };
    if (attempts >= 50) return { label: 'Extensively Analyzed', className: 'bg-green-600 text-white' };
    if (attempts >= 20) return { label: 'Well Analyzed', className: 'bg-blue-600 text-white' };
    if (attempts >= 5) return { label: 'Analyzed', className: 'bg-orange-600 text-white' };
    return { label: 'Limited Data', className: 'bg-red-600 text-white' };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 lg:gap-6 xl:gap-8">
      {puzzles.map((puzzle) => {
        const difficultyBadge = getDifficultyBadge(puzzle.difficulty);
        const analysisQualityBadge = getAnalysisQualityBadge(puzzle);
        
        return (
          <Card 
            key={puzzle.id}
            className="bg-slate-800 border-slate-600 hover:border-amber-500 transition-all duration-200 cursor-pointer group min-h-[280px] hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20"
            onClick={() => onSelectPuzzle(puzzle)}
          >
            <CardContent className="p-3 lg:p-4">
              {/* Puzzle ID - Most prominent */}
              <div className="mb-2">
                <div className="text-amber-200 font-mono text-lg lg:text-xl font-bold tracking-wide truncate">
                  {puzzle.id}
                </div>
              </div>

              {/* Analysis Badges - Horizontal layout */}
              <div className="flex flex-wrap gap-1 lg:gap-2 mb-2">
                <Badge className={`text-xs px-1 py-0.5 lg:px-2 lg:py-1 ${analysisQualityBadge.className} font-semibold`}>
                  🤖 {analysisQualityBadge.label}
                </Badge>
                <Badge className={`text-xs px-1 py-0.5 lg:px-2 lg:py-1 ${difficultyBadge.className}`}>
                  💀 {difficultyBadge.label}
                </Badge>
              </div>

              {/* Puzzle Structure Badges - Horizontal layout */}
              <div className="flex flex-wrap gap-1 lg:gap-2 mb-3">
                <Badge className="text-xs px-1 py-0.5 lg:px-2 lg:py-1 bg-blue-600 text-white">
                  📐 {puzzle.gridSize || 'unknown'}
                </Badge>
                <Badge className="text-xs px-1 py-0.5 lg:px-2 lg:py-1 bg-purple-600 text-white">
                  📊 {puzzle.dataset || 'arc-agi'}
                </Badge>
              </div>

              {/* AI Performance Section */}
              <div className="mb-2">
                <div className="text-amber-300 text-xs lg:text-sm font-semibold mb-1 lg:mb-2">🤖 AI Performance</div>
                <div className="grid grid-cols-2 gap-1 lg:gap-2">
                  <div className="bg-slate-700 rounded p-1 lg:p-2">
                    <div className="text-xs text-slate-400 mb-0.5 lg:mb-1">Success Rate</div>
                    <div className={`text-xs lg:text-sm font-bold ${
                      puzzle.avgAccuracy === 0 ? 'text-red-400' :
                      puzzle.avgAccuracy <= 0.25 ? 'text-orange-400' :
                      puzzle.avgAccuracy <= 0.50 ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      {puzzle.avgAccuracy === 0 ? 'Never' : `${(puzzle.avgAccuracy * 100).toFixed(0)}%`}
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded p-1 lg:p-2">
                    <div className="text-xs text-slate-400 mb-0.5 lg:mb-1">Attempts</div>
                    <div className="text-xs lg:text-sm font-bold text-amber-400">
                      {puzzle.totalExplanations}
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded p-1 lg:p-2">
                    <div className="text-xs text-slate-400 mb-0.5 lg:mb-1">Confidence</div>
                    <div className="text-xs lg:text-sm font-bold text-cyan-400">
                      {puzzle.avgConfidence ? `${Math.round(puzzle.avgConfidence)}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded p-1 lg:p-2">
                    <div className="text-xs text-slate-400 mb-0.5 lg:mb-1">Failures</div>
                    <div className="text-xs lg:text-sm font-bold text-purple-400">
                      {puzzle.wrongCount?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Puzzle Structure Section */}
              <div className="mb-2 lg:mb-3">
                <div className="text-amber-300 text-xs lg:text-sm font-semibold mb-1 lg:mb-2">🧩 Puzzle Structure</div>
                <div className="grid grid-cols-3 gap-1 lg:gap-2">
                  <div className="bg-slate-700 rounded p-1 lg:p-2">
                    <div className="text-xs text-slate-400 mb-0.5 lg:mb-1">Test Cases</div>
                    <div className="text-xs lg:text-sm font-bold text-cyan-400">
                      {puzzle.testCaseCount || 1}
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded p-1 lg:p-2">
                    <div className="text-xs text-slate-400 mb-0.5 lg:mb-1">Examples</div>
                    <div className="text-xs lg:text-sm font-bold text-green-400">
                      {puzzle.trainingExampleCount || 3}
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded p-1 lg:p-2">
                    <div className="text-xs text-slate-400 mb-0.5 lg:mb-1">Feedback</div>
                    <div className="text-xs lg:text-sm font-bold text-pink-400">
                      {puzzle.totalFeedback ? `${puzzle.negativeFeedback || 0}/${puzzle.totalFeedback}` : '0/0'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button - Compact and prominent */}
              <Button 
                size="sm" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-slate-900 group-hover:bg-amber-500 font-semibold text-xs lg:text-sm py-2 lg:py-3 mt-2"
              >
                🎯 Accept Challenge
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}