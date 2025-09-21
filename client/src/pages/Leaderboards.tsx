/**OLD FILE!  Probably no longer relevant! Do not use!!
 * Leaderboards Page
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: Display leaderboard interface and coordinate user interactions.
 * Clean page-level component that orchestrates leaderboard display without business logic.
 * 
 * HOW IT WORKS:
 * - Uses LeaderboardService for all data operations
 * - Renders modular components for different leaderboard types
 * - Handles user navigation between Officer Track and Global leaderboards
 * - Maintains simple state for current view selection
 * 
 * HOW THE PROJECT USES IT:
 * - Main leaderboards interface accessed via /leaderboards route
 * - Integrates with existing PlayFab service architecture
 * - Follows project's local state management pattern (no React Query)
 */

import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Header } from "@/components/game/Header";
import { LeaderboardContainer } from "@/components/leaderboards/LeaderboardContainer";
import { ELOLeaderboardContainer } from "@/components/leaderboards/ELOLeaderboardContainer";
import { LeaderboardTabs } from "@/components/leaderboards/LeaderboardTabs";
import { HARCLeaderboard } from "@/components/leaderboards/HARCLeaderboard";
import { LeaderboardType, getEnabledLeaderboards } from "@/services/playfab/leaderboard-types";
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabUserData,
  playFabTasks,
} from '@/services/playfab';
import type { LeaderboardConfig } from "@/services/playfab/leaderboard-types";
import type { PlayFabPlayer } from "@/services/playfab";

export default function Leaderboards() {
  const [match, params] = useRoute('/leaderboards/:type');
  const [selectedType, setSelectedType] = useState<LeaderboardType>(LeaderboardType.OFFICER_TRACK);
  const [availableLeaderboards, setAvailableLeaderboards] = useState<LeaderboardConfig[]>([]);
  const [player, setPlayer] = useState<PlayFabPlayer | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is the HARC leaderboard route
  const isHARCLeaderboard = params?.type === 'harc_leaderboard';

    useEffect(() => {
    const loadPageData = async () => {
      try {
        // New initialization flow
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();

        // Get available leaderboard configurations
        const leaderboards = getEnabledLeaderboards();
        setAvailableLeaderboards(leaderboards);
        
        // Set default to Officer Track (ARC puzzles are primary focus)
        const defaultType = leaderboards.find(lb => lb.type === LeaderboardType.OFFICER_TRACK)?.type 
          || LeaderboardType.OFFICER_TRACK;
        
        setSelectedType(defaultType);

        // Load player data for Header component
        const [playerData, tasksData] = await Promise.all([
          playFabUserData.getPlayerData(),
          playFabTasks.getAllTasks()
        ]);

        setPlayer(playerData);
        setTotalTasks(tasksData.length);
      } catch (error) {
        console.error('Failed to load page data:', error);
        // Set minimal values if loading fails
        setPlayer({ 
          id: 'unknown', 
          username: 'Officer', 
          rank: 'Cadet', 
          rankLevel: 1, 
          totalPoints: 0, 
          completedMissions: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setTotalTasks(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, []);

  const handleTabChange = (type: LeaderboardType) => {
    setSelectedType(type);
  };

  // If this is the HARC leaderboard route, render the dedicated component
  if (isHARCLeaderboard) {
    return <HARCLeaderboard />;
  }

  if (isLoading || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-white text-lg">Loading leaderboards...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header player={player} totalTasks={totalTasks} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏆 Officer Rankings
          </h1>
          <p className="text-blue-200 text-lg">
            ARC Puzzle Performance & Mission Completion Rankings
          </p>
        </div>

        <LeaderboardTabs
          availableLeaderboards={availableLeaderboards}
          selectedType={selectedType}
          onTabChange={handleTabChange}
        />

        {selectedType === LeaderboardType.EXPLANATION_ELO ? (
          <ELOLeaderboardContainer
            type={selectedType}
            key={selectedType} // Force re-render when type changes
          />
        ) : (
          <LeaderboardContainer
            type={selectedType}
            key={selectedType} // Force re-render when type changes
          />
        )}
      </div>
    </div>
  );
}
