/**
 * Display Mode Toolbar
 * ====================
 * A self-contained toolbar for selecting puzzle display modes and emoji themes.
 * Designed to be placed next to the main test case title.
 * Author: Gemini 2.5 Pro
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
            🔢 Numbers
          </button>
          <button
            onClick={() => onDisplayModeChange('emoji')}
            className={`px-6 py-3 text-xl font-bold rounded-lg transition-all duration-300 ${displayMode === 'emoji' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            🎨 Emojis
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
