/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17T21:18:20-04:00
 * Modified: 2025-09-18 - Phase 4.2 Performance Optimizations
 * PURPOSE: This component displays the validation status of the user's solution. It provides clear feedback on success, failure, or errors, and includes controls for submitting or retrying the puzzle.
 * SRP and DRY check: Pass. This component's responsibility is strictly to present validation feedback and actions. It relies on parent components for state and logic, ensuring it remains a dumb presentational component.
 * PERFORMANCE: Wrapped with React.memo and uses useMemo for validation feedback
 */

import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { PuzzleNotification } from '@/components/ui/PuzzleNotification';
import { FailureModal } from '@/components/ui/FailureModal';
import { AttemptCounter } from '@/components/ui/AttemptCounter';
import type { PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';

// This is a simplified interface. The actual state will be more complex.
export interface ValidationState {
  isValidating: boolean;
  validationResult: { correct: boolean; fallback?: boolean; basePoints?: number; speedBonus?: number; efficiencyBonus?: number; finalScore?: number; } | null;
  validationError: string | null;
  showSuccessModal: boolean;
  showFailureModal: boolean;
}

export interface ValidationStatusProps {
  puzzleId: string;
  validationState: ValidationState;
  attemptStatus: PuzzleAttemptStatus | null;
  isAssessmentMode: boolean;
  allTestsCompleted: boolean;
  onSubmit: () => void;
  onRetry: () => void;
  onNextPuzzle?: () => void;
  setShowFailureModal: (show: boolean) => void;
}

export const ValidationStatus = React.memo(({
  puzzleId,
  validationState,
  attemptStatus,
  isAssessmentMode,
  allTestsCompleted,
  onSubmit,
  onRetry,
  onNextPuzzle,
  setShowFailureModal,
}: ValidationStatusProps) => {
  const [, setLocation] = useLocation();

  const handleNavigateToDashboard = () => {
    // Navigate to dashboard to view progress
    setLocation('/dashboard');
  };

  // Memoize validation feedback to prevent unnecessary re-computation
  const validationFeedback = useMemo(() => {
    // For errors and incorrect solutions, we now use modals instead of tiny notifications
    // Only show success notifications inline (modals are handled separately)
    if (validationState.validationResult && validationState.validationResult.correct && !isAssessmentMode) {
      return (
        <PuzzleNotification
          type="success"
          title="Puzzle Solved!"
          message="Excellent work! Your solution has been verified."
          fullWidth={true}
        />
      );
    }

    return null;
  }, [
    validationState.validationResult,
    isAssessmentMode
  ]);

  return (
    <div className="mt-4 w-full flex flex-col items-center space-y-4">
      <div className="w-full max-w-lg">
        {isAssessmentMode && attemptStatus && (
          <AttemptCounter puzzleId={puzzleId} size="lg" className="w-full mb-4" />
        )}
      </div>

      {validationFeedback}

      {/* FailureModal for prominent error feedback */}
      <FailureModal
        open={validationState.showFailureModal}
        onClose={() => setShowFailureModal(false)}
        title={validationState.validationError ? "Validation Error" : "Incorrect Solution"}
        message={
          validationState.validationError
            ? validationState.validationError
            : "One or more test cases failed. Please review your solution and try again."
        }
        puzzleId={puzzleId}
        attemptsRemaining={attemptStatus?.attemptsRemaining ?? 2}
        totalAttempts={2}
        isLocked={attemptStatus?.status === 'locked'}
        onRetry={() => {
          setShowFailureModal(false);
          onRetry();
        }}
        onNavigateToDashboard={handleNavigateToDashboard}
      />

      {/* The main action button logic will be part of PuzzleTools,
          but this component is responsible for displaying the status that informs those actions */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.puzzleId === nextProps.puzzleId &&
    prevProps.validationState.isValidating === nextProps.validationState.isValidating &&
    JSON.stringify(prevProps.validationState.validationResult) === JSON.stringify(nextProps.validationState.validationResult) &&
    prevProps.validationState.validationError === nextProps.validationState.validationError &&
    prevProps.validationState.showSuccessModal === nextProps.validationState.showSuccessModal &&
    prevProps.validationState.showFailureModal === nextProps.validationState.showFailureModal &&
    JSON.stringify(prevProps.attemptStatus) === JSON.stringify(nextProps.attemptStatus) &&
    prevProps.isAssessmentMode === nextProps.isAssessmentMode &&
    prevProps.allTestsCompleted === nextProps.allTestsCompleted &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onRetry === nextProps.onRetry &&
    prevProps.onNextPuzzle === nextProps.onNextPuzzle &&
    prevProps.setShowFailureModal === nextProps.setShowFailureModal
  );
});

ValidationStatus.displayName = 'ValidationStatus';
