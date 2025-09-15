/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-14
 * PURPOSE: Wrapper component to display any grid with dimension labels
 * Shows grid size prominently above the grid for better UX
 * SRP and DRY check: Pass - Single responsibility (grid + dimensions), reusable across all grid types
 *
 */

import type { ARCGrid } from '@/types/arcTypes';

interface GridWithDimensionsProps {
  grid: ARCGrid;
  label?: string;
  expectedDimensions?: { width: number; height: number };
  showExpected?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function GridWithDimensions({
  grid,
  label,
  expectedDimensions,
  showExpected = false,
  className = "",
  children
}: GridWithDimensionsProps) {
  const currentWidth = grid[0]?.length || 0;
  const currentHeight = grid.length;

  const isCorrectSize = expectedDimensions ?
    (currentWidth === expectedDimensions.width && currentHeight === expectedDimensions.height) :
    true;

  return (
    <div className={`text-center ${className}`}>
      <div className="mb-2">
        {label && (
          <div className="text-slate-300 text-sm font-medium mb-1">
            {label}
          </div>
        )}
        <div className={`text-lg font-mono ${isCorrectSize ? 'text-slate-400' : 'text-red-400'}`}>
          {currentHeight} × {currentWidth}
        </div>
      </div>
      {children}
    </div>
  );
}