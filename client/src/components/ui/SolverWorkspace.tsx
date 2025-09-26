/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Solution workspace component using shadcn/ui Card components and CSS Grid/Flexbox. Replaces SolutionWorkspace that used custom styling and officer/ components. Provides responsive layout for puzzle solving with test input, controls, and solution areas.
 * SRP and DRY check: Pass. Single responsibility: provide puzzle solving workspace interface. Uses standard shadcn/ui components exclusively and will integrate with new ui/ component replacements.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SizeSlider } from '@/components/ui/SizeSlider';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, Lock, Target } from 'lucide-react';
import type { ARCGrid, OfficerTrackPuzzle, ARCExample } from '@/types/arcTypes';
import type { PuzzleDisplayState, DisplayMode } from '@/types/puzzleDisplayTypes';

// shadcn/ui component imports
import { DisplayModeToolbar } from '@/components/ui/DisplayModeToolbar';
import { PuzzleSolverControls } from '@/components/ui/PuzzleSolverControls';
import { PuzzleTools } from '@/components/ui/PuzzleTools';
import { PermanentHintSystem } from '@/components/ui/PermanentHintSystem';

export interface SolverWorkspaceProps {
  puzzle: OfficerTrackPuzzle;
  currentTestIndex: number;
  totalTests: number;
  testInput: ARCGrid;
  expectedOutput: ARCGrid;
  trainingExamples: ARCExample[];
  currentSolution: ARCGrid;
  currentDimensions: { width: number; height: number };
  displayState: PuzzleDisplayState;
  isAssessmentMode: boolean;
  allTestsCompleted: boolean;
  isValidating: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  onCellInteraction: (row: number, col: number) => void;
  onSizeChange: (height: number, width: number) => void;
  onCopyInput: () => void;
  onResetSolution: () => void;
  onValidate: () => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onEmojiSetChange: (emojiSet: any) => void;
  onValueSelect: (value: number) => void;
  onHintUsed: (hintLevel: number, totalHints: number) => void;
  onAutoResizeGrid: (height: number, width: number) => void;
  updateCurrentSolution: (newGrid: ARCGrid) => void;
  onReplayTutorial?: () => void;
}

interface GridWithDimensionsDisplayProps {
  grid: ARCGrid;
  expectedDimensions?: { height: number; width: number };
  showExpected?: boolean;
  displayMode: DisplayMode;
  emojiSet: string;
  cellSize: number;
  interactive?: boolean;
  selectedValue?: number;
  onCellInteraction?: (row: number, col: number) => void;
  onChange?: (grid: ARCGrid) => void;
}

// Internal component to show grid with dimensions
const GridWithDimensionsDisplay = React.memo(({
  grid,
  expectedDimensions,
  showExpected = false,
  displayMode,
  emojiSet,
  cellSize,
  interactive = false,
  selectedValue,
  onCellInteraction,
  onChange
}: GridWithDimensionsDisplayProps) => {
  const currentHeight = grid.length;
  const currentWidth = grid[0]?.length || 0;

  const isCorrectSize = expectedDimensions ?
    (currentHeight === expectedDimensions.height && currentWidth === expectedDimensions.width) :
    true;

  return (
    <div className="text-center">
      <div className="mb-3">
        <Badge
          variant={isCorrectSize ? "default" : "destructive"}
          className="text-sm font-mono"
        >
          {currentHeight} × {currentWidth}
          {showExpected && expectedDimensions && !isCorrectSize && (
            <span className="ml-2">
              (Expected: {expectedDimensions.height} × {expectedDimensions.width})
            </span>
          )}
        </Badge>
      </div>
      <ResponsiveGrid
        grid={grid}
        interactive={interactive}
        displayMode={displayMode}
        emojiSet={emojiSet as any}
        selectedValue={selectedValue}
        enableDragToPaint={interactive}
        className="mx-auto"
        onChange={onChange}
        fixedCellSize={cellSize}
      />
    </div>
  );
});

GridWithDimensionsDisplay.displayName = 'GridWithDimensionsDisplay';

export const SolverWorkspace = React.memo(({
  puzzle,
  currentTestIndex,
  totalTests,
  testInput,
  expectedOutput,
  trainingExamples,
  currentSolution,
  currentDimensions,
  displayState,
  isAssessmentMode,
  allTestsCompleted,
  isValidating,
  isLocked,
  attemptsRemaining,
  onCellInteraction,
  onSizeChange,
  onCopyInput,
  onResetSolution,
  onValidate,
  onDisplayModeChange,
  onEmojiSetChange,
  onValueSelect,
  onHintUsed,
  onAutoResizeGrid,
  updateCurrentSolution,
  onReplayTutorial,
}: SolverWorkspaceProps) => {

  const [inputCellSize, setInputCellSize] = useState(50);
  const [outputCellSize, setOutputCellSize] = useState(50);

  // Memoize suggested sizes computation
  const suggestedSizes = useMemo(() => {
    const suggestions: Array<{ width: number; height: number; label: string }> = [];
    const seenSizes = new Set<string>();

    trainingExamples.forEach((example, index) => {
      const outputHeight = example.output?.length || 0;
      const outputWidth = example.output?.[0]?.length || 0;
      const sizeKey = `${outputWidth}x${outputHeight}`;

      if (!seenSizes.has(sizeKey) && outputWidth > 0 && outputHeight > 0) {
        seenSizes.add(sizeKey);
        suggestions.push({
          width: outputWidth,
          height: outputHeight,
          label: `(Ex ${index + 1})`
        });
      }
    });

    return suggestions.slice(0, 4);
  }, [trainingExamples]);

  const getSuggestedSizes = useCallback(() => suggestedSizes, [suggestedSizes]);

  // Memoize used values computation
  const usedValues = useMemo((): number[] => {
    const allGrids = [
      ...trainingExamples.flatMap(ex => [ex.input, ex.output]),
      testInput,
      expectedOutput
    ].filter(grid => grid && grid.length > 0);

    const usedValuesSet = new Set<number>();
    allGrids.forEach((grid: ARCGrid) => {
      grid.forEach((row: number[]) => {
        row.forEach((cell: number) => usedValuesSet.add(cell));
      });
    });

    return Array.from(usedValuesSet).sort((a, b) => a - b);
  }, [trainingExamples, testInput, expectedOutput]);

  // Memoize expected dimensions
  const expectedDimensions = useMemo(() => {
    return expectedOutput.length > 0 ? {
      width: expectedOutput[0]?.length || 0,
      height: expectedOutput.length
    } : undefined;
  }, [expectedOutput]);

  const getSubmitButtonVariant = () => {
    if (isLocked) return "secondary";
    if (attemptsRemaining === 1) return "destructive";
    return "default";
  };

  const getSubmitButtonIcon = () => {
    if (isLocked) return <Lock className="w-5 h-5" />;
    if (isValidating) return <Clock className="w-5 h-5 animate-spin" />;
    if (attemptsRemaining === 1) return <AlertTriangle className="w-5 h-5" />;
    return <Target className="w-5 h-5" />;
  };

  const getSubmitButtonText = () => {
    if (isLocked) return "Locked";
    if (isValidating) return "Submitting...";
    if (attemptsRemaining === 1) return "Final Attempt";
    return "Submit";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-amber-400 text-5xl font-bold">
                Test Case {currentTestIndex + 1}
                {isAssessmentMode && totalTests > 1 && (
                  <span className="text-slate-400 text-2xl font-normal ml-2">
                    of {totalTests}
                  </span>
                )}
              </CardTitle>

              {/* Display Mode Controls */}
              <DisplayModeToolbar
                displayMode={displayState.displayMode}
                onDisplayModeChange={onDisplayModeChange}
                emojiSet={displayState.emojiSet}
                onEmojiSetChange={onEmojiSetChange}
              />
            </div>

            {/* Submit Button */}
            <Button
              variant={getSubmitButtonVariant()}
              size="lg"
              disabled={isLocked || isValidating}
              onClick={isLocked ? undefined : onValidate}
              className={cn(
                "shadow-lg transition-all duration-300",
                attemptsRemaining === 1 && "animate-pulse",
                !isLocked && !isValidating && "hover:scale-105"
              )}
            >
              {getSubmitButtonIcon()}
              {getSubmitButtonText()}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Test Input */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary text-3xl font-bold">Test Input</CardTitle>
              <div className="min-w-0 flex-1 max-w-xs">
                <SizeSlider
                  value={inputCellSize}
                  onChange={setInputCellSize}
                  min={25}
                  max={75}
                  label="Grid Size"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GridWithDimensionsDisplay
              grid={testInput}
              displayMode={displayState.displayMode}
              emojiSet={displayState.emojiSet}
              cellSize={inputCellSize}
              interactive={false}
            />
          </CardContent>
        </Card>

        {/* Central Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-primary text-3xl font-bold text-center">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Puzzle Solver Controls */}
            <PuzzleSolverControls
              currentDimensions={currentDimensions}
              onSizeChange={onSizeChange}
              getSuggestedSizes={getSuggestedSizes}
            />

            {/* Puzzle Tools */}
            <PuzzleTools
              displayMode={displayState.displayMode}
              emojiSet={displayState.emojiSet}
              selectedValue={displayState.selectedValue}
              onValueSelect={onValueSelect}
              onCopyInput={onCopyInput}
              onResetSolution={onResetSolution}
              onReplayTutorial={onReplayTutorial}
              usedValues={usedValues}
              isAssessmentMode={isAssessmentMode}
            />
          </CardContent>
        </Card>

        {/* User Solution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary text-3xl font-bold">
                Your Solution
                {isAssessmentMode && totalTests > 1 && (
                  <span className="text-muted-foreground text-xl font-normal ml-2">
                    - Test {currentTestIndex + 1} of {totalTests}
                  </span>
                )}
              </CardTitle>
              <div className="min-w-0 flex-1 max-w-xs">
                <SizeSlider
                  value={outputCellSize}
                  onChange={setOutputCellSize}
                  min={25}
                  max={75}
                  label="Grid Size"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <GridWithDimensionsDisplay
              grid={currentSolution}
              expectedDimensions={expectedDimensions}
              showExpected={true}
              displayMode={displayState.displayMode}
              emojiSet={displayState.emojiSet}
              cellSize={outputCellSize}
              interactive={true}
              selectedValue={displayState.selectedValue}
              onCellInteraction={onCellInteraction}
              onChange={updateCurrentSolution}
            />

            {/* Permanent Hint System */}
            <PermanentHintSystem
              puzzle={puzzle}
              currentTestOutput={expectedOutput}
              onAutoResizeGrid={onAutoResizeGrid}
              onHintUsed={onHintUsed}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo optimization
  return (
    prevProps.puzzle.id === nextProps.puzzle.id &&
    prevProps.currentTestIndex === nextProps.currentTestIndex &&
    prevProps.totalTests === nextProps.totalTests &&
    JSON.stringify(prevProps.testInput) === JSON.stringify(nextProps.testInput) &&
    JSON.stringify(prevProps.expectedOutput) === JSON.stringify(nextProps.expectedOutput) &&
    JSON.stringify(prevProps.trainingExamples) === JSON.stringify(nextProps.trainingExamples) &&
    JSON.stringify(prevProps.currentSolution) === JSON.stringify(nextProps.currentSolution) &&
    JSON.stringify(prevProps.currentDimensions) === JSON.stringify(nextProps.currentDimensions) &&
    JSON.stringify(prevProps.displayState) === JSON.stringify(nextProps.displayState) &&
    prevProps.isAssessmentMode === nextProps.isAssessmentMode &&
    prevProps.allTestsCompleted === nextProps.allTestsCompleted &&
    prevProps.isValidating === nextProps.isValidating &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.attemptsRemaining === nextProps.attemptsRemaining
  );
});

SolverWorkspace.displayName = 'SolverWorkspace';