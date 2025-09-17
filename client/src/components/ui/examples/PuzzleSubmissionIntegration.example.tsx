/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Example integration showing how to replace existing puzzle submission UX with the new PuzzleSubmissionInterface
 * Demonstrates best practices for integrating the component across different puzzle-solving contexts
 * SRP and DRY check: Pass - Example code for educational/reference purposes
 *
 */

import React, { useState, useEffect } from 'react';
import { PuzzleSubmissionInterface, type SubmissionResult } from '../PuzzleSubmissionInterface';
import { PuzzleNotification, PuzzleNotificationPresets } from '../PuzzleNotification';
import { attemptTracker } from '@/services/playfab/attemptTracker';
import { playFabValidation } from '@/services/playfab/validation';

// Example: Integration in ResponsivePuzzleSolver-like component
export function ExamplePuzzleSolver({ puzzle, solutions, onSolutionsChange }: {
  puzzle: any;
  solutions: number[][][];
  onSolutionsChange: (solutions: number[][][]) => void;
}) {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [isLocked, setIsLocked] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Load attempt status on mount
  useEffect(() => {
    const loadAttemptStatus = async () => {
      try {
        const status = await attemptTracker.getPuzzleAttemptStatus(puzzle.id);
        setAttemptsRemaining(status.attemptsRemaining);
        setIsLocked(status.status === 'locked');
      } catch (error) {
        console.error('Failed to load attempt status:', error);
      }
    };

    if (puzzle?.id) {
      loadAttemptStatus();
    }
  }, [puzzle?.id]);

  // Check if all solutions are completed
  const hasValidSolution = solutions.every(solution =>
    solution.length > 0 && solution.every(row => row.length > 0)
  );

  // Handle solution submission
  const handleSubmit = async (): Promise<SubmissionResult> => {
    setIsValidating(true);

    try {
      const result = await playFabValidation.validateARCPuzzle({
        puzzleId: puzzle.id,
        solutions: solutions,
        timeElapsed: Date.now() - startTime, // You'd track this properly
        attemptNumber: 3 - attemptsRemaining, // Calculate current attempt
        sessionId: sessionId, // You'd have this from session management
        stepCount: stepCount // You'd track user actions
      });

      const submissionResult: SubmissionResult = {
        success: result.success,
        correct: result.correct,
        message: result.message || (result.correct ? 'Puzzle solved!' : 'Incorrect solution'),
        scoreData: result.correct ? result : undefined,
        attemptsRemaining: result.attemptsRemaining,
        locked: result.locked
      };

      setLastResult(submissionResult);

      if (submissionResult.attemptsRemaining !== undefined) {
        setAttemptsRemaining(submissionResult.attemptsRemaining);
      }

      if (submissionResult.locked) {
        setIsLocked(true);
      }

      return submissionResult;

    } catch (error) {
      const errorResult: SubmissionResult = {
        success: false,
        correct: false,
        message: 'Validation failed. Please try again.',
      };

      setLastResult(errorResult);
      return errorResult;

    } finally {
      setIsValidating(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    onSolutionsChange(puzzle.test.map(() => [])); // Reset to empty solutions
    setLastResult(null);
  };

  // Handle copy input
  const handleCopyInput = () => {
    const inputCopies = puzzle.test.map((testCase: any) =>
      testCase.input.map((row: number[]) => [...row])
    );
    onSolutionsChange(inputCopies);
  };

  return (
    <div className="space-y-4">

      {/* Existing puzzle grid/interface components would go here */}
      <div className="bg-gray-100 p-4 rounded text-center text-gray-600">
        [Your existing puzzle grid components go here]
      </div>

      {/* Show warning if this is the last attempt */}
      {attemptsRemaining === 1 && !isLocked && (
        <PuzzleNotification
          {...PuzzleNotificationPresets.lastAttemptWarning()}
          dismissible={true}
          onDismiss={() => setShowNotification(false)}
        />
      )}

      {/* Show ARC Prize info for first-time users */}
      {showNotification && (
        <PuzzleNotification
          {...PuzzleNotificationPresets.arcPrizeInfo()}
          dismissible={true}
          onDismiss={() => setShowNotification(false)}
        />
      )}

      {/* NEW: Replace scattered submission controls with unified interface */}
      <PuzzleSubmissionInterface
        onSubmit={handleSubmit}
        onReset={handleReset}
        onCopyInput={handleCopyInput}
        puzzleId={puzzle.id}
        hasValidSolution={hasValidSolution}
        attemptsRemaining={attemptsRemaining}
        isLocked={isLocked}
        isValidating={isValidating}
        lastResult={lastResult}
        helpText={attemptsRemaining === 2 ? "Study the examples to understand the pattern before submitting." : undefined}
        warningText={attemptsRemaining === 1 ? "This is your final attempt!" : undefined}
      />
    </div>
  );
}

// Example: Integration in Assessment mode
export function ExampleAssessmentSolver({ puzzle, currentStep, totalSteps }: {
  puzzle: any;
  currentStep: number;
  totalSteps: number;
}) {
  // Similar state management as above...
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);

  // Assessment-specific submission handler
  const handleAssessmentSubmit = async (): Promise<SubmissionResult> => {
    // Assessment validation logic
    setIsValidating(true);

    try {
      // Your assessment validation logic here
      const result = await validateAssessmentStep(puzzle, solutions);
      return result;
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Assessment puzzle interface */}

      <PuzzleSubmissionInterface
        onSubmit={handleAssessmentSubmit}
        puzzleId={puzzle.id}
        hasValidSolution={true} // Assessment may have different validation
        attemptsRemaining={2} // Or unlimited for assessment
        isLocked={false}
        isValidating={isValidating}
        lastResult={lastResult}
        isAssessmentMode={true}
        assessmentProgress={{
          current: currentStep,
          total: totalSteps
        }}
        submitButtonText="Submit Assessment Step"
        showResetButton={false} // Maybe no reset in assessment
        showCopyButton={false}
        helpText="Take your time to analyze the pattern. Assessment steps are not timed."
      />
    </div>
  );
}

// Example: Integration with existing PuzzleTools component
export function ExamplePuzzleToolsReplacement({
  // ... existing PuzzleTools props
  displayMode,
  emojiSet,
  selectedValue,
  onValueSelect,
  onCopyInput,
  onResetSolution,
  onValidate,
  isValidating,
  allTestsCompleted,
  isLocked,
  attemptsRemaining,
  usedValues
}: any) {

  // Transform existing validation logic to match new interface
  const handleSubmit = async (): Promise<SubmissionResult> => {
    return new Promise((resolve) => {
      onValidate(); // Call existing validation

      // You'd need to capture the result somehow, perhaps through a callback
      // This is a simplified example
      setTimeout(() => {
        resolve({
          success: true,
          correct: allTestsCompleted,
          message: allTestsCompleted ? 'All tests completed!' : 'Some tests failed',
        });
      }, 1000);
    });
  };

  return (
    <div className="space-y-4">

      {/* Keep existing emoji palette or other tools */}
      <div className="existing-tools">
        {/* Your existing EmojiPaletteDivider or other tools */}
      </div>

      {/* Replace the old submit/reset buttons with new interface */}
      <PuzzleSubmissionInterface
        onSubmit={handleSubmit}
        onReset={onResetSolution}
        onCopyInput={onCopyInput}
        puzzleId="puzzle-id" // You'd pass the actual puzzle ID
        hasValidSolution={allTestsCompleted}
        attemptsRemaining={attemptsRemaining || 2}
        isLocked={isLocked || false}
        isValidating={isValidating}
        lastResult={null} // You'd track this based on validation results
        size="md"
      />
    </div>
  );
}

export default ExamplePuzzleSolver;