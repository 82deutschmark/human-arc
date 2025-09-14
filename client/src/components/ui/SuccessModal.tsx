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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SPACE_EMOJIS, type EmojiSet } from '@/constants/spaceEmojis';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseDelay?: number;
  showDesignerNotes?: boolean;
  scoreDetails?: {
    basePoints?: number;
    speedBonus?: number;
    efficiencyBonus?: number;
    finalScore?: number;
  };
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
  scoreDetails
}: SuccessModalProps) {
  const [celebrationEmojis, setCelebrationEmojis] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Generate new random emojis each time modal opens
  useEffect(() => {
    if (open) {
      setCelebrationEmojis(getRandomEmojis(5));
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`
          max-w-lg mx-auto bg-gradient-to-br from-slate-800 to-slate-900 
          border-2 border-amber-400 text-white text-center p-8
          transform transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        style={{
          animation: isVisible ? 'successModalEntrance 0.6s ease-out' : undefined
        }}
      >
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

        {/* OK Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="
              px-8 py-3 text-lg font-bold rounded-lg
              bg-amber-600 hover:bg-amber-700 text-white
              transition-all duration-200 hover:scale-105
              border-2 border-amber-400 shadow-lg
            "
          >
            OK
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
          @keyframes successModalEntrance {
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