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
import { PageHeader } from '@/components/layout/PageHeader';
import { getEnabledLeaderboards, type LeaderboardConfig } from '@/services/playfab/leaderboard-types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LeaderboardLanding() {
  const [, setLocation] = useLocation();
  const leaderboards = getEnabledLeaderboards();

  const handleSelectLeaderboard = (config: LeaderboardConfig) => {
    setLocation(`/leaderboards/${config.type.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <PageHeader 
        title="Leaderboard Hub"
        description="Compare your performance across different categories"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Leaderboards' }
        ]}
      />
      
      <div className="container mx-auto px-4 py-8">
        <p className="text-blue-200 text-lg mb-6">
          Select a leaderboard to view rankings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaderboards.map((lb) => (
            <Card 
              key={lb.type}
              className="bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-all duration-200 cursor-pointer"
              onClick={() => handleSelectLeaderboard(lb)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  {lb.icon} {lb.displayName}
                </CardTitle>
                <CardContent className="p-0 pt-2">
                  <p className="text-slate-300">{lb.description}</p>
                </CardContent>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
