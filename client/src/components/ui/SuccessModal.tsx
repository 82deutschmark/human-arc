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
        className={`
          max-w-lg mx-auto bg-gradient-to-br from-slate-800 to-slate-900 
          border-2 border-amber-400 text-white text-center p-8
          rounded-2xl shadow-2xl transform transition-all duration-300 scale-100
        `}
      >
        <DialogTitle className="sr-only">Puzzle Attempt Successful</DialogTitle>
        <DialogDescription className="sr-only">You have successfully solved the puzzle. You can now proceed to the next puzzle or review your results.</DialogDescription>
        {/* Large celebration emojis */}
        <div className="flex justify-center space-x-2 mb-6 text-5xl">
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
        <h2 className="text-3xl font-bold text-amber-400 mb-4">
          {title}
        </h2>

        {/* Success message */}
        <p className="text-slate-300 text-lg mb-4">
          {message}
        </p>

        {/* Fallback mode indicator */}
        {fallbackMode && (
          <div className="mb-4 px-3 py-2 bg-blue-900/50 border border-blue-500 rounded-lg">
            <p className="text-blue-300 text-sm">
              ⚡ Validated using backup system - all progress saved!
            </p>
          </div>
        )}

        {/* Score Breakdown */}
        {scoreDetails && (
          <div className="my-6 text-left bg-slate-700/50 p-4 rounded-lg border border-slate-600">
            <h3 className="text-xl font-bold text-amber-300 mb-3 text-center">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <span className="font-semibold">Base Points:</span>
              <span className="text-right font-mono">{scoreDetails.basePoints?.toLocaleString() ?? 'N/A'}</span>

              <span className="font-semibold">Speed Bonus:</span>
              <span className="text-right font-mono text-green-400">+{scoreDetails.speedBonus?.toLocaleString() ?? 'N/A'}</span>

              <span className="font-semibold">Efficiency Bonus:</span>
              <span className="text-right font-mono text-blue-400">+{scoreDetails.efficiencyBonus?.toLocaleString() ?? 'N/A'}</span>

              <div className="col-span-2 border-t border-slate-600 my-2"></div>

              <span className="font-bold text-amber-400 text-lg">Final Score:</span>
              <span className="text-right font-mono font-bold text-amber-400 text-lg">{scoreDetails.finalScore?.toLocaleString() ?? 'N/A'}</span>
            </div>
          </div>
        )}

        {/* AI Performance Comparison */}
        {enableAIComparison && (
          <div className="my-6 text-center bg-slate-700/30 p-4 rounded-lg border border-amber-400/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl">🤖</span>
              <h3 className="text-xl font-bold text-amber-300">You vs AI</h3>
            </div>

            {isLoadingAI ? (
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <div className="animate-spin w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"></div>
                <span>Loading AI performance...</span>
              </div>
            ) : aiStats && aiStats.hasData ? (
              <>
                <div className="mb-4">
                  {(() => {
                    const failureRate = 100 - aiStats.accuracy;
                    const modelCount = aiStats.modelBreakdown?.length || 0;
                    const worseModels = aiStats.modelBreakdown?.filter(model => model.accuracy < aiStats.accuracy).length || 0;

                    if (aiStats.accuracy === 0) {
                      return (
                        <p className="text-amber-300 font-semibold text-lg">
                          🏆 You solved an impossible puzzle! No AI model got this right!
                        </p>
                      );
                    } else if (worseModels === modelCount) {
                      return (
                        <p className="text-amber-300 font-semibold text-lg">
                          🥇 You outperformed all {modelCount} AI models on this puzzle!
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-amber-300 font-semibold">
                          You beat {worseModels} out of {modelCount} AI models
                          <br />
                          <span className="text-slate-300 text-sm">
                            (AI success rate: {aiStats.accuracy.toFixed(1)}%)
                          </span>
                        </p>
                      );
                    }
                  })()}
                </div>

                <button
                  onClick={() => setShowAIDetails(!showAIDetails)}
                  className="text-amber-400 text-sm hover:text-amber-300 underline transition-colors"
                >
                  {showAIDetails ? 'Hide Details' : 'Show Model Breakdown'}
                </button>

                {showAIDetails && aiStats.modelBreakdown && (
                  <div className="mt-4 space-y-2 text-left">
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {aiStats.modelBreakdown
                        .sort((a, b) => a.accuracy - b.accuracy) // Worst first
                        .map((model, index) => {
                          const isWorst = index === 0;
                          const accuracy = model.accuracy.toFixed(1);
                          const icon = model.accuracy >= 70 ? '✅' : model.accuracy >= 40 ? '⚠️' : '❌';

                          return (
                            <div
                              key={model.modelName}
                              className={`flex justify-between items-center p-2 rounded text-sm ${
                                isWorst ? 'bg-red-900/20 border border-red-500/50' : 'bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{icon}</span>
                                <span className={`${isWorst ? 'text-red-300 font-semibold' : 'text-slate-300'}`}>
                                  {model.modelName}
                                </span>
                                {isWorst && <span className="text-red-400 text-xs">WORST</span>}
                              </div>
                              <span className="font-mono text-xs text-slate-400">
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
              <p className="text-slate-400 text-sm">
                No AI performance data available for this puzzle.
              </p>
            )}
          </div>
        )}

        {/* LLM Analysis Section */}
        {puzzleId && (
          <div className="my-6 text-center bg-slate-700/30 p-4 rounded-lg border border-cyan-400/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🏆</span>
              <h3 className="text-lg font-bold text-cyan-300">Update AI Leaderboards</h3>
            </div>
            <p className="text-slate-400 text-sm mb-3">
              Process AI model scores and update PlayFab leaderboards for this puzzle
            </p>

            {analysisError && (
              <div className="mb-3 p-2 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm text-center">
                {analysisError}
              </div>
            )}

            {analysisComplete && (
              <div className="mb-3 p-2 bg-green-900/20 border border-green-500/50 rounded text-green-400 text-sm text-center flex items-center justify-center gap-2">
                <span>✅</span> AI leaderboards updated successfully!
              </div>
            )}

            {!analysisComplete && (
              <button
                onClick={handleAnalyzeAI}
                disabled={isAnalyzingAI}
                className="
                  px-4 py-2 text-sm font-semibold rounded
                  bg-cyan-600/80 hover:bg-cyan-600 text-white
                  transition-all duration-200 border border-cyan-400
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 mx-auto
                "
              >
                {isAnalyzingAI ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
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
          </div>
        )}

        {/* Strategy Submission Section */}
        {enableStrategySubmission && (
          <div className="my-6 text-left bg-slate-700/30 p-4 rounded-lg border border-amber-400/30">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <span className="text-2xl">💭</span>
              <h3 className="text-lg font-bold text-amber-300">Share Your Strategy</h3>
              <span className="text-xs text-slate-500 ml-2">(Optional)</span>
            </div>
            <p className="text-slate-400 text-sm mb-3 text-center">
              Help others by sharing how you solved this puzzle
            </p>

            <Textarea
              placeholder="Describe your approach, patterns you noticed, or steps you took..."
              value={strategyText}
              onChange={(e) => setStrategyText(e.target.value)}
              className="mb-3 bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-500"
              rows={3}
              maxLength={1000}
            />

            {strategyError && (
              <div className="mb-3 p-2 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm text-center">
                {strategyError}
              </div>
            )}

            {strategySubmitted && (
              <div className="mb-3 space-y-2">
                <div className="p-2 bg-green-900/20 border border-green-500/50 rounded text-green-400 text-sm text-center flex items-center justify-center gap-2">
                  <span>✅</span> Strategy submitted! Thanks for contributing.
                </div>
                {bonusAwarded && bonusPoints && (
                  <div className="p-2 bg-amber-900/20 border border-amber-500/50 rounded text-amber-400 text-sm text-center flex items-center justify-center gap-2">
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
                  className="
                    px-4 py-2 text-sm font-semibold rounded
                    bg-amber-600/80 hover:bg-amber-600 text-white
                    transition-all duration-200 border border-amber-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isSubmittingStrategy ? 'Submitting...' : 'Submit Strategy'}
                </button>
                <button
                  onClick={() => setStrategyText('')}
                  disabled={isSubmittingStrategy}
                  className="
                    px-4 py-2 text-sm rounded
                    bg-slate-600 hover:bg-slate-500 text-slate-300
                    transition-all duration-200 border border-slate-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* OK Button */}
        <div className="mt-6">
          <button
            onClick={handleClose}
            disabled={isSubmittingStrategy}
            className="
              px-8 py-3 text-lg font-bold rounded-lg
              bg-amber-600 hover:bg-amber-700 text-white
              transition-all duration-200 hover:scale-105
              border-2 border-amber-400 shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
            "
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
          <p className="text-slate-500 text-sm italic border-t border-slate-700 pt-4 mt-4">
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