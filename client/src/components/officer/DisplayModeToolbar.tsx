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
      <div className="flex flex-row items-center gap-4 bg-card border border-border rounded-lg p-2">
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={() => onDisplayModeChange('arc-colors')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'arc-colors' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            🎨 Colors
          </button>
          <button
            onClick={() => onDisplayModeChange('numbers')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'numbers' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            🔢 Numbers
          </button>
          <button
            onClick={() => onDisplayModeChange('emoji')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'emoji' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            🎭 Emojis
          </button>
          <button
            onClick={() => onDisplayModeChange('hybrid')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'hybrid' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            🔀 Hybrid
          </button>
        </div>
        {(displayMode === 'emoji' || displayMode === 'hybrid') && (
          <div className="flex items-center gap-3">
            <label className="text-foreground text-xl font-semibold whitespace-nowrap">Emoji Theme:</label>
            <select
              value={emojiSet}
              onChange={(e) => onEmojiSetChange(e.target.value as EmojiSet)}
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-xl h-14 min-w-[200px]"
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
