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

        {/* Player Identity Section */}
        <div className="mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-amber-400 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-slate-300 text-sm mb-1">Display Name:</p>
                <p className="text-xl font-bold text-white">
                  {playFabAuthManager.getDisplayName() || 'Loading...'}
                </p>
              </div>
              <div>
                <p className="text-slate-300 text-sm mb-1">PlayFab ID:</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono text-cyan-300 select-all">
                    {playFabAuthManager.getPlayFabId() || 'Loading...'}
                  </p>
                  <button
                    onClick={() => {
                      const playFabId = playFabAuthManager.getPlayFabId();
                      if (playFabId) {
                        navigator.clipboard?.writeText(playFabId);
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-700 rounded transition-colors"
                    title="Copy PlayFab ID"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Reset PlayFab ID Tool */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Reset Account:</p>
                  <p className="text-xs text-slate-500">Generate new anonymous player account</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('⚠️ This will create a new player account and reset ALL progress.\n\nYour current progress will be lost. Continue?')) {
                      // Clear all PlayFab storage
                      localStorage.removeItem('playfab_device_id');
                      sessionStorage.removeItem('playfab_device_id');
                      localStorage.removeItem('debug_playfab_mapping');

                      // Clear PlayFab cookies (fallback recovery mechanism)
                      document.cookie = "playfab_device_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

                      // Clear any other PlayFab-related localStorage
                      const keysToRemove = [];
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.includes('playfab')) {
                          keysToRemove.push(key);
                        }
                      }
                      keysToRemove.forEach(key => localStorage.removeItem(key));

                      // Force page refresh to create new player
                      window.location.reload();
                    }
                  }}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors font-medium"
                  title="Clear all data and generate new PlayFab ID"
                >
                  🔄 Reset Account
                </button>
              </div>
            </div>
          </div>
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
