/** DEPRECATED???
 * Probably superceded by ResponsiveOfficerGrid
 * Officer Grid Component
 * ======================
 * Interactive grid component for ARC puzzle solving with military academy styling
 * 
 * Key Features:
 * - Variable grid sizes (ARC puzzles have different dimensions)
 * - Integer-to-emoji transformation for visual representation  
 * - Click-to-cycle through values (0-9)
 * - Real-time solution building
 * - Military gold/amber theming
 */

import { useState, useEffect } from 'react';
import type { ARCGrid, ARCDisplayGrid } from '@/types/arcTypes';
import { SPACE_EMOJIS } from '@/constants/spaceEmojis';

interface OfficerGridProps {
  /** Initial grid values (integers 0-9) */
  initialGrid: ARCGrid;
  /** Emoji set to use for visual representation */
  emojiSet?: string;
  /** Whether the grid is interactive or display-only */
  interactive?: boolean;
  /** Callback when grid values change */
  onChange?: (grid: ARCGrid) => void;
  /** Whether the grid is disabled */
  disabled?: boolean;
  /** Optional title for the grid */
  title?: string;
  /** Size of each grid cell in pixels */
  cellSize?: number;
  /** Additional CSS classes */
  className?: string;
}

export function OfficerGrid({
  initialGrid,
  emojiSet = 'tech_set1',
  interactive = true,
  onChange,
  disabled = false,
  title,
  cellSize = 40,
  className = ''
}: OfficerGridProps) {
  const [grid, setGrid] = useState<ARCGrid>(initialGrid);

  // Update grid when initialGrid changes
  useEffect(() => {
    setGrid(initialGrid);
  }, [initialGrid]);

  /**
   * Handle cell click - cycle through values 0-9
   */
  const handleCellClick = (row: number, col: number) => {
    if (!interactive || disabled) return;

    const newGrid = grid.map((gridRow, rowIndex) =>
      gridRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          // Cycle to next value (0-9, then back to 0)
          return (cell + 1) % 10;
        }
        return cell;
      })
    );

    setGrid(newGrid);
    onChange?.(newGrid);
  };

  /**
   * Transform integer grid to emoji display
   */
  const getDisplayGrid = (): ARCDisplayGrid => {
    const emojis = SPACE_EMOJIS[emojiSet as keyof typeof SPACE_EMOJIS];
    if (!emojis) {
      console.warn(`Unknown emoji set: ${emojiSet}, using default`);
      const defaultEmojis = SPACE_EMOJIS.tech_set1;
      return grid.map(row => 
        row.map(cell => {
          const safeCell = Math.max(0, Math.min(9, cell));
          return defaultEmojis[safeCell];
        })
      );
    }

    return grid.map(row => 
      row.map(cell => {
        const safeCell = Math.max(0, Math.min(9, cell));
        return emojis[safeCell];
      })
    );
  };

  const displayGrid = getDisplayGrid();
  const gridHeight = grid.length;
  const gridWidth = grid[0]?.length || 0;

  if (gridHeight === 0 || gridWidth === 0) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <div className="text-amber-400 text-sm">No grid data</div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {/* Title */}
      {title && (
        <div className="text-xs text-amber-300 mb-2 font-semibold uppercase tracking-wide">
          {title}
        </div>
      )}

      {/* Grid */}
      <div 
        className={`
          inline-grid gap-1 p-3 rounded border-2 
          ${interactive ? 'bg-slate-800 border-amber-400' : 'bg-slate-700 border-amber-600'}
          ${disabled ? 'opacity-50' : ''}
        `}
        style={{ 
          gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`
        }}
      >
        {displayGrid.map((row, rowIndex) =>
          row.map((emoji, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                flex items-center justify-center rounded text-lg font-bold
                border transition-all duration-200
                ${interactive && !disabled
                  ? 'cursor-pointer bg-slate-700 border-amber-700 hover:bg-slate-600 hover:border-amber-500 hover:scale-105 active:scale-95'
                  : 'bg-slate-600 border-amber-800'
                }
                ${disabled ? 'cursor-not-allowed' : ''}
              `}
              style={{ 
                width: `${cellSize}px`, 
                height: `${cellSize}px`,
                fontSize: `${Math.max(12, cellSize * 0.4)}px`
              }}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              title={interactive ? `Click to change (currently: ${grid[rowIndex][colIndex]})` : undefined}
            >
              {emoji}
            </div>
          ))
        )}
      </div>

      {/* Interactive instructions */}
      {interactive && !disabled && (
        <div className="text-xs text-amber-600 mt-2">
          Click cells to cycle through values (0-9)
        </div>
      )}

      {/* Grid info for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-slate-500 mt-1">
          {gridHeight}×{gridWidth} • {emojiSet}
        </div>
      )}
    </div>
  );
}

/**
 * Display-only grid component for showing examples
 */
export function OfficerDisplayGrid({
  grid,
  title,
  emojiSet = 'tech_set1',
  cellSize = 32,
  className = ''
}: {
  grid: ARCGrid;
  title?: string;
  emojiSet?: string;
  cellSize?: number;
  className?: string;
}) {
  return (
    <OfficerGrid
      initialGrid={grid}
      emojiSet={emojiSet}
      interactive={false}
      title={title}
      cellSize={cellSize}
      className={className}
    />
  );
}