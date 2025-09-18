/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Extracted puzzle state management from ResponsivePuzzleSolver.tsx.
 * This hook manages core puzzle-solving state including solutions, dimensions, test navigation,
 * and puzzle resets. Preserves exact behavior from the original implementation.
 * SRP and DRY check: Pass - Single responsibility for puzzle state management
 * CRITICAL: Follows height x width standard throughout
 */

import { useState, useEffect, useCallback } from 'react';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import type { PuzzleDisplayState } from '@/types/puzzleDisplayTypes';
import { getRandomEmojiSet } from '@/constants/spaceEmojis';

export interface PuzzleStateHook {
  // Core state
  currentTestIndex: number;
  solutions: ARCGrid[];
  outputDimensions: Array<{height: number; width: number}>; // HEIGHT x WIDTH standard
  completedTests: boolean[];

  // Computed values
  currentSolution: ARCGrid;
  currentDimensions: {height: number; width: number}; // HEIGHT x WIDTH standard
  hasExistingData: boolean;
  totalTests: number;

  // Actions
  handleTestSelect: (testIndex: number) => void;
  handleSizeChange: (newHeight: number, newWidth: number) => void; // HEIGHT x WIDTH parameter order
  updateSolutions: (newSolutions: ARCGrid[]) => void;
  updateCurrentSolution: (newGrid: ARCGrid) => void;
}

export interface UsePuzzleStateOptions {
  puzzle: OfficerTrackPuzzle;
  isAssessmentMode?: boolean;
  onPlayerAction?: (
    eventType: string,
    positionX: number,
    positionY: number,
    payloadSummary: object | null
  ) => Promise<void>;
  onDisplayStateChange?: (updates: Partial<PuzzleDisplayState>) => void;
}

/**
 * Puzzle state management hook extracted from ResponsivePuzzleSolver.tsx
 * Copies exact behavior from lines 50-53, 140-191, 331-378
 * ENFORCES HEIGHT x WIDTH standard throughout
 */
export function usePuzzleState(options: UsePuzzleStateOptions): PuzzleStateHook {
  const { puzzle, isAssessmentMode = false, onPlayerAction, onDisplayStateChange } = options;

  // EXACT COPY from lines 50-53: Multi-test case state
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [solutions, setSolutions] = useState<ARCGrid[]>([]);
  const [outputDimensions, setOutputDimensions] = useState<Array<{height: number; width: number}>>([]);
  const [completedTests, setCompletedTests] = useState<boolean[]>([]);

  const totalTests = puzzle.test?.length || 0;

  // EXACT COPY from lines 381-383: Get current solution for active test
  const currentSolution = solutions[currentTestIndex] || [];
  const currentDimensions = outputDimensions[currentTestIndex] || { height: 3, width: 3 }; // HEIGHT x WIDTH standard
  const hasExistingData = currentSolution.some(row => row.some(cell => cell !== 0));

  // EXACT COPY from lines 140-191: Reset component state when the puzzle prop changes
  useEffect(() => {
    console.log(`[usePuzzleState] New puzzle received: ${puzzle.id}. Resetting puzzle state.`);
    setCurrentTestIndex(0);
    setSolutions([]);
    setOutputDimensions([]);
    setCompletedTests([]);

    // Randomize emoji set for each new puzzle (if display state handler provided)
    if (onDisplayStateChange) {
      onDisplayStateChange({
        emojiSet: getRandomEmojiSet()
      });
    }

    if (puzzle.test && puzzle.test.length > 0) {
      const newSolutions: ARCGrid[] = [];
      const newDimensions: Array<{height: number; width: number}> = []; // HEIGHT x WIDTH standard
      const newCompleted: boolean[] = [];

      puzzle.test.forEach((test) => {
        const inputHeight = test.input?.length || 3;
        const inputWidth = test.input?.[0]?.length || 3;
        const emptyGrid = Array(inputHeight).fill(null).map(() => Array(inputWidth).fill(0));

        newSolutions.push(emptyGrid);
        newDimensions.push({ height: inputHeight, width: inputWidth }); // HEIGHT x WIDTH standard
        newCompleted.push(false);
      });

      setSolutions(newSolutions);
      setOutputDimensions(newDimensions);
      setCompletedTests(newCompleted);
    }
  }, [puzzle.id, onDisplayStateChange]);

  // EXACT COPY from lines 331-360: Handle output size change for current test
  const handleSizeChange = useCallback((newHeight: number, newWidth: number) => {
    const oldDimensions = outputDimensions[currentTestIndex];

    const newDimensions = [...outputDimensions];
    newDimensions[currentTestIndex] = { height: newHeight, width: newWidth }; // HEIGHT x WIDTH standard
    setOutputDimensions(newDimensions);

    // Create new empty grid with new dimensions
    const newGrid = Array(newHeight).fill(null).map(() => Array(newWidth).fill(0));
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    setSolutions(newSolutions);

    // Mark as incomplete since we reset the solution
    const newCompleted = [...completedTests];
    newCompleted[currentTestIndex] = false;
    setCompletedTests(newCompleted);

    // Log grid size change event
    if (onPlayerAction) {
      onPlayerAction(
        "grid_resize",
        0,
        currentTestIndex,
        {
          fromSize: oldDimensions,
          toSize: { width: newWidth, height: newHeight },
          testCase: currentTestIndex
        }
      );
    }
  }, [outputDimensions, currentTestIndex, solutions, completedTests, onPlayerAction]);

  // EXACT COPY from lines 363-378: Handle test case selection
  const handleTestSelect = useCallback((testIndex: number) => {
    const oldTestIndex = currentTestIndex;
    setCurrentTestIndex(testIndex);

    // Log test case navigation event
    if (onPlayerAction) {
      onPlayerAction(
        "test_navigation",
        0,
        testIndex,
        {
          fromTest: oldTestIndex,
          toTest: testIndex,
          totalTests: totalTests
        }
      );
    }
  }, [currentTestIndex, totalTests, onPlayerAction]);

  // Additional convenience methods for managing solutions
  const updateSolutions = useCallback((newSolutions: ARCGrid[]) => {
    setSolutions(newSolutions);
  }, []);

  const updateCurrentSolution = useCallback((newGrid: ARCGrid) => {
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    setSolutions(newSolutions);
  }, [solutions, currentTestIndex]);

  return {
    // Core state
    currentTestIndex,
    solutions,
    outputDimensions,
    completedTests,

    // Computed values
    currentSolution,
    currentDimensions,
    hasExistingData,
    totalTests,

    // Actions
    handleTestSelect,
    handleSizeChange,
    updateSolutions,
    updateCurrentSolution,
  };
}