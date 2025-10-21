/**
 * HARC Platform - Assessment Interface
 * ===================================
 * A clean interface for presenting curated ARC puzzles to participants.
 * Uses existing puzzle services that already work in the project.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import { HARCResponsiveSolverUI } from '@/components/layout/HARCResponsiveSolverUI';
import { PuzzleHeader } from '@/components/harc-solver/PuzzleHeader';
import { AssessmentModal } from '@/components/assessment/AssessmentModal';
import { puzzleRepository } from '@/services/core/puzzleRepository';
import { ASSESSMENT_PUZZLE_IDS } from '@/constants/assessmentPuzzles';
import { playFabRequestManager, playFabAuthManager, playFabUserData } from '@/services/playfab';
import { attemptTracker } from '@/services/playfab/attemptTracker';
import { idConverter } from '@/services/idConverter';
import type { PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';
import type { PerformanceData } from '@/services/core/arcExplainerClient';

// Curated assessment puzzle IDs HARDCODED BY THE DESIGNER!

export function AssessmentInterface() {
  const [, setLocation] = useLocation();
  const [puzzles, setPuzzles] = useState<OfficerTrackPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [completedPuzzles, setCompletedPuzzles] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(true);
  const [hintsUsedForCurrentPuzzle, setHintsUsedForCurrentPuzzle] = useState(0);
  // Global 2-attempt tracking system integration
  const [currentPuzzleAttemptStatus, setCurrentPuzzleAttemptStatus] = useState<PuzzleAttemptStatus | null>(null);
  const [isAwaitingValidation, setIsAwaitingValidation] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceData | null>(null);
  const isAdvancing = useRef(false);
  const [, navigate] = useLocation();

  console.log(`[Render] AssessmentInterface - Puzzle Index: ${currentPuzzleIndex}`);

  const currentPuzzle = puzzles[currentPuzzleIndex];

  // Load attempt status for current puzzle
  useEffect(() => {
    const loadCurrentPuzzleAttemptStatus = async () => {
      if (!currentPuzzle?.id) return;

      try {
        const status = await attemptTracker.getPuzzleAttemptStatus(currentPuzzle.id);
        setCurrentPuzzleAttemptStatus(status);
        console.log(`[AssessmentInterface] Loaded attempt status for ${currentPuzzle.id}:`, status);
      } catch (error) {
        console.error(`Failed to load attempt status for ${currentPuzzle.id}:`, error);
        // Set default status on error
        setCurrentPuzzleAttemptStatus({
          status: 'available',
          attemptsRemaining: 2,
          totalAttempts: 0,
          canAttempt: true,
          lockedAt: null
        });
      }
    };

    loadCurrentPuzzleAttemptStatus();
  }, [currentPuzzle?.id]);

  // Load performance stats when current puzzle changes
  useEffect(() => {
    const loadPerformanceStats = async () => {
      if (!currentPuzzle?.id) return;

      try {
        // Get enhanced puzzle data which includes performance stats
        const enhancedPuzzle = await puzzleRepository.findById(currentPuzzle.id, true);
        setPerformanceStats(enhancedPuzzle?.aiPerformance || null);
      } catch (error) {
        console.error(`Failed to load performance stats for ${currentPuzzle.id}:`, error);
        setPerformanceStats(null);
      }
    };

    loadPerformanceStats();
  }, [currentPuzzle?.id]);

  // Initialize and load assessment puzzles
  useEffect(() => {
    const initializeAndLoadPuzzles = async () => {
      try {
        setIsLoading(true);
        console.log('🎯 Initializing assessment...');
        
        // Initialize PlayFab if needed (same as PuzzleSolver page)
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();
        
        // Load assessment puzzles using existing service
        console.log('📚 Loading assessment puzzles:', ASSESSMENT_PUZZLE_IDS);
        const loadedPuzzles: OfficerTrackPuzzle[] = [];
        
        for (const puzzleId of ASSESSMENT_PUZZLE_IDS) {
          console.log(`Loading puzzle ${puzzleId}...`);
          const puzzleData = await puzzleRepository.findById(puzzleId, true, true);

          if (puzzleData) {
            loadedPuzzles.push(puzzleData);
          } else {
            console.warn(`Could not load puzzle ${puzzleId}`);
          }
        }
        
        if (loadedPuzzles.length === 0) {
          throw new Error('No assessment puzzles could be loaded.');
        }
        
        setPuzzles(loadedPuzzles);
        console.log(`✅ Loaded ${loadedPuzzles.length} assessment puzzles`);
        
        // Check for already completed puzzles
        const completed = await checkCompletedPuzzles();
        if (ASSESSMENT_PUZZLE_IDS.every(id => completed.has(id))) {
          setIsComplete(true);
          console.log('🎉 Assessment already completed!');
        }
        
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadPuzzles();
  }, []);

  // Automatically navigate when assessment is complete
  useEffect(() => {
    if (isComplete) {
      console.log('🚀 [Assessment] isComplete is true! Starting 3-second countdown to redirect...');
      // Navigate after a short delay to allow user to see the completion message
      const timer = setTimeout(() => {
        console.log('🚀 [Assessment] Redirecting to /dashboard now!');
        navigate('/dashboard');
      }, 3000); // 3-second delay

      return () => {
        console.log('🚀 [Assessment] Cleanup: Clearing redirect timer');
        clearTimeout(timer);
      };
    }
  }, [isComplete, navigate]);

  // Check which puzzles have already been completed
  const checkCompletedPuzzles = async (): Promise<Set<string>> => {
    try {
      console.log('[Assessment] Checking completed puzzles...');

      // Directly fetch only the performance data needed
      let humanPerformanceData = await playFabUserData.getHumanPerformanceData();

      // If no data found, attempt player recovery
      if (!humanPerformanceData || humanPerformanceData.length === 0) {
        console.log('[Assessment] No completion data found, attempting player recovery...');

        const recovered = await playFabAuthManager.attemptPlayerRecovery();
        if (recovered) {
          console.log('[Assessment] Player recovery successful, re-checking completion data...');
          humanPerformanceData = await playFabUserData.getHumanPerformanceData();
        } else {
          console.log('[Assessment] Player recovery failed or no previous data found');
        }
      }

      if (humanPerformanceData && humanPerformanceData.length > 0) {
        // Convert PlayFab puzzle IDs to ARC format for comparison with ASSESSMENT_PUZZLE_IDS
        const completedArcIds = new Set<string>();

        humanPerformanceData.forEach(record => {
          const arcId = idConverter.normalizeToArcId(record.puzzleId);
          if (arcId) {
            completedArcIds.add(arcId);
          }
          console.log(`[Assessment] Record: ${record.puzzleId} -> ${arcId} (assessment: ${ASSESSMENT_PUZZLE_IDS.includes(arcId || '')})`);
        });

        setCompletedPuzzles(completedArcIds);
        console.log('[Assessment] Found completed puzzles (ARC format):', completedArcIds);
        console.log('[Assessment] ASSESSMENT_PUZZLE_IDS needed:', ASSESSMENT_PUZZLE_IDS);

        // Log recovery success if we found data after recovery attempt
        const currentPlayFabId = playFabAuthManager.getPlayFabId();
        console.log('[Assessment] Current PlayFab ID:', currentPlayFabId);

        return completedArcIds;
      }
    } catch (error) {
      console.error('[Assessment] Failed to check completed puzzles:', error);
    }

    console.log('[Assessment] No completed puzzles found after all attempts.');
    return new Set<string>();
  };

  // Check for assessment completion after solving a puzzle
  const checkForCompletion = async () => {
    console.log('🔍 [Assessment] Checking for completion...');
    const completed = await checkCompletedPuzzles();

    console.log('🔍 [Assessment] Checking completion status:');
    ASSESSMENT_PUZZLE_IDS.forEach(id => {
      const isCompleted = completed.has(id);
      console.log(`    ${id}: ${isCompleted ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
    });

    const allComplete = ASSESSMENT_PUZZLE_IDS.every(id => completed.has(id));
    console.log(`🔍 [Assessment] All complete: ${allComplete}, isComplete: ${isComplete}`);

    if (allComplete && !isComplete) {
      console.log('🎉 Assessment completed! Setting isComplete to true and will redirect in 3 seconds...');
      setIsComplete(true);
    } else if (allComplete && isComplete) {
      console.log('ℹ️ [Assessment] Already marked as complete');
    } else {
      console.log(`ℹ️ [Assessment] Not complete yet: ${completed.size}/${ASSESSMENT_PUZZLE_IDS.length} puzzles done`);
    }
  };

  const handleNextPuzzle = async () => {
    // Check for completion first
    await checkForCompletion();

    if (currentPuzzleIndex < puzzles.length - 1) {
      const nextPuzzleIndex = currentPuzzleIndex + 1;
      setCurrentPuzzleIndex(nextPuzzleIndex);
      resetHintsForNewPuzzle();
      // Note: attempt status will be loaded automatically by useEffect when currentPuzzle changes
    }
  };

  const handlePreviousPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      const prevPuzzleIndex = currentPuzzleIndex - 1;
      setCurrentPuzzleIndex(prevPuzzleIndex);
      resetHintsForNewPuzzle();
      // Note: attempt status will be loaded automatically by useEffect when currentPuzzle changes
    }
  };

  const handleBackToLanding = () => {
    setLocation('/');
  };

  // Handle hint usage for current puzzle
  const handleHintUsed = (hintLevel: number, totalHintsUsed: number) => {
    setHintsUsedForCurrentPuzzle(totalHintsUsed);
    console.log(`🔍 Hint level ${hintLevel} used. Total hints for this puzzle: ${totalHintsUsed}`);
  };

  // Reset hints when moving to next puzzle
  const resetHintsForNewPuzzle = () => {
    setHintsUsedForCurrentPuzzle(0);
  };

  // Handle PlayFab validation result for assessment flow
  const handleAssessmentValidation = useCallback(async (puzzleId: string, validationResult: any) => {
    console.log(`🔍 handleAssessmentValidation called for puzzle ${puzzleId}`);
    console.log(`🔍 Validation result:`, validationResult);

    // Refresh attempt status after validation (since CloudScript updated it)
    try {
      const updatedStatus = await attemptTracker.getPuzzleAttemptStatus(puzzleId, false); // Force refresh
      setCurrentPuzzleAttemptStatus(updatedStatus);
      console.log(`🔍 Updated attempt status for ${puzzleId}:`, updatedStatus);

      const newAttempts = updatedStatus.totalAttempts;
      console.log(`🔍 Total attempts after validation: ${newAttempts}`);

      setIsAwaitingValidation(false);

      console.log(`📝 Assessment validation for ${puzzleId}: attempt ${newAttempts}, result:`, validationResult);

      // Assessment advancement logic:
      // - First attempt success: advancement controlled by success modal "OK" button
      // - First attempt fail: stay on puzzle for second attempt
      // - Second attempt (any result): auto-advance after delay
      const shouldAutoAdvance = (newAttempts >= 2);

      console.log(`🔍 Should auto-advance? ${shouldAutoAdvance} (attempts: ${newAttempts}, correct: ${validationResult?.correct})`);

      if (shouldAutoAdvance && !isAdvancing.current) {
        isAdvancing.current = true;
        console.log(`✅ Auto-advancing after attempt ${newAttempts} for puzzle ${puzzleId}`);
        setTimeout(() => {
          console.log(`🚀 Calling handleNextPuzzle() now...`);
          handleNextPuzzle();
          isAdvancing.current = false; // Reset after advancing
        }, 2000); // Brief delay to show result
      } else if (newAttempts === 1 && validationResult?.correct) {
        console.log(`🎉 First attempt success! Advancement will be controlled by success modal.`);
      } else {
        console.log(`🔄 Staying on puzzle ${puzzleId} after first failed attempt`);
      }
    } catch (error) {
      console.error(`Failed to refresh attempt status for ${puzzleId}:`, error);
      setIsAwaitingValidation(false);
    }
  }, [currentPuzzleIndex, puzzles.length]);

  // Custom onSolve handler that tracks validation instead of auto-advancing
  const handleAssessmentSolve = () => {
    // In assessment mode, onSolve is called after successful PlayFab validation
    // But we handle advancement in handleAssessmentValidation based on attempt count
    console.log('🎯 Assessment solve callback triggered - validation successful');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <div>Loading Assessment...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <div className="text-red-400 font-semibold mb-2">Assessment Loading Failed</div>
          <div className="text-muted-foreground mb-4">{error}</div>
          <Button onClick={handleBackToLanding} className="bg-amber-600 hover:bg-amber-700">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Show completion screen and auto-navigate
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-amber-400 mb-4">Assessment Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Congratulations! You've completed all assessment puzzles.
          </p>
          <p className="text-muted-foreground mb-8">
            Redirecting you to the performance comparison page...
          </p>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Assessment Information Modal */}
      <AssessmentModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
      />

      <PuzzleHeader
        puzzle={currentPuzzle}
        performanceStats={performanceStats}
        isAssessmentMode={true}
        onBack={handleBackToLanding}
      />
      
      {/* Assessment-specific controls IMPORTANT TO KEEP*/}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-base">
              Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
              {currentPuzzle && currentPuzzleAttemptStatus && currentPuzzleAttemptStatus.totalAttempts > 0 && (
                <span className="ml-2 text-amber-300">
                  (Attempt {currentPuzzleAttemptStatus.totalAttempts} of 2)
                </span>
              )}
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => setShowModal(true)} 
                variant="outline" 
                size="lg"
                className="border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-slate-900"
              >
                About Assessment
              </Button>
              <Button onClick={handleBackToLanding} variant="outline" size="lg" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900">
                Exit Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* The HARCResponsiveSolverUI - Modern HARC solver interface */}
      <HARCResponsiveSolverUI
        key={currentPuzzle.id}
        puzzle={currentPuzzle}
        onBack={handleBackToLanding}
        isAssessmentMode={true}
        onSolve={handleAssessmentSolve}
        onValidationResult={(result) => handleAssessmentValidation(currentPuzzle.id, result)}
        onAssessmentAdvance={handleNextPuzzle}
        hideHeader={true}
      />

      {/* Hint System is now handled within HARCResponsiveSolverUI */}

      {/* Navigation controls */}
      <div className="bg-card p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            onClick={handlePreviousPuzzle}
            disabled={currentPuzzleIndex === 0}
            variant="outline"
            size="lg"
          >
            ← Previous
          </Button>

          <div className="text-foreground text-lg">
            {currentPuzzleIndex + 1} / {puzzles.length}
          </div>
          
          <Button 
            onClick={handleNextPuzzle} 
            className="bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            {currentPuzzleIndex === puzzles.length - 1 ? 'Finish Assessment' : 'Next →'}
          </Button>
        </div>
      </div>

      {/* Tiny PlayFab ID debug display -- NEEDS FIXED TO SHOW ENTIRE ID */}
      <div className="fixed bottom-2 right-2 text-xs text-muted-foreground font-mono bg-card px-2 py-1 rounded opacity-75">
        ID: {playFabAuthManager.getPlayFabId()?.slice(-8) || 'loading...'}
      </div>
    </div>
  );
}
