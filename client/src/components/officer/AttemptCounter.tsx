/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Display puzzle attempt counter and status according to ARC-AGI Prize 2-attempt limit
 * Shows remaining attempts, locked status, and completion status for puzzles
 * SRP and DRY check: Pass - Single responsibility for attempt status display
 *
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lock, CheckCircle, Clock } from 'lucide-react';
import { attemptTracker, type PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';

interface AttemptCounterProps {
  puzzleId: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AttemptCounter({
  puzzleId,
  className = '',
  showLabel = true,
  size = 'md'
}: AttemptCounterProps) {
  const [status, setStatus] = useState<PuzzleAttemptStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAttemptStatus = async () => {
      if (!puzzleId) return;

      setLoading(true);
      setError(null);

      try {
        const attemptStatus = await attemptTracker.getPuzzleAttemptStatus(puzzleId);
        setStatus(attemptStatus);
      } catch (err) {
        console.error(`Failed to load attempt status for ${puzzleId}:`, err);
        setError('Failed to load attempt status');
        // Set default status on error
        setStatus({
          status: 'available',
          attemptsRemaining: 2,
          totalAttempts: 0,
          canAttempt: true,
          lockedAt: null
        });
      } finally {
        setLoading(false);
      }
    };

    loadAttemptStatus();
  }, [puzzleId]);

  // Refresh status when puzzle changes
  const refreshStatus = async () => {
    if (!puzzleId) return;

    try {
      const attemptStatus = await attemptTracker.getPuzzleAttemptStatus(puzzleId, false); // Force refresh
      setStatus(attemptStatus);
    } catch (err) {
      console.error(`Failed to refresh attempt status for ${puzzleId}:`, err);
    }
  };

  // Expose refresh function for parent components
  useEffect(() => {
    // Add to window for debugging/testing
    (window as any).refreshAttemptStatus = refreshStatus;
    return () => {
      delete (window as any).refreshAttemptStatus;
    };
  }, [puzzleId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-red-500 text-sm">Error loading attempts</span>
      </div>
    );
  }

  const getStatusBadge = () => {
    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-2'
    };

    const iconSize = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    switch (status.status) {
      case 'completed':
        return (
          <Badge className={`bg-green-600 text-white ${sizeClasses[size]} flex items-center gap-1`}>
            <CheckCircle className={iconSize[size]} />
            Completed
          </Badge>
        );

      case 'locked':
        return (
          <Badge className={`bg-red-600 text-white ${sizeClasses[size]} flex items-center gap-1`}>
            <Lock className={iconSize[size]} />
            Locked
          </Badge>
        );

      case 'available':
        const isLastAttempt = status.attemptsRemaining === 1;
        const badgeColor = isLastAttempt ? 'bg-yellow-600' : 'bg-blue-600';

        return (
          <Badge className={`${badgeColor} text-white ${sizeClasses[size]} flex items-center gap-1`}>
            {isLastAttempt && <AlertTriangle className={iconSize[size]} />}
            {status.attemptsRemaining}/2 Attempts
          </Badge>
        );

      default:
        return (
          <Badge className={`bg-gray-600 text-white ${sizeClasses[size]}`}>
            Unknown
          </Badge>
        );
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'completed':
        return 'Puzzle completed successfully';

      case 'locked':
        return 'Maximum attempts exceeded - puzzle locked';

      case 'available':
        if (status.attemptsRemaining === 2) {
          return 'Ready to attempt';
        } else if (status.attemptsRemaining === 1) {
          return 'Final attempt - be careful!';
        } else {
          return 'No attempts remaining';
        }

      default:
        return 'Unknown status';
    }
  };

  const getTextColor = () => {
    switch (status.status) {
      case 'completed':
        return 'text-green-600';
      case 'locked':
        return 'text-red-600';
      case 'available':
        return status.attemptsRemaining === 1 ? 'text-yellow-600' : 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Status Badge */}
      {getStatusBadge()}

      {/* Optional Label and Message */}
      {showLabel && (
        <div className="text-center">
          <div className={`text-xs font-medium ${getTextColor()}`}>
            {getStatusMessage()}
          </div>
          {status.totalAttempts > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Total attempts: {status.totalAttempts}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AttemptCounter;