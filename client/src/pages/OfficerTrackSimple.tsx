/**
 * Officer Track - Simple Version
 * 
 * Clean, focused page for puzzle discovery
 * No overengineering - just the essentials
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { Header } from '@/components/game/Header';
import { useOfficerPuzzles } from '@/hooks/useOfficerPuzzles';
import { PuzzleGrid } from '@/components/officer/PuzzleGrid';
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabUserData,
  playFabTasks
} from '@/services/playfab';
import { attemptTracker } from '@/services/playfab/attemptTracker';
import type { OfficerPuzzle } from '@/types/arcTypes';
import type { PlayFabPlayer } from '@/services/playfab';
import type { PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';

export default function OfficerTrackSimple() {
  const [location, setLocation] = useLocation();
  
  const { 
    filteredPuzzles, 
    stats, 
    total,
    loading, 
    error, 
    filterByDifficulty, 
    searchById,
    addSearchResult,
    currentFilter,
    currentLimit,
    refresh,
    setLimit 
  } = useOfficerPuzzles();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [playFabReady, setPlayFabReady] = useState(false);
  const [playFabInitializing, setPlayFabInitializing] = useState(true);
  const [player, setPlayer] = useState<PlayFabPlayer | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);

  // Batch attempt status loading
  const [attemptStatusMap, setAttemptStatusMap] = useState<Record<string, PuzzleAttemptStatus>>({});
  const [attemptStatusLoading, setAttemptStatusLoading] = useState(false);

  // Initialize PlayFab and load player data on mount
    useEffect(() => {
    const initializePlayFab = async () => {
      try {
        console.log('🎖️ Initializing PlayFab for Officer Track...');
        setPlayFabInitializing(true);
        
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        
        if (!playFabAuthManager.isAuthenticated()) {
          await playFabAuthManager.loginAnonymously();
        }
        
        // Load player data and tasks for header
        const [playerData, tasksData] = await Promise.all([
          playFabUserData.getPlayerData(),
          playFabTasks.getAllTasks()
        ]);
        
        setPlayer(playerData);

        // DISABLED: Automatic tutorial redirect (was causing infinite loops)
        // Tutorial is now manual-only via button click or direct /tutorial URL visit
        // if (!playerData.hasCompletedTutorial) {
        //   console.log('New user detected, redirecting to tutorial.');
        //   setLocation('/tutorial');
        //   return; // Stop further execution
        // }

        setTotalTasks(tasksData.length);
        setPlayFabReady(true);
        console.log('✅ PlayFab ready for Officer Track');
      } catch (err) {
        console.error('❌ PlayFab initialization failed:', err);
        // Continue anyway - arc-explainer API doesn't require PlayFab
        // But warn user that puzzle loading might be limited
        setPlayFabReady(false);
        // Set fallback player data
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
        setPlayFabInitializing(false);
      }
    };

    initializePlayFab();
  }, []);

  // Load attempt status for all visible puzzles in batches
  useEffect(() => {
    const loadBatchAttemptStatus = async () => {
      if (!playFabReady || !filteredPuzzles.length) return;

      setAttemptStatusLoading(true);
      try {
        console.log(`[OfficerTrackSimple] Loading attempt status for ${filteredPuzzles.length} puzzles...`);

        // Extract puzzle IDs from filtered puzzles
        const puzzleIds = filteredPuzzles.map(puzzle => puzzle.id);

        // Load attempt status in batch
        const batchStatus = await attemptTracker.getBatchPuzzleAttemptStatus(puzzleIds);

        setAttemptStatusMap(batchStatus);
        console.log(`[OfficerTrackSimple] Loaded attempt status for ${Object.keys(batchStatus).length} puzzles`);
      } catch (error) {
        console.error('Failed to load batch attempt status:', error);
        // Create default status map on error
        const defaultStatusMap: Record<string, PuzzleAttemptStatus> = {};
        for (const puzzle of filteredPuzzles) {
          defaultStatusMap[puzzle.id] = {
            status: 'available',
            attemptsRemaining: 2,
            totalAttempts: 0,
            canAttempt: true,
            lockedAt: null
          };
        }
        setAttemptStatusMap(defaultStatusMap);
      } finally {
        setAttemptStatusLoading(false);
      }
    };

    loadBatchAttemptStatus();
  }, [playFabReady, filteredPuzzles]);


  // Handle puzzle search - add found puzzle to the card display
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Prevent search while PlayFab is still initializing
    if (playFabInitializing) {
      alert('Please wait for the system to initialize...');
      return;
    }
    
    setSearching(true);
    try {
      const puzzle = await searchById(searchQuery.trim());
      if (puzzle) {
        console.log('✅ Found puzzle:', puzzle.id);
        
        // Add the found puzzle to the display grid using the hook
        addSearchResult(puzzle);
        
        // Clear the search input after successful search
        setSearchQuery('');
        
        alert(`Found puzzle "${puzzle.id}"! Look for it at the top of the puzzle grid below.`);
      } else {
        if (playFabReady) {
          alert(`Puzzle "${searchQuery}" not found.\n\nTips:\n• Try a different puzzle ID (e.g., "007bbfb7")\n• Make sure the ID is exactly 8 characters\n• Check that the puzzle exists in the ARC dataset`);
        } else {
          alert(`Puzzle "${searchQuery}" not found.\n\n⚠️ PlayFab connection failed, so only puzzles with AI analysis data are available.\n\nTry:\n• A different puzzle ID\n• Refreshing the page\n• Checking your internet connection`);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Search failed: ${errorMessage}\n\nPlease try:\n• Refreshing the page\n• Checking your internet connection\n• Trying a different puzzle ID`);
    } finally {
      setSearching(false);
    }
  };

  // Handle puzzle selection from grid - navigate to dedicated solver page
  const handleSelectPuzzle = (puzzle: OfficerPuzzle) => {
    // Prevent navigation while PlayFab is still initializing
    if (playFabInitializing) {
      alert('Please wait for the system to initialize before loading puzzles...');
      return;
    }
    
    console.log('🎯 Navigating to puzzle solver:', puzzle.id);
    setLocation(`/space-force/officer-track/solve/${puzzle.id}`);
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-slate-900 text-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-white text-lg">Loading Officer Academy...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header player={player} totalTasks={totalTasks} />
      
      <div className="bg-slate-800 border-b-2 border-amber-400 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-amber-400">
                🎖️ OFFICER ACADEMY
              </h1>
              <Badge className="bg-amber-600 text-slate-900 font-bold">
                ARC-AGI CHALLENGES
              </Badge>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setLocation('/space-force/officer-track/ai-comparison')}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                disabled={playFabInitializing}
              >
                🤖 AI vs Human Challenge
              </Button>
              <Button
                onClick={() => setLocation('/space-force/tutorial')}
                className="bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold"
                disabled={playFabInitializing}
              >
                🎖️ Start Officer Training
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* CSS Grid Layout - Puzzle-First Priority */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8">
        
        {/* Move Puzzle Grid to Top Priority */}
        <div className="order-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-amber-400 font-bold text-2xl flex items-center">
              🧩 AVAILABLE CHALLENGES
              <Badge className="ml-4 bg-amber-600 text-slate-900 text-base px-3 py-1">
                {filteredPuzzles.length} puzzles
              </Badge>
              {currentFilter && (
                <Badge className="ml-3 bg-blue-600 text-white text-base px-3 py-1">
                  {currentFilter.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </h2>
            
            {currentFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => filterByDifficulty(null)}
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white text-base px-4 py-2"
              >
                Clear Filter
              </Button>
            )}
          </div>

          <PuzzleGrid
            puzzles={filteredPuzzles}
            loading={loading || attemptStatusLoading}
            onSelectPuzzle={handleSelectPuzzle}
            attemptStatusMap={attemptStatusMap}
          />
        </div>
        
        {/* Error State */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              <div>
                <h3 className="text-red-400 font-semibold">Failed to Load Puzzle Data</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
              <Button 
                onClick={() => refresh()} 
                variant="outline" 
                size="sm" 
                className="ml-auto border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                🔄 Retry
              </Button>
            </div>
          </div>
        )}

          {/* Puzzle Search & Controls - Compact Layout */}
          <div className="order-2 bg-slate-800 border border-slate-600 rounded-lg p-4">
            <h2 className="text-amber-400 font-semibold text-xl mb-4 flex items-center">
              🔍 PUZZLE DISCOVERY
            </h2>
          
          {/* System Status Indicator */}
          {playFabInitializing && (
              <div className="bg-blue-900 border border-blue-600 rounded p-3 mb-3">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-4"></div>
                  <span className="text-blue-300 text-base">Initializing PlayFab connection for puzzle data access...</span>
                </div>
              </div>
          )}
          
          {!playFabInitializing && !playFabReady && (
              <div className="bg-orange-900 border border-orange-600 rounded p-3 mb-3">
                <div className="text-orange-300 text-base">
                  ⚠️ PlayFab connection failed - puzzle loading may be limited to arc-explainer data only
                </div>
              </div>
          )}

            {/* Search Row - Enhanced Layout */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              type="text"
              placeholder="Enter puzzle ID (e.g., 494ef9d7)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-slate-700 border-slate-600 text-amber-100 flex-1 h-12 text-base px-4"
              disabled={playFabInitializing}
            />
            <Button 
              onClick={handleSearch}
              disabled={playFabInitializing || searching || !searchQuery.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-slate-900 disabled:bg-amber-800 disabled:opacity-50 h-12 px-6 font-semibold text-base"
            >
              {playFabInitializing ? 'Initializing...' : searching ? 'Searching...' : 'Find Puzzle'}
            </Button>
          </div>

            {/* Limit Controls - Enhanced Layout */}
            <div className="border-t border-slate-600 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3">
                  <label htmlFor="limit-select" className="text-base font-medium text-amber-300">
                    Show hardest:
                  </label>
                <select
                  id="limit-select"
                  value={currentLimit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded text-base text-amber-100 min-w-[140px]"
                >
                  <option value={25}>25 puzzles</option>
                  <option value={50}>50 puzzles</option>
                  <option value={75}>75 puzzles</option>
                  <option value={100}>100 puzzles</option>
                  <option value={150}>150 puzzles</option>
                  <option value={200}>200 puzzles</option>
                </select>
              </div>
              
                <div className="text-slate-300 text-base">
                  Showing {filteredPuzzles.length} of {total} total analyzed puzzles
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-sm mt-3">
              Search for specific puzzles by their ID or adjust the number of hardest puzzles to display
            </p>

          </div>

        {/* AI Failure Analysis Overview - Compact */}
        <div className="order-3 bg-slate-800 border border-slate-600 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h2 className="text-cyan-400 font-semibold text-xl flex items-center mb-2 sm:mb-0">
              🧠 AI ANALYSIS INSIGHTS
            </h2>
            <div className="text-slate-300 text-base">
              These puzzles challenge AI systems - perfect for human training
            </div>
          </div>
          
          {loading ? (
            <div className="text-center text-slate-400 py-3">Loading analysis insights...</div>
          ) : (
            <div className="space-y-4">
              {/* Horizontal Compact Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-700 rounded-lg p-3 text-center border-l-4 border-amber-500">
                  <div className="text-2xl font-bold text-amber-400">{filteredPuzzles.length}</div>
                  <div className="text-sm text-slate-300">🔥 Challenge Puzzles</div>
                  <div className="text-xs text-slate-400">Where AI struggles</div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-3 text-center border-l-4 border-red-500">
                  <div className="text-2xl font-bold text-red-400">
                    {filteredPuzzles.filter(p => p.avgAccuracy === 0).length}
                  </div>
                  <div className="text-sm text-slate-300">💀 Impossible</div>
                  <div className="text-xs text-slate-400">0% AI success</div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-3 text-center border-l-4 border-purple-500">
                  <div className="text-2xl font-bold text-purple-400">
                    {(() => {
                      const overconfident = filteredPuzzles.filter(p => 
                        p.avgAccuracy < 0.5 && (p.avgConfidence || 0) > 70
                      ).length;
                      return `${Math.round((overconfident / filteredPuzzles.length) * 100)}%`;
                    })()} 
                  </div>
                  <div className="text-sm text-slate-300">⚠️ Overconfident</div>
                  <div className="text-xs text-slate-400">Wrong but certain</div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-3 text-center border-l-4 border-orange-500">
                  <div className="text-2xl font-bold text-orange-400">
                    {filteredPuzzles.reduce((sum, p) => sum + p.totalExplanations, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-300">🤖 AI Attempts</div>
                  <div className="text-xs text-slate-400">Total tries</div>
                </div>
              </div>

              {/* Key Insight - Compact Summary */}
              <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-600/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-lg flex items-center">
                      💡 Why These Puzzles Matter
                    </h3>
                    <p className="text-slate-300 text-base mt-1">
                      AI systems fail dramatically on these patterns - train on what challenges machines most
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">
                      {(() => {
                        const avg = filteredPuzzles.length > 0 
                          ? Math.round(filteredPuzzles.reduce((sum, p) => sum + p.avgAccuracy, 0) / filteredPuzzles.length * 100)
                          : 0;
                        return `${avg}%`;
                      })()} 
                    </div>
                    <div className="text-sm text-slate-300">Avg AI Success</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-slate-400 bg-slate-900/50 rounded-lg p-3">
            🎯 <strong>Officer Training Focus:</strong> These puzzles reveal critical gaps in AI reasoning - 
            master what machines cannot.
          </div>
        </div>

          {/* Footer Info */}
          <div className="order-4 text-center text-slate-400 text-base bg-slate-900/30 rounded-lg p-4">
            <p>🤖 Puzzle difficulty data sourced from arc-explainer AI analysis</p>
            <p className="mt-2">Find the puzzles that challenge AI systems to train the next generation of officers</p>
          </div>
        
        </div>
      </main>
    </div>
  );
}
