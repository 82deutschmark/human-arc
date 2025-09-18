/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: Provides a toolbar for users to switch between different puzzle grid display modes ('arc-colors', 'emoji', 'hybrid') and select an emoji theme. This component is crucial for the Officer and HARC tracks, allowing users to customize their puzzle-solving interface for clarity and accessibility.
 * It interacts with a parent component (like ResponsivePuzzleSolver) by taking the current displayMode and emojiSet as props and calling the onDisplayModeChange and onEmojiSetChange callbacks when the user makes a selection.
 * SRP and DRY check: Pass. This component has a single responsibility: managing the display settings for the puzzle grid. It is self-contained and does not duplicate logic from other components.
 */

import type { DisplayMode } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';
import { getEmojiSetOptions, getEmojiSetDropdownLabel } from '@/constants/spaceEmojis';

interface DisplayModeToolbarProps {
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onEmojiSetChange: (set: EmojiSet) => void;
}

export function DisplayModeToolbar({ displayMode, emojiSet, onDisplayModeChange, onEmojiSetChange }: DisplayModeToolbarProps) {
  return (
    <div className="flex-grow flex justify-center">
      <div className="flex flex-row items-center gap-4 bg-slate-800 border border-slate-700 rounded-lg p-2">
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={() => onDisplayModeChange('arc-colors')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'arc-colors' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            🎨 Colors
          </button>
          <button
            onClick={() => onDisplayModeChange('numbers')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'numbers' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            🔢 Numbers
          </button>
          <button
            onClick={() => onDisplayModeChange('emoji')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'emoji' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            🎭 Emojis
          </button>
          <button
            onClick={() => onDisplayModeChange('hybrid')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'hybrid' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            🔀 Hybrid
          </button>
        </div>
        {(displayMode === 'emoji' || displayMode === 'hybrid') && (
          <div className="flex items-center gap-3">
            <label className="text-slate-300 text-xl font-semibold whitespace-nowrap">Emoji Theme:</label>
            <select
              value={emojiSet}
              onChange={(e) => onEmojiSetChange(e.target.value as EmojiSet)}
              className="bg-slate-700 border border-slate-500 rounded-lg px-4 py-3 text-amber-100 text-xl h-14 min-w-[200px]"
            >
              {getEmojiSetOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {getEmojiSetDropdownLabel(option.value)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
