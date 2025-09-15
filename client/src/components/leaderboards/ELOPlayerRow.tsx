/**
 * ELO Player Row Component
 * Author: Claude Code using Sonnet 4
 * Date: September 14, 2025
 *
 * PURPOSE:
 * Single responsibility: Render individual ELO rating entry in leaderboard table.
 * Pure UI component focused solely on displaying one model/player's ELO data.
 * Follows the same patterns as existing PlayerRow.tsx but for ELO ratings.
 *
 * HOW IT WORKS:
 * - Receives ELORating and styling props from parent table
 * - Renders rank, model/player name, ELO rating, and win percentage
 * - Shows AI/Human type indicators and game counts
 * - Uses alternating row colors for readability
 *
 * HOW THE PROJECT USES IT:
 * - Used by ELOLeaderboardContainer to render each ELO rating row
 * - Reusable across different ELO leaderboard views
 * - Handles ELO-specific formatting and styling consistently
 */

import type { ELORating } from '@/services/eloRatingService';

interface ELOPlayerRowProps {
  rating: ELORating;
  position: number;
  isEven: boolean;
}

export function ELOPlayerRow({ rating, position, isEven }: ELOPlayerRowProps) {
  const getRankBadge = (pos: number) => {
    switch (pos) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const formatELORating = (eloRating: number) => {
    return eloRating.toString();
  };

  const getELORatingColor = (eloRating: number) => {
    if (eloRating >= 1400) return 'text-yellow-400';
    if (eloRating >= 1300) return 'text-green-400';
    if (eloRating >= 1200) return 'text-blue-400';
    return 'text-slate-400';
  };

  const calculateWinPercentage = (eloRating: ELORating): number => {
    if (eloRating.games === 0) return 0;
    return ((eloRating.wins + eloRating.ties * 0.5) / eloRating.games) * 100;
  };

  const getTypeIcon = (type: 'ai' | 'human') => {
    return type === 'ai' ? '🤖' : '👤';
  };

  const getPerformanceMessage = (winPercentage: number) => {
    if (winPercentage >= 80) return "🏆 DOMINANT!";
    if (winPercentage >= 70) return "⭐ EXCELLENT!";
    if (winPercentage >= 60) return "🌟 STRONG!";
    if (winPercentage >= 50) return "✨ SOLID!";
    return null;
  };

  const winPercentage = calculateWinPercentage(rating);
  const displayName = rating.modelName || rating.playerName || 'Unknown';

  const rowClasses = `
    transition-colors duration-200 border-b border-slate-700/30
    ${isEven
      ? 'bg-slate-800/20 hover:bg-slate-800/40'
      : 'hover:bg-slate-800/20'
    }
  `;

  return (
    <tr className={rowClasses}>
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8">
            {getRankBadge(position) || (
              <span className="text-sm font-bold text-gray-400">
                #{position}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-600 text-slate-200">
            {getTypeIcon(rating.type)}
          </div>
          <div>
            <div className="font-medium text-white flex items-center gap-2">
              {displayName}
              <span className="text-xs text-slate-400">
                ({rating.type})
              </span>
            </div>
            {rating.type === 'ai' && rating.modelName && (
              <div className="text-xs text-slate-500">
                AI Model
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 px-6 text-right">
        <div className={`text-lg font-bold ${getELORatingColor(rating.rating)}`}>
          {formatELORating(rating.rating)}
        </div>
        <div className="text-xs text-gray-400">ELO rating</div>
        {getPerformanceMessage(winPercentage) && (
          <div className="text-xs text-yellow-400 font-semibold mt-1 animate-pulse">
            {getPerformanceMessage(winPercentage)}
          </div>
        )}
      </td>

      <td className="py-4 px-6 text-right">
        <div className="text-sm font-medium text-gray-300">
          {winPercentage.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-400">win rate</div>
      </td>

      <td className="py-4 px-6 text-right">
        <div className="text-sm font-medium text-gray-300">
          {rating.games}
        </div>
        <div className="text-xs text-gray-400">games</div>
        <div className="text-xs text-slate-500 mt-1">
          W:{rating.wins} L:{rating.losses} T:{rating.ties}
        </div>
      </td>
    </tr>
  );
}