/**
 * ELO Leaderboard Container Component
 * Author: Claude Code using Sonnet 4
 * Date: September 14, 2025
 *
 * PURPOSE:
 * Single responsibility: Manage ELO leaderboard data fetching and state.
 * Coordinates between ELO rating service and display components.
 * Follows the same patterns as existing LeaderboardContainer.tsx but for ELO data.
 *
 * HOW IT WORKS:
 * - Fetches ELO rating data using eloRatingService
 * - Manages loading and error states
 * - Passes data to ELO-specific table components for display
 * - Handles refresh functionality
 *
 * HOW THE PROJECT USES IT:
 * - Used by Leaderboards page to display ELO ratings leaderboard
 * - Follows project's local state management pattern
 * - Provides loading states and error handling for ELO data
 */

import { useState, useEffect } from "react";
import { eloRatingService, type ELORating } from "@/services/eloRatingService";
import { ELOPlayerRow } from "./ELOPlayerRow";
import { LeaderboardType, getLeaderboardConfig } from "@/services/playfab/leaderboard-types";

interface ELOLeaderboardContainerProps {
  type: LeaderboardType;
}

interface ELOLeaderboardStats {
  totalPlayers: number;
  totalGames: number;
  averageRating: number;
  highestRating: number;
  aiModels: number;
  humanPlayers: number;
}

export function ELOLeaderboardContainer({ type }: ELOLeaderboardContainerProps) {
  const [ratings, setRatings] = useState<ELORating[]>([]);
  const [stats, setStats] = useState<ELOLeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const config = getLeaderboardConfig(type);

  const loadELOLeaderboard = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log(`[ELOLeaderboardContainer] Loading ELO data for type: ${type}`);

      // Get all ELO ratings
      const allRatings = await eloRatingService.getELORatings();

      // Convert to leaderboard format (sorted by rating, minimum 3 games)
      const sortedRatings = eloRatingService.getLeaderboard(allRatings, undefined, 3);

      // Calculate statistics
      const totalPlayers = Object.keys(allRatings).length;
      const qualifiedRatings = Object.values(allRatings).filter(r => r.games >= 3);
      const totalGames = qualifiedRatings.reduce((sum, r) => sum + r.games, 0);
      const averageRating = qualifiedRatings.length > 0
        ? qualifiedRatings.reduce((sum, r) => sum + r.rating, 0) / qualifiedRatings.length
        : 0;
      const highestRating = qualifiedRatings.length > 0
        ? Math.max(...qualifiedRatings.map(r => r.rating))
        : 0;
      const aiModels = qualifiedRatings.filter(r => r.type === 'ai').length;
      const humanPlayers = qualifiedRatings.filter(r => r.type === 'human').length;

      const statistics: ELOLeaderboardStats = {
        totalPlayers,
        totalGames,
        averageRating: Math.round(averageRating),
        highestRating,
        aiModels,
        humanPlayers
      };

      setRatings(sortedRatings);
      setStats(statistics);

      console.log(`[ELOLeaderboardContainer] Loaded ${sortedRatings.length} ELO entries`);

    } catch (err) {
      console.error('[ELOLeaderboardContainer] Failed to load ELO leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ELO leaderboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadELOLeaderboard(true);
  };

  useEffect(() => {
    if (type === LeaderboardType.EXPLANATION_ELO) {
      loadELOLeaderboard();
    }
  }, [type]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton matching existing pattern */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              <div className="h-16 bg-slate-700 rounded"></div>
              <div className="h-16 bg-slate-700 rounded"></div>
              <div className="h-16 bg-slate-700 rounded"></div>
              <div className="h-16 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-8 text-center">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <div className="text-red-400 font-semibold text-xl mb-2">Failed to Load ELO Rankings</div>
        <div className="text-slate-400 mb-6">{error}</div>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ELO Statistics */}
      {stats && (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-blue-200 font-semibold text-lg flex items-center gap-2">
              {config.icon} {config.displayName} Statistics
            </h3>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              title="Refresh leaderboard"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalPlayers}</div>
              <div className="text-slate-400 text-sm">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.totalGames}</div>
              <div className="text-slate-400 text-sm">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.highestRating}</div>
              <div className="text-slate-400 text-sm">Highest Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.averageRating}</div>
              <div className="text-slate-400 text-sm">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.aiModels}</div>
              <div className="text-slate-400 text-sm">AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.humanPlayers}</div>
              <div className="text-slate-400 text-sm">Human Players</div>
            </div>
          </div>
        </div>
      )}

      {/* ELO Leaderboard Table */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
        {ratings.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-lg mb-2">🥊</div>
            <div className="text-gray-400">No ELO rankings available yet</div>
            <div className="text-gray-500 text-sm mt-1">
              Complete some explanation comparisons to build the rankings!
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-6 text-blue-200 font-medium">Rank</th>
                  <th className="text-left py-3 px-6 text-blue-200 font-medium">Model/Player</th>
                  <th className="text-right py-3 px-6 text-blue-200 font-medium">ELO Rating</th>
                  <th className="text-right py-3 px-6 text-blue-200 font-medium">Win Rate</th>
                  <th className="text-right py-3 px-6 text-blue-200 font-medium">Games</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating, index) => (
                  <ELOPlayerRow
                    key={`${rating.modelName || rating.playerName || 'unknown'}_${index}`}
                    rating={rating}
                    position={index + 1}
                    isEven={index % 2 === 0}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ELO Rating Legend */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4">
        <div className="text-slate-400 font-semibold mb-2">ELO Rating Scale:</div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-yellow-400">1400+: Master</span>
          <span className="text-green-400">1300+: Expert</span>
          <span className="text-blue-400">1200+: Intermediate</span>
          <span className="text-slate-400">&lt;1200: Novice</span>
        </div>
      </div>
    </div>
  );
}