/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Puzzle solver controls component using shadcn/ui Select and Button components. Replaces PuzzleSolverControls that used raw HTML select elements. Provides grid size selection with dropdowns and quick-select buttons.
 * SRP and DRY check: Pass. Single responsibility: provide controls for grid size selection. Uses standard shadcn/ui components exclusively for theme consistency.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Resize } from 'lucide-react';

interface PuzzleSolverControlsProps {
  currentDimensions: { width: number; height: number };
  onSizeChange: (height: number, width: number) => void;
  getSuggestedSizes: () => Array<{ width: number; height: number; label: string }>;
}

export function PuzzleSolverControls({
  currentDimensions,
  onSizeChange,
  getSuggestedSizes
}: PuzzleSolverControlsProps) {
  const suggestedSizes = getSuggestedSizes();

  const handleHeightChange = (value: string) => {
    onSizeChange(parseInt(value), currentDimensions.width);
  };

  const handleWidthChange = (value: string) => {
    onSizeChange(currentDimensions.height, parseInt(value));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-primary text-lg flex items-center gap-2 justify-center">
          <Resize className="w-5 h-5" />
          Output Size
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Size Selectors */}
        <div className="flex items-center justify-center gap-3">
          <Select
            value={currentDimensions.height.toString()}
            onValueChange={handleHeightChange}
          >
            <SelectTrigger className="w-32 h-12 text-base">
              <SelectValue placeholder="Height" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
                <SelectItem key={size} value={size.toString()}>
                  H: {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className="text-lg font-bold px-3 py-1">
            ×
          </Badge>

          <Select
            value={currentDimensions.width.toString()}
            onValueChange={handleWidthChange}
          >
            <SelectTrigger className="w-32 h-12 text-base">
              <SelectValue placeholder="Width" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
                <SelectItem key={size} value={size.toString()}>
                  W: {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Size Display */}
        <div className="text-center">
          <Badge variant="secondary" className="text-base font-mono">
            {currentDimensions.height} × {currentDimensions.width}
          </Badge>
        </div>

        {/* Quick Size Suggestions */}
        {suggestedSizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Quick sizes from examples:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedSizes.slice(0, 3).map((size, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onSizeChange(size.height, size.width)}
                  className="text-sm font-mono h-10 px-3"
                >
                  {size.height}×{size.width}
                  <span className="text-xs text-muted-foreground ml-1">
                    {size.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}