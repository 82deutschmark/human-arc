/**
 * Author: Cascade using Gemini 2.5 Pro (Audit)
 * Date: 2025-09-17
 * PURPOSE: This component is a wrapper that displays the dimensions (height x width) of a grid above the grid itself. It can be used with any grid component by passing the grid component as a child. It also has an optional feature to display the expected dimensions and highlight any mismatch, which is useful for debugging and providing clear feedback to the user.
 * SRP and DRY check: Pass. This component has a single, clear responsibility: to display grid dimensions. It is a reusable wrapper and does not contain any logic unrelated to this purpose.
 */

import type { ARCGrid } from '@/types/arcTypes';

interface GridWithDimensionsProps {
  grid: ARCGrid;
  label?: string;
  expectedDimensions?: { height: number; width: number };
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
  const currentHeight = grid.length;
  const currentWidth = grid[0]?.length || 0;

  const isCorrectSize = expectedDimensions ?
    (currentHeight === expectedDimensions.height && currentWidth === expectedDimensions.width) :
    true;

  return (
    <div className={`text-center ${className}`}>
      <div className="mb-2">
        {label && (
          <div className="text-black text-xl font-bold mb-2">
            {label}
          </div>
        )}
        <div className={`text-2xl font-mono font-bold ${isCorrectSize ? 'text-black' : 'text-red-700'}`}>
          {currentHeight} × {currentWidth}
        </div>
      </div>
      {children}
    </div>
  );
}