/**
 * 
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-12
 * PURPOSE: Reusable success feedback modal with randomized emojis and smooth transitions.
 * Used across the project for success -> transition flows. Provides professional fanfare
 * and celebrates user achievements while maintaining consistent design language.
 * SRP and DRY check: Pass - Single responsibility (success feedback), reusable component
 * 
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SPACE_EMOJIS, type EmojiSet } from '@/constants/spaceEmojis';
import { arcExplainerClient, type AggregatedAIStats, type SolutionSubmissionRequest } from '@/services/core/arcExplainerClient';
import { playFabUserData } from '@/services/playfab/userData';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseDelay?: number;
  showDesignerNotes?: boolean;
  fallbackMode?: boolean;
  scoreDetails?: {
    basePoints?: number;
    speedBonus?: number;
    efficiencyBonus?: number;
    finalScore?: number;
  };
  // New props for AI comparison and strategy submission
  puzzleId?: string;
  enableAIComparison?: boolean;
  enableStrategySubmission?: boolean;
  aiPerformanceData?: AggregatedAIStats; // Pre-loaded data (optional)
}

/**
 * Gets a random selection of emojis from different emoji sets
 * @param count Number of emojis to select
 * @returns Array of random emojis
 */
function getRandomEmojis(count: number = 6): string[] {
  const emojiSetKeys = Object.keys(SPACE_EMOJIS) as EmojiSet[];
  const selectedEmojis: string[] = [];
  
  // Get random emojis from different sets to ensure variety
  for (let i = 0; i < count; i++) {
    const randomSetKey = emojiSetKeys[Math.floor(Math.random() * emojiSetKeys.length)];
    const emojiSet = SPACE_EMOJIS[randomSetKey];
    // Skip index 0 (black square) and get random emoji from 1-9
    const randomEmoji = emojiSet[Math.floor(Math.random() * 9) + 1];
    selectedEmojis.push(randomEmoji);
  }
  
  return selectedEmojis;
}

export function SuccessModal({
  open,
  onClose,
  title = "Success!",
  message = "Great work! Moving to the next challenge...",
  autoCloseDelay = 0, // Default to no auto-close,
  showDesignerNotes = true,
  fallbackMode = false,
  scoreDetails,
  // New props with defaults
  puzzleId,
  enableAIComparison = false,
  enableStrategySubmission = false,
  aiPerformanceData
}: Props) {
  const [celebrationEmojis, setCelebrationEmojis] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // AI performance state
  const [aiStats, setAiStats] = useState<AggregatedAIStats | null>(aiPerformanceData || null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIDetails, setShowAIDetails] = useState(false);

  // Strategy submission state
  const [strategyText, setStrategyText] = useState('');
  const [isSubmittingStrategy, setIsSubmittingStrategy] = useState(false);
  const [strategySubmitted, setStrategySubmitted] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  // Strategy bonus state
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [bonusPoints, setBonusPoints] = useState<number | null>(null);

  // LLM Analysis state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showLLMAnalysis, setShowLLMAnalysis] = useState(false);

  // Generate new random emojis each time modal opens
  useEffect(() => {
    if (open) {
      setCelebrationEmojis(getRandomEmojis(5));
      setIsVisible(true);

      // Load AI performance data if enabled and not already provided
      if (enableAIComparison && puzzleId && !aiPerformanceData && !aiStats) {
        loadAIPerformanceData();
      }

      // Reset strategy submission state
      setStrategyText('');
      setStrategySubmitted(false);
      setStrategyError(null);

      // Reset LLM analysis state
      setIsAnalyzingAI(false);
      setAnalysisComplete(false);
      setAnalysisError(null);

      // Only auto close if delay is explicitly set and no strategy submission in progress
      if (autoCloseDelay > 0) {
        const timer = setTimeout(async () => {
          // Auto-submit strategy if user entered one
          if (enableStrategySubmission && strategyText.trim() && !strategySubmitted) {
            await handleSubmitStrategy();
          }

          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for fade out animation
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [open, autoCloseDelay, onClose, enableAIComparison, puzzleId, aiPerformanceData]);

  // Load AI performance data
  const loadAIPerformanceData = async () => {
    if (!puzzleId) return;

    setIsLoadingAI(true);
    try {
      const statsMap = await arcExplainerClient.getBatchExplanationsStats([puzzleId]);
      const puzzleStats = statsMap.get(puzzleId);
      setAiStats(puzzleStats || null);
    } catch (error) {
      console.error('Failed to load AI performance data:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Handle LLM Analysis trigger
  const handleAnalyzeAI = async () => {
    if (!puzzleId) return;

    setIsAnalyzingAI(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/llm-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId, triggeredBy: 'success-modal' })
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisComplete(true);
        console.log('✅ LLM Analysis completed:', result);
      } else {
        setAnalysisError(result.error || 'Analysis failed');
        console.error('❌ LLM Analysis failed:', result);
      }
    } catch (error) {
      console.error('❌ LLM Analysis request failed:', error);
      setAnalysisError('Network error occurred');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Handle strategy submission
  const handleSubmitStrategy = async () => {
    if (!strategyText.trim() || !puzzleId) return;

    setIsSubmittingStrategy(true);
    setStrategyError(null);

    try {
      const submissionData: SolutionSubmissionRequest = {
        strategy: strategyText.trim(),
        metadata: {
          assessmentMode: false,
          sessionId: `puzzle_${Date.now()}`
        }
      };

      const result = await arcExplainerClient.submitUserSolution(puzzleId, submissionData);

      if (result) {
        setStrategySubmitted(true);
        console.log('✅ Strategy submitted successfully:', result);

        // Award strategy bonus points via CloudScript
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

  // Handle modal close with strategy check
  const handleClose = async () => {
    // Auto-submit strategy if user entered one but didn't submit
    if (enableStrategySubmission && strategyText.trim() && !strategySubmitted && !isSubmittingStrategy) {
      await handleSubmitStrategy();
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl mx-auto bg-card border text-card-foreground text-center p-2 rounded-lg shadow-lg max-h-[95vh] overflow-y-auto"
      >
        <DialogTitle className="sr-only">Puzzle Attempt Successful</DialogTitle>
        <DialogDescription className="sr-only">You have successfully solved the puzzle. You can now proceed to the next puzzle or review your results.</DialogDescription>
        {/* Large celebration emojis */}
        <div className="flex justify-center space-x-1.5 mb-2 text-2xl">
          {celebrationEmojis.map((emoji, index) => (
            <span 
              key={index}
              className="inline-block animate-bounce"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationDuration: '1s'
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* Success title */}
        <h2 className="text-lg font-bold text-primary mb-1">
          {title}
        </h2>

        {/* Success message */}
        <p className="text-muted-foreground text-xs mb-1.5">
          {message}
        </p>

        {/* Score Breakdown */}
        {scoreDetails && (
          <div className="my-2 text-left bg-muted p-1.5 rounded border">
            <h3 className="text-sm font-bold text-primary mb-1 text-center">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-1 text-foreground text-xs">
              <span className="font-semibold">Base Points:</span>
              <span className="text-right font-mono">{scoreDetails.basePoints?.toLocaleString() ?? 'N/A'}</span>

              <span className="font-semibold">Speed Bonus:</span>
              <span className="text-right font-mono text-green-400">+{scoreDetails.speedBonus?.toLocaleString() ?? 'N/A'}</span>

              <span className="font-semibold">Efficiency Bonus:</span>
              <span className="text-right font-mono text-blue-400">+{scoreDetails.efficiencyBonus?.toLocaleString() ?? 'N/A'}</span>

              <div className="col-span-2 border-t border-border my-1"></div>

              <span className="font-bold text-primary">Final Score:</span>
              <span className="text-right font-mono font-bold text-primary">{scoreDetails.finalScore?.toLocaleString() ?? 'N/A'}</span>
            </div>
          </div>
        )}

        {/* AI Performance Comparison */}
        {enableAIComparison && (
          <div className="my-2 text-center bg-muted p-1.5 rounded border">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-lg">🤖</span>
              <h3 className="text-sm font-bold text-primary">You vs AI</h3>
            </div>

            {isLoadingAI ? (
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>Loading AI performance...</span>
              </div>
            ) : aiStats && aiStats.hasData ? (
              <>
                <div className="mb-1.5">
                  {(() => {
                    const failureRate = 100 - aiStats.accuracy;
                    const modelCount = aiStats.modelBreakdown?.length || 0;
                    const worseModels = aiStats.modelBreakdown?.filter(model => model.accuracy < aiStats.accuracy).length || 0;

                    if (aiStats.accuracy === 0) {
                      return (
                        <p className="text-primary font-semibold text-sm">
                          🏆 You solved an impossible puzzle! No AI model got this right!
                        </p>
                      );
                    } else if (worseModels === modelCount) {
                      return (
                        <p className="text-primary font-semibold text-sm">
                          🥇 You outperformed all {modelCount} AI models on this puzzle!
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-primary font-semibold text-xs">
                          You beat {worseModels} out of {modelCount} AI models
                          <br />
                          <span className="text-muted-foreground text-xs">
                            (AI success rate: {aiStats.accuracy.toFixed(1)}%)
                          </span>
                        </p>
                      );
                    }
                  })()}
                </div>

                <button
                  onClick={() => setShowAIDetails(!showAIDetails)}
                  className="text-primary text-xs hover:text-primary/80 underline transition-colors"
                >
                  {showAIDetails ? 'Hide Details' : 'Show Model Breakdown'}
                </button>

                {showAIDetails && aiStats.modelBreakdown && (
                  <div className="mt-1.5 space-y-0.5 text-left">
                    <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                      {aiStats.modelBreakdown
                        .sort((a, b) => a.accuracy - b.accuracy) // Worst first
                        .map((model, index) => {
                          const isWorst = index === 0;
                          const accuracy = model.accuracy.toFixed(1);
                          const icon = model.accuracy >= 70 ? '✅' : model.accuracy >= 40 ? '⚠️' : '❌';

                          return (
                            <div
                              key={model.modelName}
                              className={`flex justify-between items-center p-1 rounded text-xs ${
                                isWorst ? 'bg-red-100 border border-red-200 dark:bg-red-900/20 dark:border-red-500/50' : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-0.5">
                                <span className="text-xs">{icon}</span>
                                <span className={`truncate ${isWorst ? 'text-red-600 font-semibold dark:text-red-300' : 'text-foreground'}`}>
                                  {model.modelName}
                                </span>
                                {isWorst && <span className="text-red-500 text-xs dark:text-red-400">WORST</span>}
                              </div>
                              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap ml-0.5">
                                {accuracy}% ({model.correct}/{model.attempts})
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No AI performance data available for this puzzle.
              </p>
            )}
          </div>
        )}

        {/* LLM Analysis Section - Collapsed by default */}
        {puzzleId && (
          <div className="my-2 text-center bg-muted p-1.5 rounded border">
            <button
              onClick={() => setShowLLMAnalysis(!showLLMAnalysis)}
              className="flex items-center justify-center gap-1 mb-1 w-full text-primary hover:text-primary/80 transition-colors"
            >
              <span className="text-base">🏆</span>
              <h3 className="text-xs font-bold">Update AI Leaderboards</h3>
              <span className="text-xs">{showLLMAnalysis ? '▲' : '▼'}</span>
            </button>

            {showLLMAnalysis && (
              <>
                <p className="text-muted-foreground text-sm mb-3">
                  Process AI model scores and update PlayFab leaderboards for this puzzle
                </p>

                {analysisError && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm text-center dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-400">
                    {analysisError}
                  </div>
                )}

                {analysisComplete && (
                  <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-green-700 text-sm text-center flex items-center justify-center gap-2 dark:bg-green-900/20 dark:border-green-500/50 dark:text-green-400">
                    <span>✅</span> AI leaderboards updated successfully!
                  </div>
                )}

                {!analysisComplete && (
                  <button
                    onClick={handleAnalyzeAI}
                    disabled={isAnalyzingAI}
                    className="px-4 py-2 text-sm font-semibold rounded bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  >
                    {isAnalyzingAI ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                        Updating Leaderboards...
                      </>
                    ) : (
                      <>
                        <span>🏆</span>
                        Update AI Leaderboards
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Strategy Submission Section */}
        {enableStrategySubmission && (
          <div className="my-2 text-left bg-muted p-1.5 rounded border">
            <div className="flex items-center gap-1 mb-1.5 justify-center">
              <span className="text-base">💭</span>
              <h3 className="text-xs font-bold text-primary">Share Your Strategy</h3>
              <span className="text-xs text-muted-foreground ml-0.5">(Optional)</span>
            </div>
            <p className="text-muted-foreground text-xs mb-1.5 text-center">
              Help others by sharing how you solved this puzzle
            </p>

            <Textarea
              placeholder="Describe your approach, patterns you noticed, or steps you took..."
              value={strategyText}
              onChange={(e) => setStrategyText(e.target.value)}
              className="mb-1.5 text-xs"
              rows={2}
              maxLength={1000}
            />

            {strategyError && (
              <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm text-center dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-400">
                {strategyError}
              </div>
            )}

            {strategySubmitted && (
              <div className="mb-3 space-y-2">
                <div className="p-2 bg-green-100 border border-green-300 rounded text-green-700 text-sm text-center flex items-center justify-center gap-2 dark:bg-green-900/20 dark:border-green-500/50 dark:text-green-400">
                  <span>✅</span> Strategy submitted! Thanks for contributing.
                </div>
                {bonusAwarded && bonusPoints && (
                  <div className="p-2 bg-amber-100 border border-amber-300 rounded text-amber-700 text-sm text-center flex items-center justify-center gap-2 dark:bg-amber-900/20 dark:border-amber-500/50 dark:text-amber-400">
                    <span>🎉</span> Bonus awarded: +{bonusPoints.toLocaleString()} points to all leaderboards!
                  </div>
                )}
              </div>
            )}

            {strategyText.trim() && !strategySubmitted && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleSubmitStrategy}
                  disabled={isSubmittingStrategy}
                  className="px-4 py-2 text-sm font-semibold rounded bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingStrategy ? 'Submitting...' : 'Submit Strategy'}
                </button>
                <button
                  onClick={() => setStrategyText('')}
                  disabled={isSubmittingStrategy}
                  className="px-4 py-2 text-sm rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* OK Button */}
        <div className="mt-2">
          <button
            onClick={handleClose}
            disabled={isSubmittingStrategy}
            className="px-4 py-1.5 text-xs font-bold rounded bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingStrategy
              ? 'Submitting...'
              : (strategyText.trim() && !strategySubmitted && enableStrategySubmission
                ? 'Submit & Close'
                : 'OK')}
          </button>
        </div>

        {/* Designer notes placeholder */}
        {showDesignerNotes && (
          <p className="text-muted-foreground text-xs italic border-t border-border pt-1.5 mt-1.5">
            DESIGNER NOTES HERE TO BE FILLED IN
          </p>
        )}

        {/* Custom CSS for entrance animation */}
        <style>{`
          @keyframes Entrance {
            0% {
              transform: scale(0.8) translateY(-20px);
              opacity: 0;
            }
            50% {
              transform: scale(1.05) translateY(5px);
              opacity: 0.8;
            }
            100% {
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}