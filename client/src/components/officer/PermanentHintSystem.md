/**
 * 🚫 DEPRECATED COMPONENT - DO NOT USE!
 * 
 * Author: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-22T18:26:14-04:00
 * 
 * ⚠️  DEPRECATION NOTICE ⚠️
 * This component has been superseded by: client/src/components/ui/PermanentHintSystem.tsx
 * 
 * REASON FOR DEPRECATION:
 * - Part of HARC UI Phase 5 refactor to consolidate shadcn/ui components
 * - This version uses hardcoded colors that violate theme system
 * - New ui/ version supports automatic light/dark mode theming
 * - This file violates architectural boundaries (officer/ folder is deprecated)
 * - Original author noted "WEDGED IN THE WRONG FOLDER!!"
 * 
 * REPLACEMENT LOCATION: client/src/components/ui/PermanentHintSystem.tsx
 * MIGRATION: All imports updated in commit a92b94f8
 * 
 * Original PURPOSE: Clean hint system providing progressive 3-level hints for ARC puzzles.
 * SRP and DRY check: Pass - Single responsibility (hints only), reusable component
 * 
 */

// THIS COMPONENT IS DEPRECATED - USE client/src/components/ui/PermanentHintSystem.tsx INSTEAD

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  // Level 2 Hint: Transformation Types (will show TypesModal when created)
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
    <Card className={`bg-card border-border ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-bold text-lg">Puzzle Hints</h3>
          <Badge variant="outline" className="border-border text-muted-foreground">
            {hintState.totalHintsUsed} used
          </Badge>
        </div>
        
        <div className="space-y-3">
          {/* Level 1 Hint: Grid Size */}
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-primary font-semibold">Level 1: Output Grid Size</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={revealLevel1Hint}
                disabled={hintState.level1Revealed}
                className="text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {hintState.level1Revealed ? 'Revealed' : 'Reveal'}
              </Button>
            </div>
            {hintState.level1Revealed && (
              <div className="text-foreground text-sm bg-muted p-2 rounded">
                <strong>Grid Size Hint:</strong> {getExpectedOutputDimensions()}
                {currentTestOutput && currentTestOutput.length > 0 && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-200">
                    ✅ <strong>Auto-resized your grid to {currentTestOutput.length} × {currentTestOutput[0]?.length || 0}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Level 2 Hint: Transformation Types */}
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-primary font-semibold">Level 2: ARC Transformations</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={revealLevel2Hint}
                disabled={hintState.level2Revealed}
                className="text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {hintState.level2Revealed ? 'Revealed' : 'Reveal'}
              </Button>
            </div>
            {hintState.level2Revealed && (
              <div className="text-foreground text-sm bg-muted p-2 rounded">
                <strong>Transformation Types:</strong> This puzzle likely involves one of the 40 common ARC-AGI transformation patterns such as rotation, reflection, pattern completion, object counting, or conditional rules.
                <br />
                <em>(TypesModal with full list will be available in next update)</em>
              </div>
            )}
          </div>

          {/* Level 3 Hint: Solution Explanation */}
          <div className="border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-primary font-semibold">Level 3: Solution Explanation</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={revealLevel3Hint}
                disabled={hintState.level3Revealed}
                className="text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {hintState.level3Revealed ? 'Revealed' : 'Reveal'}
              </Button>
            </div>
            {hintState.level3Revealed && (
              <div className="text-foreground text-sm bg-muted p-2 rounded">
                {hintState.level3Loading && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Loading explanation from arc-explainer API...
                  </div>
                )}
                {hintState.level3Error && (
                  <div className="text-destructive">
                    <strong>Error:</strong> {hintState.level3Error}
                  </div>
                )}
                {hintState.level3Content && (
                  <div>
                    <strong>Solution Approach:</strong> {hintState.level3Content}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {hintState.totalHintsUsed > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Hint penalty: -{hintState.totalHintsUsed * 5} points
          </div>
        )}
      </CardContent>
    </Card>
  );
}