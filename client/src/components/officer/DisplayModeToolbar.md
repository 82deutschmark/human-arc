/**
 * 🚫 DEPRECATED COMPONENT - DO NOT USE!
 * 
 * Author: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-22T18:26:14-04:00
 * 
 * ⚠️  DEPRECATION NOTICE ⚠️
 * This component has been superseded by: client/src/components/ui/DisplayModeToolbar.tsx
 * 
 * REASON FOR DEPRECATION:
 * - Part of HARC UI Phase 5 refactor to consolidate shadcn/ui components
 * - This version uses hardcoded colors that violate theme system
 * - New ui/ version supports automatic light/dark mode theming
 * - This file violates architectural boundaries (officer/ folder is deprecated)
 * 
 * REPLACEMENT LOCATION: client/src/components/ui/DisplayModeToolbar.tsx
 * MIGRATION: All imports updated in commit a92b94f8
 * 
 * Original PURPOSE: Toolbar for switching between display modes ('arc-colors', 'emoji', 'hybrid').
 * SRP and DRY check: Pass. Single responsibility: managing display settings for puzzle grid.
 * 
 */

// THIS COMPONENT IS DEPRECATED - USE client/src/components/ui/DisplayModeToolbar.tsx INSTEAD

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
