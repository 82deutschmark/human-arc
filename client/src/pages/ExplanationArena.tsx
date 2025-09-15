/**
 * Explanation Arena Page (ELO Leaderboard)
 * Author: Cascade
 * Date: 2025-09-14
 * 
 * PURPOSE:
 * Displays the ELO leaderboard for AI model explanation quality.
 */

import { ELOLeaderboardContainer } from '@/components/leaderboards/ELOLeaderboardContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LeaderboardType } from '@/services/playfab/leaderboard-types';

export default function ExplanationArena() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      <PageHeader 
        title="🥊 Explanation Arena"
        description="AI model explanation quality rankings (ELO-based)"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Leaderboards', href: '/leaderboards' },
          { label: 'Explanation Arena' }
        ]}
      />
      
      <div className="container mx-auto px-4 py-8">
        <ELOLeaderboardContainer type={LeaderboardType.EXPLANATION_ELO} />
      </div>
    </div>
  );
}
