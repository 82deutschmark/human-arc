/**
 * Author: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-22T18:03:26-04:00
 * PURPOSE: Display puzzle attempt counter and status according to ARC-AGI Prize 2-attempt limit
 * Shows remaining attempts, locked status, and completion status for puzzles
 * Uses shadcn/ui theme variables for proper light/dark mode support.
 * SRP and DRY check: Pass - Single responsibility for attempt status display
 *
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lock, CheckCircle, Clock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
        <Clock className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-destructive text-sm">Error loading attempts</span>
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
          <Badge className={`bg-success text-success-foreground ${sizeClasses[size]} flex items-center gap-1`}>
            <CheckCircle className={iconSize[size]} />
            Completed
          </Badge>
        );

      case 'locked':
        return (
          <Badge className={`bg-destructive text-destructive-foreground ${sizeClasses[size]} flex items-center gap-1`}>
            <Lock className={iconSize[size]} />
            Locked
          </Badge>
        );

      case 'available':
        const isLastAttempt = status.attemptsRemaining === 1;
        const badgeColor = isLastAttempt ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground';

        return (
          <Badge className={`${badgeColor} ${sizeClasses[size]} flex items-center gap-1`}>
            {isLastAttempt && <AlertTriangle className={iconSize[size]} />}
            {status.attemptsRemaining}/2 Attempts
          </Badge>
        );

      default:
        return (
          <Badge className={`bg-muted text-muted-foreground ${sizeClasses[size]}`}>
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
        return 'text-success';
      case 'locked':
        return 'text-destructive';
      case 'available':
        return status.attemptsRemaining === 1 ? 'text-warning' : 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <TooltipProvider>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {/* Status Badge with Educational Tooltip */}
        <div className="flex items-center gap-1">
          {getStatusBadge()}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-sm">
                <div className="font-semibold mb-1">ARC-AGI Prize Standard</div>
                <div className="mb-2">Each puzzle allows exactly <strong>2 attempts</strong> to match official research conditions.</div>
                <div className="text-xs text-muted-foreground">
                  After 2 incorrect attempts, the puzzle becomes locked and no points can be earned.
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Optional Label and Message */}
        {showLabel && (
          <div className="text-center">
            <div className={`text-xs font-medium ${getTextColor()}`}>
              {getStatusMessage()}
            </div>
            {status.totalAttempts > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Total attempts: {status.totalAttempts}
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default AttemptCounter;