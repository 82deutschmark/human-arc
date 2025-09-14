/**
 * PuzzleSolver Page  - VERY BAD NAME!!!
 * Not sure if this has been deprecated for ResponsivePuzzleSolver ???
 * Author: Cascade
 * Date: 2025-UNKNOWN
 * 
 * PURPOSE:
 * Dedicated page for solving individual ARC puzzles accessed via URL
 * Replaces embedded puzzle solving in OfficerTrackSimple
 * 
 * HOW IT WORKS:
 * - Extracts puzzleId from URL params (/officer-track/solve/:puzzleId)
 * - Loads puzzle data from PlayFab
 * - Renders ResponsivePuzzleSolver component
 * - Handles loading states and errors
 * - Provides navigation back to puzzle list
 * 
 * HOW THE PROJECT USES IT:
 * - Enables direct URL access to specific puzzles
 * - Separates puzzle solving from puzzle discovery
 * - Improves application architecture and user experience
 */

import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { ResponsivePuzzleSolver } from '@/components/officer/ResponsivePuzzleSolver';
import { playFabRequestManager, playFabAuthManager } from '@/services/playfab';
import { puzzleRepository } from '@/services/core/puzzleRepository';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

export default function PuzzleSolver() {
  const [location, setLocation] = useLocation();

  // Determine the base path from the current location
  const basePath = location.startsWith('/puzzles') ? '/puzzles' : '/officer-track';
  const [match, params] = useRoute(`${basePath}/solve/:puzzleId`);

  const [puzzle, setPuzzle] = useState<OfficerTrackPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playFabReady, setPlayFabReady] = useState(false);

  const puzzleId = params?.puzzleId;

  // Initialize PlayFab and load puzzle
  useEffect(() => {
    const initializeAndLoadPuzzle = async () => {
      if (!puzzleId) {
        setError('No puzzle ID provided in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🎯 Loading puzzle:', puzzleId);

                // Initialize PlayFab if needed
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();
        
        setPlayFabReady(true);

        // Use the centralized service to find the puzzle
        const puzzleData = await puzzleRepository.findById(puzzleId, true);
        
        if (puzzleData) {
          setPuzzle(puzzleData);
          console.log('✅ Puzzle loaded successfully:', puzzleData.id);
        } else {
          setError(`Puzzle "${puzzleId}" not found. It may not exist in the dataset or hasn't been uploaded yet.`);
        }
        
      } catch (err) {
        console.error('❌ Failed to load puzzle:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('PlayFab not initialized')) {
          setError('System initialization failed. Please refresh and try again.');
        } else if (errorMessage.includes('Network')) {
          setError('Network connection issue. Please check your internet and try again.');
        } else if (errorMessage.includes('JSON')) {
          setError('The puzzle data appears to be corrupted. Please try a different puzzle.');
        } else {
          setError(`Failed to load puzzle: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAndLoadPuzzle();
  }, [puzzleId]);

  // Navigate back to the correct puzzle list
  const handleBack = () => {
    setLocation(basePath);
  };

  // If no route match, redirect to the appropriate base path after render
  useEffect(() => {
    if (!loading && !match) {
      setLocation(basePath);
    }
  }, [match, loading, setLocation, basePath]);

  if (!match) {
    return null; // Render nothing while redirecting
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-amber-400 mb-2">Loading Puzzle</h2>
          <p className="text-slate-400">Loading puzzle {puzzleId}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-amber-50">
        <header className="bg-slate-800 border-b-2 border-amber-400 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-amber-400">
                🎖️ PUZZLE SOLVER
              </h1>
              <Button 
                variant="outline" 
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Puzzles
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-900 border border-red-600 rounded-lg p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-red-400 font-semibold text-xl mb-3">Failed to Load Puzzle</h2>
            <p className="text-red-300 mb-6">{error}</p>
            
            <div className="space-x-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                🔄 Retry
              </Button>
              <Button 
                onClick={handleBack}
                variant="outline" 
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                ← Back to Puzzle List
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Success state - render puzzle solver with just the ID
  if (puzzle) {
    return <ResponsivePuzzleSolver puzzle={puzzle} onBack={handleBack} />;
  }

  // Fallback - shouldn't reach here
  return null;
}
