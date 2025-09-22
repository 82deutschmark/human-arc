/**
 * Author: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-22T18:03:26-04:00
 * PURPOSE: This component renders the header for the puzzle solver UI. It displays the puzzle title, performance badges, and a back button for navigation.
 * Uses shadcn/ui theme variables for proper light/dark mode support.
 * PERFORMANCE: Wrapped with React.memo and uses useMemo for badge computation
 * SRP and DRY check: Pass. This component is solely responsible for presenting the header. It is a reusable UI component that receives all its data and functionality via props.
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
      <Badge key="dataset" variant="outline" className="border-primary/50 text-primary">
        Dataset: {performanceStats.dataset}
      </Badge>,
      <Badge key="accuracy" variant="outline" className="border-success/50 text-success">
        AI Accuracy: {performanceStats.avgAccuracy.toFixed(1)}%
      </Badge>,
      <Badge key="attempts" variant="outline" className="border-secondary/50 text-secondary-foreground">
        AI Attempts: {performanceStats.totalAttempts}
      </Badge>,
    ];

    if (performanceStats.dangerousOverconfidence) {
      badgeList.push(
        <Badge key="warning" variant="outline" className="border-destructive/50 text-destructive animate-pulse">
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

export default PuzzleHeader;
