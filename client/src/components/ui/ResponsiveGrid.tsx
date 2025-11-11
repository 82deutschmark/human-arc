/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Modern responsive grid component using CSS Grid with fractional units. Replaces the problematic ResponsiveOfficerGrid that used JavaScript-driven pixel calculations. This component uses CSS-first responsive design with Tailwind utilities and is theme-agnostic.
 * SRP and DRY check: Pass. Single responsibility: render a responsive, interactive grid. Contains its own GridCell sub-component to maintain modularity while avoiding the complexity of separate files.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SPACE_EMOJIS, getARCColorCSS, type EmojiSet } from '@/constants/spaceEmojis';
import type { ARCGrid } from '@/types/arcTypes';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';

interface ResponsiveGridProps {
  /** Grid data (2D array of integers 0-9) */
  grid: ARCGrid;
  /** Whether the grid is interactive */
  interactive?: boolean;
  /** Callback when grid changes */
  onChange?: (grid: ARCGrid) => void;
  /** Display mode for cells */
  displayMode?: DisplayMode;
  /** Emoji set for emoji display mode */
  emojiSet?: EmojiSet;
  /** Currently selected value for painting */
  selectedValue?: number;
  /** Enable drag-to-paint functionality */
  enableDragToPaint?: boolean;
  /** Optional title */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the grid is disabled */
  disabled?: boolean;
  /** Scale factor for grid size (10-50px) - deprecated, use fixedCellSize */
  scale?: number;
  /** Fixed cell size in pixels - overrides scale calculation */
  fixedCellSize?: number;
}

interface GridCellProps {
  value: number;
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  isSelected: boolean;
  isHovered: boolean;
  interactive: boolean;
  onClick: (value: number) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onRightClick: (value: number) => void;
}

// Internal GridCell component using Tailwind variants
const GridCell = React.memo(({
  value,
  displayMode,
  emojiSet,
  isSelected,
  isHovered,
  interactive,
  onClick,
  onMouseDown,
  onMouseEnter,
  onRightClick
}: GridCellProps) => {
  const getCellContent = () => {
    switch (displayMode) {
      case 'emoji':
        return SPACE_EMOJIS[emojiSet][value];
      case 'arc-colors':
        return value.toString();
      case 'numbers':
        return value.toString();
      case 'hybrid':
        return SPACE_EMOJIS[emojiSet][value];
      default:
        return SPACE_EMOJIS[emojiSet][value];
    }
  };

  const getCellStyles = () => {
    const baseStyle: React.CSSProperties = {};
    
    if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
      baseStyle.backgroundColor = getARCColorCSS(value);
      baseStyle.color = value === 0 || value === 5 || value === 9 ? 'white' : 'black';
    }
    
    // Dynamic emoji sizing based on container
    // We'll use CSS clamp() to ensure emojis are readable at any grid size
    if (displayMode === 'emoji' || displayMode === 'hybrid') {
      // Calculate dynamic font size that scales with the cell
      // min: 0.6rem (10px), preferred: 3vw per cell, max: 1.2rem (19px)
      baseStyle.fontSize = 'clamp(0.6rem, 3vw, 1.2rem)';
    }
    
    return baseStyle;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (interactive) {
      e.preventDefault();
      onClick(value);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactive) {
      onMouseDown(e);
    }
  };

  const handleMouseEnter = () => {
    if (interactive) {
      onMouseEnter();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (interactive) {
      e.preventDefault();
      onRightClick(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(value);
    }
  };

  return (
    <div
      className={cn(
        // Base styles - ULTRA COMPACT
        "aspect-square flex items-center justify-center font-bold border-0 transition-all duration-100 user-select-none relative",

        // NO minimum sizes - let it scale down to nothing if needed
        "",

        // Interactive states
        interactive && [
          "cursor-pointer",
          // Default state
          displayMode === 'emoji' || displayMode === 'numbers'
            ? "bg-muted text-primary border-border"
            : "border-border",
          // Hover state - minimal feedback, no scale/shadow to avoid distraction
          "hover:border-primary/50",
          // Selected state
          isSelected && [
            "border-primary border-2 scale-105 shadow-lg shadow-primary/30",
            "after:absolute after:top-0 after:right-0 after:w-2 after:h-2 after:bg-primary after:rounded-full after:-translate-y-1 after:translate-x-1"
          ],
          // Hovered state (for drag selection)
          isHovered && !isSelected && "border-primary/70 bg-muted/80"
        ],

        // Non-interactive state
        !interactive && [
          displayMode === 'emoji' || displayMode === 'numbers'
            ? "bg-muted/50 text-muted-foreground border-border"
            : "border-border",
          "cursor-default"
        ],

        // Hybrid mode text shadow for readability
        displayMode === 'hybrid' && "text-shadow-sm"
      )}
      style={getCellStyles()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      role={interactive ? "button" : "cell"}
      tabIndex={interactive ? 0 : -1}
      title={interactive ? `Value ${value} - Left click: select, Right click: clear` : `Value ${value}`}
    >
      {getCellContent()}
    </div>
  );
});

GridCell.displayName = 'GridCell';

export function ResponsiveGrid({
  grid,
  interactive = true,
  onChange,
  displayMode = 'emoji',
  emojiSet = 'tech_set1',
  selectedValue = 1,
  enableDragToPaint = false,
  title,
  className = '',
  disabled = false,
  scale = 30,
  fixedCellSize
}: ResponsiveGridProps) {
  const [localGrid, setLocalGrid] = useState<ARCGrid>(grid);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startCell: { row: number; col: number } | null;
    hoveredCell: { row: number; col: number } | null;
  }>({
    isDragging: false,
    startCell: null,
    hoveredCell: null
  });

  // Update local grid when prop changes
  useEffect(() => {
    setLocalGrid(grid);
  }, [grid]);

  // Global mouse up handler for drag painting
  useEffect(() => {
    if (!enableDragToPaint) return;

    const handleGlobalMouseUp = () => {
      setDragState((currentDragState) => {
        if (currentDragState.isDragging && currentDragState.startCell && currentDragState.hoveredCell) {
          const minRow = Math.min(currentDragState.startCell.row, currentDragState.hoveredCell.row);
          const maxRow = Math.max(currentDragState.startCell.row, currentDragState.hoveredCell.row);
          const minCol = Math.min(currentDragState.startCell.col, currentDragState.hoveredCell.col);
          const maxCol = Math.max(currentDragState.startCell.col, currentDragState.hoveredCell.col);

          const selectedCells: Array<{ row: number; col: number }> = [];
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              selectedCells.push({ row: r, col: c });
            }
          }

          if (selectedCells.length > 0 && selectedValue !== undefined && selectedValue !== null) {
            setLocalGrid((currentGrid) => {
              const newGrid = currentGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isSelected = selectedCells.some(sc => sc.row === rowIndex && sc.col === colIndex);
                  return isSelected ? selectedValue : cell;
                })
              );

              if (onChange) {
                setTimeout(() => onChange(newGrid), 0);
              }

              return newGrid;
            });
          }
        }

        return {
          isDragging: false,
          startCell: null,
          hoveredCell: null
        };
      });
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [enableDragToPaint, selectedValue, onChange]);

  const handleCellClick = useCallback((row: number, col: number, currentValue: number) => {
    if (!interactive || disabled) return;

    const newValue = selectedValue !== undefined && selectedValue !== null ? selectedValue : (currentValue + 1) % 10;
    const newGrid = localGrid.map((gridRow, rowIndex) =>
      gridRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return newValue;
        }
        return cell;
      })
    );

    setLocalGrid(newGrid);
    onChange?.(newGrid);
  }, [interactive, disabled, selectedValue, localGrid, onChange]);

  const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    if (!interactive || disabled || !enableDragToPaint || e.button !== 0) return;

    setDragState({
      isDragging: true,
      startCell: { row, col },
      hoveredCell: { row, col }
    });
  }, [interactive, disabled, enableDragToPaint]);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!enableDragToPaint || !dragState.isDragging) return;

    setDragState(prev => ({
      ...prev,
      hoveredCell: { row, col }
    }));
  }, [enableDragToPaint, dragState.isDragging]);

  const handleCellRightClick = useCallback((row: number, col: number) => {
    if (!interactive || disabled) return;

    const newGrid = localGrid.map((gridRow, rowIndex) =>
      gridRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return 0;
        }
        return cell;
      })
    );

    setLocalGrid(newGrid);
    onChange?.(newGrid);
  }, [interactive, disabled, localGrid, onChange]);

  const isCellSelected = useCallback((row: number, col: number) => {
    if (!dragState.isDragging || !dragState.startCell || !dragState.hoveredCell) return false;

    const minRow = Math.min(dragState.startCell.row, dragState.hoveredCell.row);
    const maxRow = Math.max(dragState.startCell.row, dragState.hoveredCell.row);
    const minCol = Math.min(dragState.startCell.col, dragState.hoveredCell.col);
    const maxCol = Math.max(dragState.startCell.col, dragState.hoveredCell.col);

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [dragState]);

  const gridHeight = localGrid.length;
  const gridWidth = localGrid[0]?.length || 0;

  // Calculate responsive cell size - more sophisticated than just fixed pixels
  const getResponsiveCellSize = () => {
    if (fixedCellSize) {
      // Fixed size override - use exactly what user specified
      return fixedCellSize;
    }

    // Responsive calculation based on scale preference and screen constraints
    const baseSize = scale;
    const maxCellSize = Math.min(60, Math.floor(window.innerWidth / (gridWidth * 1.2))); // Screen-aware max
    const minCellSize = Math.max(16, Math.floor(window.innerWidth / (gridWidth * 8))); // Screen-aware min

    // Clamp the user's scale preference to responsive bounds
    return Math.max(minCellSize, Math.min(maxCellSize, baseSize));
  };

  const actualCellSize = getResponsiveCellSize();
  const fontSize = Math.max(10, Math.floor(actualCellSize * 0.5));

  if (gridHeight === 0 || gridWidth === 0) {
    return (
      <div className={cn("text-center p-4", className)}>
        <div className="text-muted-foreground text-sm">No grid data</div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {/* Title */}
      {title && (
        <div className="text-xs text-primary mb-1 font-semibold uppercase tracking-wide">
          {title}
        </div>
      )}

      {/* Ultra-compact grid - NO WASTED SPACE */}
      <div
        className={cn(
          "inline-grid gap-0 p-0 border",
          interactive && !disabled ? "bg-card border-border" : "bg-muted border-border",
          disabled && "opacity-50"
        )}
        style={fixedCellSize ? {
          // Pixel-based grid styling when fixedCellSize is provided (like original ResponsiveOfficerGrid)
          gridTemplateColumns: `repeat(${gridWidth}, ${actualCellSize}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${actualCellSize}px)`,
          maxWidth: '100%',
          maxHeight: '100%'
        } : {
          // Fallback to responsive fractional units
          gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
          gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
          width: `${gridWidth * actualCellSize}px`,
          height: `${gridHeight * actualCellSize}px`,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {localGrid.map((row, rowIndex) =>
          row.map((cellValue, colIndex) => {
            const isHovered = dragState.hoveredCell?.row === rowIndex && dragState.hoveredCell?.col === colIndex;
            const isSelected = isCellSelected(rowIndex, colIndex);

            return (
              <GridCell
                key={`${rowIndex}-${colIndex}`}
                value={cellValue}
                displayMode={displayMode}
                emojiSet={emojiSet}
                isSelected={isSelected}
                isHovered={isHovered}
                interactive={interactive && !disabled}
                onClick={(currentValue) => handleCellClick(rowIndex, colIndex, currentValue)}
                onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                onRightClick={() => handleCellRightClick(rowIndex, colIndex)}
              />
            );
          })
        )}
      </div>

      {/* No instructions - save space */}
    </div>
  );
}