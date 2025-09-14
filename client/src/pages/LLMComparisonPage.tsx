/**Unknow when this page was created or if it does anything???
 * Needs audit!
 * LLM Comparison Page
 * Wrapper page for the LLM comparison selector component
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/game/Header';
import { LLMComparisonSelector } from '@/components/officer/LLMComparisonSelector';
import type { AIPuzzlePerformance } from '@/services/arcExplainerAPI';
import { playFabRequestManager, playFabAuthManager, playFabUserData, playFabTasks } from '@/services/playfab';
import type { PlayFabPlayer } from '@/types/playfab';

export function LLMComparisonPage() {
  const [location, setLocation] = useLocation();
  const [player, setPlayer] = useState<PlayFabPlayer | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    const initializePlayFab = async () => {
      try {
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();

        const [playerData, tasksData] = await Promise.all([
          playFabUserData.getPlayerData(),
          playFabTasks.getAllTasks()
        ]);

        setPlayer(playerData);
        setTotalTasks(tasksData.length);
      } catch (err) {
        console.error('PlayFab initialization failed:', err);
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
      }
    };

    initializePlayFab();
  }, []);

  const handlePuzzleSelect = (puzzleId: string, aiPerformance: AIPuzzlePerformance) => {
    // Navigate to solve this puzzle
    setLocation(`/officer-track/solve/${puzzleId}`);
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header player={player} totalTasks={totalTasks} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-amber-400 mb-4">
              🤖 AI vs Human Challenge
            </h1>
            <p className="text-slate-300">
              Select puzzles where AI models struggled or failed completely. 
              Can you solve what AI couldn't? All data comes from real AI performance testing.
            </p>
          </div>

          <LLMComparisonSelector 
            onPuzzleSelect={handlePuzzleSelect}
            className="mb-8"
          />

          <div className="text-center">
            <button
              onClick={() => setLocation('/officer-track')}
              className="px-4 py-2 bg-slate-700 border border-amber-700 rounded text-amber-400 hover:bg-slate-600 hover:border-amber-500 transition-colors"
            >
              ← Back to Officer Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}