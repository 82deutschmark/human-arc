/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component renders a progress bar for the tutorial mode. It displays a series of blocks that visually represent the user's progress through the tutorial steps, with different colors indicating completed, in-progress, and future steps. It's a simple, presentational component that provides clear feedback to the user.
 * SRP and DRY check: Pass. This component has a single responsibility: to display the tutorial progress. It is a presentational component that receives all its data and callbacks via props, making it reusable and well-encapsulated.
 */

import type { TutorialStep } from '@/config/tutorialSteps';

interface TutorialProgressBarProps {
  currentStep: TutorialStep;
  stepCompleted: boolean;
  totalSteps: number;
}

export function TutorialProgressBar({
  currentStep,
  stepCompleted,
  totalSteps,
}: TutorialProgressBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-cyan-400 p-2 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-cyan-400 text-sm font-medium">
            Tutorial Progress:
          </div>
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-2 rounded ${i + 1 < currentStep.stepNumber
                    ? 'bg-green-500'
                    : i + 1 === currentStep.stepNumber
                      ? stepCompleted
                        ? 'bg-green-500'
                        : 'bg-amber-400'
                      : 'bg-slate-600'
                  }`}
              />
            ))}
          </div>
        </div>
        
        <div className="text-slate-300 text-sm">
          Step {currentStep.stepNumber} of {totalSteps} • 
          <span className="text-amber-400 font-medium ml-1">
            {currentStep.title}
          </span>
        </div>
      </div>
    </div>
  );
}
