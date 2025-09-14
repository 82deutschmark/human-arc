/**
 * @author Gemini 2.5 Pro
 * @date 2025-09-13
 * @description A specialized success modal for the assessment flow that provides educational context.
 * It displays a combination of designer-crafted notes and real-time AI performance data.
 */

import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@nextui-org/react';
import { assessmentContentService, type AssessmentContent } from '@/services/assessment/AssessmentContentService';
import { arcExplainerClient, type AggregatedAIStats, type ModelPerformance } from '@/services/core/arcExplainerClient';
import { idConverter } from '@/services/idConverter';

interface AssessmentStepSuccessModalProps {
  open: boolean;
  onClose: () => void;
  puzzleId: string;
  onAssessmentAdvance?: () => void;
  fallbackMode?: boolean;
}

export function AssessmentStepSuccessModal({
  open,
  onClose,
  puzzleId,
  onAssessmentAdvance,
  fallbackMode = false,
}: AssessmentStepSuccessModalProps) {
  const [content, setContent] = useState<AssessmentContent | null>(null);
  const [aiStats, setAiStats] = useState<AggregatedAIStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (open && puzzleId) {
        setIsLoading(true);
        setError(null);
        try {
          // Load content and AI stats in parallel, using the same method as HumanVsAiComparison
          const [fetchedContent, aiDataMap] = await Promise.all([
            assessmentContentService.getAssessmentContent(puzzleId),
            arcExplainerClient.getBatchExplanationsStats([puzzleId])
          ]);

          if (fetchedContent) {
            setContent(fetchedContent);
          } else {
            setError('Failed to load assessment content. The necessary data could not be found.');
          }

          // Get AI stats using the same approach as HumanVsAiComparison
          const arcId = idConverter.normalizeToArcId(puzzleId);
          const aiData = arcId ? aiDataMap.get(arcId) : null;
          setAiStats(aiData || null);

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
    setAiStats(null);
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

    const getPerformanceMessage = () => {
        // Use the same AI stats structure as HumanVsAiComparison
        if (!aiStats || !aiStats.hasData || aiStats.totalAttempts === 0) {
            return 'This puzzle challenged various AI models. Your human insight solved what machines struggle with! 🧠 > 🤖';
        }

        // Find the worst performing model from the breakdown
        if (aiStats.modelBreakdown && aiStats.modelBreakdown.length > 0) {
            const worstModel = aiStats.modelBreakdown.reduce((worst, current) =>
                current.accuracy < worst.accuracy ? current : worst, aiStats.modelBreakdown[0]
            );

            const failureRate = (1 - worstModel.accuracy) * 100;
            return `You solved something that ${worstModel.modelName} gets wrong ${failureRate.toFixed(0)}% of the time. Human pattern recognition for the win! 🧠 > 🤖`;
        }

        // Fallback using overall accuracy
        const failureRate = (1 - aiStats.accuracy) * 100;
        return `You solved something that AI models get wrong ${failureRate.toFixed(0)}% of the time. Human pattern recognition for the win! 🧠 > 🤖`;
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

          {/* Fallback mode indicator */}
          {fallbackMode && (
            <div className="mb-4 px-3 py-2 bg-blue-900/50 border border-blue-500 rounded-lg">
              <p className="text-blue-300 text-sm text-center">
                ⚡ Validated using backup system - all progress saved!
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="font-bold text-md text-amber-500">Designer's Explanation</h4>
            <p className="text-slate-300">{explanation}</p>
          </div>

          <div className="mb-4">
            <h4 className="font-bold text-md text-amber-500">What makes this hard for AI?</h4>
            <p className="text-slate-300">{aiDifficultyContext}</p>
            {aiStats && aiStats.hasData && (
                <div className="p-2 mt-2 text-sm border-l-2 border-amber-500 bg-slate-800/50">
                    <h5 className="font-semibold">AI Accuracy Breakdown:</h5>
                    <p className="mb-1">Overall: {(aiStats.accuracy * 100).toFixed(1)}% ({aiStats.correctAttempts}/{aiStats.totalAttempts})</p>
                    {aiStats.modelBreakdown && aiStats.modelBreakdown.length > 0 && (
                        <ul className="list-disc list-inside">
                            {aiStats.modelBreakdown.map((model) => (
                                <li key={model.modelName}>{model.modelName}: {(model.accuracy * 100).toFixed(1)}%</li>
                            ))}
                        </ul>
                    )}
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
