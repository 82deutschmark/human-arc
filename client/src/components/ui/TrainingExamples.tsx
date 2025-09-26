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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ArrowRight, Lightbulb, Eye, Sparkles } from 'lucide-react';
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
        scale={cellSize}
        className={cn("mx-auto")}
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
              label="Grid Size"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Responsive horizontal scrolling container */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {examples.map((example, index) => {
              // Generate subtle color variety for cards
              const cardColors = [
                "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20",
                "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20",
                "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20",
                "border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/20",
                "border-rose-200 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-950/20",
                "border-cyan-200 bg-cyan-50/30 dark:border-cyan-800 dark:bg-cyan-950/20",
                "border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20"
              ];
              const cardColor = cardColors[index % cardColors.length];

              return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className={cn(
                        "flex-shrink-0 border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                        "relative overflow-hidden",
                        cardColor,
                        // Decorative corner borders
                        "before:absolute before:top-0 before:left-0 before:w-4 before:h-4 before:border-l-2 before:border-t-2 before:border-primary/30",
                        "after:absolute after:bottom-0 after:right-0 after:w-4 after:h-4 after:border-r-2 after:border-b-2 after:border-primary/30"
                      )}
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
                      label="This grid"
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
                      label="becomes this grid!"
                      displayMode={displayMode}
                      emojiSet={emojiSet}
                      cellSize={cellSize}
                    />
                  </div>
                </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <p>
                      <strong>Training Example {index + 1}</strong>
                    </p>
                    <p className="text-sm">
                      Study the transformation: {example.input.length}×{example.input[0]?.length || 0} → {example.output.length}×{example.output[0]?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Look for patterns in colors, shapes, and positions
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Enhanced Pattern Analysis Hint for complex puzzles */}
        {examples.length >= 3 && (
          <Alert className="mt-4 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <Lightbulb className="h-4 w-4" />
            <div className="ml-2">
              <strong className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                Pattern Analysis Challenge
              </strong>
              <AlertDescription className="mt-2">
                <p className="text-sm">
                  Study these <Badge variant="secondary" className="mx-1">{examples.length}</Badge> examples to identify the transformation pattern.
                </p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  Look for consistent rules that apply across all input → output pairs.
                </p>
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}