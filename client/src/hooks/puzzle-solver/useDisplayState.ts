/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Extracted display state management from ResponsivePuzzleSolver.tsx.
 * This hook manages puzzle display preferences including display mode, emoji sets,
 * and selected values. Preserves exact behavior from the original implementation.
 * SRP and DRY check: Pass - Single responsibility for display state management
 */

import { useState, useCallback } from 'react';
import type { DisplayMode, PuzzleDisplayState } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';
import type { ARCGrid } from '@/types/arcTypes';
import { getRandomEmojiSet } from '@/constants/spaceEmojis';

export interface UseDisplayStateReturn {
  // State
  displayState: PuzzleDisplayState;

  // Actions
  handleDisplayModeChange: (mode: DisplayMode) => void;
  handleEmojiSetChange: (emojiSet: EmojiSet) => void;
  handleValueSelect: (value: number) => void;
  getUsedValues: (trainingExamples: any[], testInput: ARCGrid, expectedOutput: ARCGrid) => number[];

  // Direct state access for convenience
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  selectedValue: number;
  showControls: boolean;
}

export interface UseDisplayStateOptions {
  onPlayerAction?: (
    eventType: string,
    positionX: number,
    positionY: number,
    payloadSummary: object | null
  ) => Promise<void>;
}

/**
 * Display state management hook extracted from ResponsivePuzzleSolver.tsx
 * Copies exact behavior from lines 56-61, 577-626, 651-666
 */
export function useDisplayState(options: UseDisplayStateOptions = {}): UseDisplayStateReturn {
  const { onPlayerAction } = options;

  // EXACT COPY from lines 56-61: Enhanced display state - randomize emoji set for variety
  const [displayState, setDisplayState] = useState<PuzzleDisplayState>({
    displayMode: 'hybrid',
    emojiSet: getRandomEmojiSet(),
    selectedValue: 1,
    showControls: true,
  });

  // EXACT COPY from lines 577-592: Enhanced display control handlers
  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    const oldMode = displayState.displayMode;
    setDisplayState(prev => ({ ...prev, displayMode: mode }));

    // Log display mode change event
    if (onPlayerAction) {
      onPlayerAction(
        "display_mode_change",
        0,
        0,
        {
          fromMode: oldMode,
          toMode: mode,
          emojiSet: displayState.emojiSet
        }
      );
    }
  }, [displayState.displayMode, displayState.emojiSet, onPlayerAction]);

  // EXACT COPY from lines 594-609
  const handleEmojiSetChange = useCallback((emojiSet: EmojiSet) => {
    const oldEmojiSet = displayState.emojiSet;
    setDisplayState(prev => ({ ...prev, emojiSet }));

    // Log emoji set change event
    if (onPlayerAction) {
      onPlayerAction(
        "emoji_set_change",
        0,
        0,
        {
          fromSet: oldEmojiSet,
          toSet: emojiSet,
          displayMode: displayState.displayMode
        }
      );
    }
  }, [displayState.emojiSet, displayState.displayMode, onPlayerAction]);

  // EXACT COPY from lines 611-626
  const handleValueSelect = useCallback((value: number) => {
    const oldValue = displayState.selectedValue;
    setDisplayState(prev => ({ ...prev, selectedValue: value }));

    // Log palette value selection event
    if (onPlayerAction) {
      onPlayerAction(
        "palette_selection",
        0,
        0,
        {
          fromValue: oldValue,
          toValue: value,
          displayMode: displayState.displayMode
        }
      );
    }
  }, [displayState.selectedValue, displayState.displayMode, onPlayerAction]);

  // EXACT COPY from lines 651-666: Get values used in current puzzle for palette highlighting
  const getUsedValues = useCallback((
    trainingExamples: any[],
    testInput: ARCGrid,
    expectedOutput: ARCGrid
  ): number[] => {
    const allGrids = [
      ...trainingExamples.flatMap(ex => [ex.input, ex.output]),
      testInput,
      expectedOutput
    ].filter(grid => grid.length > 0);

    const usedValues = new Set<number>();
    allGrids.forEach(grid => {
      grid.forEach(row => {
        row.forEach(cell => usedValues.add(cell));
      });
    });

    return Array.from(usedValues).sort((a, b) => a - b);
  }, []);

  return {
    // State
    displayState,

    // Actions
    handleDisplayModeChange,
    handleEmojiSetChange,
    handleValueSelect,
    getUsedValues,

    // Direct access for convenience
    displayMode: displayState.displayMode,
    emojiSet: displayState.emojiSet,
    selectedValue: displayState.selectedValue,
    showControls: displayState.showControls,
  };
}