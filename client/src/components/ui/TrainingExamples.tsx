/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Training examples display component using shadcn/ui Card components and CSS Grid/Flexbox. Replaces TrainingExamplesSection that used custom styling and hardcoded colors. Provides responsive horizontal scrolling layout for puzzle training examples with size controls.
 * SRP and DRY check: Pass. Single responsibility: display training examples with size controls. Uses standard shadcn/ui components exclusively for theme consistency.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SizeSlider } from '@/components/ui/SizeSlider';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import type { ARCGrid, DisplayMode, EmojiSet } from '@/types/arcTypes';

interface TrainingExample {
  input: ARCGrid;
  output: ARCGrid;
}

interface TrainingExamplesProps {
  examples: TrainingExample[];
  emojiSet?: EmojiSet;
  title?: string;
  className?: string;
  displayMode?: DisplayMode;
}

interface GridWithDimensionsDisplayProps {
  grid: ARCGrid;
  label?: string;
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  cellSize: number;
}

// Internal component to show grid with dimensions (replacing GridWithDimensions)
const GridWithDimensionsDisplay = React.memo(({
  grid,
  label,
  displayMode,
  emojiSet,
  cellSize
}: GridWithDimensionsDisplayProps) => {
  const currentHeight = grid.length;
  const currentWidth = grid[0]?.length || 0;

  return (
    <div className="text-center">
      <div className="mb-2">
        {label && (
          <div className="text-foreground text-lg font-bold mb-1">
            {label}
          </div>
        )}
        <Badge variant="outline" className="text-sm font-mono">
          {currentHeight} × {currentWidth}
        </Badge>
      </div>
      <ResponsiveGrid
        grid={grid}
        interactive={false}
        displayMode={displayMode}
        emojiSet={emojiSet}
        className={cn("mx-auto")}
        style={{
          width: `${Math.max(currentWidth * cellSize + 24, 120)}px`,
          height: `${Math.max(currentHeight * cellSize + 24, 120)}px`
        }}
      />
    </div>
  );
});

GridWithDimensionsDisplay.displayName = 'GridWithDimensionsDisplay';

export function TrainingExamples({
  examples,
  emojiSet = 'tech_set1',
  title = '📚 Training Examples',
  className = '',
  displayMode = 'emoji'
}: TrainingExamplesProps) {
  const [cellSize, setCellSize] = useState(() => {
    const savedSize = localStorage.getItem('trainingExampleCellSize');
    return savedSize ? Number(savedSize) : 32;
  });

  useEffect(() => {
    localStorage.setItem('trainingExampleCellSize', String(cellSize));
  }, [cellSize]);

  if (!examples || examples.length === 0) {
    return (
      <Card className={cn("text-center", className)}>
        <CardContent className="py-8">
          <div className="text-muted-foreground">No training examples available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary flex items-center gap-2">
            {title}
            <Badge variant="secondary">{examples.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-4 min-w-0 flex-1 max-w-sm">
            <SizeSlider
              value={cellSize}
              onChange={setCellSize}
              min={16}
              max={80}
              label="Size"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Responsive horizontal scrolling container */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {examples.map((example, index) => (
              <Card
                key={index}
                className="flex-shrink-0 border-2 shadow-lg"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-lg">
                    Example {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {/* Input Grid */}
                    <GridWithDimensionsDisplay
                      grid={example.input}
                      label="Input"
                      displayMode={displayMode}
                      emojiSet={emojiSet}
                      cellSize={cellSize}
                    />

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-primary" />
                    </div>

                    {/* Output Grid */}
                    <GridWithDimensionsDisplay
                      grid={example.output}
                      label="Output"
                      displayMode={displayMode}
                      emojiSet={emojiSet}
                      cellSize={cellSize}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pattern Analysis Hint for complex puzzles */}
        {examples.length >= 3 && (
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-primary">
                <strong className="flex items-center gap-2">
                  💡 Pattern Analysis
                </strong>
                <p className="text-sm text-muted-foreground mt-2">
                  Study these {examples.length} examples to identify the transformation pattern.
                  Look for consistent rules that apply across all input → output pairs.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}