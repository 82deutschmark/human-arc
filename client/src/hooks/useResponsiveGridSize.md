/**
 * DEPRECATED - DO NOT USE THIS FILE
 * ==================================
 * This file has been deprecated as part of the HARC UI refactoring (Task 2.1).
 *
 * REASON FOR DEPRECATION:
 * This hook was the root cause of layout issues by using JavaScript-driven,
 * pixel-based responsive design instead of CSS-first approach with Tailwind.
 *
 * REPLACEMENT:
 * Use CSS Grid with fractional units (fr) and Tailwind responsive utilities
 * in the new ResponsiveGrid component (client/src/components/ui/ResponsiveGrid.tsx).
 *
 * DATE DEPRECATED: 2025-09-22
 * DEPRECATED BY: Sonnet 4
 *
 * Original purpose: Calculates optimal cell size based on grid dimensions, container type, and viewport
 */

import { useState, useEffect } from 'react';

interface GridSizeOptions {
  gridWidth: number;
  gridHeight: number;
  containerType: 'example' | 'solver' | 'display';
  minCellSize?: number;
  maxCellSize?: number;
  padding?: number;
}

interface GridSizeResult {
  cellSize: number;
  totalWidth: number;
  totalHeight: number;
  gridStyle: {
    gridTemplateColumns: string;
    gridTemplateRows: string;
  };
}

export function useResponsiveGridSize({
  gridWidth,
  gridHeight,
  containerType,
  minCellSize = 16,
  maxCellSize = 60,
  padding = 16
}: GridSizeOptions): GridSizeResult {
  const [dimensions, setDimensions] = useState<GridSizeResult>(() => 
    calculateGridSize({ gridWidth, gridHeight, containerType, minCellSize, maxCellSize, padding }, window.innerWidth)
  );

  useEffect(() => {
    const calculateAndUpdate = () => {
      const newDimensions = calculateGridSize(
        { gridWidth, gridHeight, containerType, minCellSize, maxCellSize, padding },
        window.innerWidth
      );
      setDimensions(newDimensions);
    };

    // Recalculate on window resize
    const handleResize = () => {
      calculateAndUpdate();
    };

    window.addEventListener('resize', handleResize);
    calculateAndUpdate();

    return () => window.removeEventListener('resize', handleResize);
  }, [gridWidth, gridHeight, containerType, minCellSize, maxCellSize, padding]);

  return dimensions;
}

function calculateGridSize(
  options: GridSizeOptions, 
  viewportWidth: number
): GridSizeResult {
  const { gridWidth, gridHeight, containerType, minCellSize = 16, maxCellSize = 60, padding = 16 } = options;

  // Define responsive breakpoints and available space
  const breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  };

  let availableWidth: number;
  let targetCellSize: number;

  if (viewportWidth < breakpoints.mobile) {
    // Mobile: Use most of screen width, smaller cells
    availableWidth = Math.min(viewportWidth - 32, 350);
    targetCellSize = containerType === 'example' ? 28 : 36;
  } else if (viewportWidth < breakpoints.tablet) {
    // Tablet: More space available, better utilization
    availableWidth = Math.min(viewportWidth * 0.85, 600);
    targetCellSize = containerType === 'example' ? 36 : 44;
  } else {
    // Desktop: Better space utilization for larger screens
    availableWidth = containerType === 'example' ? 350 : 600;
    targetCellSize = containerType === 'example' ? 36 : 52;
  }

  // Adjust for solver vs example containers
  if (containerType === 'solver') {
    targetCellSize += 8;
    availableWidth = Math.max(availableWidth, 400);
  }

  // Calculate optimal cell size that fits within constraints
  const maxCellByWidth = Math.floor((availableWidth - padding * 2) / gridWidth);
  const maxCellByHeight = containerType === 'solver' ? maxCellSize : Math.min(maxCellSize, 48);

  let optimalCellSize = Math.min(
    targetCellSize,
    maxCellByWidth,
    maxCellByHeight
  );

  // Ensure it stays within bounds
  optimalCellSize = Math.max(minCellSize, Math.min(maxCellSize, optimalCellSize));

  // Special handling for very large grids
  if (gridWidth >= 10 || gridHeight >= 10) {
    optimalCellSize = Math.max(minCellSize, Math.min(optimalCellSize, 28));
  }

  // Special handling for very small grids
  if (gridWidth <= 3 && gridHeight <= 3 && containerType === 'solver') {
    optimalCellSize = Math.min(optimalCellSize + 12, maxCellSize);
  }

  const totalWidth = gridWidth * optimalCellSize + padding * 2;
  const totalHeight = gridHeight * optimalCellSize + padding * 2;

  return {
    cellSize: optimalCellSize,
    totalWidth,
    totalHeight,
    gridStyle: {
      gridTemplateColumns: `repeat(${gridWidth}, ${optimalCellSize}px)`,
      gridTemplateRows: `repeat(${gridHeight}, ${optimalCellSize}px)`
    }
  };
}

/**
 * Get container-specific sizing parameters
 */
export function getContainerConfig(containerType: 'example' | 'solver' | 'display') {
  switch (containerType) {
    case 'example':
      return {
        minCellSize: 16,
        maxCellSize: 40,
        padding: 12
      };
    case 'solver':
      return {
        minCellSize: 20,
        maxCellSize: 60,
        padding: 16
      };
    case 'display':
    default:
      return {
        minCellSize: 16,
        maxCellSize: 48,
        padding: 12
      };
  }
}