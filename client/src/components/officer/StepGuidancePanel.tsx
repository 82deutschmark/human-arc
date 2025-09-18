/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component displays a guidance panel for a single step in a tutorial. It shows the user the learning objectives, instructions, and success criteria for the current step, and provides controls for marking the step as complete and moving to the next one. It is designed to be used within a larger tutorial framework.
 * SRP and DRY check: Pass. This component has a single responsibility: to display the guidance for a tutorial step. It is a presentational component that receives all its data and callbacks via props, making it reusable and well-encapsulated.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TutorialStep } from '@/config/tutorialSteps';

interface StepGuidancePanelProps {
  currentStep: TutorialStep;
  isCorrectPuzzle: boolean;
  stepCompleted: boolean;
  isLastStep: boolean;
  onStepComplete: () => void;
  onNextStep: () => void;
}

export function StepGuidancePanel({
  currentStep,
  isCorrectPuzzle,
  stepCompleted,
  isLastStep,
  onStepComplete,
  onNextStep,
}: StepGuidancePanelProps) {
  return (
    <div className="bg-slate-800 border-b border-slate-600 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card className="bg-gradient-to-r from-blue-950 to-purple-950 border-cyan-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              💡 Step {currentStep.stepNumber} Guidance
              <Badge className="ml-2 bg-blue-600 text-white text-xs">
                {isCorrectPuzzle ? 'Correct Puzzle' : 'Different Puzzle'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-amber-400 font-semibold mb-2">🎯 What to Practice:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
                  {currentStep.learningObjectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-green-400 font-semibold mb-2">✅ Success Criteria:</h4>
                <p className="text-sm text-slate-200">{currentStep.successCriteria}</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded p-3 mb-4">
              <h4 className="text-amber-400 font-semibold mb-2">📋 Quick Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-200">
                {currentStep.instructions.slice(0, 2).map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-slate-400 text-sm">
                💭 Practice the concepts above, then mark this step as complete.
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={onStepComplete}
                  disabled={stepCompleted}
                  className={`${stepCompleted ? 'bg-green-600 text-white' : 'bg-amber-400 hover:bg-amber-500 text-slate-900'} font-semibold`}
                >
                  {stepCompleted ? '✅ Step Complete' : '✅ Mark Complete'}
                </Button>
                
                {stepCompleted && (
                  <Button
                    onClick={onNextStep}
                    className="bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold"
                  >
                    {isLastStep ? '🎉 Finish Tutorial' : 'Next Step →'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
