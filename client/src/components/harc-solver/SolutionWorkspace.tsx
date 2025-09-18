/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17T21:18:20-04:00
 * PURPOSE: This component provides the main user interface for solving a puzzle test case. It includes the test input grid, the interactive solution grid, and all associated tools for manipulation and display.
 * SRP and DRY check: Pass. This component is responsible only for presenting the puzzle-solving workspace. All state management and business logic are provided via props.
 */

import { useState } from 'react';
import type { ARCGrid, OfficerTrackPuzzle, ARCExample } from '@/types/arcTypes';
import type { PuzzleDisplayState, DisplayMode } from '@/types/puzzleDisplayTypes';
import { DisplayModeToolbar } from '@/components/officer/DisplayModeToolbar';
import { SizeSlider } from '@/components/ui/SizeSlider';
import { GridWithDimensions } from '@/components/officer/GridWithDimensions';
import { ResponsiveOfficerDisplayGrid, ResponsiveOfficerGrid } from '@/components/officer/ResponsiveOfficerGrid';
import { PuzzleSolverControls } from '@/components/officer/PuzzleSolverControls';
import { PuzzleTools } from '@/components/officer/PuzzleTools';
import { PermanentHintSystem } from '@/components/officer/PermanentHintSystem';

export interface SolutionWorkspaceProps {
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
}

export const SolutionWorkspace = ({
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
}: SolutionWorkspaceProps) => {

  const [inputCellSize, setInputCellSize] = useState(50);
  const [outputCellSize, setOutputCellSize] = useState(50);

  const getSuggestedSizes = () => {
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

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const getUsedValues = (): number[] => {
    const allGrids = [
      ...trainingExamples.flatMap(ex => [ex.input, ex.output]),
      testInput,
      expectedOutput
    ].filter(grid => grid && grid.length > 0);

    const usedValues = new Set<number>();
        allGrids.forEach((grid: ARCGrid) => {
      grid.forEach((row: number[]) => {
        row.forEach((cell: number) => usedValues.add(cell));
      });
    });

    return Array.from(usedValues).sort((a, b) => a - b);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-amber-400 font-bold text-5xl">
            Test Case {currentTestIndex + 1}
            {isAssessmentMode && totalTests > 1 && (
              <span className="text-slate-400 text-2xl font-normal ml-2">
                of {totalTests}
              </span>
            )}
          </h2>
          <DisplayModeToolbar 
            displayMode={displayState.displayMode} 
            onDisplayModeChange={onDisplayModeChange}
            emojiSet={displayState.emojiSet}
            onEmojiSetChange={onEmojiSetChange}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Test Input */}
        <div className="flex-1 bg-slate-800 border border-slate-600 rounded p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-amber-300 text-3xl font-bold text-center">Test Input</h3>
            <div className="w-1/2">
              <SizeSlider value={inputCellSize} onChange={setInputCellSize} min={25} max={75} label="Grid Size" />
            </div>
          </div>
          <GridWithDimensions grid={testInput}>
            <ResponsiveOfficerDisplayGrid
              grid={testInput}
              containerType="solver"
              emojiSet={displayState.emojiSet}
              displayMode={displayState.displayMode}
              className="w-full h-full"
              fixedCellSize={inputCellSize}
            />
          </GridWithDimensions>
        </div>

        {/* Central Controls */}
        <div className="flex flex-col items-center justify-center px-2 space-y-4 lg:max-w-md lg:flex-shrink-0">
          <PuzzleSolverControls
            currentDimensions={currentDimensions}
            onSizeChange={onSizeChange}
            getSuggestedSizes={getSuggestedSizes}
          />
          <PuzzleTools
            displayMode={displayState.displayMode}
            emojiSet={displayState.emojiSet}
            selectedValue={displayState.selectedValue}
            onValueSelect={onValueSelect}
            onCopyInput={onCopyInput}
            onResetSolution={onResetSolution}
            onValidate={onValidate}
            isValidating={isValidating}
            allTestsCompleted={allTestsCompleted}
            usedValues={getUsedValues()}
            isAssessmentMode={isAssessmentMode}
            isLocked={isLocked}
            attemptsRemaining={attemptsRemaining}
          />
        </div>

        {/* User Solution */}
        <div className="flex-1 bg-slate-800 border border-slate-600 rounded p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-amber-300 text-3xl font-bold text-center">
              Your Solution
              {isAssessmentMode && totalTests > 1 && (
                <span className="text-slate-400 text-xl font-normal ml-2">
                  - Test {currentTestIndex + 1} of {totalTests}
                </span>
              )}
            </h3>
            <div className="w-1/2">
              <SizeSlider value={outputCellSize} onChange={setOutputCellSize} min={25} max={75} label="Grid Size" />
            </div>
          </div>
          <GridWithDimensions
            grid={currentSolution}
            expectedDimensions={expectedOutput.length > 0 ? {
              width: expectedOutput[0]?.length || 0,
              height: expectedOutput.length
            } : undefined}
            showExpected={true}
          >
            <ResponsiveOfficerGrid
              initialGrid={currentSolution}
              containerType="solver"
              emojiSet={displayState.emojiSet}
              displayMode={displayState.displayMode}
              selectedValue={displayState.selectedValue}
              onCellInteraction={onCellInteraction}
              enableDragToPaint={true}
              className="w-full h-full"
              onChange={updateCurrentSolution}
              fixedCellSize={outputCellSize}
            />
          </GridWithDimensions>
          <div className="mt-4">
            <PermanentHintSystem
              puzzle={puzzle}
              currentTestOutput={expectedOutput}
              onAutoResizeGrid={onAutoResizeGrid}
              onHintUsed={onHintUsed}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
