/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component is an enhanced, responsive version of the `OfficerGrid`. It uses the `useResponsiveGridSize` hook to adapt the grid's cell size to the available container space, ensuring that puzzles are viewable on a wide range of screen sizes. It supports multiple display modes (emoji, ARC colors, hybrid) and advanced interaction features like drag-to-paint. This is the preferred grid component for all new puzzle-solving interfaces.
 * SRP and DRY check: Pass. This component's single responsibility is to render a responsive grid. It correctly uses the `useResponsiveGridSize` hook for its sizing logic and composes `EnhancedGridCell` components for rendering individual cells, demonstrating good modularity and adherence to DRY principles.
 */

import { useState, useEffect } from 'react';
import type { ARCGrid, ARCDisplayGrid } from '@/types/arcTypes';
import { SPACE_EMOJIS, type EmojiSet } from '@/constants/spaceEmojis';
import { useResponsiveGridSize, getContainerConfig } from '@/hooks/useResponsiveGridSize';
import { EnhancedGridCell } from './EnhancedGridCell';
import type { DisplayMode, EnhancedDisplayOptions } from '@/types/puzzleDisplayTypes';

interface ResponsiveOfficerGridProps {
  /** Initial grid values (integers 0-9) */
  initialGrid: ARCGrid;
  /** Emoji set to use for visual representation */
  emojiSet?: EmojiSet;
  /** Whether the grid is interactive or display-only */
  interactive?: boolean;
  /** Callback when grid values change */
  onChange?: (grid: ARCGrid) => void;
  /** Whether the grid is disabled */
  disabled?: boolean;
  /** Optional title for the grid */
  title?: string;
  /** Container type affects sizing strategy */
  containerType?: 'example' | 'solver' | 'display';
  /** Additional CSS classes */
  className?: string;
  /** Override cell size calculation (for specific use cases) */
  fixedCellSize?: number;
  /** Enhanced display options for new UI system */
  displayMode?: DisplayMode;
  /** Selected value for painting mode */
  selectedValue?: number;
  /** Callback when cell is clicked with value selection */
  onCellInteraction?: (row: number, col: number, value: number) => void;
  /** Enable drag-to-paint functionality */
  enableDragToPaint?: boolean;
}

export function ResponsiveOfficerGrid({
  initialGrid,
  emojiSet = 'tech_set1',
  interactive = true,
  onChange,
  disabled = false,
  title,
  containerType = 'display',
  className = '',
  fixedCellSize,
  displayMode = 'emoji',
  selectedValue = 1,
  onCellInteraction,
  enableDragToPaint = false
}: ResponsiveOfficerGridProps) {
  const [grid, setGrid] = useState<ARCGrid>(initialGrid);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startCell: { row: number; col: number } | null;
    hoveredCell: { row: number; col: number } | null;
  }>({
    isDragging: false,
    startCell: null,
    hoveredCell: null
  });

  // Get responsive sizing
  const gridHeight = initialGrid.length;
  const gridWidth = initialGrid[0]?.length || 0;
  const containerConfig = getContainerConfig(containerType);
  
  const responsiveSize = useResponsiveGridSize({
    gridWidth,
    gridHeight,
    containerType,
    ...containerConfig
  });

  // Use fixed size if provided, otherwise use responsive calculation
  const cellSize = fixedCellSize || responsiveSize.cellSize;
  const fontSize = Math.max(10, Math.floor(cellSize * 0.5));

  // Update grid when initialGrid changes
  useEffect(() => {
    setGrid(initialGrid);
  }, [initialGrid]);

  // Handle global mouse events for drag selection and flood fill
  useEffect(() => {
    if (!enableDragToPaint) return;

    const handleGlobalMouseUp = () => {
      // Use callback to get FRESH drag state at time of mouse up
      setDragState((currentDragState) => {
        if (currentDragState.isDragging && currentDragState.startCell && currentDragState.hoveredCell) {
          console.log('Mouse up detected during drag. Start:', currentDragState.startCell, 'End:', currentDragState.hoveredCell, 'Selected value:', selectedValue);
          
          // Calculate selected cells directly here instead of using getSelectedCells()
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
          
          console.log('Calculated selection rectangle:', { minRow, maxRow, minCol, maxCol }, 'Total cells:', selectedCells.length);
          
          if (selectedCells.length > 0 && selectedValue !== undefined && selectedValue !== null) {
            // Use callback version of setGrid to get current state
            setGrid((currentGrid) => {
              const newGrid = currentGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isSelected = selectedCells.some(sc => sc.row === rowIndex && sc.col === colIndex);
                  return isSelected ? selectedValue : cell;
                })
              );
              console.log('FLOOD FILL APPLIED: Filled', selectedCells.length, 'cells with value', selectedValue);
              
              // Call onChange with new grid
              if (onChange) {
                setTimeout(() => onChange(newGrid), 0);
              }
              
              return newGrid;
            });
          } else {
            console.log('Flood fill skipped - no cells selected or no value:', { cellCount: selectedCells.length, selectedValue });
          }
        } else {
          console.log('Mouse up without active drag state:', { isDragging: currentDragState.isDragging, startCell: currentDragState.startCell, hoveredCell: currentDragState.hoveredCell });
        }
        
        // Always return cleared state
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

  /**
   * Handle cell click - Paint with selectedValue when in painting mode, otherwise cycle through values
   */
  const handleCellClick = (row: number, col: number) => {
    if (!interactive || disabled) return;

    // PAINTING MODE: Use selectedValue when onCellInteraction is provided
    if (onCellInteraction && selectedValue !== undefined && selectedValue !== null) {
      const newGrid = grid.map((gridRow, rowIndex) =>
        gridRow.map((cell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return selectedValue;
          }
          return cell;
        })
      );

      setGrid(newGrid);
      onChange?.(newGrid);
      onCellInteraction(row, col, selectedValue);
      return;
    }

    // DEFAULT MODE: Cycle through values (0→1→2→...→9→0)
    const newGrid = grid.map((gridRow, rowIndex) =>
      gridRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return (cell + 1) % 10;
        }
        return cell;
      })
    );

    setGrid(newGrid);
    onChange?.(newGrid);
    
    // Call callback if provided
    if (onCellInteraction) {
      onCellInteraction(row, col, newGrid[row][col]);
    }
  };

  /**
   * Handle enhanced cell interaction with selected value painting
   */
  const handleEnhancedCellClick = (row: number, col: number, currentValue: number) => {
    // Paint with selectedValue when in painting mode, otherwise cycle through values
    if (onCellInteraction && selectedValue !== undefined && selectedValue !== null) {
      handleCellValueChange(row, col, selectedValue);
      onCellInteraction(row, col, selectedValue);
    } else {
      // Default cycling behavior
      const nextValue = (currentValue + 1) % 10;
      handleCellValueChange(row, col, nextValue);
      if (onCellInteraction) {
        onCellInteraction(row, col, nextValue);
      }
    }
  };

  /**
   * Handle mouse down for drag selection (not immediate painting)
   */
  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (!interactive || disabled || !enableDragToPaint) return;

    if (e.button === 0) { // Left click - start selection
      console.log('Starting drag at:', { row, col });
      setDragState({
        isDragging: true,
        startCell: { row, col },
        hoveredCell: { row, col }
      });
      // DON'T paint immediately - wait for mouse up
    }
    // Note: Right-click is now handled by handleCellRightClick via onContextMenu
  };

  /**
   * Handle right-click to clear cell (set to 0)
   */
  const handleCellRightClick = (row: number, col: number, currentValue: number) => {
    if (!interactive || disabled) return;
    
    console.log('Right-click clear cell at', row, col, 'from', currentValue, 'to 0');
    handleCellValueChange(row, col, 0);
    
    if (onCellInteraction) {
      onCellInteraction(row, col, 0);
    }
  };

  /**
   * Handle mouse enter for drag selection visualization
   */
  const handleCellMouseEnter = (row: number, col: number) => {
    if (!enableDragToPaint) {
      console.log('Mouse enter skipped - enableDragToPaint is false');
      return;
    }
    
    if (!dragState.isDragging) {
      console.log('Mouse enter skipped - not dragging');
      return;
    }

    console.log('Mouse enter during drag:', { row, col }, 'Previous hovered:', dragState.hoveredCell);
    
    // Update selection area but don't paint yet
    setDragState(prev => ({
      ...prev,
      hoveredCell: { row, col }
    }));
  };

  /**
   * Get cells in selection rectangle
   */
  const getSelectedCells = () => {
    if (!dragState.startCell || !dragState.hoveredCell) return [];
    
    const minRow = Math.min(dragState.startCell.row, dragState.hoveredCell.row);
    const maxRow = Math.max(dragState.startCell.row, dragState.hoveredCell.row);
    const minCol = Math.min(dragState.startCell.col, dragState.hoveredCell.col);
    const maxCol = Math.max(dragState.startCell.col, dragState.hoveredCell.col);
    
    const cells = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ row: r, col: c });
      }
    }
    return cells;
  };

  /**
   * Check if cell is in current selection
   */
  const isCellSelected = (row: number, col: number) => {
    if (!dragState.isDragging) return false;
    return getSelectedCells().some(cell => cell.row === row && cell.col === col);
  };

  /**
   * Handle cell value change
   */
  const handleCellValueChange = (row: number, col: number, value: number) => {
    const newGrid = grid.map((gridRow, rowIndex) =>
      gridRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return value;
        }
        return cell;
      })
    );

    setGrid(newGrid);
    onChange?.(newGrid);
  };

  // Determine if we should use enhanced display system
  const useEnhancedDisplay = displayMode !== 'emoji' || onCellInteraction || enableDragToPaint;
  
  /**
   * Transform integer grid to emoji display (legacy compatibility)
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

  const displayGrid = useEnhancedDisplay ? null : getDisplayGrid();

  if (gridHeight === 0 || gridWidth === 0) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <div className="text-primary text-sm">No grid data</div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {/* Title */}
      {title && (
        <div className="text-xs text-primary mb-2 font-semibold uppercase tracking-wide">
          {title}
        </div>
      )}

      {/* Responsive Grid */}
      <div 
        className={`
          inline-grid gap-1 p-3 rounded border-2 mx-auto
          ${interactive ? 'bg-card border-border' : 'bg-muted border-border'}
          ${disabled ? 'opacity-50' : ''}
        `}
        style={fixedCellSize ? {
          gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`
        } : responsiveSize.gridStyle}
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu for right-click functionality
      >
        {useEnhancedDisplay ? (
          // Enhanced display system with color overlays and drag support
          grid.map((row, rowIndex) =>
            row.map((cellValue, colIndex) => {
              const isHovered = dragState.hoveredCell?.row === rowIndex && dragState.hoveredCell?.col === colIndex;
              const isSelected = isCellSelected(rowIndex, colIndex); // Show selection rectangle
              
              return (
                <EnhancedGridCell
                  key={`${rowIndex}-${colIndex}`}
                  value={cellValue}
                  displayMode={displayMode}
                  emojiSet={emojiSet}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  interactive={interactive && !disabled}
                  cellSize={cellSize}
                  onClick={(currentValue) => handleCellClick(rowIndex, colIndex)}
                  onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                  onRightClick={(currentValue) => handleCellRightClick(rowIndex, colIndex, currentValue)}
                />
              );
            })
          )
        ) : (
          // Legacy emoji display system for backward compatibility
          displayGrid!.map((row, rowIndex) =>
            row.map((emoji, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  flex items-center justify-center rounded font-bold
                  border transition-all duration-200
                  ${interactive && !disabled
                    ? 'cursor-pointer bg-muted border-border hover:bg-muted/80 hover:border-primary hover:scale-105 active:scale-95'
                    : 'bg-muted/50 border-border'
                  }
                  ${disabled ? 'cursor-not-allowed' : ''}
                `}
                style={{ 
                  width: `${cellSize}px`, 
                  height: `${cellSize}px`,
                  fontSize: `${fontSize}px`,
                  minHeight: `${Math.max(cellSize, 16)}px`,
                  minWidth: `${Math.max(cellSize, 16)}px`
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                title={interactive ? `Click to change (currently: ${grid[rowIndex][colIndex]})` : undefined}
              >
                {emoji}
              </div>
            ))
          )
        )}
      </div>

      {/* Interactive instructions */}
      {interactive && !disabled && (
        <div className="text-xs text-muted-foreground mt-2">
          {useEnhancedDisplay ? (
            enableDragToPaint ? 
              'Click or drag to paint with selected value • Right-click to clear' :
              onCellInteraction ?
                'Click cells to paint with selected value' :
                'Click cells to cycle through values (0-9)'
          ) : (
            'Click cells to cycle through values (0-9)'
          )}
        </div>
      )}

    </div>
  );
}

/**
 * Display-only version with responsive sizing and enhanced display support
 */
export function ResponsiveOfficerDisplayGrid({
  grid,
  title,
  emojiSet = 'tech_set1',
  containerType = 'example',
  className = '',
  fixedCellSize,
  displayMode = 'emoji'
}: {
  grid: ARCGrid;
  title?: string;
  emojiSet?: EmojiSet;
  containerType?: 'example' | 'solver' | 'display';
  className?: string;
  fixedCellSize?: number;
  displayMode?: DisplayMode;
}) {
  return (
    <ResponsiveOfficerGrid
      initialGrid={grid}
      emojiSet={emojiSet}
      interactive={false}
      title={title}
      containerType={containerType}
      className={className}
      fixedCellSize={fixedCellSize}
      displayMode={displayMode}
    />
  );
}