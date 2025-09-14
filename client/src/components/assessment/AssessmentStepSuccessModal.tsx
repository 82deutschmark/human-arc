/**
 * @author Claude Code using Sonnet 4
 * @date 2025-09-14
 * @purpose Enhanced assessment success modal with improved AI model performance display and data validation
 * SRP and DRY check: Pass - Single responsibility (assessment success display), reuses existing UI components
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

    // Helper function to safely format accuracy as percentage
    const formatAccuracy = (accuracy: number): string => {
      // Defensive programming: handle edge cases
      if (typeof accuracy !== 'number' || isNaN(accuracy)) return '0';

      // If accuracy > 1, it's likely already a percentage
      if (accuracy > 1) {
        return Math.min(accuracy, 100).toFixed(1);
      }

      // Otherwise, convert from decimal to percentage
      return (accuracy * 100).toFixed(1);
    };

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

            const failureRate = 100 - parseFloat(formatAccuracy(worstModel.accuracy));
            return `You solved something that ${worstModel.modelName} gets wrong ${failureRate.toFixed(0)}% of the time. Human pattern recognition for the win! 🧠 > 🤖`;
        }

        // Fallback using overall accuracy
        const failureRate = 100 - parseFloat(formatAccuracy(aiStats.accuracy));
        return `You solved something that AI models get wrong ${failureRate.toFixed(0)}% of the time. Human pattern recognition for the win! 🧠 > 🤖`;
    };

    const renderModelBreakdown = (models: typeof aiStats.modelBreakdown) => {
      if (!models || models.length === 0) return null;

      // Sort models by accuracy (worst first for prominence)
      const sortedModels = [...models].sort((a, b) => a.accuracy - b.accuracy);

      // Get performance color class
      const getPerformanceColor = (accuracy: number) => {
        const accPercentage = parseFloat(formatAccuracy(accuracy));
        if (accPercentage >= 70) return 'text-green-400';
        if (accPercentage >= 40) return 'text-yellow-400';
        return 'text-red-400';
      };

      // Get performance icon
      const getPerformanceIcon = (accuracy: number) => {
        const accPercentage = parseFloat(formatAccuracy(accuracy));
        if (accPercentage >= 70) return '✅';
        if (accPercentage >= 40) return '⚠️';
        return '❌';
      };

      const [showAllModels, setShowAllModels] = useState(false);
      const displayModels = showAllModels ? sortedModels : sortedModels.slice(0, 4);

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Individual Model Performance:</span>
            {sortedModels.length > 4 && (
              <button
                onClick={() => setShowAllModels(!showAllModels)}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                {showAllModels ? `Show Less` : `Show All ${sortedModels.length}`}
              </button>
            )}
          </div>

          {/* Highlight worst performer */}
          {sortedModels.length > 0 && (
            <div className="p-2 border-l-2 border-red-400 bg-red-900/20 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">👎</span>
                  <span className="text-slate-300 text-sm font-medium">Worst: {sortedModels[0].modelName}</span>
                </div>
                <span className={`font-bold ${getPerformanceColor(sortedModels[0].accuracy)}`}>
                  {formatAccuracy(sortedModels[0].accuracy)}%
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {sortedModels[0].correct}/{sortedModels[0].attempts} attempts
              </div>
            </div>
          )}

          {/* Grid display for other models */}
          <div className="grid grid-cols-2 gap-2">
            {displayModels.slice(1).map((model) => (
              <div key={model.modelName} className="flex items-center justify-between p-2 bg-slate-700/30 rounded text-sm">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-xs">{getPerformanceIcon(model.accuracy)}</span>
                  <span className="text-slate-300 truncate">{model.modelName}</span>
                </div>
                <span className={`font-medium ${getPerformanceColor(model.accuracy)} ml-2 whitespace-nowrap`}>
                  {formatAccuracy(model.accuracy)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );
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
                <div className="p-3 mt-3 border border-amber-500/30 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-amber-400 text-lg">🤖</span>
                        <h5 className="font-semibold text-amber-400">AI Performance Analysis</h5>
                    </div>

                    <div className="mb-3 p-2 bg-slate-700/50 rounded">
                        <span className="text-slate-400 text-sm">Overall AI Success Rate: </span>
                        <span className="font-bold text-white">{formatAccuracy(aiStats.accuracy)}%</span>
                        <span className="text-slate-500 text-sm ml-2">({aiStats.correctAttempts}/{aiStats.totalAttempts} attempts)</span>
                    </div>

                    {aiStats.modelBreakdown && aiStats.modelBreakdown.length > 0 && renderModelBreakdown(aiStats.modelBreakdown)}
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
    <Modal
      isOpen={open}
      onClose={handleClose}
      backdrop="blur"
      size="2xl"
      closeButton={false}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <ModalContent className="bg-slate-900 text-white border border-slate-700">
        {isLoading ? renderLoadingState() : error ? renderErrorState() : renderContent()}
      </ModalContent>
    </Modal>
  );
}
