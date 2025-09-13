/**
 * Display Mode Controls
 * =====================
 * A dedicated component for rendering the display mode buttons in a horizontal layout.
 * This component is used in the main puzzle solver view next to the test case title.
 * Author: Gemini 2.5 Pro
 */

import type { DisplayMode } from '@/types/puzzleDisplayTypes';

interface DisplayModeControlsProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

export function DisplayModeControls({ displayMode, onDisplayModeChange }: DisplayModeControlsProps) {
  return (
    <div className="flex flex-row gap-2 items-center">
      <button
        onClick={() => onDisplayModeChange('arc-colors')}
        className={`px-3 py-2 text-sm font-bold rounded transition-all duration-300 ${displayMode === 'arc-colors' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
        🔢 Numbers
      </button>
      <button
        onClick={() => onDisplayModeChange('emoji')}
        className={`px-3 py-2 text-sm font-bold rounded transition-all duration-300 ${displayMode === 'emoji' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
        🎨 Emojis
      </button>
      <button
        onClick={() => onDisplayModeChange('hybrid')}
        className={`px-3 py-2 text-sm font-bold rounded transition-all duration-300 ${displayMode === 'hybrid' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
        🔀 Hybrid
      </button>
    </div>
  );
}
