/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-14
 * PURPOSE: Generic profile page with HARC theme and navbar instead of game-specific design
 * SRP and DRY check: Pass - Single responsibility (profile management), reuses existing components
 *
 * Updated to use generic HARC theme and Navbar instead of Space Force game Header.
 * Provides access to display name and avatar management features in neutral context.
 */

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { UserProfile } from "@/components/user/UserProfile";
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabUserData
} from '@/services/playfab';
import type { PlayFabPlayer } from "@/services/playfab";

export default function Profile() {
  const [player, setPlayer] = useState<PlayFabPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        // Initialize PlayFab
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();

        const playerData = await playFabUserData.getPlayerData();
        setPlayer(playerData);
      } catch (error) {
        console.error('PlayFab initialization failed:', error);
        setPlayer({
          id: 'unknown',
          username: 'Player',
          rank: 'User',
          rankLevel: 1,
          totalPoints: 0,
          completedMissions: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, []);

  if (isLoading || !player) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar title="User Profile" />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
            <div>Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar title="User Profile" />

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">
            👤 Your Profile
          </h1>
          <p className="text-slate-300 text-lg">
            Manage your identity and personalize your experience
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <UserProfile
            onProfileUpdate={(profile) => {
              console.log('Profile updated:', profile);
            }}
          />
        </div>
      </div>
    </div>
  );
}
