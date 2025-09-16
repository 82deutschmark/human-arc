/**
 * WHAT DOES THIS DO?
 * ===================
 * This component provides grid size selection controls for ARC puzzle solving.
 * It allows users to adjust the output grid dimensions (width x height) for their
 * puzzle solutions, with quick-select buttons based on training example patterns.
 * 
 * WHO WROTE IT?
 * =============
 * Extracted from ResponsivePuzzleSolver.tsx as part of code refactoring to follow
 * Single Responsibility Principle and DRY principles. Original code was inline
 * within the main solver component (lines 632-670).
 * 
 * WHEN WAS IT WRITTEN?
 * ====================
 * September 2025 - Extracted during component modularization effort
 * 
 * WHERE DID I GET THIS CODE FROM?
 * ===============================
 * Extracted from ResponsivePuzzleSolver.tsx solving interface section.
 * Originally part of the "Combined Controls Panel" inline implementation.
 * 
 * DOES IT WORK?
 * =============
 * Yes - This component handles:
 * - Width/Height dropdown selection (1-30 range)
 * - Quick size suggestion buttons from training examples
 * - Real-time dimension updates with callback to parent
 * - Styled to match Space Force theme (amber/slate colors)
 * 
 * Is it actually used anywhere?
 * =============================
 * Yes - Used by ResponsivePuzzleSolver.tsx in the main solving interface.
 * Replaces the inline grid size controls to improve code organization.
 * 
 * HOW IT WORKS:
 * =============
 * 1. Receives current grid dimensions from parent component
 * 2. Renders two dropdowns for width/height selection (1-30 range)
 * 3. Calls onSizeChange callback when user selects new dimensions
 * 4. Gets suggested sizes from training examples via getSuggestedSizes prop
 * 5. Renders up to 3 quick-select buttons for common sizes from examples
 * 6. All size changes trigger grid recreation in parent component
 * 
 * DEPENDENCIES:
 * =============
 * - @/components/ui/button (for consistent button styling)
 * - Parent must provide currentDimensions, onSizeChange, getSuggestedSizes
 * 
 * STYLING:
 * ========
 * - Space Force theme: slate-800 background, amber-300 text
 * - Large interactive elements (h-14) for better UX
 * - Responsive button layout with min-width constraints
 */

import { Button } from '@/components/ui/button';

interface PuzzleSolverControlsProps {
  currentDimensions: { width: number; height: number };
  onSizeChange: (width: number, height: number) => void;
  getSuggestedSizes: () => Array<{ width: number; height: number; label: string }>;
}

export function PuzzleSolverControls({ 
  currentDimensions, 
  onSizeChange, 
  getSuggestedSizes 
}: PuzzleSolverControlsProps) {
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-full">
      <h4 className="text-amber-300 text-2xl font-bold mb-4 text-center">OUTPUT SIZE</h4>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xl">
        <select
          value={currentDimensions.width}
          onChange={(e) => onSizeChange(parseInt(e.target.value), currentDimensions.height)}
          className="bg-slate-700 border border-slate-500 rounded px-4 py-3 text-amber-100 text-xl h-16 min-w-[110px] flex-shrink-0"
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
            <option key={size} value={size}>W: {size}</option>
          ))}
        </select>
        <span className="text-slate-400 text-2xl font-bold flex-shrink-0">×</span>
        <select
          value={currentDimensions.height}
          onChange={(e) => onSizeChange(currentDimensions.width, parseInt(e.target.value))}
          className="bg-slate-700 border border-slate-500 rounded px-4 py-3 text-amber-100 text-xl h-16 min-w-[110px] flex-shrink-0"
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
            <option key={size} value={size}>H: {size}</option>
          ))}
        </select>
      </div>
      
      {/* Quick Size Suggestions */}
      {getSuggestedSizes().length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {getSuggestedSizes().slice(0, 3).map((size, index) => (
            <button
              key={index}
              onClick={() => onSizeChange(size.width, size.height)}
              className="bg-amber-700 hover:bg-amber-600 text-white text-xl font-bold px-4 py-3 h-16 rounded min-w-[90px]"
            >
              {size.width}×{size.height}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}