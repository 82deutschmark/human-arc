/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component renders a single cell within a puzzle grid. It is 'enhanced' because it intelligently handles multiple display modes (emoji, ARC colors, hybrid), interaction states (selected, hovered), and user events (click, mouse down, etc.). It dynamically adjusts its appearance, including background color, text color, and font size, based on the provided props. This is a core presentational component for rendering the puzzle grids in the Officer and HARC tracks.
 * SRP and DRY check: Pass. This component has the single responsibility of displaying one grid cell. It is a pure, reusable component that receives all its data via props, making it highly modular and compliant with DRY principles.
 */

import React from 'react';
import { SPACE_EMOJIS, getARCColorCSS } from '@/constants/spaceEmojis';
import type { EnhancedGridCellProps } from '@/types/puzzleDisplayTypes';

export const EnhancedGridCell = React.memo(({
  value,
  displayMode,
  emojiSet,
  isSelected,
  isHovered,
  interactive,
  onClick,
  onMouseDown,
  onMouseEnter,
  onRightClick,
  cellSize,
  className = ''
}: EnhancedGridCellProps) => {

  const getCellContent = () => {
    switch (displayMode) {
      case 'emoji':
        return SPACE_EMOJIS[emojiSet][value];
      case 'arc-colors':
        return value.toString();
      case 'hybrid':
        return SPACE_EMOJIS[emojiSet][value];
    }
  };

  const getCellBackground = () => {
    if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
      return getARCColorCSS(value);
    }
    
    // Emoji mode - use slate background
    if (interactive) {
      if (isSelected) return 'rgb(100, 116, 139)'; // slate-500
      if (isHovered) return 'rgb(71, 85, 105)'; // slate-600
      return 'rgb(51, 65, 85)'; // slate-700
    }
    return 'rgb(71, 85, 105)'; // slate-600
  };

  const getTextColor = () => {
    if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
      // Calculate contrast based on ARC color
      const isDarkBackground = value === 0 || value === 5 || value === 9; // Black, Grey, Maroon
      return isDarkBackground ? 'white' : 'black';
    }
    
    // Emoji mode - use amber text
    return 'rgb(251, 191, 36)'; // amber-400
  };

  const getBorderColor = () => {
    if (isSelected) {
      return 'rgb(251, 191, 36)'; // amber-400
    }
    if (isHovered) {
      return 'rgb(251, 191, 36)'; // amber-400 with lower opacity
    }
    if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
      return 'rgb(100, 116, 139)'; // slate-500
    }
    return 'rgb(148, 163, 184)'; // slate-400
  };

  const getFontSize = () => {
    // Dynamic font sizing based on cell size
    if (cellSize <= 16) return Math.max(8, cellSize * 0.5);
    if (cellSize <= 24) return Math.max(10, cellSize * 0.6);
    if (cellSize <= 32) return Math.max(12, cellSize * 0.65);
    if (cellSize <= 48) return Math.max(14, cellSize * 0.7);
    return Math.max(16, cellSize * 0.75);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (interactive && onClick) {
      e.preventDefault();
      onClick(value);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactive && onMouseDown) {
      onMouseDown(e);
    }
  };

  const handleMouseEnter = () => {
    if (interactive && onMouseEnter) {
      onMouseEnter();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (interactive) {
      e.preventDefault();
      // Use dedicated right-click handler if provided, otherwise default to clear
      if (onRightClick) {
        onRightClick(value);
      } else if (onClick) {
        onClick(0);
      }
    }
  };

  const cellStyles: React.CSSProperties = {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    backgroundColor: getCellBackground(),
    color: getTextColor(),
    borderColor: getBorderColor(),
    fontSize: `${getFontSize()}px`,
    minHeight: `${Math.max(cellSize, 16)}px`,
    minWidth: `${Math.max(cellSize, 16)}px`,
    borderWidth: isSelected ? '2px' : '1px',
    borderStyle: 'solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    borderRadius: '2px',
    transition: 'all 0.2s ease-in-out',
    cursor: interactive ? 'pointer' : 'default',
    userSelect: 'none',
    position: 'relative'
  };

  // Add hover effects for interactive cells
  if (interactive) {
    if (isHovered) {
      cellStyles.transform = 'scale(1.05)';
      cellStyles.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.3)';
    }
    if (isSelected) {
      cellStyles.boxShadow = '0 0 0 2px rgb(251, 191, 36), 0 2px 8px rgba(251, 191, 36, 0.5)';
    }
  }

  // Add text shadow for better readability in hybrid mode
  if (displayMode === 'hybrid') {
    cellStyles.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.7)';
  }

  return (
    <div
      style={cellStyles}
      className={className}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onContextMenu={handleContextMenu}
      title={interactive ? `Value ${value} - Left click: select, Right click: clear` : `Value ${value}`}
      role={interactive ? "button" : "cell"}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      } : undefined}
    >
      {getCellContent()}
      
      {/* Selection indicator for better visibility */}
      {isSelected && interactive && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: 'rgb(251, 191, 36)',
            borderRadius: '50%',
            border: '1px solid rgb(51, 65, 85)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
});

EnhancedGridCell.displayName = 'EnhancedGridCell';