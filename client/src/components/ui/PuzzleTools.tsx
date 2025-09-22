/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Puzzle tools component using shadcn/ui ToggleGroup and Button components. Replaces PuzzleTools and EmojiPaletteDivider that used custom styling and hardcoded colors. Provides value selection palette and action buttons for puzzle solving.
 * SRP and DRY check: Pass. Single responsibility: provide puzzle tools interface with value selection and actions. Uses standard shadcn/ui components exclusively for theme consistency.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Palette, Copy, RotateCcw, Play } from 'lucide-react';
import { SPACE_EMOJIS, type EmojiSet, getARCColorCSS } from '@/constants/spaceEmojis';
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

interface ValuePaletteProps {
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  selectedValue: number;
  onValueSelect: (value: number) => void;
  usedValues: number[];
}

// Internal component for the value selection palette
const ValuePalette = React.memo(({
  displayMode,
  emojiSet,
  selectedValue,
  onValueSelect,
  usedValues
}: ValuePaletteProps) => {
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-primary text-lg flex items-center gap-2 justify-center">
          <Palette className="w-5 h-5" />
          Painting Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a value, then click on the output grid to paint
        </p>

        {/* Value Selection Grid - 2 rows of 5 */}
        <ToggleGroup
          type="single"
          value={selectedValue.toString()}
          onValueChange={handleValueChange}
          className="grid grid-cols-5 gap-2 w-full"
        >
          {Array.from({ length: 10 }, (_, i) => {
            const isUsed = usedValues.includes(i);
            return (
              <ToggleGroupItem
                key={i}
                value={i.toString()}
                className={cn(
                  "h-16 w-full text-lg font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
                  isUsed && "ring-2 ring-cyan-400",
                  displayMode === 'arc-colors' || displayMode === 'hybrid'
                    ? "border-2"
                    : ""
                )}
                style={getItemStyle(i)}
                title={`Value ${i}: ${emojis[i]} ${isUsed ? '(used in puzzle)' : ''}`}
              >
                {getDisplayContent(i)}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        {/* Selected Value Display */}
        <div className="text-center">
          <Badge variant="default" className="text-base font-bold">
            Selected: Value {selectedValue}
          </Badge>
        </div>

        {/* Usage hint */}
        <p className="text-xs text-muted-foreground text-center">
          Value 0 = Background • Values 1-9 = Different elements
        </p>
      </CardContent>
    </Card>
  );
});

ValuePalette.displayName = 'ValuePalette';

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
  return (
    <div className="space-y-4">
      {/* Value Selection Palette */}
      <ValuePalette
        displayMode={displayMode}
        emojiSet={emojiSet}
        selectedValue={selectedValue}
        onValueSelect={onValueSelect}
        usedValues={usedValues}
      />

      {/* Action Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-primary text-lg text-center">
            Puzzle Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 font-semibold"
              onClick={onCopyInput}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Input
            </Button>

            <Button
              variant="outline"
              className="h-12 font-semibold text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onResetSolution}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

            {onReplayTutorial && (
              <Button
                variant="outline"
                className="h-12 font-semibold sm:col-span-2"
                onClick={onReplayTutorial}
              >
                <Play className="w-4 h-4 mr-2" />
                Replay Tutorial
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}