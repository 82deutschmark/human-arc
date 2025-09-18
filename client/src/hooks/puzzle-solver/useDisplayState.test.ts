/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-18
 * PURPOSE: Unit tests for useDisplayState hook from Phase 2 extraction.
 * Tests the display state management functionality including mode changes, emoji set changes, and value selection.
 * SRP and DRY check: Pass - Single responsibility for testing useDisplayState hook
 */

import { renderHook, act } from '@testing-library/react';
import { useDisplayState } from './useDisplayState';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';

describe('useDisplayState', () => {

  describe('Initial State', () => {
    it('should initialize with default display state', () => {
      const { result } = renderHook(() => useDisplayState());

      expect(result.current.displayMode).toBe('hybrid');
      expect(result.current.selectedValue).toBe(1);
      expect(result.current.showControls).toBe(true);
      expect(result.current.emojiSet).toBeDefined();
      expect(result.current.displayState).toEqual({
        displayMode: 'hybrid',
        emojiSet: result.current.emojiSet,
        selectedValue: 1,
        showControls: true,
      });
    });

    it('should provide all required actions', () => {
      const { result } = renderHook(() => useDisplayState());

      expect(typeof result.current.handleDisplayModeChange).toBe('function');
      expect(typeof result.current.handleEmojiSetChange).toBe('function');
      expect(typeof result.current.handleValueSelect).toBe('function');
      expect(typeof result.current.getUsedValues).toBe('function');
    });
  });

  describe('Display Mode Changes', () => {
    it('should update display mode when handleDisplayModeChange is called', () => {
      const { result } = renderHook(() => useDisplayState());

      act(() => {
        result.current.handleDisplayModeChange('numbers');
      });

      expect(result.current.displayMode).toBe('numbers');
      expect(result.current.displayState.displayMode).toBe('numbers');
    });

    it('should call onPlayerAction when provided and display mode changes', async () => {
      const mockOnPlayerAction = jest.fn();
      const { result } = renderHook(() =>
        useDisplayState({ onPlayerAction: mockOnPlayerAction })
      );

      await act(async () => {
        result.current.handleDisplayModeChange('emojis');
      });

      expect(mockOnPlayerAction).toHaveBeenCalledWith(
        'display_mode_change',
        0,
        0,
        {
          fromMode: 'hybrid',
          toMode: 'emojis',
          emojiSet: result.current.emojiSet
        }
      );
    });
  });

  describe('Emoji Set Changes', () => {
    it('should update emoji set when handleEmojiSetChange is called', () => {
      const { result } = renderHook(() => useDisplayState());
      const newEmojiSet: EmojiSet = {
        name: 'test-set',
        emojis: ['🟥', '🟦', '🟩', '🟨', '🟪', '🟫', '⬜', '⬛', '🟧', '🔲']
      };

      act(() => {
        result.current.handleEmojiSetChange(newEmojiSet);
      });

      expect(result.current.emojiSet).toEqual(newEmojiSet);
      expect(result.current.displayState.emojiSet).toEqual(newEmojiSet);
    });

    it('should call onPlayerAction when emoji set changes', async () => {
      const mockOnPlayerAction = jest.fn();
      const { result } = renderHook(() =>
        useDisplayState({ onPlayerAction: mockOnPlayerAction })
      );

      const newEmojiSet: EmojiSet = {
        name: 'test-set',
        emojis: ['🟥', '🟦', '🟩', '🟨', '🟪', '🟫', '⬜', '⬛', '🟧', '🔲']
      };

      await act(async () => {
        result.current.handleEmojiSetChange(newEmojiSet);
      });

      expect(mockOnPlayerAction).toHaveBeenCalledWith(
        'emoji_set_change',
        0,
        0,
        expect.objectContaining({
          fromSet: expect.any(Object),
          toSet: newEmojiSet,
          displayMode: 'hybrid'
        })
      );
    });
  });

  describe('Value Selection', () => {
    it('should update selected value when handleValueSelect is called', () => {
      const { result } = renderHook(() => useDisplayState());

      act(() => {
        result.current.handleValueSelect(5);
      });

      expect(result.current.selectedValue).toBe(5);
      expect(result.current.displayState.selectedValue).toBe(5);
    });

    it('should call onPlayerAction when value is selected', async () => {
      const mockOnPlayerAction = jest.fn();
      const { result } = renderHook(() =>
        useDisplayState({ onPlayerAction: mockOnPlayerAction })
      );

      await act(async () => {
        result.current.handleValueSelect(7);
      });

      expect(mockOnPlayerAction).toHaveBeenCalledWith(
        'palette_selection',
        0,
        0,
        {
          fromValue: 1,
          toValue: 7,
          displayMode: 'hybrid'
        }
      );
    });
  });

  describe('Used Values Calculation', () => {
    it('should calculate used values from grids correctly', () => {
      const { result } = renderHook(() => useDisplayState());

      const trainingExamples = [
        { input: [[0, 1, 2]], output: [[3, 4, 5]] }
      ];
      const testInput = [[6, 7]];
      const expectedOutput = [[8, 9]];

      const usedValues = result.current.getUsedValues(
        trainingExamples,
        testInput,
        expectedOutput
      );

      expect(usedValues).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle empty grids gracefully', () => {
      const { result } = renderHook(() => useDisplayState());

      const usedValues = result.current.getUsedValues([], [], []);

      expect(usedValues).toEqual([]);
    });

    it('should deduplicate values and sort them', () => {
      const { result } = renderHook(() => useDisplayState());

      const trainingExamples = [
        { input: [[5, 1, 5]], output: [[1, 3, 1]] }
      ];
      const testInput = [[3, 5]];
      const expectedOutput = [[1]];

      const usedValues = result.current.getUsedValues(
        trainingExamples,
        testInput,
        expectedOutput
      );

      expect(usedValues).toEqual([1, 3, 5]);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain state consistency across multiple operations', () => {
      const { result } = renderHook(() => useDisplayState());

      act(() => {
        result.current.handleDisplayModeChange('numbers');
        result.current.handleValueSelect(8);
      });

      expect(result.current.displayState).toEqual({
        displayMode: 'numbers',
        emojiSet: result.current.emojiSet,
        selectedValue: 8,
        showControls: true,
      });
    });

    it('should not call onPlayerAction when not provided', () => {
      const { result } = renderHook(() => useDisplayState({}));

      // Should not throw error when onPlayerAction is undefined
      expect(() => {
        act(() => {
          result.current.handleDisplayModeChange('emojis');
        });
      }).not.toThrow();
    });
  });
});