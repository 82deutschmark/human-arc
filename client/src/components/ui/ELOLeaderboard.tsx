/**
 * Author: Claude Code using Sonnet 4
 * Date: September 14, 2025
 * PURPOSE: ELO Leaderboard component for displaying AI model and human explanation rankings
 * Shows top-rated authors/models with their ELO ratings, win percentages, and game counts
 * Used alongside ExplanationArena to show current standings in explanation quality
 * SRP and DRY check: Pass - Single responsibility for displaying ELO rankings
 */

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, RotateCcw } from 'lucide-react';
import { eloRatingService, type ELORating } from '@/services/eloRatingService';

interface ELOLeaderboardProps {
  className?: string;
  maxEntries?: number;
  showType?: 'all' | 'ai' | 'human';
  minGames?: number;
}

export function ELOLeaderboard({
  className = '',
  maxEntries = 10,
  showType = 'all',
  minGames = 3
}: ELOLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<ELORating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [showType, minGames]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[ELOLeaderboard] Loading leaderboard data...');

      // Get all ratings from ELO service
      const allRatings = await eloRatingService.getELORatings();

      // Filter and sort based on props
      const typeFilter = showType === 'all' ? undefined : showType;
      const sortedRatings = eloRatingService.getLeaderboard(allRatings, typeFilter, minGames);

      // Limit to requested number of entries
      const limitedRatings = sortedRatings.slice(0, maxEntries);

      setLeaderboard(limitedRatings);
      setLastUpdated(new Date());

      console.log(`[ELOLeaderboard] Loaded ${limitedRatings.length} leaderboard entries`);

    } catch (err) {
      console.error('[ELOLeaderboard] Failed to load leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 flex items-center justify-center text-slate-400 font-bold text-sm">#{position}</div>;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 1400) return 'text-yellow-400';
    if (rating >= 1300) return 'text-green-400';
    if (rating >= 1200) return 'text-blue-400';
    return 'text-slate-400';
  };

  const getTypeIcon = (type: 'ai' | 'human') => {
    return type === 'ai' ? '🤖' : '👤';
  };

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
        <div className="text-blue-400 text-sm">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-400 text-sm mb-4">
          Error: {error}
        </div>
        <button
          onClick={loadLeaderboard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-slate-400 text-sm mb-4">
          No ratings available yet. Complete some comparisons to build the leaderboard!
        </div>
        <button
          onClick={loadLeaderboard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 border border-blue-400 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-blue-400 font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          ELO Leaderboard
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLeaderboard}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title="Refresh leaderboard"
          >
            <RotateCcw className="w-4 h-4 text-blue-400" />
          </button>
          <div className="text-xs text-slate-400">
            {showType !== 'all' && `${showType} only`}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-6 gap-2 text-xs text-slate-400 font-semibold pb-2 border-b border-slate-700">
          <div>Rank</div>
          <div className="col-span-2">Author</div>
          <div>Rating</div>
          <div>Win%</div>
          <div>Games</div>
        </div>

        {/* Leaderboard Entries */}
        {leaderboard.map((rating, index) => {
          const position = index + 1;
          const winPercentage = eloRatingService.calculateWinPercentage(rating);

          return (
            <div
              key={`${rating.modelName || rating.playerName || 'unknown'}_${position}`}
              className={`grid grid-cols-6 gap-2 py-2 px-3 rounded transition-colors ${
                position <= 3 ? 'bg-slate-700 border border-slate-600' : 'hover:bg-slate-750'
              }`}
            >
              {/* Rank */}
              <div className="flex items-center">
                {getRankIcon(position)}
              </div>

              {/* Author Name & Type */}
              <div className="col-span-2 flex items-center gap-2 min-w-0">
                <span className="text-sm">{getTypeIcon(rating.type)}</span>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium truncate ${position <= 3 ? 'text-white' : 'text-slate-300'}`}>
                    {rating.modelName || rating.playerName || 'Unknown'}
                  </div>
                  {rating.modelName && rating.type === 'ai' && (
                    <div className="text-xs text-slate-500 truncate">
                      AI Model
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className={`font-bold ${getRatingColor(rating.rating)}`}>
                {rating.rating}
              </div>

              {/* Win Percentage */}
              <div className="text-sm text-slate-300">
                {winPercentage.toFixed(1)}%
              </div>

              {/* Games Played */}
              <div className="text-sm text-slate-400">
                {rating.games}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <div>
          Minimum {minGames} games to qualify
        </div>
        <div>
          {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>

      {/* Rating Legend */}
      <div className="mt-2 p-2 bg-slate-750 rounded text-xs">
        <div className="text-slate-400 font-semibold mb-1">Rating Scale:</div>
        <div className="flex flex-wrap gap-3">
          <span className="text-yellow-400">1400+: Master</span>
          <span className="text-green-400">1300+: Expert</span>
          <span className="text-blue-400">1200+: Intermediate</span>
          <span className="text-slate-400">&lt;1200: Novice</span>
        </div>
      </div>
    </div>
  );
}