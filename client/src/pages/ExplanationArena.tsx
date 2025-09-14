/**
 * Explanation Arena Page (ELO Leaderboard)
 * Author: Cascade
 * Date: 2025-09-14
 * 
 * PURPOSE:
 * Displays the ELO leaderboard for AI model explanation quality.
 */

import { ELOLeaderboardContainer } from '@/components/leaderboards/ELOLeaderboardContainer';
import { Header } from '@/components/game/Header';
import { LeaderboardType } from '@/services/playfab/leaderboard-types';

export default function ExplanationArena() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      <Header player={null} totalTasks={0} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🥊 Explanation Arena
          </h1>
          <p className="text-purple-200 text-lg">
            AI model explanation quality rankings (ELO-based)
          </p>
        </div>

        <ELOLeaderboardContainer type={LeaderboardType.EXPLANATION_ELO} />
      </div>
    </div>
  );
}
