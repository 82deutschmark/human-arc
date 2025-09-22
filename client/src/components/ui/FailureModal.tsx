/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-18
 * PURPOSE: Reusable failure feedback modal with clear error messaging and retry encouragement.
 * Used for prominent validation failure feedback instead of tiny bottom notifications.
 * Provides professional error handling while maintaining consistent design language.
 * SRP and DRY check: Pass - Single responsibility (failure feedback), reusable component
 *
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseDelay?: number;
  puzzleId?: string;
  attemptsRemaining?: number;
  totalAttempts?: number;
  isLocked?: boolean;
  onRetry?: () => void;
  showDesignerNotes?: boolean;
}

/**
 * Gets a random selection of failure/thinking emojis
 * @param count Number of emojis to select
 * @returns Array of random failure emojis
 */
function getRandomFailureEmojis(count: number = 5): string[] {
  const failureEmojis = ['🙊', '🤔', '💭', '😕', '🙄', '🤷‍♂️', '🙈', '😨', '⛔', '🧐'];
  const selectedEmojis: string[] = [];

  // Get random emojis ensuring variety
  for (let i = 0; i < count; i++) {
    const randomEmoji = failureEmojis[Math.floor(Math.random() * failureEmojis.length)];
    selectedEmojis.push(randomEmoji);
  }

  return selectedEmojis;
}

export function FailureModal({
  open,
  onClose,
  title = "Incorrect Solution",
  message = "That's not quite right. Review your solution and try again.",
  autoCloseDelay = 0, // Default to no auto-close
  puzzleId,
  attemptsRemaining = 2,
  totalAttempts = 2,
  isLocked = false,
  onRetry,
  showDesignerNotes = true
}: Props) {
  const [failureEmojis, setFailureEmojis] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Generate new random emojis each time modal opens
  useEffect(() => {
    if (open) {
      setFailureEmojis(getRandomFailureEmojis(5));
      setIsVisible(true);

      // Only auto close if delay is explicitly set
      if (autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for fade out animation
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [open, autoCloseDelay, onClose]);

  // Determine modal styling based on lock status
  const borderColor = isLocked ? 'border-red-500' : 'border-orange-400';
  const titleColor = isLocked ? 'text-red-400' : 'text-orange-400';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`
          max-w-lg mx-auto bg-gradient-to-br from-slate-800 to-slate-900
          border-2 ${borderColor} text-white text-center p-8
          rounded-2xl shadow-2xl transform transition-all duration-300 scale-100
        `}
      >
        <DialogTitle className="sr-only">Puzzle Attempt Failed</DialogTitle>
        <DialogDescription className="sr-only">You have failed to solve the puzzle. You have {attemptsRemaining} attempt(s) remaining.</DialogDescription>
        {/* Failure emojis */}
        <div className="flex justify-center space-x-2 mb-6 text-4xl">
          {failureEmojis.map((emoji, index) => (
            <span
              key={index}
              className="inline-block animate-pulse"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '2s'
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* Failure title */}
        <h2 className={`text-3xl font-bold ${titleColor} mb-4`}>
          {isLocked ? "Puzzle Locked" : title}
        </h2>

        {/* Failure message */}
        <p className="text-slate-300 text-lg mb-4">
          {isLocked
            ? "Maximum attempts exceeded. You cannot earn points for this puzzle."
            : message
          }
        </p>

        {/* Attempt counter display */}
        {!isLocked && attemptsRemaining >= 0 && (
          <div className="my-6 text-center bg-slate-700/50 p-4 rounded-lg border border-orange-400/30">
            <h3 className="text-xl font-bold text-orange-300 mb-2">Attempts Remaining</h3>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-orange-400">
                {attemptsRemaining}
              </span>
              <span className="text-slate-400">of {totalAttempts}</span>
            </div>
            {attemptsRemaining === 1 && (
              <p className="text-orange-300 text-sm mt-2 font-semibold">
                ⚠️ This is your final attempt!
              </p>
            )}
          </div>
        )}

        {/* Locked state display */}
        {isLocked && (
          <div className="my-6 text-center bg-red-900/30 p-4 rounded-lg border border-red-500/50">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🔒</span>
              <h3 className="text-xl font-bold text-red-300">Puzzle Locked</h3>
            </div>
            <p className="text-red-400 text-sm">
              You used all {totalAttempts} attempts for this puzzle.
              <br />
              Try other puzzles to continue earning points.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          {!isLocked && onRetry && (
            <button
              onClick={onRetry}
              className="
                px-6 py-3 text-lg font-bold rounded-lg
                bg-orange-600 hover:bg-orange-700 text-white
                transition-all duration-200 hover:scale-105
                border-2 border-orange-400 shadow-lg
              "
            >
              Try Again
            </button>
          )}

          <button
            onClick={onClose}
            className={`
              px-6 py-3 text-lg font-bold rounded-lg text-white
              transition-all duration-200 hover:scale-105 shadow-lg
              ${isLocked
                ? 'bg-slate-600 hover:bg-slate-700 border-2 border-slate-400'
                : 'bg-slate-600 hover:bg-slate-700 border-2 border-slate-400'
              }
            `}
          >
            {isLocked ? 'Browse Other Puzzles' : 'Review Solution'}
          </button>
        </div>

        {/* Encouragement message for non-locked failures */}
        {!isLocked && (
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm italic">
              💡 Tip: Look carefully at the training examples for patterns
            </p>
          </div>
        )}

        {/* Designer notes placeholder */}
        {showDesignerNotes && (
          <p className="text-slate-500 text-sm italic border-t border-slate-700 pt-4 mt-4">
            DESIGNER NOTES HERE TO BE FILLED IN
          </p>
        )}

        {/* Custom CSS for entrance animation */}
        <style>{`
          @keyframes FailureEntrance {
            0% {
              transform: scale(0.8) translateY(-20px);
              opacity: 0;
            }
            50% {
              transform: scale(1.02) translateY(3px);
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