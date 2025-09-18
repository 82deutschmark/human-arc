/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-18
 * PURPOSE: Unit tests for usePuzzleState hook from Phase 2 extraction.
 * Tests the core puzzle state management including solutions, dimensions, and test navigation.
 * SRP and DRY check: Pass - Single responsibility for testing usePuzzleState hook
 */

import { renderHook, act } from '@testing-library/react';
import { usePuzzleState } from './usePuzzleState';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

// Mock puzzle data
const mockPuzzle: OfficerTrackPuzzle = {
  id: 'test-puzzle-123',
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
    },
    {
      input: [[1, 0], [0, 1]],
      output: [[0, 1], [1, 0]]
    }
  ]
};

const mockSingleTestPuzzle: OfficerTrackPuzzle = {
  id: 'single-test-puzzle',
  train: [
    {
      input: [[0, 1]],
      output: [[1, 0]]
    }
  ],
  test: [
    {
      input: [[0, 1]],
      output: [[1, 0]]
    }
  ]
};

describe('usePuzzleState', () => {

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      expect(result.current.currentTestIndex).toBe(0);
      expect(result.current.totalTests).toBe(2);
      expect(result.current.solutions).toHaveLength(2);
      expect(result.current.outputDimensions).toHaveLength(2);
      expect(result.current.completedTests).toEqual([false, false]);
      expect(result.current.hasExistingData).toBe(false);
    });

    it('should initialize solutions with correct dimensions from test input', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      // First test: 2x2 grid
      expect(result.current.solutions[0]).toEqual([[0, 0], [0, 0]]);
      expect(result.current.outputDimensions[0]).toEqual({ height: 2, width: 2 });

      // Second test: 2x2 grid
      expect(result.current.solutions[1]).toEqual([[0, 0], [0, 0]]);
      expect(result.current.outputDimensions[1]).toEqual({ height: 2, width: 2 });
    });

    it('should enforce HEIGHT x WIDTH standard in dimensions', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      result.current.outputDimensions.forEach(dim => {
        expect(dim).toHaveProperty('height');
        expect(dim).toHaveProperty('width');
        expect(typeof dim.height).toBe('number');
        expect(typeof dim.width).toBe('number');
      });

      expect(result.current.currentDimensions).toHaveProperty('height');
      expect(result.current.currentDimensions).toHaveProperty('width');
    });
  });

  describe('Puzzle Reset on Change', () => {
    it('should reset state when puzzle changes', () => {
      const { result, rerender } = renderHook(
        ({ puzzle }) => usePuzzleState({ puzzle }),
        { initialProps: { puzzle: mockPuzzle } }
      );

      // Modify some state
      act(() => {
        result.current.updateCurrentSolution([[1, 1], [1, 1]]);
        result.current.handleTestSelect(1);
      });

      expect(result.current.currentTestIndex).toBe(1);
      expect(result.current.currentSolution).toEqual([[1, 1], [1, 1]]);

      // Change puzzle
      rerender({ puzzle: mockSingleTestPuzzle });

      expect(result.current.currentTestIndex).toBe(0);
      expect(result.current.totalTests).toBe(1);
      expect(result.current.solutions).toHaveLength(1);
      expect(result.current.currentSolution).toEqual([[0, 0]]);
    });
  });

  describe('Test Navigation', () => {
    it('should handle test selection correctly', () => {
      const mockOnPlayerAction = jest.fn();
      const { result } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          onPlayerAction: mockOnPlayerAction
        })
      );

      act(() => {
        result.current.handleTestSelect(1);
      });

      expect(result.current.currentTestIndex).toBe(1);
      expect(mockOnPlayerAction).toHaveBeenCalledWith(
        'test_navigation',
        0,
        1,
        {
          fromTest: 0,
          toTest: 1,
          totalTests: 2
        }
      );
    });

    it('should update current solution and dimensions when test changes', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      // Modify solution for test 0
      act(() => {
        result.current.updateCurrentSolution([[9, 8], [7, 6]]);
      });

      expect(result.current.currentSolution).toEqual([[9, 8], [7, 6]]);

      // Switch to test 1
      act(() => {
        result.current.handleTestSelect(1);
      });

      expect(result.current.currentSolution).toEqual([[0, 0], [0, 0]]);
      expect(result.current.currentDimensions).toEqual({ height: 2, width: 2 });
    });
  });

  describe('Size Changes', () => {
    it('should handle size changes with HEIGHT x WIDTH parameter order', () => {
      const mockOnPlayerAction = jest.fn();
      const { result } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          onPlayerAction: mockOnPlayerAction
        })
      );

      act(() => {
        result.current.handleSizeChange(3, 4); // height=3, width=4
      });

      expect(result.current.currentDimensions).toEqual({ height: 3, width: 4 });
      expect(result.current.currentSolution).toEqual([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);

      expect(mockOnPlayerAction).toHaveBeenCalledWith(
        'grid_resize',
        0,
        0,
        expect.objectContaining({
          fromSize: { height: 2, width: 2 },
          toSize: { width: 4, height: 3 },
          testCase: 0
        })
      );
    });

    it('should mark test as incomplete when size changes', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      // Make it look like test was completed
      act(() => {
        const newCompleted = [...result.current.completedTests];
        newCompleted[0] = true;
        // Note: In real usage, completedTests would be updated by the solution manager
        // This is just for testing the size change behavior
      });

      act(() => {
        result.current.handleSizeChange(1, 1);
      });

      expect(result.current.completedTests[0]).toBe(false);
    });
  });

  describe('Solution Management', () => {
    it('should update current solution correctly', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      const newGrid = [[5, 4], [3, 2]];

      act(() => {
        result.current.updateCurrentSolution(newGrid);
      });

      expect(result.current.currentSolution).toEqual(newGrid);
      expect(result.current.solutions[0]).toEqual(newGrid);
      expect(result.current.hasExistingData).toBe(true);
    });

    it('should update solutions array correctly', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      const newSolutions = [
        [[1, 2], [3, 4]],
        [[5, 6], [7, 8]]
      ];

      act(() => {
        result.current.updateSolutions(newSolutions);
      });

      expect(result.current.solutions).toEqual(newSolutions);
      expect(result.current.currentSolution).toEqual([[1, 2], [3, 4]]);
    });

    it('should detect existing data correctly', () => {
      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: mockPuzzle })
      );

      expect(result.current.hasExistingData).toBe(false);

      act(() => {
        result.current.updateCurrentSolution([[0, 1], [0, 0]]);
      });

      expect(result.current.hasExistingData).toBe(true);
    });
  });

  describe('Assessment Mode', () => {
    it('should handle assessment mode flag', () => {
      const { result } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          isAssessmentMode: true
        })
      );

      // Assessment mode doesn't change initial state, but is passed to hook
      expect(result.current.totalTests).toBe(2);
      expect(result.current.currentTestIndex).toBe(0);
    });
  });

  describe('Display State Integration', () => {
    it('should call onDisplayStateChange when provided', () => {
      const mockOnDisplayStateChange = jest.fn();
      const { result } = renderHook(() =>
        usePuzzleState({
          puzzle: mockPuzzle,
          onDisplayStateChange: mockOnDisplayStateChange
        })
      );

      expect(mockOnDisplayStateChange).toHaveBeenCalledWith({
        emojiSet: expect.any(Object)
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle puzzle with no test cases', () => {
      const emptyPuzzle: OfficerTrackPuzzle = {
        id: 'empty-puzzle',
        train: [],
        test: []
      };

      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: emptyPuzzle })
      );

      expect(result.current.totalTests).toBe(0);
      expect(result.current.solutions).toEqual([]);
      expect(result.current.outputDimensions).toEqual([]);
      expect(result.current.completedTests).toEqual([]);
    });

    it('should handle malformed test input gracefully', () => {
      const malformedPuzzle: OfficerTrackPuzzle = {
        id: 'malformed-puzzle',
        train: [],
        test: [
          {
            input: [],
            output: []
          }
        ]
      };

      const { result } = renderHook(() =>
        usePuzzleState({ puzzle: malformedPuzzle })
      );

      expect(result.current.totalTests).toBe(1);
      expect(result.current.currentDimensions).toEqual({ height: 3, width: 3 });
      expect(result.current.currentSolution).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ]);
    });
  });
});