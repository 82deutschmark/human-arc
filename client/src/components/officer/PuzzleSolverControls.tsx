/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component provides UI controls for adjusting the output grid size of a puzzle. It was extracted from `ResponsivePuzzleSolver.tsx` to adhere to the Single Responsibility Principle. It allows users to select width and height via dropdowns and offers quick-select buttons for common sizes derived from the puzzle's training examples.
 * SRP and DRY check: Pass. This component has a single, clear responsibility: to provide controls for grid size selection. Its extraction from a larger component is a good example of improving code modularity and adhering to SRP.
 */

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
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-full">
      <h4 className="text-amber-300 text-2xl font-bold mb-4 text-center">OUTPUT SIZE</h4>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xl">
        <select
          value={currentDimensions.height}
          onChange={(e) => onSizeChange(parseInt(e.target.value), currentDimensions.width)}
          className="bg-slate-700 border border-slate-500 rounded px-4 py-3 text-amber-100 text-xl h-16 min-w-[110px] flex-shrink-0"
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
            <option key={size} value={size}>H: {size}</option>
          ))}
        </select>
        <span className="text-slate-400 text-2xl font-bold flex-shrink-0">×</span>
        <select
          value={currentDimensions.width}
          onChange={(e) => onSizeChange(currentDimensions.height, parseInt(e.target.value))}
          className="bg-slate-700 border border-slate-500 rounded px-4 py-3 text-amber-100 text-xl h-16 min-w-[110px] flex-shrink-0"
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
            <button
              key={index}
              onClick={() => onSizeChange(size.height, size.width)}
              className="bg-amber-700 hover:bg-amber-600 text-white text-xl font-bold px-4 py-3 h-16 rounded min-w-[90px]"
            >
              {size.height}×{size.width}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}