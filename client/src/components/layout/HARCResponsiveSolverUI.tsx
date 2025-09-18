/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Enhanced puzzle solver component with improved architecture following SRP and DRY principles.
 * This is a container component that orchestrates puzzle solving through custom hooks and presentational components.
 * Unlike the original ResponsivePuzzleSolver, this component separates concerns into focused, testable modules.
 *
 * PHASE 3: Container component using Phase 2 hooks with 5 focused presentational components.
 * This component fixes the critical UI/UX issues found in ResponsivePuzzleSolver.tsx:
 * - No more misleading green styling for error messages
 * - Proper success/error feedback positioning and clarity
 * - Professional modal handling for success states
 * - Clear assessment mode guidance
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { AssessmentStepSuccessModal } from '@/components/assessment/AssessmentStepSuccessModal';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import { attemptTracker, type PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';
import {
  useDisplayState,
  usePuzzleState,
  useSessionLogger,
  useSolutionValidation,
  usePuzzleSolutionManager
} from '@/hooks/puzzle-solver';

// Import existing components - reuse where possible
import { PuzzleHeader } from '@/components/officer/components/PuzzleHeader';
import { TrainingExamplesSection } from '@/components/officer/TrainingExamplesSection';
import { TestCaseNavigation } from '@/components/officer/TestCaseNavigation';
import { ResponsiveOfficerGrid, ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import { PuzzleSolverControls } from '@/components/officer/PuzzleSolverControls';
import { PuzzleTools } from '@/components/officer/PuzzleTools';
import { DisplayModeToolbar } from '@/components/officer/DisplayModeToolbar';
import { PermanentHintSystem } from '@/components/officer/PermanentHintSystem';
import { GridWithDimensions } from '@/components/officer/GridWithDimensions';
import { AttemptCounter } from '@/components/officer/AttemptCounter';
import { SizeSlider } from '@/components/ui/SizeSlider';
import { Badge } from '@/components/ui/badge';
import { PuzzleNotification } from '@/components/ui/PuzzleNotification';

interface HARCResponsiveSolverUIProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
  tutorialMode?: boolean;
  isAssessmentMode?: boolean;
  onSolve?: () => void;
  onValidationResult?: (result: any) => void;
  onAssessmentAdvance?: () => void;
  hideHeader?: boolean;
}

export function HARCResponsiveSolverUI({
  puzzle,
  onBack,
  tutorialMode = false,
  isAssessmentMode = false,
  onSolve,
  onValidationResult,
  onAssessmentAdvance,
  hideHeader = false
}: HARCResponsiveSolverUIProps) {
  const [, setLocation] = useLocation();
