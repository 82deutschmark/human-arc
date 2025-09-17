/**Author: Claude
 * Date: 2025-09-17
 * Audit: Dr. Max Power
 * Training Examples Section
 * =========================
 * Responsive layout system for displaying ARC puzzle training examples
 * Handles multiple examples with proper input/output pairing and mobile optimization
 */

import { useState, useEffect } from 'react';
import { ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import { GridWithDimensions } from '@/components/officer/GridWithDimensions';
import { SizeSlider } from '@/components/ui/SizeSlider';
import type { ARCGrid } from '@/types/arcTypes';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';

interface TrainingExample {
  input: ARCGrid;
  output: ARCGrid;
}

interface TrainingExamplesSectionProps {
  examples: TrainingExample[];
  emojiSet?: EmojiSet;
  title?: string;
  className?: string;
  displayMode?: DisplayMode;
}

export function TrainingExamplesSection({ 
  examples, 
  emojiSet = 'tech_set1', 
  title = '📚 TRAINING EXAMPLES',
  className = '',
  displayMode = 'emoji'
}: TrainingExamplesSectionProps) {
  const [cellSize, setCellSize] = useState(() => {
    const savedSize = localStorage.getItem('trainingExampleCellSize');
    return savedSize ? Number(savedSize) : 50;
  });

  useEffect(() => {
    localStorage.setItem('trainingExampleCellSize', String(cellSize));
  }, [cellSize]);
  
  if (!examples || examples.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-slate-400">No training examples available</div>
      </div>
    );
  }

  const getExampleBgClass = (index: number) => {
    const bgClasses = [
      'bg-rose-100',
      'bg-sky-100',
      'bg-emerald-100', 
      'bg-purple-100',
      'bg-amber-100'
    ];
    return bgClasses[index % bgClasses.length];
  };

  return (
    <div className={`bg-slate-800 border border-slate-600 rounded-lg p-6 ${className}`}>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-amber-400 text-2xl font-bold flex items-center">
            {title}
          </h2>
          <div className="flex items-center gap-4 w-1/3">
            <SizeSlider value={cellSize} onChange={setCellSize} min={10} max={75} />
          </div>
        </div>
        
        <div className="overflow-x-auto flex-grow">
          <div className="flex gap-4 pb-4">
            {examples.map((example, index) => {
              const cardPadding = "p-2";
              const headerSize = "text-lg font-bold";
              const arrowSize = "text-xl";

              return (
                <div key={index} className={`flex-shrink-0 ${getExampleBgClass(index)} rounded-lg border-4 border-slate-400 shadow-lg ${cardPadding} relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-4 h-4 border-l-4 border-t-4 border-slate-600 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-r-4 border-t-4 border-slate-600 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l-4 border-b-4 border-slate-600 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-slate-600 rounded-br-lg"></div>
                  
                  <h3 className={`text-slate-900 ${headerSize} mb-1 text-center`}>
                    EX {index + 1}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <GridWithDimensions grid={example.input} label="This grid">
                      <ResponsiveOfficerDisplayGrid
                        grid={example.input}
                        containerType="example"
                        emojiSet={emojiSet}
                        displayMode={displayMode}
                        fixedCellSize={cellSize}
                      />
                    </GridWithDimensions>
                    <div className={`text-slate-900 ${arrowSize} font-bold`}>→</div>
                    <GridWithDimensions grid={example.output} label="becomes this grid!  Why?">
                      <ResponsiveOfficerDisplayGrid
                        grid={example.output}
                        containerType="example"
                        emojiSet={emojiSet}
                        displayMode={displayMode}
                        fixedCellSize={cellSize}
                      />
                    </GridWithDimensions>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pattern Analysis Hint (if many examples) */}
        {examples.length >= 3 && (
          <div className="mt-6 bg-blue-900 border border-blue-600 rounded-lg p-4">
            <div className="text-blue-300 text-base">
              <strong>💡 What's the rule here?</strong> Study these {examples.length} examples to identify the transformation pattern. 
              Look for consistent rules that apply across all input → output pairs.
            </div>
          </div>
        )}
      </div>
  );
}