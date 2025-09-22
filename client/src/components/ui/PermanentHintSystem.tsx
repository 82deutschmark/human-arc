/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Permanent hint system component using shadcn/ui Card and Alert components. Replaces PermanentHintSystem that used custom styling. Provides progressive 3-level hints for ARC puzzles with PlayFab integration and arc-explainer API calls.
 * SRP and DRY check: Pass. Single responsibility: provide progressive hint system for puzzle solving. Uses standard shadcn/ui components exclusively for theme consistency.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

interface PermanentHintSystemProps {
  puzzle: OfficerTrackPuzzle;
  onHintUsed?: (hintLevel: number, hintsUsedTotal: number) => void;
  onAutoResizeGrid?: (height: number, width: number) => void;
  currentTestOutput?: number[][];
  className?: string;
}

interface HintState {
  level1Revealed: boolean;
  level2Revealed: boolean;
  level3Revealed: boolean;
  level3Content: string | null;
  level3Loading: boolean;
  level3Error: string | null;
  totalHintsUsed: number;
}

export function PermanentHintSystem({
  puzzle,
  onHintUsed,
  onAutoResizeGrid,
  currentTestOutput,
  className = ""
}: PermanentHintSystemProps) {
  const [hintState, setHintState] = useState<HintState>({
    level1Revealed: false,
    level2Revealed: false,
    level3Revealed: false,
    level3Content: null,
    level3Loading: false,
    level3Error: null,
    totalHintsUsed: 0
  });

  // Reset hints when puzzle changes
  useEffect(() => {
    setHintState({
      level1Revealed: false,
      level2Revealed: false,
      level3Revealed: false,
      level3Content: null,
      level3Loading: false,
      level3Error: null,
      totalHintsUsed: 0
    });
  }, [puzzle.id]);

  // Level 1 Hint: Output Grid Size
  const revealLevel1Hint = () => {
    if (hintState.level1Revealed) return;

    const newHintsUsed = hintState.totalHintsUsed + 1;
    setHintState(prev => ({
      ...prev,
      level1Revealed: true,
      totalHintsUsed: newHintsUsed
    }));

    // Auto-resize grid to correct dimensions
    if (currentTestOutput && currentTestOutput.length > 0 && onAutoResizeGrid) {
      const correctHeight = currentTestOutput.length;
      const correctWidth = currentTestOutput[0]?.length || 0;
      if (correctWidth > 0) {
        onAutoResizeGrid(correctHeight, correctWidth);
      }
    }

    onHintUsed?.(1, newHintsUsed);
  };

  // Level 2 Hint: Transformation Types
  const revealLevel2Hint = () => {
    if (hintState.level2Revealed) return;

    const newHintsUsed = hintState.totalHintsUsed + 1;
    setHintState(prev => ({
      ...prev,
      level2Revealed: true,
      totalHintsUsed: newHintsUsed
    }));

    onHintUsed?.(2, newHintsUsed);
  };

  // Level 3 Hint: Solution Explanation from arc-explainer API
  const revealLevel3Hint = async () => {
    if (hintState.level3Revealed) return;

    const newHintsUsed = hintState.totalHintsUsed + 1;
    setHintState(prev => ({
      ...prev,
      level3Revealed: true,
      level3Loading: true,
      totalHintsUsed: newHintsUsed
    }));

    onHintUsed?.(3, newHintsUsed);

    try {
      // Extract puzzle ID for arc-explainer API call
      // Convert from ARC-TR-007bbfb7 format to 007bbfb7 format
      const cleanPuzzleId = puzzle.id.replace(/^ARC-TR-/, '');

      const response = await fetch(
        `https://arc-explainer-production.up.railway.app/api/puzzle/${cleanPuzzleId}/explanations`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation: ${response.status}`);
      }

      const data = await response.json();

      // Extract the most relevant explanation
      let explanation = "No explanation available for this puzzle.";
      if (data && data.length > 0) {
        // Look for explanations with good ratings or take the first available
        const bestExplanation = data.find((exp: any) => exp.rating >= 4) || data[0];
        explanation = bestExplanation.explanation || bestExplanation.content || explanation;
      }

      setHintState(prev => ({
        ...prev,
        level3Loading: false,
        level3Content: explanation
      }));

    } catch (error: any) {
      console.error('Failed to fetch hint explanation:', error);
      setHintState(prev => ({
        ...prev,
        level3Loading: false,
        level3Error: error.message || 'Failed to load explanation'
      }));
    }
  };

  // Get output dimensions from training examples
  const getExpectedOutputDimensions = () => {
    if (!puzzle.train || puzzle.train.length === 0) {
      return "Unable to determine from training examples.";
    }

    const dimensions = puzzle.train.map(example => {
      const height = example.output?.length || 0;
      const width = example.output?.[0]?.length || 0;
      return `${height}×${width}`;
    });

    const uniqueDimensions = Array.from(new Set(dimensions));

    if (uniqueDimensions.length === 1) {
      return `All training examples show ${uniqueDimensions[0]} output grids.`;
    } else {
      return `Training examples show varying sizes: ${uniqueDimensions.join(', ')}`;
    }
  };

  if (!puzzle) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Puzzle Hints
          </CardTitle>
          <Badge variant="outline">
            {hintState.totalHintsUsed} used
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Level 1 Hint: Grid Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Level 1: Output Grid Size</span>
            <Button
              size="sm"
              variant="outline"
              onClick={revealLevel1Hint}
              disabled={hintState.level1Revealed}
            >
              {hintState.level1Revealed ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Revealed
                </>
              ) : (
                'Reveal'
              )}
            </Button>
          </div>
          {hintState.level1Revealed && (
            <Alert>
              <AlertTitle>Grid Size Hint</AlertTitle>
              <AlertDescription>
                {getExpectedOutputDimensions()}
                {currentTestOutput && currentTestOutput.length > 0 && (
                  <Alert className="mt-3 border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <AlertTitle>Auto-Resized Grid</AlertTitle>
                    <AlertDescription>
                      Your grid has been auto-resized to {currentTestOutput.length} × {currentTestOutput[0]?.length || 0}
                    </AlertDescription>
                  </Alert>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Level 2 Hint: Transformation Types */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Level 2: ARC Transformations</span>
            <Button
              size="sm"
              variant="outline"
              onClick={revealLevel2Hint}
              disabled={hintState.level2Revealed}
            >
              {hintState.level2Revealed ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Revealed
                </>
              ) : (
                'Reveal'
              )}
            </Button>
          </div>
          {hintState.level2Revealed && (
            <Alert>
              <AlertTitle>Transformation Types</AlertTitle>
              <AlertDescription>
                This puzzle likely involves one of the 40 common ARC-AGI transformation patterns such as rotation, reflection, pattern completion, object counting, or conditional rules.
                <br />
                <em className="text-muted-foreground">(TypesModal with full list will be available in next update)</em>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Level 3 Hint: Solution Explanation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Level 3: Solution Explanation</span>
            <Button
              size="sm"
              variant="outline"
              onClick={revealLevel3Hint}
              disabled={hintState.level3Revealed}
            >
              {hintState.level3Revealed ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Revealed
                </>
              ) : (
                'Reveal'
              )}
            </Button>
          </div>
          {hintState.level3Revealed && (
            <Alert>
              <AlertTitle>Solution Explanation</AlertTitle>
              <AlertDescription>
                {hintState.level3Loading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading explanation from arc-explainer API...
                  </div>
                )}
                {hintState.level3Error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{hintState.level3Error}</AlertDescription>
                  </Alert>
                )}
                {hintState.level3Content && (
                  <div>
                    <strong>Solution Approach:</strong> {hintState.level3Content}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Hint Penalty Display */}
        {hintState.totalHintsUsed > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-center p-2 bg-muted rounded">
            Hint penalty: -{hintState.totalHintsUsed * 5} points
          </div>
        )}
      </CardContent>
    </Card>
  );
}