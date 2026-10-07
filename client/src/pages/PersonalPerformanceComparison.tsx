/**
 * Author: Codex
 * Date: 2026-10-07
 * PURPOSE: Support Human ARC at a configurable hosting prefix within ARC Explainer.
 * SRP/DRY check: Pass — shared appPath helper keeps application and asset URLs consistent.
 */
import { appPath } from "@/utils/appPath";
/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-14
 * PURPOSE: Personal performance comparison page showing player vs individual LLM models across ALL completed puzzles
 * SRP and DRY check: Pass - Single responsibility (performance comparison display), reuses existing components and data patterns
 *
 * Based on ParticipantDashboard.tsx pattern for data fetching, enhanced with individual LLM model breakdowns
 * from AssessmentStepSuccessModal.tsx for rich model-by-model comparison display.
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { playFabAuthManager } from '@/services/playfab/authManager';
import { playFabRequestManager } from '@/services/playfab/requestManager';
import { playFabUserData } from '@/services/playfab/userData';
import { arcExplainerClient, type AggregatedAIStats, type ModelStats } from '@/services/core/arcExplainerClient';
import { idConverter } from '@/services/idConverter';
import { PuzzleComparisonCard } from '@/components/comparison/PuzzleComparisonCard';

// Reuse data structures from existing components
interface HumanPerformanceRecord {
  puzzleId: string;
  correct: boolean;
  timestamp: string;
  basePoints: number;
  speedBonus: number;
  efficiencyBonus: number;
  firstTryBonus?: number;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
}

interface EnhancedComparisonData {
  human: HumanPerformanceRecord;
  llmStats: AggregatedAIStats | null;
}

export function PersonalPerformanceComparison() {
  const [comparisonData, setComparisonData] = useState<EnhancedComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllModelsFor, setShowAllModelsFor] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        setIsLoading(true);

        // 1. Initialize PlayFab (reuse pattern from ParticipantDashboard)
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) throw new Error('VITE_PLAYFAB_TITLE_ID not set');
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();

        // 2. Fetch ALL human performance data (not just assessment puzzles)
        const humanPerformance = await playFabUserData.getHumanPerformanceData();

        if (!humanPerformance || humanPerformance.length === 0) {
          setIsLoading(false);
          return;
        }

        // 3. Get unique puzzle IDs and fetch enhanced LLM data with model breakdowns
        const uniquePuzzleIds = [
          ...new Set(
            humanPerformance
              .map(record => idConverter.normalizeToArcId(record.puzzleId))
              .filter((id): id is string => id !== null)
          )
        ];

        // Use getBatchExplanationsStats for full model breakdown data (like AssessmentStepSuccessModal)
        const llmDataMap = await arcExplainerClient.getBatchExplanationsStats(uniquePuzzleIds);

        // 4. Merge human and LLM data, taking latest human record per puzzle
        const latestHumanRecords = new Map<string, HumanPerformanceRecord>();
        humanPerformance.forEach(record => {
          const existing = latestHumanRecords.get(record.puzzleId);
          if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
            latestHumanRecords.set(record.puzzleId, record);
          }
        });

        const mergedData: EnhancedComparisonData[] = Array.from(latestHumanRecords.values()).map(humanRecord => {
          const arcId = idConverter.normalizeToArcId(humanRecord.puzzleId);
          const llmStats = arcId ? llmDataMap.get(arcId) : null;

          return {
            human: humanRecord,
            llmStats: llmStats || null
          };
        });

        // Sort by most recent first
        mergedData.sort((a, b) => new Date(b.human.timestamp).getTime() - new Date(a.human.timestamp).getTime());

        setComparisonData(mergedData);

      } catch (err: any) {
        setError(err.message || 'Failed to load performance data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, []);

  // Helper functions from AssessmentStepSuccessModal for LLM display
  const formatAccuracy = (accuracy: number): string => {
    if (typeof accuracy !== 'number' || isNaN(accuracy)) return '0';
    if (accuracy > 1) {
      return Math.min(accuracy, 100).toFixed(1);
    }
    return (accuracy * 100).toFixed(1);
  };

  const getPerformanceColor = (accuracy: number) => {
    const accPercentage = parseFloat(formatAccuracy(accuracy));
    if (accPercentage >= 70) return 'text-emerald-400';
    if (accPercentage >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getPerformanceIcon = (accuracy: number) => {
    const accPercentage = parseFloat(formatAccuracy(accuracy));
    if (accPercentage >= 70) return '✅';
    if (accPercentage >= 40) return '⚠️';
    return '❌';
  };

  const toggleShowAllModels = (puzzleId: string) => {
    setShowAllModelsFor(prev => {
      const newSet = new Set(prev);
      if (newSet.has(puzzleId)) {
        newSet.delete(puzzleId);
      } else {
        newSet.add(puzzleId);
      }
      return newSet;
    });
  };

  const renderModelBreakdown = (models: ModelStats[], puzzleId: string) => {
    if (!models || models.length === 0) return null;

    const sortedModels = [...models].sort((a, b) => a.accuracy - b.accuracy);
    const showAll = showAllModelsFor.has(puzzleId);
    const displayModels = showAll ? sortedModels : sortedModels.slice(0, 3);

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm font-medium">Individual LLM Performance:</span>
          {sortedModels.length > 3 && (
            <button
              onClick={() => toggleShowAllModels(puzzleId)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              {showAll ? `Show Less` : `Show All ${sortedModels.length}`}
            </button>
          )}
        </div>

        {/* Highlight worst performer */}
        {sortedModels.length > 0 && (
          <div className="p-3 border-l-4 border-rose-400 bg-gradient-to-r from-rose-900/30 to-rose-800/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 text-lg">🤖💔</span>
                <span className="text-white text-sm font-medium">Struggled Most: {sortedModels[0].modelName}</span>
              </div>
              <span className={`font-bold text-lg ${getPerformanceColor(sortedModels[0].accuracy)}`}>
                {formatAccuracy(sortedModels[0].accuracy)}%
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {sortedModels[0].correct}/{sortedModels[0].attempts} attempts
            </div>
          </div>
        )}

        {/* Grid display for other models */}
        <div className="grid grid-cols-2 gap-3">
          {displayModels.slice(1).map((model) => (
            <div key={model.modelName} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/50 to-slate-600/30 rounded-lg text-sm hover:from-slate-600/60 hover:to-slate-500/40 transition-all">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm">{getPerformanceIcon(model.accuracy)}</span>
                <span className="text-slate-200 truncate font-medium">{model.modelName}</span>
              </div>
              <span className={`font-bold ${getPerformanceColor(model.accuracy)} ml-2 whitespace-nowrap`}>
                {formatAccuracy(model.accuracy)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatTime = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar
          title="HARC Dashboard"
          rightContent={
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => window.location.href = appPath('/assessment')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                📋 Take Assessment
              </Button>
              <Button
                onClick={() => window.location.href = appPath('/dashboard')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                📊 View Dashboard
              </Button>
              <Button
                onClick={() => window.location.href = appPath('/leaderboards/harc_leaderboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                🏆 Leaderboard
              </Button>
              <Button
                onClick={() => window.location.href = appPath('/puzzles')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                🧩 Puzzle Library
              </Button>
            </div>
          }
        />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
            <div>Loading your performance data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar
          title="HARC Dashboard"
          rightContent={
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => window.location.href = appPath('/assessment')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                📋 Take Assessment
              </Button>
              <Button
                onClick={() => window.location.href = appPath('/dashboard')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                📊 View Dashboard
              </Button>
              <Button
                onClick={() => window.location.href = appPath('/leaderboards/harc_leaderboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                🏆 Leaderboard
              </Button>
              <Button
                onClick={() => window.location.href = appPath('/puzzles')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                🧩 Puzzle Library
              </Button>
            </div>
          }
        />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <div className="text-red-400 font-semibold mb-2">Failed to Load Performance Data</div>
            <div className="text-slate-400 mb-4">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalScore = comparisonData.reduce((sum, data) => sum + data.human.finalScore, 0);
  const averageTime = comparisonData.length > 0
    ? (comparisonData.reduce((sum, data) => sum + data.human.timeElapsed, 0) / comparisonData.length).toFixed(1)
    : '0';
  const correctCount = comparisonData.filter(data => data.human.correct).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar
        title="HARC Dashboard"
        rightContent={
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.location.href = appPath('/assessment')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              📋 Take Assessment
            </Button>
            <Button
              onClick={() => window.location.href = appPath('/dashboard')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              📊 View Dashboard
            </Button>
            <Button
              onClick={() => window.location.href = appPath('/leaderboards/harc_leaderboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              🏆 Leaderboard
            </Button>
            <Button
              onClick={() => window.location.href = appPath('/puzzles')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              🧩 Puzzle Library
            </Button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto p-6">
        {comparisonData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧩</div>
            <h2 className="text-xl text-slate-300 mb-2">No Performance Data</h2>
            <p className="text-slate-400">Complete some ARC puzzles to see how you compare against LLMs.</p>
            <Link href="/puzzles" className="inline-block mt-4 px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
              Browse Puzzles
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-6 rounded-xl border border-blue-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🧩</span>
                  <h3 className="text-lg font-semibold text-blue-300">Puzzles Solved</h3>
                </div>
                <div className="text-3xl font-bold text-white">{comparisonData.length}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 p-6 rounded-xl border border-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-lg font-semibold text-emerald-300">Success Rate</h3>
                </div>
                <div className="text-3xl font-bold text-white">
                  {((correctCount / comparisonData.length) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 p-6 rounded-xl border border-amber-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⭐</span>
                  <h3 className="text-lg font-semibold text-amber-300">Total Score</h3>
                </div>
                <div className="text-3xl font-bold text-white">{totalScore.toLocaleString()} pts</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-6 rounded-xl border border-purple-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⏱️</span>
                  <h3 className="text-lg font-semibold text-purple-300">Avg Time</h3>
                </div>
                <div className="text-3xl font-bold text-white">{averageTime}s</div>
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/50 p-6 rounded-2xl border border-slate-600/50 shadow-xl backdrop-blur-sm mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">👤</span>
                <h3 className="font-bold text-xl text-amber-300">Player Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/30">
                  <p className="text-slate-300 text-sm mb-2">Display Name:</p>
                  <p className="text-xl font-bold text-white">
                    {import.meta.env.VITE_PLAYFAB_TITLE_ID ? (
                      playFabAuthManager?.getDisplayName?.() || 'Anonymous Researcher'
                    ) : 'Anonymous Researcher'}
                  </p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/30">
                  <p className="text-slate-300 text-sm mb-2">PlayFab ID:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-cyan-300 select-all">
                      {import.meta.env.VITE_PLAYFAB_TITLE_ID ? (
                        playFabAuthManager?.getPlayFabId?.()?.slice(-8) || 'Loading...'
                      ) : 'N/A'}
                    </p>
                    {import.meta.env.VITE_PLAYFAB_TITLE_ID && (
                      <button
                        onClick={() => {
                          const playFabId = playFabAuthManager?.getPlayFabId?.();
                          if (playFabId) {
                            navigator.clipboard?.writeText(playFabId);
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-600 rounded transition-colors"
                        title="Copy full PlayFab ID"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-600/30">
                <Link
                  href={appPath("/profile")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600/20 border border-amber-500/30 rounded-lg text-amber-300 hover:bg-amber-600/30 hover:text-amber-200 transition-all"
                >
                  <span>⚙️</span>
                  <span>Manage Profile</span>
                </Link>
              </div>
            </div>

            {/* Performance Comparisons - Using PuzzleComparisonCard for DRY compliance */}
            <div className="space-y-6">
              {comparisonData.map(data => (
                <PuzzleComparisonCard
                  key={data.human.puzzleId}
                  puzzleId={data.human.puzzleId}
                  humanResult={data.human}
                  aiResult={data.llmStats}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
