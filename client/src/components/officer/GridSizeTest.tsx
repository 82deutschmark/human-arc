/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This is a diagnostic component used for testing and demonstrating the scaling behavior of different grid components. It is not intended for use in the main application but serves as a development tool to visualize how fixed-size and responsive grids handle various puzzle dimensions, especially on smaller viewports.
 * SRP and DRY check: Pass. This component's single responsibility is to be a testbed for grid components. It is not part of the production application and does not need to adhere to the same strict SRP and DRY principles as production code, but it is well-structured for its purpose.
 */

import { OfficerGrid, OfficerDisplayGrid } from '@/components/officer/OfficerGrid';
import { ResponsiveOfficerGrid, ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import type { ARCGrid } from '@/types/arcTypes';

// Sample grids of different sizes
const testGrids: { size: string; grid: ARCGrid; description: string }[] = [
  {
    size: '3x3',
    grid: [
      [0, 1, 0],
      [1, 2, 1], 
      [0, 1, 0]
    ],
    description: 'Small puzzle - should be compact'
  },
  {
    size: '5x5', 
    grid: [
      [0, 1, 0, 1, 0],
      [1, 2, 1, 2, 1],
      [0, 1, 3, 1, 0],
      [1, 2, 1, 2, 1],
      [0, 1, 0, 1, 0]
    ],
    description: 'Medium puzzle - should fit well'
  },
  {
    size: '10x8',
    grid: [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 2, 1, 2, 1, 2, 1, 2],
      [0, 1, 3, 1, 0, 1, 3, 1],
      [1, 2, 1, 2, 1, 2, 1, 2],
      [0, 1, 0, 1, 4, 1, 0, 1],
      [1, 2, 1, 2, 1, 2, 1, 2],
      [0, 1, 3, 1, 0, 1, 3, 1],
      [1, 2, 1, 2, 1, 2, 1, 2],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 2, 1, 2, 1, 2, 1, 2]
    ],
    description: 'Large puzzle - likely to overflow on mobile'
  }
];

export function GridSizeTest() {
  return (
    <div className="min-h-screen bg-slate-900 text-amber-50 p-8">
      <h1 className="text-3xl font-bold text-amber-400 mb-8 text-center">
        🧪 GRID SCALING TEST
      </h1>
      
      <p className="text-slate-300 text-center mb-8 max-w-3xl mx-auto">
        This demonstrates the current scaling issues. Fixed 40px cells cause problems with larger grids.
        Notice how larger grids become unwieldy and may overflow on smaller screens.
      </p>

      {/* Current Implementation - Fixed Size */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-amber-400 mb-6">
          Current Implementation (Fixed 40px cells)
        </h2>
        
        <div className="space-y-8">
          {testGrids.map((test, index) => (
            <div key={index} className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-300 mb-2">
                {test.size} Grid - {test.description}
              </h3>
              
              <div className="flex flex-wrap items-start gap-8">
                {/* Display version */}
                <div>
                  <h4 className="text-sm text-slate-400 mb-2">Display (non-interactive)</h4>
                  <OfficerDisplayGrid
                    grid={test.grid}
                    cellSize={40}
                    title="FIXED"
                  />
                  <div className="text-xs text-slate-500 mt-2 text-center">
                    Width: {test.grid[0].length * 40 + 32}px
                  </div>
                </div>

                {/* Interactive version */}
                <div>
                  <h4 className="text-sm text-slate-400 mb-2">Interactive</h4>
                  <OfficerGrid
                    initialGrid={test.grid}
                    cellSize={40}
                    title="FIXED"
                    onChange={() => {}}
                  />
                  <div className="text-xs text-slate-500 mt-2 text-center">
                    Width: {test.grid[0].length * 40 + 32}px
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Responsive Implementation */}
      <div className="bg-green-900 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-green-400 mb-6">
          New Responsive Implementation (Adaptive sizing)
        </h2>
        
        <div className="space-y-8">
          {testGrids.map((test, index) => (
            <div key={index} className="bg-green-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-300 mb-2">
                {test.size} Grid - {test.description}
              </h3>
              
              <div className="flex flex-wrap items-start gap-8">
                {/* Example container sizing */}
                <div>
                  <h4 className="text-sm text-green-300 mb-2">Example Container</h4>
                  <ResponsiveOfficerDisplayGrid
                    grid={test.grid}
                    containerType="example"
                    title="EXAMPLE"
                  />
                </div>

                {/* Solver container sizing */}
                <div>
                  <h4 className="text-sm text-green-300 mb-2">Solver Container</h4>
                  <ResponsiveOfficerGrid
                    initialGrid={test.grid}
                    containerType="solver"
                    title="SOLVER"
                    onChange={() => {}}
                  />
                </div>

                {/* Display container sizing */}
                <div>
                  <h4 className="text-sm text-green-300 mb-2">Display Container</h4>
                  <ResponsiveOfficerDisplayGrid
                    grid={test.grid}
                    containerType="display"
                    title="DISPLAY"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Simulation */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-amber-400 mb-6">
          Mobile Viewport Test (375px wide) - Fixed Implementation
        </h2>
        
        <div className="bg-slate-600 rounded-lg p-4" style={{ width: '375px', margin: '0 auto', overflow: 'auto' }}>
          <p className="text-xs text-slate-300 mb-4 text-center">
            Mobile viewport (375px width) - Testing overflow behavior with fixed sizing:
          </p>
          
          <div className="space-y-4">
            {testGrids.map((test, index) => (
              <div key={index} className="bg-slate-700 rounded p-3">
                <div className="text-sm text-amber-300 mb-2">{test.size} - Fixed</div>
                <div style={{ overflow: 'auto' }}>
                  <OfficerDisplayGrid
                    grid={test.grid}
                    cellSize={40}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {test.grid[0].length * 40 + 32}px wide (overflow: {test.grid[0].length * 40 + 32 > 375 ? 'YES' : 'NO'})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Simulation - Responsive */}
      <div className="bg-green-900 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-400 mb-6">
          Mobile Viewport Simulation (375px wide) - Responsive Implementation
        </h2>
        
        <div className="bg-green-600 rounded-lg p-4" style={{ width: '375px', margin: '0 auto', overflow: 'auto' }}>
          <p className="text-xs text-green-100 mb-4 text-center">
            Same mobile width, but with responsive grids that adapt to fit:
          </p>
          
          <div className="space-y-4">
            {testGrids.map((test, index) => (
              <div key={index} className="bg-green-700 rounded p-3">
                <div className="text-sm text-green-300 mb-2">{test.size} - Responsive</div>
                <div className="flex justify-center">
                  <ResponsiveOfficerDisplayGrid
                    grid={test.grid}
                    containerType="example"
                  />
                </div>
                <div className="text-xs text-green-200 mt-1 text-center">
                  Automatically sized to fit mobile width
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="text-slate-400">
          This test demonstrates why we need responsive grid sizing that adapts to both puzzle dimensions and screen size.
        </p>
      </div>
    </div>
  );
}