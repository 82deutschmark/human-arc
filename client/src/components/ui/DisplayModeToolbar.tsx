/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Display mode toolbar component using shadcn/ui ToggleGroup and Select components. Replaces DisplayModeToolbar that used custom button styling. Provides display mode switching and emoji theme selection for puzzle grids.
 * SRP and DRY check: Pass. Single responsibility: provide display mode and emoji theme controls. Uses standard shadcn/ui components exclusively for theme consistency.
 */

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Palette, Hash, Smile, Shuffle } from 'lucide-react';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';
import { getEmojiSetOptions, getEmojiSetDropdownLabel } from '@/constants/spaceEmojis';

interface DisplayModeToolbarProps {
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onEmojiSetChange: (set: EmojiSet) => void;
  className?: string;
}

export function DisplayModeToolbar({
  displayMode,
  emojiSet,
  onDisplayModeChange,
  onEmojiSetChange,
  className = ""
}: DisplayModeToolbarProps) {
  const handleDisplayModeChange = (value: string) => {
    if (value) {
      onDisplayModeChange(value as DisplayMode);
    }
  };

  const handleEmojiSetChange = (value: string) => {
    onEmojiSetChange(value as EmojiSet);
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Display Mode Toggle Group */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Display Mode</Label>
            <ToggleGroup
              type="single"
              value={displayMode}
              onValueChange={handleDisplayModeChange}
              className="grid grid-cols-2 lg:grid-cols-4 gap-1"
            >
              <ToggleGroupItem
                value="arc-colors"
                className="h-14 text-lg font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                title="Show colors for values"
              >
                <Palette className="w-5 h-5 mr-2" />
                Colors
              </ToggleGroupItem>
              <ToggleGroupItem
                value="numbers"
                className="h-14 text-lg font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                title="Show numeric values"
              >
                <Hash className="w-5 h-5 mr-2" />
                Numbers
              </ToggleGroupItem>
              <ToggleGroupItem
                value="emoji"
                className="h-14 text-lg font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                title="Show emoji representations"
              >
                <Smile className="w-5 h-5 mr-2" />
                Emojis
              </ToggleGroupItem>
              <ToggleGroupItem
                value="hybrid"
                className="h-14 text-lg font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                title="Show numbers + emojis"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Hybrid
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Emoji Theme Selector - only show when using emoji or hybrid mode */}
          {(displayMode === 'emoji' || displayMode === 'hybrid') && (
            <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-xs">
              <Label className="text-sm font-semibold text-foreground">Emoji Theme</Label>
              <Select value={emojiSet} onValueChange={handleEmojiSetChange}>
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {getEmojiSetOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {getEmojiSetDropdownLabel(option.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}