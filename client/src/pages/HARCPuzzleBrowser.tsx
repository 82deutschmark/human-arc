/**  SRP and DRY Check: FAIL!!  
 *  NEEDS AUDIT!!
 * HARC Puzzle Browser - Modernized UI
 * Authored by: Cascade using Claude 3.5 Sonnet
 * Date: 2025-09-16 3:03 PM
 * 
 * Clean, user-friendly puzzle discovery interface with:
 * - Modern loading modal with progress indicators
 * - Light, accessible color scheme
 * - Search-first layout prioritizing user workflow
 * - Simplified interface without analytics clutter
 * 
 * Rebranded from Officer Track for HARC Platform use
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useOfficerPuzzles } from '@/hooks/useOfficerPuzzles';
import { PuzzleGrid } from '@/components/officer/PuzzleGrid';
import { PuzzleLoadingModal } from '@/components/ui/PuzzleLoadingModal';
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabUserData,
  playFabTasks,
  attemptTracker
} from '@/services/playfab';
import type { EnhancedPuzzle } from '@/services/core/puzzleRepository';
import type { PlayFabPlayer } from '@/services/playfab';
import type { PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';

export default function HARCPuzzleBrowser() {
  const [location, setLocation] = useLocation();

  const {
    filteredPuzzles,
    stats,
    total,
    loading,
    error,
    loadingProgress,
    loadingMessage,
    loadingStages,
    currentStage,
    detailedStatus,
    performanceMetrics,
    enhancedError,
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

  // Batch attempt status loading
  const [attemptStatusMap, setAttemptStatusMap] = useState<Record<string, PuzzleAttemptStatus>>({});
  const [attemptStatusLoading, setAttemptStatusLoading] = useState(false);

  // Initialize PlayFab and load player data on mount
  useEffect(() => {
    const initializePlayFab = async () => {
      try {
        console.log('🧠 Initializing PlayFab for HARC Puzzle Browser...');
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

        // Load player data
        const playerData = await playFabUserData.getPlayerData();
        setPlayer(playerData);

        setPlayFabReady(true);
        console.log('✅ PlayFab ready for HARC Puzzle Browser');
      } catch (err) {
        console.error('❌ PlayFab initialization failed:', err);
        // Continue anyway - arc-explainer API doesn't require PlayFab
        setPlayFabReady(false);
        // Set fallback player data
        setPlayer({
          id: 'unknown',
          username: 'Researcher',
          rank: 'Participant',
          rankLevel: 1,
          totalPoints: 0,
          completedMissions: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
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
        console.log(`[HARCPuzzleBrowser] Loading attempt status for ${filteredPuzzles.length} puzzles...`);

        // Extract puzzle IDs from filtered puzzles
        const puzzleIds = filteredPuzzles.map(puzzle => puzzle.id);

        // Load attempt status in batch
        const batchStatus = await attemptTracker.getBatchPuzzleAttemptStatus(puzzleIds);

        setAttemptStatusMap(batchStatus);
        console.log(`[HARCPuzzleBrowser] Loaded attempt status for ${Object.keys(batchStatus).length} puzzles`);
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
  const handleSelectPuzzle = (puzzle: EnhancedPuzzle) => {
    // Prevent navigation while PlayFab is still initializing
    if (playFabInitializing) {
      alert('Please wait for the system to initialize before loading puzzles...');
      return;
    }

    console.log('🎯 Navigating to puzzle solver:', puzzle.id);
    setLocation(`/puzzles/solve/${puzzle.id}`);
  };

  // Show loading modal during puzzle data loading (the real bottleneck)
  if (loading || !player) {
    return (
      <>
        <PuzzleLoadingModal
          isVisible={loading}
          progress={loadingProgress}
          statusMessage={loadingMessage}
          secondaryMessage={
            loading
              ? "Processing puzzle metadata from arc-explainer API..."
              : "Initializing HARC Platform..."
          }
          loadingStages={loadingStages}
          detailedStatus={detailedStatus}
          performanceMetrics={performanceMetrics}
          enhancedError={enhancedError || undefined}
        />
        {/* Fallback for PlayFab initialization */}
        {!player && !loading && (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-blue-200">
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  🧠 Initializing HARC Platform
                </h2>
                <p className="text-sm text-gray-600">
                  Setting up user session...
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        title="🧠 HARC Puzzle Library"
        showBackButton={true}
        onBack={() => setLocation('/')}
      />

      {/* Compact Search Bar */}
      <div className="bg-slate-100 border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3">
          <div className="flex items-center gap-3">
            <label className="text-slate-700 text-sm font-medium whitespace-nowrap">🔍 Find Puzzle:</label>
            <Input
              type="text"
              placeholder="Enter puzzle ID (e.g., 494ef9d7)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-white border-slate-300 text-slate-900 h-9 text-sm px-3 flex-1 max-w-xs"
              disabled={playFabInitializing}
            />
            <Button
              onClick={handleSearch}
              disabled={playFabInitializing || searching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50 h-9 px-4 font-semibold text-sm"
            >
              {playFabInitializing ? 'Init...' : searching ? 'Searching...' : 'Find'}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* CSS Grid Layout - Puzzle-First Priority */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8">

        {/* Move Puzzle Grid to Top Priority */}
        <div className="order-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-cyan-300 font-bold text-2xl flex items-center">
              🧩 AVAILABLE PUZZLES
              <Badge className="ml-4 bg-cyan-500 text-white text-base px-3 py-1">
                {filteredPuzzles.length} puzzles
              </Badge>
              {currentFilter && (
                <Badge className="ml-3 bg-sky-500 text-white text-base px-3 py-1">
                  {currentFilter.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </h2>

            {currentFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => filterByDifficulty(null)}
                className="border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-white text-base px-4 py-2"
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

          {/* Puzzle Limit Controls */}
          <div className="order-2 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label htmlFor="limit-select" className="text-base font-medium text-sky-300">
                  Show hardest:
                </label>
                <select
                  id="limit-select"
                  value={currentLimit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded text-base text-white min-w-[140px]"
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

        {/* AI Analysis Overview - HARC Research Theme */}  
        <div className="order-3 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h2 className="text-cyan-300 font-semibold text-xl flex items-center mb-2 sm:mb-0">
              🤖 AI PERFORMANCE ANALYSIS
            </h2>
            <div className="text-slate-300 text-base">
              Where human reasoning excels over artificial intelligence  
            </div>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-3">Loading analysis insights...</div>
          ) : (
            <div className="space-y-4">
              {/* Horizontal Compact Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-3 text-center border-l-4 border-cyan-500">
                  <div className="text-2xl font-bold text-cyan-300">{filteredPuzzles.length}</div>
                  <div className="text-sm text-slate-300">🧩 Research Puzzles</div>
                  <div className="text-xs text-slate-400">For human study</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 text-center border-l-4 border-red-500">
                  <div className="text-2xl font-bold text-red-400">
                    {filteredPuzzles.filter(p => (p.aiPerformance?.avgAccuracy || 0) === 0).length}
                  </div>
                  <div className="text-sm text-slate-300">🚫 AI Failures</div>
                  <div className="text-xs text-slate-400">0% success rate</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 text-center border-l-4 border-amber-500">
                  <div className="text-2xl font-bold text-amber-400">
                    {(() => {
                      const overconfident = filteredPuzzles.filter(p =>
                        (p.aiPerformance?.avgAccuracy || 0) < 0.5 && (p.aiPerformance?.avgConfidence || 0) > 70
                      ).length;
                      return `${Math.round((overconfident / filteredPuzzles.length) * 100)}%`;
                    })()}
                  </div>
                  <div className="text-sm text-slate-300">⚠️ Overconfident AI</div>
                  <div className="text-xs text-slate-400">Wrong but certain</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 text-center border-l-4 border-green-500">
                  <div className="text-2xl font-bold text-green-400">
                    {filteredPuzzles.reduce((sum, p) => sum + (p.aiPerformance?.totalExplanations || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-300">🔬 AI Attempts</div>
                  <div className="text-xs text-slate-400">Research data</div>
                </div>
              </div>

              {/* Key Insight - Research Focus */}
              <div className="bg-gradient-to-r from-cyan-900/30 to-sky-900/30 border border-cyan-700/40 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-cyan-300 font-semibold text-lg flex items-center">
                      🔬 Research Contribution
                    </h3>
                    <p className="text-slate-300 text-base mt-1">
                      If researchers ever wanted it the data is here 🤷‍♂️
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-300">
                      {(() => {
                        const avg = filteredPuzzles.length > 0
                          ? Math.round(filteredPuzzles.reduce((sum, p) => sum + (p.aiPerformance?.avgAccuracy || 0), 0) / filteredPuzzles.length * 100)
                          : 0;
                        return `${avg}%`;
                      })()}
                    </div>
                    <div className="text-sm text-slate-300">Avg AI Performance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground bg-muted rounded-lg p-3">
            🧠 <strong>Human - ARC Research:</strong> Will your advantage slip as the state of the art advances?
          </div>
        </div>

          {/* Footer Info */}
          <div className="order-4 text-center text-muted-foreground text-base bg-muted rounded-lg p-4">
            <p>🤖 Puzzle performance data sourced from arc-explainer AI analysis</p>
            <p className="mt-2">Practice on puzzles that challenge the most advanced AI systems</p>
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                onClick={() => setLocation('/space-force')}
                variant="ghost"
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                🚀 Looking for Space Force Mode?
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}