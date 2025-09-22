/**
 * Author: Cascade using Claude 4 Sonnet
 * Date: 2025-09-21T20:52:13-04:00
 * PURPOSE: Enhanced Puzzle Comparison Card Component with individual model breakdown functionality
 * ================================
 * Displays a side-by-side comparison for a single puzzle, including detailed AI model performance breakdown.
 * Enhanced with individual model performance section, "Struggled Most" highlighting (THIS IS IRRELEVANT!!  Should be reworked to how many models who failed?), and expandable model lists.
 * SRP and DRY check: Pass - Single responsibility (puzzle comparison display), reuses helper functions and patterns from PersonalPerformanceComparison
 */

import { useState } from 'react';
import { Link } from 'wouter';
import type { AggregatedAIStats, ModelStats } from '@/services/core/arcExplainerClient';

// Define the detailed structure for a human performance record
interface HumanPerformanceRecord {
  puzzleId: string;
  correct: boolean; // Changed from isCorrect to match CloudScript output
  timestamp: string;
  basePoints: number;
  speedBonus: number;
  efficiencyBonus: number;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
}

interface PuzzleComparisonCardProps {
  puzzleId: string;
  humanResult: HumanPerformanceRecord;
  aiResult: AggregatedAIStats | null;
}

const formatTime = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00:00';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Invalid Date';
  }
};

const getOrdinalSuffix = (num: number): string => {
  const remainder = num % 100;
  if (remainder >= 11 && remainder <= 13) return 'th';

  switch (num % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Helper functions for AI model performance display (from PersonalPerformanceComparison)
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

export function PuzzleComparisonCard({ puzzleId, humanResult, aiResult }: PuzzleComparisonCardProps) {
  // Add debugging to see exact data structure
  console.log(`🧩 PuzzleComparisonCard for ${puzzleId}:`, aiResult);

  // DEBUG: Detailed logging of human result data
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult:`, humanResult);
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult type:`, typeof humanResult);
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult.correct:`, humanResult?.correct);
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult keys:`, humanResult ? Object.keys(humanResult) : 'null/undefined');

  const humanCorrect = humanResult?.correct || false;
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - final humanCorrect:`, humanCorrect);

  // Fix property mappings for AggregatedAIStats interface
  const aiAccuracy = aiResult?.accuracy || 0;  // was avgAccuracy
  const avgConfidence = aiResult?.averageConfidence || 0;  // was avgConfidence
  const totalAttempts = aiResult?.totalAttempts || 0;  // was totalExplanations
  const correctAttempts = aiResult?.correctAttempts || 0;
  const aiWrongCount = totalAttempts - correctAttempts;  // calculated from new data

  // Convert accuracy percentage (0-100) to decimal for comparison
  const aiAccuracyDecimal = aiAccuracy / 100;
  const isOverconfident = aiAccuracyDecimal < 0.5 && avgConfidence > 80;

  // Simplified quality assessment based on total attempts and accuracy
  const getExplanationQualityTier = () => {
    if (totalAttempts > 20 && aiAccuracy > 60) return { label: 'High', color: 'text-green-400' };
    if (totalAttempts > 10 && aiAccuracy > 40) return { label: 'Medium', color: 'text-yellow-400' };
    return { label: 'Low', color: 'text-red-400' };
  };

  const qualityTier = getExplanationQualityTier();
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDebugData, setShowDebugData] = useState(false);
  const [showModelBreakdown, setShowModelBreakdown] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  // Function to render individual model breakdown (adapted from PersonalPerformanceComparison)
  const renderModelBreakdown = (models: ModelStats[]) => {
    if (!models || models.length === 0) return null;

    const sortedModels = [...models].sort((a, b) => a.accuracy - b.accuracy);
    const displayModels = showAllModels ? sortedModels : sortedModels.slice(0, 3);

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm font-medium">Individual Model Performance:</span>
          {sortedModels.length > 3 && (
            <button
              onClick={() => setShowAllModels(!showAllModels)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              {showAllModels ? `Show Less` : `Show All ${sortedModels.length}`}
            </button>
          )}
        </div>

        {/* Highlight worst performer - "Struggled Most" */}
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

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 transition-all hover:border-amber-400">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-amber-300">{puzzleId}</h3>
        <Link href={`/officer-track/solve/${puzzleId}`} className="text-sm text-sky-400 hover:text-sky-300 transition-colors self-start">
          Review Puzzle →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Human Performance */}
        <div className={`p-3 rounded-lg ${humanCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
          <p className="font-bold text-white mb-2">Your Result</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Status:</span>
              <span className={`font-bold text-xl ${humanCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {humanCorrect ? '✅ Correct' : '❌ Incorrect'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Score:</span>
              <button 
                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                className="font-bold text-xl text-amber-300 hover:underline focus:outline-none text-right"
                aria-label="Toggle score breakdown"
              >
                {humanResult.finalScore?.toLocaleString() || 'N/A'}
                <span className="ml-1 text-xs text-slate-400">
                  {showScoreBreakdown ? '▲' : '▼'}
                </span>
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Time:</span>
              <span className="font-bold text-xl">
                {humanResult.timeElapsed ? formatTime(humanResult.timeElapsed) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Steps:</span>
              <span className="font-bold text-xl">{humanResult.stepCount || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Attempt:</span>
              <span className="font-bold text-xl text-purple-300">
                {humanResult.attemptNumber ? `${humanResult.attemptNumber}${getOrdinalSuffix(humanResult.attemptNumber)} Try` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Completed:</span>
              <span className="font-bold text-sm text-slate-300">
                {humanResult.timestamp ? formatTimestamp(humanResult.timestamp) : 'N/A'}
              </span>
            </div>
            
            {showScoreBreakdown && (
              <div className="mt-3 pt-2 border-t border-slate-600 text-sm">
                <p className="text-slate-400 mb-1">Score Breakdown:</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Base Points:</span>
                    <span className="font-medium">{humanResult.basePoints?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Speed Bonus:</span>
                    <span className="font-medium text-green-400">+{humanResult.speedBonus?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Efficiency Bonus:</span>
                    <span className="font-medium text-green-400">+{humanResult.efficiencyBonus?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-600 mt-1">
                    <span className="text-slate-100 font-medium">Total:</span>
                    <span className="font-bold text-amber-300">{humanResult.finalScore?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Data Section */}
            <div className="mt-3 pt-2 border-t border-slate-600">
              <button
                onClick={() => setShowDebugData(!showDebugData)}
                className="w-full text-left text-xs text-slate-400 hover:text-slate-300 transition-colors flex justify-between items-center"
                aria-label="Toggle debug data display"
              >
                <span>Debug Data</span>
                <span className="ml-1">
                  {showDebugData ? '▲' : '▼'}
                </span>
              </button>

              {showDebugData && (
                <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs">
                  <p className="text-slate-400 mb-2">Raw humanPerformanceData:</p>
                  <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(humanResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Performance */}
        <div className="p-3 rounded-lg bg-slate-700/50 space-y-2">
          <p className="font-bold text-white mb-2">AI Benchmark</p>
          {aiResult && aiResult.hasData ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Success Rate:</span>
                <span className={`font-bold text-xl ${aiAccuracyDecimal > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {`${aiAccuracy.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Correct/Total:</span>
                <span className="font-bold text-xl text-amber-300">{correctAttempts}/{totalAttempts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Avg. Confidence:</span>
                <span className="font-bold text-xl text-cyan-300">
                  {avgConfidence > 0 ? `${avgConfidence.toFixed(0)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Failed Attempts:</span>
                <span className="font-bold text-xl text-purple-300">{aiWrongCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">AI Models:</span>
                <span className="font-bold text-xl text-orange-300">{aiResult.modelBreakdown.length}</span>
              </div>
              {isOverconfident && (
                <div className="pt-2 text-center bg-red-900/50 rounded-md p-1 mt-2">
                  <p className="text-red-300 font-bold text-sm">🚨 Dangerous Overconfidence Detected</p>
                </div>
              )}
              
              {/* Individual Model Performance Section - styled like debug data */}
              <div className="mt-3 pt-2 border-t border-slate-600">
                <button
                  onClick={() => setShowModelBreakdown(!showModelBreakdown)}
                  className="w-full text-left text-xs text-slate-400 hover:text-slate-300 transition-colors flex justify-between items-center"
                  aria-label="Toggle individual model performance display"
                >
                  <span>Individual Model Performance ({aiResult.modelBreakdown.length} models)</span>
                  <span className="ml-1">
                    {showModelBreakdown ? '▲' : '▼'}
                  </span>
                </button>

                {showModelBreakdown && (
                  <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs">
                    {renderModelBreakdown(aiResult.modelBreakdown)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-center">No AI data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
