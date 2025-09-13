/**
 * @author Gemini 2.5 Pro
 * @date 2025-09-13
 * @description A specialized success modal for the assessment flow that provides educational context.
 * It displays a combination of designer-crafted notes and real-time AI performance data.
 */

import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@nextui-org/react';
import { assessmentContentService, type AssessmentContent } from '@/services/assessment/AssessmentContentService';
import type { ModelPerformance } from '@/services/core/arcExplainerClient';

interface AssessmentStepSuccessModalProps {
  open: boolean;
  onClose: () => void;
  puzzleId: string;
  onAssessmentAdvance?: () => void;
}

export function AssessmentStepSuccessModal({
  open,
  onClose,
  puzzleId,
  onAssessmentAdvance,
}: AssessmentStepSuccessModalProps) {
  const [content, setContent] = useState<AssessmentContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (open && puzzleId) {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedContent = await assessmentContentService.getAssessmentContent(puzzleId);
          if (fetchedContent) {
            setContent(fetchedContent);
          } else {
            setError('Failed to load assessment content. The necessary data could not be found.');
          }
        } catch (e) {
          console.error('Error loading assessment content:', e);
          setError('An unexpected error occurred while loading content.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadContent();
  }, [open, puzzleId]);

  const handleClose = () => {
    onClose();
    // Reset state when modal is closed
    setContent(null);
    setError(null);
  };

  const handleAdvance = () => {
    handleClose();
    if (onAssessmentAdvance) {
      onAssessmentAdvance();
    }
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <Spinner label="Loading insights..." color="warning" />
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h3 className="text-lg font-bold text-danger-500">Error</h3>
      <p className="text-slate-400">{error}</p>
    </div>
  );

  const renderContent = () => {
    if (!content) return null;

    const { puzzle, title, explanation, aiDifficultyContext } = content;
    const performance = puzzle.aiPerformance;

    const getPerformanceMessage = () => {
        if (!performance || performance.totalAttempts < 10) {
            return 'This is a new puzzle we are still analyzing. Your solution helps us understand it better!';
        }

        const worstModel = performance.modelPerformance.reduce((worst: ModelPerformance, current: ModelPerformance) => 
            current.accuracy < worst.accuracy ? current : worst, performance.modelPerformance[0]
        );

        const failureRate = (1 - worstModel.accuracy) * 100;

        return `You solved something that ${worstModel.modelName} gets wrong ${failureRate.toFixed(0)}% of the time. Human pattern recognition for the win! 🧠 > 🤖`;
    };

    return (
      <>
        <ModalHeader className="flex flex-col gap-1 text-center">
          <span className="text-2xl">🎯🧠🎉</span>
          <h2 className="text-xl font-bold text-amber-400">{title}</h2>
          <p className="text-xs text-slate-500">{puzzle.id} [{puzzle.dataset}]</p>
        </ModalHeader>
        <ModalBody>
          <div className="p-4 mb-4 text-center bg-slate-800 rounded-lg">
            <p className="font-semibold text-white">{getPerformanceMessage()}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold text-md text-amber-500">Designer's Explanation</h4>
            <p className="text-slate-300">{explanation}</p>
          </div>

          <div className="mb-4">
            <h4 className="font-bold text-md text-amber-500">What makes this hard for AI?</h4>
            <p className="text-slate-300">{aiDifficultyContext}</p>
            {performance && (
                <div className="p-2 mt-2 text-sm border-l-2 border-amber-500 bg-slate-800/50">
                    <h5 className="font-semibold">AI Accuracy Breakdown:</h5>
                    <ul className="list-disc list-inside">
                        {performance.modelPerformance.map((model: ModelPerformance) => (
                            <li key={model.modelName}>{model.modelName}: {(model.accuracy * 100).toFixed(1)}%</li>
                        ))}
                    </ul>
                </div>
            )}
          </div>

        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={handleAdvance}>
            OK
          </Button>
        </ModalFooter>
      </>
    );
  };

  return (
    <Modal isOpen={open} onClose={handleClose} backdrop="blur" size="2xl">
      <ModalContent className="bg-slate-900 text-white border border-slate-700">
        {isLoading ? renderLoadingState() : error ? renderErrorState() : renderContent()}
      </ModalContent>
    </Modal>
  );
}
