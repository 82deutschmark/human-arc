/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17T21:18:20-04:00
 * Modified: 2025-09-18 - Phase 4.2 Performance Optimizations
 * PURPOSE: This component renders the header for the puzzle solver UI. It displays the puzzle title, performance badges, and a back button for navigation.
 * SRP and DRY check: Pass. This component is solely responsible for presenting the header. It is a reusable UI component that receives all its data and functionality via props.
 * PERFORMANCE: Wrapped with React.memo and uses useMemo for badge computation
 */

import React, { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import type { PerformanceData } from '@/services/core/arcExplainerClient';

export interface PuzzleHeaderProps {
  puzzle: OfficerTrackPuzzle;
  performanceStats: PerformanceData | null;
  isAssessmentMode: boolean;
  onBack: () => void;
}

export const PuzzleHeader = React.memo(({
  puzzle,
  performanceStats,
  isAssessmentMode,
  onBack
}: PuzzleHeaderProps) => {

  // Memoize badge computation to prevent unnecessary recalculation
  const badges = useMemo(() => {
    if (!performanceStats) return [];

    const badgeList = [
      <Badge key="dataset" variant="outline" className="border-sky-400 text-sky-300">
        Dataset: {performanceStats.dataset}
      </Badge>,
      <Badge key="accuracy" variant="outline" className="border-green-400 text-green-300">
        AI Accuracy: {performanceStats.avgAccuracy.toFixed(1)}%
      </Badge>,
      <Badge key="attempts" variant="outline" className="border-purple-400 text-purple-300">
        AI Attempts: {performanceStats.totalAttempts}
      </Badge>,
    ];

    if (performanceStats.dangerousOverconfidence) {
      badgeList.push(
        <Badge key="warning" variant="outline" className="border-red-400 text-red-300 animate-pulse">
          🚨 AI Overconfident
        </Badge>
      );
    }

    return badgeList;
  }, [performanceStats]);

  // Memoize title computation
  const title = useMemo(() =>
    isAssessmentMode ? `Assessment: ${puzzle.id}` : "Are you smarter than a Chatbot?",
    [isAssessmentMode, puzzle.id]
  );

  return (
    <Navbar
      title={title}
      badges={badges}
      showBackButton={true}
      onBack={onBack}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.puzzle.id === nextProps.puzzle.id &&
    prevProps.performanceStats === nextProps.performanceStats &&
    prevProps.isAssessmentMode === nextProps.isAssessmentMode &&
    prevProps.onBack === nextProps.onBack
  );
});

PuzzleHeader.displayName = 'PuzzleHeader';
