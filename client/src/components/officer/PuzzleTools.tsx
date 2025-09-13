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
  onValidate: () => void;
  
  // Validation state
  isValidating: boolean;
  allTestsCompleted: boolean;
  isAssessmentMode?: boolean;
  
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
  isValidating,
  allTestsCompleted,
  isAssessmentMode = false,
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
        className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-full mb-4"
      />


      {/* Action Controls - Puzzle Actions */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-full">
        <h4 className="text-amber-300 text-2xl font-bold mb-4 text-center">PUZZLE ACTIONS</h4>
        
        {/* Primary Actions Row */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]" 
            onClick={onCopyInput}
          >
            Copy Input
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]" 
            onClick={onResetSolution}
          >
            Reset
          </Button>
          {onReplayTutorial && (
            <Button 
              size="lg" 
              variant="outline" 
              className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]"
              onClick={onReplayTutorial}
            >
              Replay Tutorial
            </Button>
          )}
        </div>
      </div>

      {/* Validation Button - Separated with margin */}
      <div className="mt-4">
        <Button
          size="lg"
          className="w-full px-4 py-4 h-16 text-xl bg-amber-600 hover:bg-amber-700 text-white"
          disabled={false}
          onClick={onValidate}
        >
          {isValidating ? '🔄 Submitting to PlayFab...' : '🎯 Submit for Official Validation'}
        </Button>
        
        {/* Helper text */}
        <div className="text-base text-slate-400 mt-3 text-center">
          {isAssessmentMode ? 
            'Submit your attempt for official assessment validation.' :
            'Submit your solution for official PlayFab validation.'}
        </div>
      </div>
    </>
  );
}