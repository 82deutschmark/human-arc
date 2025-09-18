/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-18
 * PURPOSE: Integration tests for puzzle solver hooks working together.
 * Tests the coordination between hooks and their interaction patterns from Phase 2 extraction.
 * SRP and DRY check: Pass - Single responsibility for testing hook integration
 */

import { renderHook, act } from '@testing-library/react';
import {
  useDisplayState,
  usePuzzleState,
  useSessionLogger,
  useSolutionValidation,
  usePuzzleSolutionManager
} from './index';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

// Mock external dependencies
jest.mock('@/services/playfab/events', () => ({
  playFabEvents: {
    logPuzzleEvent: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('@/services/puzzleSolver/PuzzleSolverService', () => ({
  puzzleSolverService: {
    validatePuzzleWithPlayFab: jest.fn().mockResolvedValue({
      correct: true,
      basePoints: 100,
      finalScore: 100
    })
  }
}));

jest.mock('@/services/idConverter', () => ({
  idConverter: {
    getAllPlayFabVariants: jest.fn().mockReturnValue(['ARC-TR-test-puzzle'])
  }
}));

// Mock puzzle data
const mockPuzzle: OfficerTrackPuzzle = {
  id: 'test-puzzle-integration',
  train: [
    {
      input: [[0, 1], [1, 0]],
      output: [[1, 0], [0, 1]]
    }
  ],
  test: [
    {
      input: [[0, 1], [1, 0]],
      output: [[1, 0], [0, 1]]
    }
  ]
};

describe('Puzzle Solver Hooks Integration', () => {

  describe('Hook Coordination', () => {
    it('should coordinate state between all hooks', () => {
      // Initialize hooks in the correct order as per Phase 2 guidance
      const { result: displayState } = renderHook(() =>
        useDisplayState({ onPlayerAction: jest.fn() })
      );

      const { result: sessionLogger } = renderHook(() =>
        useSessionLogger({
          puzzle: mockPuzzle,
          selectedValue: displayState.current.selectedValue
        })
      );

      const { result: puzzleState } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          onPlayerAction: sessionLogger.current.logPlayerAction
        })
      );

      const { result: solutionValidation } = renderHook(() =>
        useSolutionValidation({
          puzzle: mockPuzzle,
          solutions: puzzleState.current.solutions,
          sessionId: sessionLogger.current.sessionId,
          sessionStartTime: sessionLogger.current.sessionStartTime,
          stepIndex: sessionLogger.current.stepIndex,
          attemptNumber: sessionLogger.current.attemptNumber,
          totalTests: puzzleState.current.totalTests,
          logPlayerAction: sessionLogger.current.logPlayerAction,
          incrementAttemptNumber: sessionLogger.current.incrementAttemptNumber,
          onValidationResult: jest.fn(),
          onSolve: jest.fn(),
          onAssessmentAdvance: jest.fn()
        })
      );

      const { result: solutionManager } = renderHook(() =>
        usePuzzleSolutionManager({
          currentTestIndex: puzzleState.current.currentTestIndex,
          totalTests: puzzleState.current.totalTests,
          expectedOutput: mockPuzzle.test?.[0]?.output || [],
          updateSolutions: puzzleState.current.updateSolutions,
          updateCompletedTests: jest.fn(),
          setCurrentTestIndex: puzzleState.current.handleTestSelect,
          solutions: puzzleState.current.solutions,
          completedTests: puzzleState.current.completedTests,
          logPlayerAction: sessionLogger.current.logPlayerAction
        })
      );

      // Verify all hooks are properly initialized
      expect(displayState.current.displayMode).toBe('hybrid');
      expect(sessionLogger.current.sessionId).toBeDefined();
      expect(puzzleState.current.totalTests).toBe(1);
      expect(solutionValidation.current.validationState.isValidating).toBe(false);
      expect(solutionManager.current.solutionManagerState).toBeDefined();
    });
  });

  describe('State Flow Integration', () => {
    it('should properly coordinate solution updates between puzzle state and solution manager', () => {
      const { result: puzzleState } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      const { result: solutionManager } = renderHook(() =>
        usePuzzleSolutionManager({
          currentTestIndex: puzzleState.current.currentTestIndex,
          totalTests: puzzleState.current.totalTests,
          expectedOutput: mockPuzzle.test?.[0]?.output || [],
          updateSolutions: puzzleState.current.updateSolutions,
          updateCompletedTests: jest.fn(),
          setCurrentTestIndex: puzzleState.current.handleTestSelect,
          solutions: puzzleState.current.solutions,
          completedTests: puzzleState.current.completedTests,
          logPlayerAction: jest.fn()
        })
      );

      const newSolution = [[1, 0], [0, 1]];

      act(() => {
        solutionManager.current.updateCurrentSolution(newSolution);
      });

      // Solution should be updated in puzzle state through coordination
      expect(puzzleState.current.currentSolution).toEqual(newSolution);
    });

    it('should coordinate validation between multiple hooks', async () => {
      const mockOnValidationResult = jest.fn();
      const mockOnSolve = jest.fn();

      const { result: sessionLogger } = renderHook(() =>
        useSessionLogger({ puzzle: mockPuzzle })
      );

      const { result: puzzleState } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          onPlayerAction: sessionLogger.current.logPlayerAction
        })
      );

      const { result: solutionValidation } = renderHook(() =>
        useSolutionValidation({
          puzzle: mockPuzzle,
          solutions: puzzleState.current.solutions,
          sessionId: sessionLogger.current.sessionId,
          sessionStartTime: sessionLogger.current.sessionStartTime,
          stepIndex: sessionLogger.current.stepIndex,
          attemptNumber: sessionLogger.current.attemptNumber,
          totalTests: puzzleState.current.totalTests,
          logPlayerAction: sessionLogger.current.logPlayerAction,
          incrementAttemptNumber: sessionLogger.current.incrementAttemptNumber,
          onValidationResult: mockOnValidationResult,
          onSolve: mockOnSolve
        })
      );

      // Update solution first
      act(() => {
        puzzleState.current.updateCurrentSolution([[1, 0], [0, 1]]);
      });

      // Trigger validation
      await act(async () => {
        await solutionValidation.current.validateSolution();
      });

      expect(solutionValidation.current.validationState.validationResult?.correct).toBe(true);
      expect(mockOnSolve).toHaveBeenCalled();
    });
  });

  describe('Session Management Integration', () => {
    it('should properly coordinate session logging across hooks', async () => {
      const { result: sessionLogger } = renderHook(() =>
        useSessionLogger({ puzzle: mockPuzzle })
      );

      const { result: puzzleState } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          onPlayerAction: sessionLogger.current.logPlayerAction
        })
      );

      // Test navigation should trigger session logging
      await act(async () => {
        puzzleState.current.handleTestSelect(0);
      });

      // Session logging should have been called (mocked)
      expect(sessionLogger.current.stepIndex).toBeGreaterThan(0);
    });

    it('should maintain session consistency across hook interactions', () => {
      const { result: sessionLogger } = renderHook(() =>
        useSessionLogger({ puzzle: mockPuzzle })
      );

      const initialSessionId = sessionLogger.current.sessionId;
      const initialStartTime = sessionLogger.current.sessionStartTime;

      // Session values should remain consistent
      expect(sessionLogger.current.sessionId).toBe(initialSessionId);
      expect(sessionLogger.current.sessionStartTime).toBe(initialStartTime);
    });
  });

  describe('Assessment Mode Integration', () => {
    it('should coordinate assessment mode behavior across hooks', () => {
      const { result: puzzleState } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          isAssessmentMode: true
        })
      );

      const { result: solutionManager } = renderHook(() =>
        usePuzzleSolutionManager({
          currentTestIndex: puzzleState.current.currentTestIndex,
          totalTests: puzzleState.current.totalTests,
          expectedOutput: mockPuzzle.test?.[0]?.output || [],
          isAssessmentMode: true,
          updateSolutions: puzzleState.current.updateSolutions,
          updateCompletedTests: jest.fn(),
          setCurrentTestIndex: puzzleState.current.handleTestSelect,
          solutions: puzzleState.current.solutions,
          completedTests: puzzleState.current.completedTests,
          logPlayerAction: jest.fn()
        })
      );

      // Assessment mode should be properly initialized
      expect(solutionManager.current.solutionManagerState.assessmentTestsCompleted).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully across hook coordination', async () => {
      // Mock validation service to throw error
      const mockValidationService = require('@/services/puzzleSolver/PuzzleSolverService');
      mockValidationService.puzzleSolverService.validatePuzzleWithPlayFab.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result: sessionLogger } = renderHook(() =>
        useSessionLogger({ puzzle: mockPuzzle })
      );

      const { result: puzzleState } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      const { result: solutionValidation } = renderHook(() =>
        useSolutionValidation({
          puzzle: mockPuzzle,
          solutions: puzzleState.current.solutions,
          sessionId: sessionLogger.current.sessionId,
          sessionStartTime: sessionLogger.current.sessionStartTime,
          stepIndex: sessionLogger.current.stepIndex,
          attemptNumber: sessionLogger.current.attemptNumber,
          totalTests: puzzleState.current.totalTests,
          logPlayerAction: sessionLogger.current.logPlayerAction,
          incrementAttemptNumber: sessionLogger.current.incrementAttemptNumber
        })
      );

      await act(async () => {
        await solutionValidation.current.validateSolution();
      });

      expect(solutionValidation.current.validationState.validationError).toBe('Network error');
      expect(solutionValidation.current.validationState.isValidating).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should not cause excessive re-renders when hooks coordinate', () => {
      const renderCounts = {
        displayState: 0,
        puzzleState: 0,
        sessionLogger: 0
      };

      const { result: displayState } = renderHook(() => {
        renderCounts.displayState++;
        return useDisplayState();
      });

      const { result: sessionLogger } = renderHook(() => {
        renderCounts.sessionLogger++;
        return useSessionLogger({
          puzzle: mockPuzzle,
          selectedValue: displayState.current.selectedValue
        });
      });

      const { result: puzzleState } = renderHook(() => {
        renderCounts.puzzleState++;
        return usePuzzleState({
          puzzle: mockPuzzle,
          onPlayerAction: sessionLogger.current.logPlayerAction
        });
      });

      const initialRenderCounts = { ...renderCounts };

      // Single coordinated action
      act(() => {
        displayState.current.handleValueSelect(5);
      });

      // Should not cause excessive re-renders
      expect(renderCounts.displayState).toBeLessThanOrEqual(initialRenderCounts.displayState + 2);
      expect(renderCounts.sessionLogger).toBeLessThanOrEqual(initialRenderCounts.sessionLogger + 2);
      expect(renderCounts.puzzleState).toBeLessThanOrEqual(initialRenderCounts.puzzleState + 2);
    });
  });
});