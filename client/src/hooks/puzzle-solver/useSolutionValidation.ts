/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Extracted solution validation state and logic from ResponsivePuzzleSolver.tsx.
 * This hook manages validation state and integrates with PuzzleSolverService from Phase 1.
 * Preserves exact behavior from the original implementation.
 * SRP and DRY check: Pass - Single responsibility for solution validation management
 */

import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import { playFabValidation } from '@/services/playfab/validation';
import { idConverter } from '@/services/idConverter';
import { attemptTracker } from '@/services/playfab/attemptTracker';

export interface ValidationState {
  isValidating: boolean;
  validationResult: any | null;
  validationError: string | null;
  showSuccessModal: boolean;
  showFailureModal: boolean;
}

export interface SolutionValidationHook {
  // State
  validationState: ValidationState;

  // Actions
  validateSolution: () => Promise<void>;
  clearValidationState: () => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowFailureModal: (show: boolean) => void;

  // Computed
  canSubmit: boolean;
}

export interface UseSolutionValidationOptions {
  puzzle: OfficerTrackPuzzle;
  solutions: ARCGrid[];
  sessionId: string;
  sessionStartTime: number;
  stepIndex: number;
  attemptNumber: number;
  totalTests: number;
  isAssessmentMode?: boolean;
  logPlayerAction: (
    eventType: string,
    positionX: number,
    positionY: number,
    payloadSummary: object | null,
    status?: "won" | "fail" | "stop" | "start"
  ) => Promise<void>;
  onValidationResult?: (result: any) => void;
  onSolve?: () => void;
  onAssessmentAdvance?: () => void;
  incrementAttemptNumber: () => void;
}

/**
 * Solution validation hook extracted from ResponsivePuzzleSolver.tsx
 * Integrates with PuzzleSolverService from Phase 1 and manages validation state
 * Copies exact behavior from lines 64-66, 387-502
 */
export function useSolutionValidation(options: UseSolutionValidationOptions): SolutionValidationHook {
  const {
    puzzle,
    solutions,
    sessionId,
    sessionStartTime,
    stepIndex,
    attemptNumber,
    totalTests,
    isAssessmentMode = false,
    logPlayerAction,
    onValidationResult,
    onSolve,
    onAssessmentAdvance,
    incrementAttemptNumber
  } = options;

  const [, setLocation] = useLocation();

  // EXACT COPY from lines 64-66: Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Additional state for success and failure modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  // Convert puzzle ID to PlayFab format - use the first variant (CloudScript will search all batches)
  const playFabVariants = idConverter.getAllPlayFabVariants(puzzle.id);
  const playFabPuzzleId = playFabVariants[0] || puzzle.id;

  // Determine if submission is allowed
  const canSubmit = solutions.length > 0 && !isValidating;

  // EXTRACTED from lines 387-502: Validate puzzle with PlayFab using PuzzleSolverService
  const validateSolution = useCallback(async () => {
    if (isValidating) return; // Prevent double submission

    setIsValidating(true);
    setValidationError(null);

    try {
      // REMOVE PRE-VALIDATION ATTEMPT CHECKING - Let PlayFab handle this like the working component does

      // Create validation arguments exactly like the working ResponsivePuzzleSolver component
      const validationStartTime = Date.now();
      const timeElapsedInSeconds = Math.floor((validationStartTime - sessionStartTime) / 1000);

      console.log(`[useSolutionValidation] Validation for ${puzzle.id}:\n  Start Time: ${sessionStartTime}\n  End Time:   ${validationStartTime}\n  Elapsed (s): ${timeElapsedInSeconds}`);

      const validationArgs = {
        puzzleId: playFabPuzzleId,
        solutions: solutions,
        timeElapsed: timeElapsedInSeconds,
        attemptNumber: attemptNumber,
        stepCount: Math.max(stepIndex, 1), // Ensure stepCount is at least 1
        sessionId: sessionId
      };

      console.log('🚀 [useSolutionValidation] Sending to CloudScript:', JSON.stringify(validationArgs, null, 2));

      // Call PlayFab validation directly like the working component does
      const result = await playFabValidation.validateARCPuzzle(validationArgs);

      // Increment attempt number for the next try
      incrementAttemptNumber();

      setValidationResult(result);

      console.log('✅ [useSolutionValidation] PlayFab validation result:', result);

      // Show success modal for correct answers, failure modal for incorrect (but not locked)
      if (result?.correct) {
        setShowSuccessModal(true);
      } else if (result?.locked) {
        // For locked puzzles, don't show failure modal - redirect immediately to dashboard
        console.log('🔒 [useSolutionValidation] Puzzle is locked, redirecting to dashboard...');
        // Trigger immediate navigation to dashboard
        setLocation('/dashboard');
      } else {
        // Show failure modal for incorrect attempts that aren't locked
        setShowFailureModal(true);
      }

      // In assessment mode, use validation result callback for advancement logic
      if (isAssessmentMode) {
        if (onValidationResult) {
          console.log('📝 [useSolutionValidation] Assessment mode: Calling onValidationResult with:', result);
          onValidationResult(result);
        } else {
          console.error('⚠️ [useSolutionValidation] Assessment mode but no onValidationResult callback provided!');
        }
      }

      // In regular mode, use original onSolve logic
      if (!isAssessmentMode && result?.correct && onSolve) {
        console.log('✅ [useSolutionValidation] Regular mode: Puzzle solved, calling onSolve callback.');
        onSolve();
      }

    } catch (error: any) {
      console.error('❌ [useSolutionValidation] Validation error:', error);
      setValidationError(error.message || 'Validation failed');
      setShowFailureModal(true);
    } finally {
      setIsValidating(false);
    }
  }, [
    isValidating,
    puzzle,
    solutions,
    sessionId,
    sessionStartTime,
    stepIndex,
    attemptNumber,
    playFabPuzzleId,
    totalTests,
    isAssessmentMode,
    logPlayerAction,
    incrementAttemptNumber,
    onValidationResult,
    onSolve
  ]);

  // Clear validation state (useful for puzzle changes)
  const clearValidationState = useCallback(() => {
    setValidationResult(null);
    setValidationError(null);
    setIsValidating(false);
    setShowSuccessModal(false);
    setShowFailureModal(false);
  }, []);

  return {
    // State
    validationState: {
      isValidating,
      validationResult,
      validationError,
      showSuccessModal,
      showFailureModal
    },

    // Actions
    validateSolution,
    clearValidationState,
    setShowSuccessModal,
    setShowFailureModal,

    // Computed
    canSubmit
  };
}