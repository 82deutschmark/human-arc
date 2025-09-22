/**
 * 🚫 DEPRECATED COMPONENT - DO NOT USE!
 * 
 * Author: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-22T18:26:14-04:00
 * 
 * ⚠️  DEPRECATION NOTICE ⚠️
 * This component has been superseded by: client/src/components/ui/PuzzleSolverControls.tsx
 * 
 * REASON FOR DEPRECATION:
 * - Part of HARC UI Phase 5 refactor to consolidate shadcn/ui components
 * - This version uses hardcoded colors that violate theme system
 * - New ui/ version supports automatic light/dark mode theming
 * - This file violates architectural boundaries (officer/ folder is deprecated)
 * 
 * REPLACEMENT LOCATION: client/src/components/ui/PuzzleSolverControls.tsx
 * MIGRATION: All imports updated in commit a92b94f8
 * 
 * Original PURPOSE: UI controls for adjusting the output grid size of a puzzle.
 * SRP and DRY check: Pass. Single, clear responsibility: grid size selection controls.
 * 
 */

// THIS COMPONENT IS DEPRECATED - USE client/src/components/ui/PuzzleSolverControls.tsx INSTEAD

import { Button } from '@/components/ui/button';

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
  return (
    <div className="bg-card border border-border rounded-lg p-5 w-full">
      <h4 className="text-primary text-2xl font-bold mb-4 text-center">OUTPUT SIZE</h4>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xl">
        <select
          value={currentDimensions.height}
          onChange={(e) => onSizeChange(parseInt(e.target.value), currentDimensions.width)}
          className="bg-background border border-border rounded px-4 py-3 text-foreground text-xl h-16 min-w-[110px] flex-shrink-0"
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
            <option key={size} value={size}>H: {size}</option>
          ))}
        </select>
        <span className="text-muted-foreground text-2xl font-bold flex-shrink-0">×</span>
        <select
          value={currentDimensions.width}
          onChange={(e) => onSizeChange(currentDimensions.height, parseInt(e.target.value))}
          className="bg-background border border-border rounded px-4 py-3 text-foreground text-xl h-16 min-w-[110px] flex-shrink-0"
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
            <option key={size} value={size}>W: {size}</option>
          ))}
        </select>
      </div>
      
      {/* Quick Size Suggestions */}
      {getSuggestedSizes().length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {getSuggestedSizes().slice(0, 3).map((size, index) => (
            <Button
              key={index}
              onClick={() => onSizeChange(size.height, size.width)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold px-4 py-3 h-16 rounded min-w-[90px]"
            >
              {size.height}×{size.width}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}