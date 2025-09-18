/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Extracted complex solution management logic from ResponsivePuzzleSolver.tsx.
 * This hook handles assessment vs regular mode logic, auto-advance, client-side validation,
 * and assessment guidance. Preserves exact behavior from the original implementation.
 * SRP and DRY check: Pass - Single responsibility for solution update business logic
 */

import { useState, useEffect, useCallback } from 'react';
import type { ARCGrid } from '@/types/arcTypes';

export interface SolutionManagerState {
  // Assessment mode state
  assessmentTestsCompleted: boolean[];
  showNextTestButton: boolean;
  assessmentGuidanceMessage: string;

  // Auto-advance state for regular mode
  isAutoAdvancing: boolean;
  autoAdvanceMessage: string | null;
}

export interface SolutionManagerHook {
  // State
  solutionManagerState: SolutionManagerState;

  // Actions
  updateCurrentSolution: (newGrid: ARCGrid) => void;
  handleNextTest: () => void;
  resetSolutionManagerState: () => void;
}

export interface UseSolutionManagerOptions {
  // Puzzle data
  currentTestIndex: number;
  totalTests: number;
  expectedOutput: ARCGrid;
  isAssessmentMode?: boolean;

  // State setters from other hooks
  updateSolutions: (newSolutions: ARCGrid[]) => void;
  updateCompletedTests: (completed: boolean[]) => void;
  setCurrentTestIndex: (index: number) => void;
  solutions: ARCGrid[];
  completedTests: boolean[];

  // Logging
  logPlayerAction?: (
    eventType: string,
    positionX: number,
    positionY: number,
    payloadSummary: object | null,
    status?: "won" | "fail" | "stop" | "start"
  ) => Promise<void>;
}

/**
 * Solution management hook extracted from ResponsivePuzzleSolver.tsx
 * Copies exact behavior from lines 505-574, 120-122, 75-76, 690-696
 * Handles complex assessment vs regular mode logic with auto-advance
 */
export function usePuzzleSolutionManager(options: UseSolutionManagerOptions): SolutionManagerHook {
  const {
    currentTestIndex,
    totalTests,
    expectedOutput,
    isAssessmentMode = false,
    updateSolutions,
    updateCompletedTests,
    setCurrentTestIndex,
    solutions,
    completedTests,
    logPlayerAction
  } = options;

  // EXACT COPY from lines 120-122: Assessment mode guidance state
  const [assessmentTestsCompleted, setAssessmentTestsCompleted] = useState<boolean[]>([]);
  const [showNextTestButton, setShowNextTestButton] = useState(false);
  const [assessmentGuidanceMessage, setAssessmentGuidanceMessage] = useState<string>('');

  // EXACT COPY from lines 75-76: Auto-advance state for assessment mode
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [autoAdvanceMessage, setAutoAdvanceMessage] = useState<string | null>(null);

  // Reset assessment state when puzzle or mode changes
  useEffect(() => {
    if (isAssessmentMode && totalTests > 0) {
      setAssessmentTestsCompleted(new Array(totalTests).fill(false));
    } else {
      setAssessmentTestsCompleted([]);
    }
    setShowNextTestButton(false);
    setAssessmentGuidanceMessage('');
    setIsAutoAdvancing(false);
    setAutoAdvanceMessage(null);
  }, [totalTests, isAssessmentMode]);

  // EXACT COPY from lines 505-574: Update current solution
  const updateCurrentSolution = useCallback((newGrid: ARCGrid) => {
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    updateSolutions(newSolutions);

    // Assessment mode: guided hand-holding with client-side validation
    if (isAssessmentMode && expectedOutput.length > 0 && totalTests > 1) {
      const matches = JSON.stringify(newGrid) === JSON.stringify(expectedOutput);
      const newAssessmentCompleted = [...assessmentTestsCompleted];
      const wasAlreadyCompleted = newAssessmentCompleted[currentTestIndex];
      newAssessmentCompleted[currentTestIndex] = matches;
      setAssessmentTestsCompleted(newAssessmentCompleted);

      if (matches && !wasAlreadyCompleted) {
        // Show success message and next test button
        if (currentTestIndex < totalTests - 1) {
          setAssessmentGuidanceMessage(`✅ Great! Test ${currentTestIndex + 1} completed. Click 'Next Test' to continue.`);
          setShowNextTestButton(true);
        } else {
          // Last test completed
          setAssessmentGuidanceMessage(`🎉 Excellent! All ${totalTests} tests completed. You can now submit.`);
          setShowNextTestButton(false);
        }
      } else if (!matches) {
        // Reset guidance if solution becomes incorrect
        setAssessmentGuidanceMessage('');
        setShowNextTestButton(false);
      }
    }
    // Regular mode: existing frontend validation logic
    else if (!isAssessmentMode && expectedOutput.length > 0) {
      const matches = JSON.stringify(newGrid) === JSON.stringify(expectedOutput);
      const newCompleted = [...completedTests];
      const wasAlreadyCompleted = newCompleted[currentTestIndex];
      newCompleted[currentTestIndex] = matches;
      updateCompletedTests(newCompleted);

      // Log individual test case completion (only on state change) - regular mode only
      if (matches && !wasAlreadyCompleted && logPlayerAction) {
        logPlayerAction(
          "test_case_complete",
          0,
          currentTestIndex,
          {
            testCase: currentTestIndex,
            totalTests: totalTests,
            correctSolution: true,
            validationType: "frontend_only"
          },
          "won"
        );

        // Auto-advance between test cases within same puzzle (regular mode only)
        if (currentTestIndex < totalTests - 1) {
          console.log(`✅ [useSolutionManager] Test ${currentTestIndex + 1} completed. Auto-advancing to test ${currentTestIndex + 2}...`);

          // Show auto-advance notification
          setIsAutoAdvancing(true);
          setAutoAdvanceMessage(`Test ${currentTestIndex + 1} of ${totalTests} complete! Moving to Test ${currentTestIndex + 2}...`);

          // Auto-advance to next test after a brief delay for user feedback
          setTimeout(() => {
            setCurrentTestIndex(currentTestIndex + 1);
            setIsAutoAdvancing(false);
            setAutoAdvanceMessage(null);
          }, 1500);
        }
      }
    }
  }, [
    solutions,
    currentTestIndex,
    updateSolutions,
    isAssessmentMode,
    expectedOutput,
    totalTests,
    assessmentTestsCompleted,
    completedTests,
    updateCompletedTests,
    setCurrentTestIndex,
    logPlayerAction
  ]);

  // EXACT COPY from lines 690-696: Handle Next Test button for assessment mode
  const handleNextTest = useCallback(() => {
    if (currentTestIndex < totalTests - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
      setShowNextTestButton(false);
      setAssessmentGuidanceMessage('');
    }
  }, [currentTestIndex, totalTests, setCurrentTestIndex]);

  // Reset all solution manager state
  const resetSolutionManagerState = useCallback(() => {
    setAssessmentTestsCompleted([]);
    setShowNextTestButton(false);
    setAssessmentGuidanceMessage('');
    setIsAutoAdvancing(false);
    setAutoAdvanceMessage(null);
  }, []);

  return {
    // State
    solutionManagerState: {
      assessmentTestsCompleted,
      showNextTestButton,
      assessmentGuidanceMessage,
      isAutoAdvancing,
      autoAdvanceMessage
    },

    // Actions
    updateCurrentSolution,
    handleNextTest,
    resetSolutionManagerState
  };
}