/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17T21:18:20-04:00
 * PURPOSE: This component renders the header for the puzzle solver UI. It displays the puzzle title, performance badges, and a back button for navigation.
 * SRP and DRY check: Pass. This component is solely responsible for presenting the header. It is a reusable UI component that receives all its data and functionality via props.
 */

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

export const PuzzleHeader = ({ 
  puzzle,
  performanceStats,
  isAssessmentMode,
  onBack 
}: PuzzleHeaderProps) => {

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
      title={isAssessmentMode ? `Assessment: ${puzzle.id}` : "Are you smarter than a Chatbot?"}
      badges={renderBadges()}
      showBackButton={true}
      onBack={onBack}
    />
  );
};
