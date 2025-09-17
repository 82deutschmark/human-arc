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

import { Loader2 } from 'lucide-react';

interface PuzzleLoadingModalProps {
  /** Whether the modal is visible */
  isVisible: boolean;
  /** Current progress percentage (0-100) */
  progress?: number;
  /** Current status message to display */
  statusMessage?: string;
  /** Secondary message for additional context */
  secondaryMessage?: string;
}

export function PuzzleLoadingModal({
  isVisible,
  progress = 0,
  statusMessage = 'Loading puzzles...',
  secondaryMessage = 'Please wait while we process puzzle data'
}: PuzzleLoadingModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-blue-200">
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
                style={{ width: `${Math.max(progress, 10)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              {statusMessage}
            </p>
          </div>

          {/* Status Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-700 font-medium">
              {secondaryMessage}
            </p>
            {progress > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {progress.toFixed(0)}% complete
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}