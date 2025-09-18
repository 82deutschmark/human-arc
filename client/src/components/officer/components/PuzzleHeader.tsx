/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Header component for puzzle solver interface showing navigation and performance stats.
 * This component extracts the header logic from ResponsivePuzzleSolver.tsx into a focused presentational component.
 * SRP and DRY check: Pass - Single responsibility for puzzle header display
 */

import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import type { PerformanceData } from '@/services/core/arcExplainerClient';

export interface PuzzleHeaderProps {
  puzzle: OfficerTrackPuzzle;
  performanceStats: PerformanceData | null;
  isAssessmentMode: boolean;
  onBack: () => void;
}

export function PuzzleHeader({
  puzzle,
  performanceStats,
  isAssessmentMode,
  onBack
}: PuzzleHeaderProps) {

  const renderBadges = () => {
    if (!performanceStats) return [];

    const badges = [
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

    // Add dangerous overconfidence warning if detected
    if (performanceStats.dangerousOverconfidence) {
      badges.push(
        <Badge key="warning" variant="outline" className="border-red-400 text-red-300 animate-pulse">
          🚨 AI Overconfident
        </Badge>
      );
    }

    return badges;
  };

  return (
    <Navbar
      title="Are you smarter than a Chatbot?"
      badges={renderBadges()}
      showBackButton={true}
      onBack={onBack}
    />
  );
}