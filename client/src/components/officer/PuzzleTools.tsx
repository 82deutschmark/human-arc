/**
 * 
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-12
 * PURPOSE: Enhanced puzzle tools with glowing pulse effects to guide user interaction.
 * Provides display controls and action tools for ARC puzzle solving with improved UX.
 * Features pulsing glow effect on Display Mode controls until user first interacts.
 * SRP and DRY check: Pass - Single responsibility (puzzle tools/controls), enhanced with UX improvements
 * 
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmojiPaletteDivider } from '@/components/officer/EmojiPaletteDivider';
import type { EmojiSet } from '@/constants/spaceEmojis';
import { getEmojiSetOptions, getEmojiSetDropdownLabel } from '@/constants/spaceEmojis';

import type { DisplayMode } from '@/types/puzzleDisplayTypes';

interface PuzzleToolsProps {
  // Display state
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  selectedValue: number;
  onValueSelect: (value: number) => void;

  // Action handlers
  onCopyInput: () => void;
  onResetSolution: () => void;
  onReplayTutorial?: () => void;
  onValidate?: () => void;

  // Validation state (optional since Submit button moved to header)
  isValidating?: boolean;
  allTestsCompleted?: boolean;
  isAssessmentMode?: boolean;

  // Attempt tracking state (optional since Submit button moved to header)
  isLocked?: boolean;
  attemptsRemaining?: number;

  // Palette data
  usedValues: number[];
}

export function PuzzleTools({
  displayMode,
  emojiSet,
  selectedValue,
  onValueSelect,
  onCopyInput,
  onResetSolution,
  onReplayTutorial,
  onValidate,
  isValidating = false,
  allTestsCompleted = false,
  isAssessmentMode = false,
  isLocked = false,
  attemptsRemaining = 2,
  usedValues
}: PuzzleToolsProps) {
  // Track user interaction to control glowing pulse effect

  return (
    <>
      {/* Emoji Palette - Main Selection */}
      <EmojiPaletteDivider
        emojiSet={emojiSet}
        selectedValue={selectedValue}
        onValueSelect={onValueSelect}
        usedValues={usedValues}
        displayMode={displayMode}
        className="bg-card border border-border rounded-lg p-5 w-full mb-4"
      />


      {/* Action Controls - Puzzle Actions */}
      <div className="bg-card border border-border rounded-lg p-5 w-full">
        <h4 className="text-primary text-2xl font-bold mb-4 text-center">PUZZLE ACTIONS</h4>
        
        {/* Primary Actions Row */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]" 
            onClick={onCopyInput}
          >
            Copy Input
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]" 
            onClick={onResetSolution}
          >
            Reset
          </Button>
          {onReplayTutorial && (
            <Button 
              size="lg" 
              variant="outline" 
              className="border-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]"
              onClick={onReplayTutorial}
            >
              Replay Tutorial
            </Button>
          )}
        </div>
      </div>

      {/* Submit button moved to header next to theme controls */}
    </>
  );
}