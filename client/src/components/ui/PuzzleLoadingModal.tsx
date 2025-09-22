/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Reusable loading modal component for puzzle data loading operations.
 * Shows progress and status messages during puzzle file processing from arc-explainer API.
 * Replaces hardcoded loading modals and console spam with user-friendly progress feedback.
 * SRP and DRY check: Pass - Single responsibility for displaying puzzle loading progress.
 *
 */

import { Loader2, Clock, Database, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { LoadingStage, DetailedStatus, PerformanceMetrics, EnhancedError } from '@/types/loadingTypes';

interface PuzzleLoadingModalProps {
  /** Whether the modal is visible */
  isVisible: boolean;
  /** Current progress percentage (0-100) */
  progress?: number;
  /** Current status message to display */
  statusMessage?: string;
  /** Secondary message for additional context */
  secondaryMessage?: string;
  /** Enhanced loading stages */
  loadingStages?: LoadingStage[];
  /** Detailed status information */
  detailedStatus?: DetailedStatus;
  /** Performance metrics */
  performanceMetrics?: PerformanceMetrics;
  /** Enhanced error information */
  enhancedError?: EnhancedError;
  /** Whether to show technical details */
  showTechnicalDetails?: boolean;
}

export function PuzzleLoadingModal({
  isVisible,
  progress = 0,
  statusMessage = 'Loading puzzles...',
  secondaryMessage = 'Please wait while we process puzzle data',
  loadingStages,
  detailedStatus,
  performanceMetrics,
  enhancedError,
  showTechnicalDetails = false
}: PuzzleLoadingModalProps) {
  const [showDetails, setShowDetails] = useState(showTechnicalDetails);
  if (!isVisible) return null;

  // Use enhanced data if available, fall back to legacy props
  const displayProgress = progress;
  const displayStatus = detailedStatus?.primaryMessage || statusMessage;
  const displaySecondary = detailedStatus?.secondaryMessage || secondaryMessage;
  const hasEnhancedData = loadingStages && detailedStatus;

  // Format time display
  const formatTime = (ms: number): string => {
    if (ms < 1000) return '<1s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Show error state if enhanced error is available
  if (enhancedError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-red-200">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {enhancedError.title}
            </h2>

            <p className="text-gray-700 mb-4">{enhancedError.message}</p>
            <p className="text-sm text-gray-600 mb-6">{enhancedError.context}</p>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
              <h3 className="font-semibold text-red-800 mb-2">Suggestions:</h3>
              <ul className="text-sm text-red-700 text-left list-disc list-inside space-y-1">
                {enhancedError.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>

            {enhancedError.technicalDetails && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800">
                  {enhancedError.technicalDetails}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-blue-200">
        <div className="text-center">
          {/* Animated Logo/Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>

          {/* Loading Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🧠 Loading Puzzle Library
          </h2>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(displayProgress, 2)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              {displayStatus}
            </p>
            {displayProgress > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {displayProgress.toFixed(0)}% complete
              </p>
            )}
          </div>

          {/* Enhanced Status Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 mb-4">
            <p className="text-sm text-gray-700 font-medium">
              {displaySecondary}
            </p>

            {/* Performance Metrics */}
            {hasEnhancedData && performanceMetrics && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                {performanceMetrics.processedPuzzles > 0 && (
                  <div className="flex items-center justify-center space-x-1 bg-white rounded p-2">
                    <Database className="w-3 h-3 text-blue-600" />
                    <span className="font-semibold">{performanceMetrics.processedPuzzles}</span>
                    <span className="text-gray-500">puzzles</span>
                  </div>
                )}

                {performanceMetrics.averageAccuracy !== undefined && (
                  <div className="flex items-center justify-center space-x-1 bg-white rounded p-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="font-semibold">{(performanceMetrics.averageAccuracy * 100).toFixed(1)}%</span>
                    <span className="text-gray-500">accuracy</span>
                  </div>
                )}

                {performanceMetrics.timeElapsed && (
                  <div className="flex items-center justify-center space-x-1 bg-white rounded p-2">
                    <Clock className="w-3 h-3 text-orange-600" />
                    <span className="font-semibold">{formatTime(performanceMetrics.timeElapsed)}</span>
                    <span className="text-gray-500">elapsed</span>
                  </div>
                )}

                {performanceMetrics.estimatedTimeRemaining && performanceMetrics.estimatedTimeRemaining > 1000 && (
                  <div className="flex items-center justify-center space-x-1 bg-white rounded p-2">
                    <Clock className="w-3 h-3 text-purple-600" />
                    <span className="font-semibold">{formatTime(performanceMetrics.estimatedTimeRemaining)}</span>
                    <span className="text-gray-500">remaining</span>
                  </div>
                )}
              </div>
            )}

            {/* Performance Stats */}
            {detailedStatus?.performanceStats && (
              <p className="text-xs text-green-700 mt-2 font-medium">
                📊 {detailedStatus.performanceStats}
              </p>
            )}
          </div>

          {/* Loading Stages Display */}
          {hasEnhancedData && loadingStages && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-center space-x-2 mx-auto text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span>Loading Details</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-2 text-left">
                  {loadingStages.map((stage) => (
                    <div key={stage.id} className="flex items-center space-x-3 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        stage.status === 'complete' ? 'bg-green-500' :
                        stage.status === 'active' ? 'bg-blue-500 animate-pulse' :
                        stage.status === 'error' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`} />
                      <span className={`flex-1 ${
                        stage.status === 'active' ? 'text-blue-700 font-medium' :
                        stage.status === 'complete' ? 'text-green-700' :
                        stage.status === 'error' ? 'text-red-700' :
                        'text-gray-500'
                      }`}>
                        {stage.name}
                      </span>
                      {stage.status === 'complete' && stage.endTime && stage.startTime && (
                        <span className="text-gray-400">
                          {formatTime(stage.endTime - stage.startTime)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Technical Details */}
          {detailedStatus?.technicalDetails && showDetails && (
            <div className="text-left bg-gray-100 rounded p-3 text-xs font-mono text-gray-700">
              {detailedStatus.technicalDetails}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}