/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component provides a multi-step tutorial modal for onboarding users to the Officer Academy. It guides them through the basic concepts of puzzle solving, from grid interaction to advanced validation. It is built on the `useTutorialProgress` hook, which manages the state and flow of the tutorial.
 * SRP and DRY check: Pass. This component's single responsibility is to present the tutorial content and handle user interaction within the tutorial. It is well-structured and reuses the `useTutorialProgress` hook for its state management, which is a good example of DRY principles in action.
 */

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import { TUTORIAL_COMPLETION } from "@/config/tutorialSteps";

interface OfficerTutorialModalProps {
  open: boolean;
  onClose: () => void;
  onStartTutorial: (puzzleId: string) => void;
}

export function OfficerTutorialModal({ open, onClose, onStartTutorial }: OfficerTutorialModalProps) {
  const {
    currentStep,
    progress,
    isFirstStep,
    isLastStep,
    completionPercentage,
    nextStep,
    previousStep,
    startTutorial,
    endTutorial,
    completeCurrentStep
  } = useTutorialProgress();

  const handleStartTutorial = () => {
    startTutorial();
  };

  const handleStartPuzzle = () => {
    if (currentStep?.puzzleId && currentStep.puzzleId !== 'DESIGNER_INPUT_PUZZLE_ID_1') {
      onStartTutorial(currentStep.puzzleId);
      onClose(); // Close modal when starting puzzle
    } else {
      // Show designer input warning
      alert('DESIGNER INPUT: Please configure puzzle IDs in tutorialSteps.ts before starting tutorial');
    }
  };

  const handleNextStep = () => {
    completeCurrentStep();
    if (!isLastStep) {
      nextStep();
    } else {
      // Tutorial completed
      endTutorial();
    }
  };

  const handleCloseTutorial = () => {
    endTutorial();
    onClose();
  };

  if (!progress.isActive) {
    // Tutorial Start Screen
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-cyan-400 text-slate-50">
          <DialogTitle className="sr-only">Officer Academy Tutorial</DialogTitle>
          
          <div className="text-center space-y-6 p-4">
            {/* Header */}
            <div>
              <div className="flex justify-center mb-4">
                <img 
                  src="/Cadet-Yvonne.PNG" 
                  alt="Cadet Yvonne - Tutorial Instructor" 
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-cyan-400 object-cover transition-transform duration-300 hover:scale-105" 
                />
              </div>
              <h1 className="text-3xl font-bold text-cyan-400 mb-2">🎖️ Officer Academy</h1>
              <p className="text-amber-400 font-mono text-sm">PUZZLE SOLVING TRAINING PROGRAM</p>
              <Badge className="mt-2 bg-green-600 text-white">
                Instructor: Cadet Yvonne
              </Badge>
            </div>
            
            {/* Welcome Message */}
            <div className="bg-slate-900 border border-slate-600 rounded p-6 text-left">
              <h3 className="text-green-400 font-semibold mb-4 text-center">
                Welcome to Officer Academy Training!
              </h3>
              
              {/* DESIGNER INPUT: Customize welcome message */}
              <div className="text-slate-200 space-y-3">
                <p className="text-center text-lg text-cyan-300">
                  Welcome to the Officer Academy! I'm Cadet Yvonne, your training instructor.
                  The Academy specializes in pattern recognition and abstract reasoning - 
                  the core skills needed to outperform AI systems in complex problem solving.
                </p>
                <p>
                  I'll guide you through <strong className="text-amber-400">5 essential skills</strong> 
                  every officer needs for advanced puzzle solving:
                </p>
                
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Basic grid interaction and value selection</li>
                  <li>Pattern recognition from training examples</li>
                  <li>Grid sizing tools and display options</li>
                  <li>Multi-test puzzle strategies</li>
                  <li>Advanced validation and problem-solving</li>
                </ul>
                
                <p className="text-green-300 text-center font-medium">
                  Ready to begin your officer training, Cadet?
                </p>
              </div>
            </div>
            
            {/* Tutorial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-600 rounded p-3">
                <h4 className="text-amber-400 font-semibold text-sm mb-1">Training Steps</h4>
                <p className="text-slate-400 text-lg font-bold">5 Modules</p>
              </div>
              <div className="bg-slate-900 border border-slate-600 rounded p-3">
                <h4 className="text-amber-400 font-semibold text-sm mb-1">Estimated Time</h4>
                <p className="text-slate-400 text-lg font-bold">15-20 min</p>
              </div>
              <div className="bg-slate-900 border border-slate-600 rounded p-3">
                <h4 className="text-amber-400 font-semibold text-sm mb-1">Your Progress</h4>
                <p className="text-slate-400 text-lg font-bold">{Math.round(completionPercentage)}%</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleStartTutorial}
                className="bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold py-3 px-6 text-lg"
              >
                🚀 START OFFICER TRAINING
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Tutorial In Progress Screen
  return (
    <Dialog open={open} onOpenChange={handleCloseTutorial}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-800 border-cyan-400 text-slate-50">
        <DialogTitle className="sr-only">
          Officer Academy - Step {currentStep?.stepNumber} of 5
        </DialogTitle>
        
        <div className="space-y-6 p-4">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-600 pb-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/Cadet-Yvonne.PNG" 
                alt="Cadet Yvonne" 
                className="w-16 h-16 rounded-full border-4 border-cyan-400 object-cover" 
              />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">
                  Step {currentStep?.stepNumber || 1} of 5
                </h2>
                <p className="text-slate-300">Officer Academy Training</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-amber-400 font-bold text-lg">
                {Math.round(completionPercentage)}% Complete
              </div>
              <div className="w-48 bg-slate-700 rounded-full h-2 mt-1">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {currentStep && (
            <>
              {/* Step Title */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-amber-400 mb-2">
                  {currentStep.title}
                </h1>
                <Badge className="bg-blue-600 text-white">
                  Puzzle ID: {currentStep.puzzleId}
                </Badge>
              </div>

              {/* Instructor Dialogue */}
              <Card className="bg-slate-900 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    💬 Cadet Yvonne Says:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-800 p-4 rounded border-l-4 border-green-400">
                    <div className="whitespace-pre-wrap text-slate-200">
                      {currentStep.instructorDialogue}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step Instructions */}
              <Card className="bg-slate-900 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">
                    📋 Step {currentStep.stepNumber} Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    {currentStep.instructions.map((instruction, index) => (
                      <li key={index} className="text-slate-200">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Learning Objectives */}
              <Card className="bg-slate-900 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-blue-400">
                    🎯 Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {currentStep.learningObjectives.map((objective, index) => (
                      <li key={index} className="text-slate-200 text-sm">
                        {objective}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Available Hints */}
              {currentStep.hints.length > 0 && (
                <Card className="bg-blue-900 border-blue-600">
                  <CardHeader>
                    <CardTitle className="text-blue-300">
                      💡 Available Hints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentStep.hints.map((hint, index) => (
                        <div key={index} className="bg-blue-800 p-3 rounded text-sm text-blue-100">
                          <strong>Hint {index + 1}:</strong> {hint}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Criteria */}
              <Card className="bg-green-900 border-green-600">
                <CardHeader>
                  <CardTitle className="text-green-300">
                    ✅ Success Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-100">{currentStep.successCriteria}</p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-600">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={isFirstStep}
              className="border-slate-400 text-slate-300 disabled:opacity-50"
            >
              ← Previous Step
            </Button>
            
            <div className="flex gap-3">
              <Button
                onClick={handleStartPuzzle}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold"
              >
                🧩 Practice This Step
              </Button>
              
              <Button
                onClick={handleNextStep}
                className="bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold"
              >
                {isLastStep ? '🎉 Complete Training' : 'Next Step →'}
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={handleCloseTutorial}
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-slate-900"
            >
              Exit Tutorial
            </Button>
          </div>

          {/* Tutorial Completion Message */}
          {isLastStep && (
            <Card className="bg-gradient-to-r from-green-900 to-blue-900 border-amber-400">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold text-amber-400 mb-3">
                  {TUTORIAL_COMPLETION.title}
                </h3>
                <p className="text-slate-200 mb-4">
                  {TUTORIAL_COMPLETION.message}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  {TUTORIAL_COMPLETION.achievements.map((achievement, index) => (
                    <Badge key={index} className="bg-amber-600 text-slate-900">
                      {achievement}
                    </Badge>
                  ))}
                </div>
                <p className="text-slate-300 mt-4 text-sm">
                  {TUTORIAL_COMPLETION.nextSteps}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}