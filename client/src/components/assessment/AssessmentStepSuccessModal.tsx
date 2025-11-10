/**
 * @author Claude Code using Sonnet 4
 * @date 2025-09-14
 * @purpose Enhanced assessment success modal with improved AI model performance display and data validation
 * SRP and DRY check: Pass - Single responsibility (assessment success display), reuses existing UI components
 */

import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@nextui-org/react';
import { Textarea } from '@/components/ui/textarea';
import { assessmentContentService, type AssessmentContent } from '@/services/assessment/AssessmentContentService';
import { arcExplainerClient, type AggregatedAIStats, type ModelPerformance, type ModelStats, type SolutionSubmissionRequest } from '@/services/core/arcExplainerClient';
import { idConverter } from '@/services/idConverter';
import { playFabUserData } from '@/services/playfab/userData';

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
  const [showAllModels, setShowAllModels] = useState(false);

  // Strategy submission state
  const [strategyText, setStrategyText] = useState('');
  const [isSubmittingStrategy, setIsSubmittingStrategy] = useState(false);
  const [strategySubmitted, setStrategySubmitted] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  // Strategy bonus state
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [bonusPoints, setBonusPoints] = useState<number | null>(null);

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
    setStrategyText('');
    setStrategySubmitted(false);
    setStrategyError(null);
  };

  const handleSubmitStrategy = async () => {
    if (!strategyText.trim()) return;

    setIsSubmittingStrategy(true);
    setStrategyError(null);

    try {
      // First, submit strategy to community database
      const submissionData: SolutionSubmissionRequest = {
        strategy: strategyText.trim(),
        metadata: {
          assessmentMode: true,
          sessionId: `assessment_${Date.now()}`
        }
      };

      const result = await arcExplainerClient.submitUserSolution(puzzleId, submissionData);

      if (result) {
        setStrategySubmitted(true);
        console.log('✅ Strategy submitted successfully:', result);

        // Second, award strategy bonus points via CloudScript
        try {
          const bonusResult = await playFabUserData.awardStrategyBonus(puzzleId);

          if (bonusResult.success && bonusResult.bonusAwarded) {
            setBonusAwarded(true);
            setBonusPoints(bonusResult.bonusPoints || 0);
            console.log('🎉 Strategy bonus awarded:', bonusResult.bonusPoints);
          } else {
            console.log('ℹ️ Strategy bonus not awarded:', bonusResult.message);
          }
        } catch (bonusError) {
          console.error('⚠️ Strategy bonus failed (strategy still submitted):', bonusError);
          // Don't show error to user since strategy was successfully submitted
        }

      } else {
        setStrategyError('Failed to submit strategy. Please try again.');
      }
    } catch (error) {
      console.error('❌ Strategy submission error:', error);
      setStrategyError('An error occurred while submitting your strategy.');
    } finally {
      setIsSubmittingStrategy(false);
    }
  };

  const handleAdvance = async () => {
    // If user has entered strategy but not submitted, submit it first
    if (strategyText.trim() && !strategySubmitted && !isSubmittingStrategy) {
      await handleSubmitStrategy();
    }

    handleClose();
    
    // Ensure next puzzle loads fresh with training examples visible at top
    // Use requestAnimationFrame to scroll to top after modal closes and puzzle advances
    requestAnimationFrame(() => {
      if (onAssessmentAdvance) {
        onAssessmentAdvance();
        // Scroll to top after puzzle advance to show training examples
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    });
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
            return 'This puzzle challenged various AI models. 🧠 > 🤖';
        }

        // Find the worst performing model from the breakdown
        if (aiStats.modelBreakdown && aiStats.modelBreakdown.length > 0) {
            const worstModel = aiStats.modelBreakdown.reduce((worst, current) =>
                current.accuracy < worst.accuracy ? current : worst, aiStats.modelBreakdown[0]
            );

            const failureRate = 100 - parseFloat(formatAccuracy(worstModel.accuracy));
            return `You solved something that ${worstModel.modelName} gets wrong ${failureRate.toFixed(0)}% of the time.`;
        }

        // Fallback using overall accuracy
        const failureRate = 100 - parseFloat(formatAccuracy(aiStats.accuracy));
        return `You solved something that AI models get wrong ${failureRate.toFixed(0)}% of the time. Human pattern recognition for the win! 🧠 > 🤖`;
    };

    const renderModelBreakdown = (models: ModelStats[]) => {
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
        <ModalBody className="max-h-[calc(90vh-140px)] overflow-y-auto">
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

          {/* Strategy Submission Section  THIS NEEDS DEBUGGING NOT CURRENTLY WORKING CORRECTLY */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-lg">💭</span>
              <h4 className="font-bold text-md text-amber-500">Share Your Strategy</h4>
              <span className="text-xs text-slate-500 ml-auto">(Optional)</span>
            </div>
            <p className="text-slate-400 text-sm mb-3">
              Help other solvers by sharing how you approached this puzzle. Your strategy will be added to the community solutions.
            </p>

            <Textarea
              placeholder="Describe your solving approach, what patterns you noticed, or the steps you took..."
              value={strategyText}
              onChange={(e) => setStrategyText(e.target.value)}
              className="mb-3 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-500"
              rows={3}
              maxLength={1000}
            />

            {strategyError && (
              <div className="mb-3 p-2 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
                {strategyError}
              </div>
            )}

            {strategySubmitted && (
              <div className="mb-3 space-y-2">
                <div className="p-2 bg-green-900/20 border border-green-500/50 rounded text-green-400 text-sm flex items-center gap-2">
                  <span>✅</span> Strategy submitted successfully! Thank you for contributing.
                </div>
                {bonusAwarded && bonusPoints && (
                  <div className="p-2 bg-amber-900/20 border border-amber-500/50 rounded text-amber-400 text-sm flex items-center gap-2">
                    <span>🎉</span> Bonus awarded: +{bonusPoints.toLocaleString()} points to all leaderboards!
                  </div>
                )}
              </div>
            )}

            {strategyText.trim() && !strategySubmitted && (
              <div className="flex gap-2 mb-3">
                <Button
                  size="sm"
                  color="warning"
                  variant="bordered"
                  onPress={handleSubmitStrategy}
                  isLoading={isSubmittingStrategy}
                  isDisabled={isSubmittingStrategy}
                >
                  {isSubmittingStrategy ? 'Submitting...' : 'Submit Strategy'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setStrategyText('')}
                  isDisabled={isSubmittingStrategy}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={handleAdvance}
            isLoading={isSubmittingStrategy}
            isDisabled={isSubmittingStrategy}
          >
            {isSubmittingStrategy ? 'Submitting...' : (strategyText.trim() && !strategySubmitted ? 'Submit & Continue' : 'Continue')}
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
