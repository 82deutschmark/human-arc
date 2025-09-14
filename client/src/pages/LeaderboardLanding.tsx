/**
 * Leaderboard Landing Page
 * Author: Cascade
 * Date: 2025-09-14
 * 
 * PURPOSE:
 * A central hub for navigating to all available leaderboards.
 * Provides clear, distinct links to each leaderboard type.
 */

import { useLocation } from 'wouter';
import { Header } from '@/components/game/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEnabledLeaderboards, LeaderboardConfig } from '@/services/playfab/leaderboard-types';

export default function LeaderboardLanding() {
  const [, setLocation] = useLocation();
  const leaderboards = getEnabledLeaderboards();

  const handleSelectLeaderboard = (config: LeaderboardConfig) => {
    setLocation(`/leaderboards/${config.type.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header player={null} totalTasks={0} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Leaderboard Hub
          </h1>
          <p className="text-blue-200 text-lg">
            Select a leaderboard to view rankings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaderboards.map((lb) => (
            <Card 
              key={lb.type}
              className="bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-all duration-200 cursor-pointer"
              onClick={() => handleSelectLeaderboard(lb)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-300">
                  <span className="text-2xl">{lb.icon}</span>
                  <span>{lb.displayName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">{lb.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
