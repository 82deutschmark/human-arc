/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Reusable notification component for displaying various types of puzzle-related messages.
 * Replaces specific components like IncorrectPuzzleWarning with a flexible, themeable notification system.
 * Supports multiple notification types with consistent styling and improved accessibility.
 * SRP and DRY check: Pass - Single responsibility for displaying notifications, highly reusable
 *
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Lightbulb,
  X,
  ExternalLink
} from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'tip';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface PuzzleNotificationProps {
  type: NotificationType;
  title: string;
  message: string;

  // Optional customization
  icon?: React.ReactNode;
  actions?: NotificationAction[];
  onDismiss?: () => void;
  dismissible?: boolean;

  // Layout options
  compact?: boolean;
  fullWidth?: boolean;
  className?: string;

  // Content enhancements
  details?: string;
  learnMoreUrl?: string;
}

export function PuzzleNotification({
  type,
  title,
  message,
  icon,
  actions = [],
  onDismiss,
  dismissible = false,
  compact = false,
  fullWidth = true,
  className = '',
  details,
  learnMoreUrl
}: PuzzleNotificationProps) {

  const getTypeConfig = (notificationType: NotificationType) => {
    switch (notificationType) {
      case 'success':
        return {
          containerClass: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          defaultIcon: <CheckCircle className="w-5 h-5" />
        };
      case 'error':
        return {
          containerClass: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          defaultIcon: <XCircle className="w-5 h-5" />
        };
      case 'warning':
        return {
          containerClass: 'bg-amber-50 border-amber-200',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-800',
          messageColor: 'text-amber-700',
          defaultIcon: <AlertTriangle className="w-5 h-5" />
        };
      case 'tip':
        return {
          containerClass: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          defaultIcon: <Lightbulb className="w-5 h-5" />
        };
      default: // 'info'
        return {
          containerClass: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700',
          defaultIcon: <Info className="w-5 h-5" />
        };
    }
  };

  const config = getTypeConfig(type);
  const displayIcon = icon || config.defaultIcon;

  const containerClasses = [
    'border transition-all duration-200',
    config.containerClass,
    fullWidth ? 'w-full' : 'max-w-2xl',
    className
  ].join(' ');

  const contentPadding = compact ? 'p-3' : 'p-4';

  return (
    <div className={fullWidth ? 'w-full' : 'flex justify-center'}>
      <Card className={containerClasses}>
        <CardContent className={contentPadding}>
          <div className="flex items-start gap-3">

            {/* Icon */}
            <div className={`${config.iconColor} flex-shrink-0 ${compact ? 'mt-0.5' : 'mt-1'}`}>
              {displayIcon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className={`font-semibold ${config.titleColor} ${compact ? 'text-sm' : 'text-base'}`}>
                    {title}
                  </h4>
                </div>

                {/* Dismiss Button */}
                {dismissible && onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="p-1 h-auto hover:bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Message */}
              <p className={`${config.messageColor} ${compact ? 'text-sm mt-1' : 'text-sm mt-2'}`}>
                {message}
              </p>

              {/* Details */}
              {details && (
                <p className={`${config.messageColor} opacity-80 text-xs ${compact ? 'mt-1' : 'mt-2'}`}>
                  {details}
                </p>
              )}

              {/* Actions and Learn More */}
              {(actions.length > 0 || learnMoreUrl) && (
                <div className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>

                  {/* Action Buttons */}
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={action.onClick}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}

                  {/* Learn More Link */}
                  {learnMoreUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(learnMoreUrl, '_blank')}
                      className="text-xs p-0 h-auto hover:bg-transparent"
                    >
                      <span className={config.messageColor}>Learn more</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Preset notification variants for common use cases
export const PuzzleNotificationPresets = {

  incorrectPuzzle: (currentId: string, expectedId: string, onReturnToTutorial?: () => void) => ({
    type: 'warning' as NotificationType,
    title: 'Different Puzzle Detected',
    message: `This puzzle (${currentId}) doesn't match the expected tutorial puzzle (${expectedId}).`,
    details: 'You can practice here, but return to the tutorial to continue the intended sequence.',
    actions: onReturnToTutorial ? [{
      label: 'Return to Tutorial',
      onClick: onReturnToTutorial,
      variant: 'outline' as const
    }] : undefined
  }),

  puzzleLocked: (attemptsUsed: number = 2) => ({
    type: 'error' as NotificationType,
    title: 'Puzzle Locked',
    message: `You've used all ${attemptsUsed} attempts on this puzzle and it's now locked.`,
    details: 'Try other puzzles to continue improving your skills.',
  }),

  lastAttemptWarning: () => ({
    type: 'warning' as NotificationType,
    title: 'Final Attempt Warning',
    message: 'This is your last attempt! The puzzle will lock if you submit an incorrect solution.',
    details: 'Take your time to review your solution before submitting.',
  }),

  solutionRequired: () => ({
    type: 'info' as NotificationType,
    title: 'Complete Your Solution',
    message: 'Fill in all output grids before submitting your solution.',
    compact: true
  }),

  validationSuccess: (score?: number) => ({
    type: 'success' as NotificationType,
    title: 'Puzzle Solved!',
    message: score ? `Congratulations! You earned ${score} points.` : 'Congratulations! Your solution is correct.',
    compact: true
  }),

  validationError: (message: string) => ({
    type: 'error' as NotificationType,
    title: 'Incorrect Solution',
    message: message || 'Your solution doesn\'t match the expected output. Review the examples and try again.',
    compact: true
  }),

  arcPrizeInfo: () => ({
    type: 'tip' as NotificationType,
    title: 'ARC-AGI Prize Standards',
    message: 'Each puzzle follows ARC-AGI Prize testing conditions with exactly 2 attempts allowed.',
    details: 'This ensures fair comparison with AI performance benchmarks.',
    learnMoreUrl: 'https://arcprize.org/',
    compact: true
  })
};

export default PuzzleNotification;