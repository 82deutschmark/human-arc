/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component provides a user interface for selecting the dimensions (width and height) of the output grid for a puzzle. It is particularly important for ARC puzzles where the output grid size may differ from the input grid size. It includes features like suggested sizes based on training examples and a warning to the user if changing the size will reset their current work. It also incorporates controls for changing the display mode and emoji set, making it a comprehensive control panel for the puzzle-solving interface.
 * SRP and DRY check: Pass. This component's primary responsibility is to manage the grid size selection. While it also includes display mode controls, they are closely related to the presentation of the grid and are logically grouped here. The component is reusable and does not contain any puzzle-solving logic.
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SPACE_EMOJIS, EMOJI_SET_INFO, type EmojiSet } from '@/constants/spaceEmojis';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';

interface GridSizeSelectorProps {
  /** Current grid width */
  width: number;
  /** Current grid height */
  height: number;
  /** Callback when size changes */
  onSizeChange: (width: number, height: number) => void;
  /** Whether there's existing solution data that would be lost */
  hasExistingData: boolean;
  /** Suggested sizes from training examples */
  suggestedSizes?: Array<{ width: number; height: number; label: string }>;
  /** Additional CSS classes */
  className?: string;
  
  /** Enhanced display props */
  displayMode?: DisplayMode;
  emojiSet?: EmojiSet;
  selectedValue?: number;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  onEmojiSetChange?: (emojiSet: EmojiSet) => void;
  onValueSelect?: (value: number) => void;
  usedValues?: number[];
}

export function GridSizeSelector({
  width,
  height,
  onSizeChange,
  hasExistingData,
  suggestedSizes = [],
  className = '',
  displayMode = 'emoji',
  emojiSet = 'tech_set1',
  selectedValue = 1,
  onDisplayModeChange,
  onEmojiSetChange,
  onValueSelect,
  usedValues = []
}: GridSizeSelectorProps) {
  
  const handleSizeChange = (newWidth: number, newHeight: number) => {
    if (hasExistingData && (newWidth !== width || newHeight !== height)) {
      const confirmed = confirm(
        `Changing grid size from ${height}×${width} to ${newHeight}×${newWidth} will reset your current solution. Continue?`
      );
      if (!confirmed) return;
    }
    onSizeChange(newWidth, newHeight);
  };

  const handleDisplayModeToggle = () => {
    if (!onDisplayModeChange) return;
    const modes: DisplayMode[] = ['emoji', 'arc-colors', 'hybrid'];
    const currentIndex = modes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onDisplayModeChange(modes[nextIndex]);
  };

  const getDisplayModeLabel = (mode: DisplayMode) => {
    switch (mode) {
      case 'emoji': return '😊 Emoji';
      case 'arc-colors': return '🎨 Colors';
      case 'hybrid': return '🎭 Hybrid';
    }
  };


  return (
    <div className={`bg-slate-700 rounded-lg p-4 border border-slate-600 ${className}`}>
      {/* Centered Header with Grid Size */}
      <div className="text-center mb-4">
        <h3 className="text-amber-300 text-3xl font-bold mb-3">⚙️ INPUT CONTROLS</h3>
        
        {/* Ultra Compact Grid Size */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-slate-300 text-2xl font-medium">Grid Size:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={width}
              min="1"
              max="30"
              onChange={(e) => handleSizeChange(parseInt(e.target.value) || 1, height)}
              className="w-16 h-12 px-2 bg-slate-600 border border-slate-500 rounded text-amber-100 text-center text-2xl font-bold"
            />
            <span className="text-slate-400 text-3xl font-bold">×</span>
            <input
              type="number"
              value={height}
              min="1"
              max="30"
              onChange={(e) => handleSizeChange(width, parseInt(e.target.value) || 1)}
              className="w-16 h-12 px-2 bg-slate-600 border border-slate-500 rounded text-amber-100 text-center text-2xl font-bold"
            />
          </div>
          
          {onValueSelect && (
            <Badge variant="outline" className="text-slate-300 border-slate-500 text-2xl px-4 py-2 ml-4">
              Selected: {selectedValue}
            </Badge>
          )}
        </div>
      </div>

      {/* Suggested Sizes - Centered */}
      {suggestedSizes.length > 0 && (
        <div className="text-center mb-4">
          <div className="text-slate-400 text-2xl font-semibold mb-4">Quick Sizes from Examples:</div>
          <div className="flex flex-wrap justify-center gap-3">
            {suggestedSizes.map((suggestion, index) => (
              <Button
                key={index}
                size="lg"
                variant="outline"
                className="h-12 px-6 text-xl font-bold border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                onClick={() => handleSizeChange(suggestion.width, suggestion.height)}
              >
                {suggestion.height}×{suggestion.width}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Display Controls - Centered */}
      {(onDisplayModeChange || onEmojiSetChange) && (
        <div className="border-t border-slate-600 pt-4 mt-4">
          <div className="space-y-4">
            {/* Display Mode Toggle - Centered */}
            {onDisplayModeChange && (
              <div className="text-center">
                <label className="text-slate-300 text-2xl font-bold block mb-4">Display Mode:</label>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDisplayModeToggle}
                  className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white text-2xl px-8 py-4 font-bold"
                >
                  {getDisplayModeLabel(displayMode)}
                </Button>
              </div>
            )}
            
            {/* Emoji Set Selector - Centered */}
            {onEmojiSetChange && (displayMode === 'emoji' || displayMode === 'hybrid') && (
              <div className="text-center">
                <label className="text-slate-300 text-2xl font-bold mb-4 block">Emoji Set:</label>
                <div className="max-w-md mx-auto">
                  <Select value={emojiSet} onValueChange={(value: EmojiSet) => onEmojiSetChange(value)}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-amber-100 h-14 text-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {Object.entries(EMOJI_SET_INFO).map(([key, info]) => (
                        <SelectItem 
                          key={key} 
                          value={key}
                          className="text-amber-100 focus:bg-slate-600 focus:text-amber-200 py-4"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{SPACE_EMOJIS[key as EmojiSet][1]}</span>
                            <div>
                              <div className="font-bold text-xl">{info.name}</div>
                              <div className="text-lg text-slate-400">{info.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Value Selection Note - Palette moved to solver interface */}
      {onValueSelect && (
        <div className="border-t border-slate-600 pt-3 mt-4">
          <div className="text-center text-lg text-slate-400">
            💡 Use the emoji palette between input/solution grids to select values
          </div>
        </div>
      )}

      {/* Warning for existing data - Centered */}
      {hasExistingData && (
        <div className="mt-6 text-center">
          <div className="inline-block text-2xl text-orange-400 bg-orange-900/20 border border-orange-800 rounded-lg p-4 font-bold">
            ⚠️ You have existing solution data. Changing size will reset your progress.
          </div>
        </div>
      )}
    </div>
  );
}
