/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * Editor: Claude Code using Sonnet 4
 * Date of edit: 2025-09-17
 * PURPOSE: Extracts and orchestrates the core validation logic from ResponsivePuzzleSolver.tsx.
 * This service provides the exact same validation workflow that currently works, but abstracted
 * into a reusable service. It preserves all existing logging, timing, and callback behavior.
 * SRP and DRY check: Pass - Single responsibility for validation orchestration, uses existing services
 */

import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import type { EventType } from '@/types/playfab';
import { playFabValidation } from '@/services/playfab/validation';
import { playFabEvents } from '@/services/playfab/events';
import { idConverter } from '@/services/idConverter';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';

// Simple validation request interface matching current ResponsivePuzzleSolver
export interface ValidationRequest {
  puzzle: OfficerTrackPuzzle;
  solutions: ARCGrid[];
  sessionId: string;
  sessionStartTime: number;
  stepIndex: number;
  attemptNumber: number;
  playFabPuzzleId: string;
  totalTests: number;
  isAssessmentMode: boolean;
}

// Validation result interface matching current implementation
export interface ValidationResult {
  correct: boolean;
  serverResult?: any;
  timeElapsed: number;
  validationDurationMs: number;
  error?: string;
}

/**
 * Simple service that extracts the core validation logic from ResponsivePuzzleSolver.tsx.
 * Preserves the exact same workflow and behavior that currently works.
 */
export class PuzzleSolverService {
  private static instance: PuzzleSolverService;

  private constructor() {}

  public static getInstance(): PuzzleSolverService {
    if (!PuzzleSolverService.instance) {
      PuzzleSolverService.instance = new PuzzleSolverService();
    }
    return PuzzleSolverService.instance;
  }

  /**
   * Extract the exact validation logic from ResponsivePuzzleSolver.tsx (lines 387-502).
   * This preserves all logging, timing, and callback behavior exactly as it currently works.
   */
  public async validatePuzzleWithPlayFab(
    request: ValidationRequest,
    logPlayerAction: (eventType: string, positionX: number, positionY: number, payloadSummary: object | null, status?: "won" | "fail" | "stop" | "start") => Promise<void>
  ): Promise<ValidationResult> {

    // DEBUG: Log puzzle ID being sent to PlayFab (preserved from original)
    console.log('🔍 DEBUG - Puzzle validation details:');
    console.log('  Puzzle ID:', request.puzzle.id);
    console.log('  Solutions array:', request.solutions);
    console.log('  Total test cases:', request.totalTests);
    console.log('  Expected outputs:', request.puzzle.test?.map(t => t.output));

    // Log validation start event (preserved from original)
    await logPlayerAction(
      "validation_start",
      0,
      0,
      {
        validationType: "playfab_cloudscript",
        totalTests: request.totalTests,
        puzzleId: request.puzzle.id,
        debugInfo: {
          puzzleIdSent: request.puzzle.id,
          solutionsCount: request.solutions.length,
          expectedTestCases: request.totalTests
        }
      },
      "start"
    );

    try {
      const validationStartTime = Date.now();
      const timeElapsedInSeconds = Math.floor((validationStartTime - request.sessionStartTime) / 1000);

      console.log(`[TIMER] Validation for ${request.puzzle.id}:\n  Start Time: ${request.sessionStartTime}\n  End Time:   ${validationStartTime}\n  Elapsed (s): ${timeElapsedInSeconds}`);

      console.log(`🔄 Using PlayFab ID: ${request.playFabPuzzleId} (converted from ${request.puzzle.id})`);

      const validationArgs = {
        puzzleId: request.playFabPuzzleId,
        solutions: request.solutions,
        timeElapsed: timeElapsedInSeconds,
        attemptNumber: request.attemptNumber,
        stepCount: Math.max(request.stepIndex, 1), // Ensure stepCount is at least 1
        sessionId: request.sessionId
      };

      console.log('🚀 DEBUG - Sending to CloudScript:', JSON.stringify(validationArgs, null, 2));

      const serverResult = await playFabValidation.validateARCPuzzle(validationArgs);

      const validationDuration = Date.now() - validationStartTime;

      console.log('✅ DEBUG - PlayFab validation result:', serverResult);

      const result: ValidationResult = {
        correct: serverResult?.correct || false,
        serverResult,
        timeElapsed: timeElapsedInSeconds,
        validationDurationMs: validationDuration
      };

      // Log validation complete event (success) - preserved from original
      await logPlayerAction(
        "validation_complete",
        0,
        0,
        {
          serverResult,
          validationDurationMs: validationDuration,
          correct: result.correct,
          puzzleId: request.puzzle.id
        },
        result.correct ? "won" : "fail"
      );

      return result;

    } catch (error: any) {
      console.error('❌ DEBUG - PlayFab validation error:', error);

      // Log validation complete event (error) - preserved from original
      await logPlayerAction(
        "validation_complete",
        0,
        0,
        {
          error: error.message || 'Validation failed',
          validationType: "playfab_cloudscript",
          puzzleId: request.puzzle.id
        },
        "fail"
      );

      const errorResult: ValidationResult = {
        correct: false,
        error: error.message || 'Validation failed',
        timeElapsed: 0,
        validationDurationMs: 0
      };

      return errorResult;
    }
  }

  /**
   * Extract session initialization logic from ResponsivePuzzleSolver.tsx (lines 204-230).
   * This logs the puzzle start event exactly as the original implementation.
   */
  public async logSessionStart(
    sessionId: string,
    attemptNumber: number,
    playFabPuzzleId: string,
    stepIndex: number,
    totalTests: number,
    trainingExamplesCount: number,
    puzzleId: string
  ): Promise<void> {
    try {
      await playFabEvents.logPuzzleEvent(
        "SFMC",                    // eventName
        sessionId,                 // sessionId
        attemptNumber,             // attemptNumber
        playFabPuzzleId,           // game_id (PlayFab format puzzle ID)
        stepIndex,                 // stepIndex (starts at 0)
        0,                         // positionX
        0,                         // positionY
        {                          // payloadSummary
          totalTests: totalTests,
          trainingExamples: trainingExamplesCount,
          puzzleId: puzzleId
        },
        0,                         // deltaMs (0 for start)
        "Officer Track Puzzle",    // game_title
        "start",                   // status
        "officer-track",           // category
        "game_start",              // event_type
        0,                         // selection_value
        new Date().toISOString()   // game_time
      );
    } catch (error) {
      // Event logging failures should not break gameplay - fail silently
    }
  }

  /**
   * Extract session cleanup logic from ResponsivePuzzleSolver.tsx (lines 236-265).
   * This logs the session end event exactly as the original implementation.
   */
  public async logSessionEnd(
    sessionId: string,
    attemptNumber: number,
    playFabPuzzleId: string,
    stepIndex: number,
    sessionStartTime: number,
    puzzleId: string
  ): Promise<void> {
    try {
      const sessionDuration = Date.now() - sessionStartTime;
      await playFabEvents.logPuzzleEvent(
        "SFMC",                    // eventName
        sessionId,                 // sessionId
        attemptNumber,             // attemptNumber
        playFabPuzzleId,           // game_id (PlayFab format puzzle ID)
        stepIndex + 1,             // stepIndex (increment for final step)
        0,                         // positionX
        0,                         // positionY
        {                          // payloadSummary
          sessionDurationMs: sessionDuration,
          finalStepIndex: stepIndex,
          puzzleId: puzzleId
        },
        sessionDuration,           // deltaMs (total session time)
        "Officer Track Puzzle",    // game_title
        "stop",                    // status
        "officer-track",           // category
        "game_completion",         // event_type
        0,                         // selection_value
        new Date().toISOString()   // game_time
      );
    } catch (error) {
      // Event logging failures should not break gameplay - fail silently
    }
  }

  /**
   * Extract performance stats fetching logic from ResponsivePuzzleSolver.tsx (lines 194-199).
   * This fetches puzzle performance data exactly as the original implementation.
   */
  public async fetchPuzzlePerformance(puzzleId: string): Promise<PerformanceData | null> {
    try {
      const stats = await arcExplainerClient.getPuzzlePerformance(puzzleId);
      return stats;
    } catch (error) {
      console.error(`[PuzzleSolverService] Failed to fetch performance stats for ${puzzleId}:`, error);
      return null;
    }
  }

}

// Export singleton instance
export const puzzleSolverService = PuzzleSolverService.getInstance();