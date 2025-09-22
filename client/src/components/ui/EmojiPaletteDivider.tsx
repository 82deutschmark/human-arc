/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Emoji palette divider component using shadcn/ui ToggleGroup. Replaces EmojiPaletteDivider that used custom styling and hardcoded colors. Provides compact 2x5 value selection palette with proper theme support and accessibility.
 * SRP and DRY check: Pass. Single responsibility: provide reusable value selection palette. Uses standard shadcn/ui components exclusively for theme consistency and modularity.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { SPACE_EMOJIS, type EmojiSet, getARCColorCSS } from '@/constants/spaceEmojis';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';

interface EmojiPaletteDividerProps {
  emojiSet: EmojiSet;
  selectedValue: number;
  onValueSelect: (value: number) => void;
  usedValues?: number[];
  className?: string;
  displayMode?: DisplayMode;
  showTitle?: boolean;
  showInstructions?: boolean;
  showSelectedIndicator?: boolean;
  showUsageHint?: boolean;
}

export const EmojiPaletteDivider = React.memo(({
  emojiSet,
  selectedValue,
  onValueSelect,
  usedValues = [],
  className = '',
  displayMode = 'emoji',
  showTitle = true,
  showInstructions = true,
  showSelectedIndicator = true,
  showUsageHint = true
}: EmojiPaletteDividerProps) => {
  const emojis = SPACE_EMOJIS[emojiSet];

  const getDisplayContent = (value: number) => {
    const emoji = emojis[value];
    switch (displayMode) {
      case 'arc-colors':
      case 'numbers':
        return value.toString();
      case 'hybrid':
        return `${value}${emoji}`;
      default:
        return emoji;
    }
  };

  const getItemStyle = (value: number) => {
    if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
      const backgroundColor = getARCColorCSS(value);
      const isDarkBackground = value === 0 || value === 5 || value === 9;
      return {
        backgroundColor,
        color: isDarkBackground ? 'white' : 'black',
        '--tw-ring-color': backgroundColor
      } as React.CSSProperties;
    }
    return {};
  };

  const handleValueChange = (value: string) => {
    if (value) {
      onValueSelect(parseInt(value));
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 transition-all duration-300",
      className
    )}>
      {/* Header with title and instructions */}
      {(showTitle || showInstructions) && (
        <div className="text-center">
          {showTitle && (
            <h4 className="text-primary text-lg font-bold mb-2">
              Painting Tools
            </h4>
          )}
          {showInstructions && (
            <p className="text-muted-foreground text-sm">
              Select a value, then click on the output grid to paint
            </p>
          )}
        </div>
      )}

      {/* Value Selection Grid - 2 rows of 5 */}
      <ToggleGroup
        type="single"
        value={selectedValue.toString()}
        onValueChange={handleValueChange}
        className="grid grid-cols-5 gap-1 w-full max-w-md"
      >
        {Array.from({ length: 10 }, (_, i) => {
          const isUsed = usedValues.includes(i);
          return (
            <ToggleGroupItem
              key={i}
              value={i.toString()}
              className={cn(
                "h-12 w-full text-lg font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all duration-200",
                isUsed && "ring-2 ring-cyan-400",
                displayMode === 'arc-colors' || displayMode === 'hybrid'
                  ? "border-2"
                  : "",
                "hover:scale-105 hover:shadow-md"
              )}
              style={getItemStyle(i)}
              title={`Value ${i}: ${emojis[i]} ${isUsed ? '(used in puzzle)' : ''}`}
            >
              {getDisplayContent(i)}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {/* Selected Value Indicator */}
      {showSelectedIndicator && (
        <Badge variant="default" className="text-sm font-bold">
          Selected: Value {selectedValue}
        </Badge>
      )}

      {/* Usage hint */}
      {showUsageHint && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Value 0 = Background • Values 1-9 = Different elements
        </p>
      )}
    </div>
  );
});

EmojiPaletteDivider.displayName = 'EmojiPaletteDivider';