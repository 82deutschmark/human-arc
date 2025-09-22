/**
 * 🚫 DEPRECATED COMPONENT - DO NOT USE!
 * 
 * Author: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-22T18:26:14-04:00
 * 
 * ⚠️  DEPRECATION NOTICE ⚠️
 * This component has been superseded by: client/src/components/ui/EmojiPaletteDivider.tsx
 * 
 * REASON FOR DEPRECATION:
 * - Part of HARC UI Phase 5 refactor to consolidate shadcn/ui components
 * - This version uses hardcoded colors that violate theme system
 * - New ui/ version supports automatic light/dark mode theming
 * - This file violates architectural boundaries (officer/ folder is deprecated)
 * 
 * REPLACEMENT LOCATION: client/src/components/ui/EmojiPaletteDivider.tsx
 * MIGRATION: All imports updated in commit a92b94f8
 * 
 * Original PURPOSE: Enhanced emoji palette with glowing pulse effects to guide user interaction.
 * SRP and DRY check: Pass - Single responsibility (value selection), enhanced with UX improvements
 * 
 */

// THIS COMPONENT IS DEPRECATED - USE client/src/components/ui/EmojiPaletteDivider.tsx INSTEAD

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SPACE_EMOJIS, type EmojiSet, getARCColorCSS } from '@/constants/spaceEmojis';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';

interface EmojiPaletteDividerProps {
  emojiSet: EmojiSet;
  selectedValue: number;
  onValueSelect: (value: number) => void;
  usedValues?: number[];
  className?: string;
  displayMode?: DisplayMode;
}

export const EmojiPaletteDivider: React.FC<EmojiPaletteDividerProps> = ({
  emojiSet,
  selectedValue,
  onValueSelect,
  usedValues = [],
  className = '',
  displayMode = 'emoji'
}) => {
  // Track user interaction to control glowing pulse effect
  const [hasInteracted, setHasInteracted] = useState(false);

  // Handle value selection with interaction tracking
  const handleValueSelect = (value: number) => {
    setHasInteracted(true);
    onValueSelect(value);
  };
  const getAllEmojis = () => {
    const emojis = SPACE_EMOJIS[emojiSet];
    return emojis.map((emoji, index) => ({ emoji, value: index }));
  };

  const emojis = getAllEmojis();
  
  // Split into 2 rows of 5 values each
  const topRow = emojis.slice(0, 5);
  const bottomRow = emojis.slice(5, 10);

  const renderValueButton = ({ emoji, value }: { emoji: string; value: number }) => {
    const isSelected = value === selectedValue;
    const isUsed = usedValues.includes(value);

    // Determine what to display based on mode
    let displayContent: string;
    if (displayMode === 'arc-colors' || displayMode === 'numbers') {
      displayContent = value.toString();
    } else if (displayMode === 'hybrid') {
      displayContent = `${value}${emoji}`;
    } else {
      displayContent = emoji;
    }

    // Get background color based on display mode
    const getBackgroundColor = () => {
      if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
        return getARCColorCSS(value);
      }
      // For numbers and emoji mode, use standard selection logic
      if (isSelected) return 'rgb(251, 191, 36)'; // amber-400
      return 'transparent';
    };

    // Get text color with proper contrast
    const getTextColor = () => {
      if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
        // Calculate contrast based on ARC color - same logic as EnhancedGridCell
        const isDarkBackground = value === 0 || value === 5 || value === 9; // Black, Grey, Maroon
        return isDarkBackground ? 'white' : 'black';
      }
      // For numbers and emoji mode, use standard selection logic
      if (isSelected) return 'rgb(51, 65, 85)'; // slate-700
      return 'rgb(203, 213, 225)'; // slate-300
    };

    // Get border color
    const getBorderColor = () => {
      if (isSelected) return 'rgb(251, 191, 36)'; // amber-400
      if (isUsed) return 'rgb(34, 211, 238)'; // cyan-400
      return 'rgb(100, 116, 139)'; // slate-500
    };

    const buttonStyle: React.CSSProperties = {
      backgroundColor: getBackgroundColor(),
      color: getTextColor(),
      borderColor: getBorderColor(),
      borderWidth: isSelected ? '2px' : '1px',
    };

    return (
      <Button
        key={value}
        variant="outline"
        size="sm"
        onClick={() => handleValueSelect(value)}
        style={buttonStyle}
        className={`
          h-24 w-20 p-0 text-2xl font-bold flex-shrink-0 transition-all duration-300
          ${!hasInteracted ? 'animate-pulse [animation-duration:3s] ring-1 ring-amber-400/60 shadow-md shadow-amber-400/30' : ''}
          ${isSelected ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/30' : ''}
          ${isUsed && !isSelected ? 'ring-1 ring-cyan-400' : ''}
          hover:scale-105 hover:shadow-lg
        `}
        title={`Value ${value}: ${emoji} ${isUsed ? '(used in puzzle)' : ''}`}
      >
        {displayContent}
      </Button>
    );
  };

  return (
    <div className={`
      flex flex-col items-center justify-center gap-4 transition-all duration-300
      ${!hasInteracted ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/30 animate-pulse [animation-duration:4s]' : ''}
      ${className}
    `}>
      {/* Header with clear description */}
      <div className="text-center">
        <h4 className={`
          text-amber-300 text-2xl font-bold mb-2 transition-all duration-300
          ${!hasInteracted ? 'animate-pulse [animation-duration:3s] text-amber-200' : ''}
        `}>
          PAINTING TOOLS
        </h4>
        <p className={`
          text-slate-300 text-lg transition-all duration-300
          ${!hasInteracted ? 'animate-pulse [animation-duration:3s] text-slate-200' : ''}
        `}>
          Select a value, then click on the output grid to paint
        </p>
      </div>
      
      {/* Top row (0-4) */}
      <div className="flex gap-2">
        {topRow.map(renderValueButton)}
      </div>
      
      {/* Bottom row (5-9) */}
      <div className="flex gap-2">
        {bottomRow.map(renderValueButton)}
      </div>
      
      {/* Selected value indicator - more prominent */}
      <div className="bg-amber-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg">
        Selected: Value {selectedValue}
      </div>
      
      {/* Usage hint */}
      <div className="text-slate-400 text-sm text-center max-w-48">
        Value 0 = Background • Values 1-9 = Different elements
      </div>
    </div>
  );
};