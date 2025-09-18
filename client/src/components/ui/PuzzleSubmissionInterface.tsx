/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Comprehensive reusable UI component for puzzle solution submission across all HARC platform interfaces.
 * Provides clear visual feedback, attempt tracking, validation states, and user guidance.
 * Designed to replace the poor UX of scattered submission controls with a cohesive interface.
 * SRP and DRY check: Pass - Single responsibility for puzzle submission UX, reusable across all solving interfaces
 *
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Lock,
  Send,
  RotateCcw,
  Copy,
  Info,
  Eye,
  EyeOff,
  Lightbulb
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AttemptCounter } from '@/components/ui/AttemptCounter';

export type SubmissionStatus = 'ready' | 'validating' | 'success' | 'error' | 'locked';

export interface SubmissionResult {
  success: boolean;
  correct: boolean;
  message: string;
  scoreData?: any;
  attemptsRemaining?: number;
  locked?: boolean;
}

interface PuzzleSubmissionInterfaceProps {
  // Core submission functionality
  onSubmit: () => Promise<SubmissionResult>;
  onReset?: () => void;
  onCopyInput?: () => void;

  // Puzzle state
  puzzleId: string;
  hasValidSolution: boolean;

  // Attempt tracking
  attemptsRemaining: number;
  isLocked: boolean;

  // Validation state
  isValidating: boolean;
  lastResult?: SubmissionResult | null;

  // UI customization
  showAttemptCounter?: boolean;
  showResetButton?: boolean;
  showCopyButton?: boolean;
  submitButtonText?: string;
  size?: 'sm' | 'md' | 'lg';

  // Help and guidance
  helpText?: string;
  warningText?: string;

  // Assessment mode
  isAssessmentMode?: boolean;
  assessmentProgress?: {
    current: number;
    total: number;
  };
}

export function PuzzleSubmissionInterface({
  onSubmit,
  onReset,
  onCopyInput,
  puzzleId,
  hasValidSolution,
  attemptsRemaining,
  isLocked,
  isValidating,
  lastResult,
  showAttemptCounter = true,
  showResetButton = true,
  showCopyButton = true,
  submitButtonText = 'Submit Solution',
  size = 'md',
  helpText,
  warningText,
  isAssessmentMode = false,
  assessmentProgress
}: PuzzleSubmissionInterfaceProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionResult[]>([]);

  // Update submission history when lastResult changes
  useEffect(() => {
    if (lastResult) {
      setSubmissionHistory(prev => [...prev, lastResult].slice(-5)); // Keep last 5 results
    }
  }, [lastResult]);

  const getSubmissionStatus = (): SubmissionStatus => {
    if (isLocked) return 'locked';
    if (isValidating) return 'validating';
    if (lastResult?.success && lastResult?.correct) return 'success';
    if (lastResult?.success === false || (lastResult?.success && !lastResult?.correct)) return 'error';
    return 'ready';
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'validating': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'locked': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSubmitButtonState = () => {
    if (isLocked) {
      return {
        disabled: true,
        className: 'bg-red-600 hover:bg-red-600 cursor-not-allowed',
        icon: <Lock className="w-4 h-4" />,
        text: 'Puzzle Locked'
      };
    }

    if (isValidating) {
      return {
        disabled: true,
        className: 'bg-blue-600 hover:bg-blue-600',
        icon: <Clock className="w-4 h-4 animate-spin" />,
        text: 'Validating...'
      };
    }

    if (!hasValidSolution) {
      return {
        disabled: true,
        className: 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed',
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'Complete Solution Required'
      };
    }

    const isLastAttempt = attemptsRemaining === 1;
    return {
      disabled: false,
      className: isLastAttempt
        ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
        : 'bg-green-600 hover:bg-green-700',
      icon: <Send className="w-4 h-4" />,
      text: isLastAttempt ? `${submitButtonText} (Final Attempt!)` : submitButtonText
    };
  };

  const buttonState = getSubmitButtonState();
  const status = getSubmissionStatus();

  return (
    <TooltipProvider>
      <Card className={`border-2 transition-all duration-200 ${getStatusColor(status)}`}>
        <CardContent className="p-4 space-y-4">

          {/* Assessment Progress */}
          {isAssessmentMode && assessmentProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Assessment Progress</span>
                <span>{assessmentProgress.current} / {assessmentProgress.total}</span>
              </div>
              <Progress
                value={(assessmentProgress.current / assessmentProgress.total) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Attempt Counter */}
          {showAttemptCounter && (
            <div className="flex justify-center">
              <AttemptCounter
                puzzleId={puzzleId}
                size={size}
                showLabel={false}
              />
            </div>
          )}

          {/* Warning Text */}
          {warningText && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">{warningText}</p>
            </div>
          )}

          {/* Help Text */}
          {helpText && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{helpText}</p>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="space-y-3">

            {/* Primary Submit Button */}
            <Button
              onClick={onSubmit}
              disabled={buttonState.disabled}
              className={`w-full font-semibold transition-all duration-200 ${buttonState.className}`}
              size={size === 'lg' ? 'lg' : 'default'}
            >
              <div className="flex items-center gap-2">
                {buttonState.icon}
                {buttonState.text}
              </div>
            </Button>

            {/* Secondary Action Buttons */}
            <div className="flex gap-2">
              {showResetButton && onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReset}
                      disabled={isValidating}
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear your solution and start over</TooltipContent>
                </Tooltip>
              )}

              {showCopyButton && onCopyInput && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCopyInput}
                      disabled={isValidating}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Input
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy the input grid as starting point</TooltipContent>
                </Tooltip>
              )}

              {/* Show/Hide Details Button */}
              {submissionHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-2"
                >
                  {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Last Result Display */}
          {lastResult && (
            <div className={`p-3 rounded-lg border ${
              lastResult.correct
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {lastResult.correct ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${
                    lastResult.correct ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {lastResult.message}
                  </p>
                  {lastResult.scoreData && lastResult.correct && (
                    <p className="text-xs text-green-700">
                      Score: {lastResult.scoreData.finalScore || lastResult.scoreData.pointsEarned || 'N/A'} points
                    </p>
                  )}
                  {lastResult.attemptsRemaining !== undefined && (
                    <p className="text-xs text-gray-600">
                      Attempts remaining: {lastResult.attemptsRemaining}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submission History Details */}
          {showDetails && submissionHistory.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Attempts</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {submissionHistory.slice(-4, -1).map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                    {result.correct ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                    )}
                    <span className={result.correct ? 'text-green-700' : 'text-red-700'}>
                      {result.correct ? 'Correct' : 'Incorrect'}
                    </span>
                    {result.scoreData && (
                      <span className="text-gray-600 ml-auto">
                        {result.scoreData.finalScore || result.scoreData.pointsEarned || 0} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Attempt Warning */}
          {attemptsRemaining === 1 && !isLocked && (
            <div className="flex items-center gap-2 p-3 bg-amber-100 border border-amber-300 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ This is your final attempt! The puzzle will be locked if this submission is incorrect.
              </p>
            </div>
          )}

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default PuzzleSubmissionInterface;