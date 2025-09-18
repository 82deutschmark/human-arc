/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17T21:24:22-04:00
 * PURPOSE: This is the primary container component for the HARC puzzle solver. It follows the principles of SRP and DRY by orchestrating the puzzle-solving experience through a set of focused custom hooks and presentational components. This architecture separates concerns, enhances testability, and improves maintainability over the previous monolithic approach.
 * SRP and DRY check: Pass. This component's sole responsibility is to manage state via hooks and coordinate the flow of data to its child presentational components. It contains no direct business or UI rendering logic.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';
import { attemptTracker, type PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';

// Phase 2 Hooks
import {
  useDisplayState,
  usePuzzleState,
  useSessionLogger,
  useSolutionValidation,
  usePuzzleSolutionManager
} from '@/hooks/puzzle-solver';

// Phase 3 Presentational Components
import { PuzzleHeader } from '@/components/harc-solver/PuzzleHeader';
import { TestCasesView } from '@/components/harc-solver/TestCasesView';
import { SolutionWorkspace } from '@/components/harc-solver/SolutionWorkspace';
import { ValidationStatus } from '@/components/harc-solver/ValidationStatus';

// Shared/Existing Components
import { TrainingExamplesSection } from '@/components/officer/TrainingExamplesSection';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { AssessmentStepSuccessModal } from '@/components/assessment/AssessmentStepSuccessModal';

interface HARCResponsiveSolverUIProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
  isAssessmentMode?: boolean;
  onSolve?: () => void;
  onValidationResult?: (result: any) => void;
  onAssessmentAdvance?: () => void;
  hideHeader?: boolean;
}

export function HARCResponsiveSolverUI({
  puzzle,
  onBack,
  isAssessmentMode = false,
  onSolve,
  onValidationResult,
  onAssessmentAdvance,
  hideHeader = false
}: HARCResponsiveSolverUIProps) {

  // --- STATE MANAGEMENT ---

  const [performanceStats, setPerformanceStats] = useState<PerformanceData | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<PuzzleAttemptStatus | null>(null);

  // --- HOOKS ORCHESTRATION ---

  const displayState = useDisplayState({});
  
  const sessionLogger = useSessionLogger({
    puzzle,
    selectedValue: displayState.selectedValue,
  });

  const puzzleState = usePuzzleState({
    puzzle,
    isAssessmentMode,
    onPlayerAction: sessionLogger.logPlayerAction,
  });

  const solutionValidation = useSolutionValidation({
    puzzle,
    solutions: puzzleState.solutions,
    sessionId: sessionLogger.sessionId,
    sessionStartTime: sessionLogger.sessionStartTime,
    stepIndex: sessionLogger.stepIndex,
    attemptNumber: sessionLogger.attemptNumber,
    totalTests: puzzleState.totalTests,
    isAssessmentMode,
    logPlayerAction: sessionLogger.logPlayerAction,
    incrementAttemptNumber: sessionLogger.incrementAttemptNumber,
    onValidationResult,
    onSolve,
    onAssessmentAdvance,
  });

  const solutionManager = usePuzzleSolutionManager({
    currentTestIndex: puzzleState.currentTestIndex,
    totalTests: puzzleState.totalTests,
    expectedOutput: puzzle.test?.[puzzleState.currentTestIndex]?.output || [],
    isAssessmentMode,
    updateSolutions: puzzleState.updateSolutions,
    updateCompletedTests: puzzleState.updateCompletedTests,
    setCurrentTestIndex: puzzleState.handleTestSelect,
    solutions: puzzleState.solutions,
    completedTests: puzzleState.completedTests,
    logPlayerAction: sessionLogger.logPlayerAction,
  });

  // --- DATA FETCHING ---

  useEffect(() => {
    if (!puzzle?.id) return;
    const fetchStats = async () => {
      const stats = await arcExplainerClient.getPuzzlePerformance(puzzle.id);
      setPerformanceStats(stats);
    };
    const loadAttemptStatus = async () => {
      // Use User Data method to bypass CloudScript authentication issues
      const status = await attemptTracker.getPuzzleAttemptStatusFromUserData(puzzle.id);
      setAttemptStatus(status);
    };

    fetchStats();
    loadAttemptStatus();
  }, [puzzle?.id]);

  // --- DERIVED STATE ---

  const currentTest = puzzle.test?.[puzzleState.currentTestIndex];

  // Memoize current solution for performance
  const currentSolution = useMemo(() =>
    puzzleState.solutions[puzzleState.currentTestIndex] || [],
    [puzzleState.solutions, puzzleState.currentTestIndex]
  );

  // Memoize current dimensions for performance - HEIGHT x WIDTH standard
  const currentDimensions = useMemo(() =>
    puzzleState.outputDimensions[puzzleState.currentTestIndex] || { height: 3, width: 3 },
    [puzzleState.outputDimensions, puzzleState.currentTestIndex]
  );

  // Memoize callback functions to prevent unnecessary re-renders
  const handleCellInteraction = useCallback((row: number, col: number) => {
    const newGrid = [...currentSolution];
    newGrid[row][col] = displayState.selectedValue;
    solutionManager.updateCurrentSolution(newGrid);
  }, [currentSolution, displayState.selectedValue, solutionManager.updateCurrentSolution]);

  const handleCopyInput = useCallback(() => {
    if (currentTest?.input) {
      solutionManager.updateCurrentSolution(currentTest.input.map(row => [...row]));
    }
  }, [currentTest?.input, solutionManager.updateCurrentSolution]);

  const handleResetSolution = useCallback(() => {
    if (currentDimensions) {
      const { height, width } = currentDimensions;
      const emptyGrid = Array(height).fill(null).map(() => Array(width).fill(0));
      solutionManager.updateCurrentSolution(emptyGrid);
    }
  }, [currentDimensions, solutionManager.updateCurrentSolution]);

  const handleHintUsed = useCallback((hintLevel: number, totalHints: number) => {
    sessionLogger.logPlayerAction('hint_used', 0, hintLevel, {
      hintLevel,
      totalHintsUsed: totalHints,
      testCase: puzzleState.currentTestIndex,
      puzzleId: puzzle.id
    });
  }, [sessionLogger.logPlayerAction, puzzleState.currentTestIndex, puzzle.id]);

  const handleRetry = useCallback(() => {
    // TODO: Implement retry logic
    console.log('Retry validation requested');
  }, []);

  if (!puzzle || !currentTest) {
    return <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center">Loading puzzle...</div>;
  }

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      {!hideHeader && (
        <PuzzleHeader
          puzzle={puzzle}
          performanceStats={performanceStats}
          isAssessmentMode={isAssessmentMode}
          onBack={onBack}
        />
      )}

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TrainingExamplesSection
          examples={puzzle.train || []}
          emojiSet={displayState.emojiSet}
          displayMode={displayState.displayMode}
          title="Training Examples - Find the pattern... 🤔"
        />

        <TestCasesView
          totalTests={puzzleState.totalTests}
          currentTestIndex={puzzleState.currentTestIndex}
          completedTests={puzzleState.completedTests}
          onTestSelect={puzzleState.handleTestSelect}
          isAssessmentMode={isAssessmentMode}
        />

        <SolutionWorkspace
          puzzle={puzzle}
          currentTestIndex={puzzleState.currentTestIndex}
          totalTests={puzzleState.totalTests}
          testInput={currentTest.input}
          expectedOutput={currentTest.output}
          trainingExamples={puzzle.train || []}
          currentSolution={currentSolution}
          currentDimensions={currentDimensions}
          displayState={displayState}
          isAssessmentMode={isAssessmentMode}
          allTestsCompleted={solutionManager.allTestsCompleted}
          isValidating={solutionValidation.validationState.isValidating}
          isLocked={attemptStatus?.status === 'locked'}
          attemptsRemaining={attemptStatus?.attemptsRemaining ?? 2}
          onCellInteraction={handleCellInteraction}
          onSizeChange={puzzleState.handleSizeChange}
          onCopyInput={handleCopyInput}
          onResetSolution={handleResetSolution}
          onValidate={solutionValidation.validateSolution}
          onDisplayModeChange={displayState.handleDisplayModeChange}
          onEmojiSetChange={displayState.handleEmojiSetChange}
          onValueSelect={displayState.handleValueSelect}
          onHintUsed={handleHintUsed}
          onAutoResizeGrid={puzzleState.handleSizeChange}
          updateCurrentSolution={solutionManager.updateCurrentSolution}
        />

        <ValidationStatus
          puzzleId={puzzle.id}
          validationState={solutionValidation.validationState}
          attemptStatus={attemptStatus}
          isAssessmentMode={isAssessmentMode}
          allTestsCompleted={solutionManager.allTestsCompleted}
          onSubmit={solutionValidation.validateSolution}
          onRetry={handleRetry}
          setShowFailureModal={solutionValidation.setShowFailureModal}
        />

      </main>

      {isAssessmentMode ? (
        <AssessmentStepSuccessModal
          open={solutionValidation.validationState.showSuccessModal}
          puzzleId={puzzle.id}
          onClose={() => {}}
          onAssessmentAdvance={onAssessmentAdvance}
          fallbackMode={solutionValidation.validationState.validationResult?.fallback || false}
        />
      ) : (
        <SuccessModal
          open={solutionValidation.validationState.showSuccessModal}
          onClose={() => solutionValidation.setShowSuccessModal(false)}
          title="Excellent Work!"
          message="Puzzle solved successfully!"
          puzzleId={puzzle.id}
          scoreDetails={solutionValidation.validationState.validationResult || undefined}
        />
      )}
    </div>
  );
}
