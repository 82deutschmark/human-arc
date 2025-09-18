/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17T21:18:20-04:00
 * PURPOSE: This component displays the validation status of the user's solution. It provides clear feedback on success, failure, or errors, and includes controls for submitting or retrying the puzzle.
 * SRP and DRY check: Pass. This component's responsibility is strictly to present validation feedback and actions. It relies on parent components for state and logic, ensuring it remains a dumb presentational component.
 */

import { PuzzleNotification } from '@/components/ui/PuzzleNotification';
import { AttemptCounter } from '@/components/officer/AttemptCounter';
import type { PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';

// This is a simplified interface. The actual state will be more complex.
export interface ValidationState {
  isValidating: boolean;
  validationResult: { correct: boolean; fallback?: boolean; basePoints?: number; speedBonus?: number; efficiencyBonus?: number; finalScore?: number; } | null;
  validationError: string | null;
  showSuccessModal: boolean;
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
}

export const ValidationStatus = ({
  puzzleId,
  validationState,
  attemptStatus,
  isAssessmentMode,
  allTestsCompleted,
  onSubmit,
  onRetry,
  onNextPuzzle,
}: ValidationStatusProps) => {

  const renderValidationFeedback = () => {
    if (validationState.validationError) {
      return (
        <PuzzleNotification
          type="error"
          title="Validation Error"
          message={validationState.validationError}
          fullWidth={true}
        />
      );
    }

    if (validationState.validationResult && !validationState.validationResult.correct) {
      return (
        <PuzzleNotification
          type="error"
          title="Incorrect Solution"
          message="One or more test cases failed. Please review your solution and try again."
          fullWidth={true}
        />
      );
    }

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
  };

  return (
    <div className="mt-4 w-full flex flex-col items-center space-y-4">
      <div className="w-full max-w-lg">
        {isAssessmentMode && attemptStatus && (
          <AttemptCounter puzzleId={puzzleId} size="lg" className="w-full mb-4" />
        )}
      </div>
      
      {renderValidationFeedback()}

      {/* The main action button logic will be part of PuzzleTools, 
          but this component is responsible for displaying the status that informs those actions */}
    </div>
  );
};
