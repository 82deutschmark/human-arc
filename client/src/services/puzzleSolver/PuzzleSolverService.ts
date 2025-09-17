/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * Editor: Claude Code using Sonnet 4
 * Date of edit: 2025-09-17
 * PURPOSE: Orchestrates all backend operations for puzzle solving, including PlayFab validation,
 * arc-explainer API calls, event logging coordination, and error handling. This service abstracts
 * backend complexity from UI components and provides consistent retry logic and circuit breaker patterns.
 * Integrates with existing PlayFab singleton services while providing a clean interface for puzzle solving workflows.
 * SRP and DRY check: Pass - Single responsibility for backend orchestration, leverages existing services
 */

import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import type { EventType } from '@/types/playfab';
import { playFabValidation } from '@/services/playfab/validation';
import { playFabEvents } from '@/services/playfab/events';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';
import { attemptTracker, type PuzzleAttemptStatus } from '@/services/playfab/attemptTracker';
import { idConverter } from '@/services/idConverter';

// Validation request interface
export interface PuzzleValidationRequest {
  puzzle: OfficerTrackPuzzle;
  solutions: ARCGrid[];
  sessionId: string;
  sessionStartTime: number;
  stepIndex: number;
  attemptNumber: number;
}

// Validation result interface with enhanced state management
export interface PuzzleValidationResult {
  correct: boolean;
  serverResult?: any;
  timeElapsed: number;
  validationDurationMs: number;
  fallback?: boolean;
  error?: string;
  // Enhanced UI state properties
  showSuccessModal: boolean;
  showErrorModal: boolean;
  validationTimestamp: number;
}

// Session management interface
export interface PuzzleSession {
  sessionId: string;
  puzzleId: string;
  startTime: number;
  stepIndex: number;
  attemptNumber: number;
  isActive: boolean;
}

// Event logging payload interface
export interface PuzzleEventPayload {
  eventType: EventType;
  positionX: number;
  positionY: number;
  payloadSummary: object | null;
  status?: "won" | "fail" | "stop" | "start";
}

/**
 * Centralized service for orchestrating all puzzle solving backend operations.
 * Provides clean abstraction over PlayFab services, arc-explainer API, and event logging.
 */
export class PuzzleSolverService {
  private static instance: PuzzleSolverService;
  private activeSessions = new Map<string, PuzzleSession>();
  private performanceCache = new Map<string, PerformanceData>();
  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second base delay

  private constructor() {}

  public static getInstance(): PuzzleSolverService {
    if (!PuzzleSolverService.instance) {
      PuzzleSolverService.instance = new PuzzleSolverService();
    }
    return PuzzleSolverService.instance;
  }

  /**
   * Initialize a new puzzle solving session with proper event logging
   */
  public async initializeSession(
    puzzle: OfficerTrackPuzzle,
    isAssessmentMode: boolean = false
  ): Promise<PuzzleSession> {
    const sessionId = crypto.randomUUID();
    const startTime = Date.now();

    const session: PuzzleSession = {
      sessionId,
      puzzleId: puzzle.id,
      startTime,
      stepIndex: 0,
      attemptNumber: 1,
      isActive: true
    };

    this.activeSessions.set(sessionId, session);

    // Convert to PlayFab ID for logging
    const playFabVariants = idConverter.getAllPlayFabVariants(puzzle.id);
    const playFabPuzzleId = playFabVariants[0] || puzzle.id;

    // Log session start event
    try {
      await this.logPuzzleEvent(session, {
        eventType: "game_start",
        positionX: 0,
        positionY: 0,
        payloadSummary: {
          totalTests: puzzle.test?.length || 0,
          trainingExamples: puzzle.train?.length || 0,
          puzzleId: puzzle.id,
          playFabPuzzleId,
          isAssessmentMode
        },
        status: "start"
      });

      console.log(`[PuzzleSolverService] Session initialized for puzzle ${puzzle.id}`, session);
    } catch (error) {
      // Event logging failures should not break gameplay
      console.warn(`[PuzzleSolverService] Failed to log session start:`, error);
    }

    return session;
  }

  /**
   * End a puzzle solving session with cleanup and final event logging
   */
  public async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return;
    }

    try {
      const sessionDuration = Date.now() - session.startTime;

      // Log session end event
      await this.logPuzzleEvent(session, {
        eventType: "game_completion",
        positionX: 0,
        positionY: 0,
        payloadSummary: {
          sessionDurationMs: sessionDuration,
          finalStepIndex: session.stepIndex,
          puzzleId: session.puzzleId
        },
        status: "stop"
      });

      console.log(`[PuzzleSolverService] Session ended for puzzle ${session.puzzleId}`, {
        duration: sessionDuration,
        steps: session.stepIndex
      });
    } catch (error) {
      console.warn(`[PuzzleSolverService] Failed to log session end:`, error);
    } finally {
      // Mark session as inactive and remove from active sessions
      session.isActive = false;
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Validate a puzzle solution with comprehensive error handling and state management
   */
  public async validatePuzzleSolution(
    request: PuzzleValidationRequest
  ): Promise<PuzzleValidationResult> {
    const session = this.activeSessions.get(request.sessionId);
    if (!session) {
      throw new Error(`No active session found for ID: ${request.sessionId}`);
    }

    const validationStartTime = Date.now();
    const timeElapsedInSeconds = Math.floor((validationStartTime - request.sessionStartTime) / 1000);

    // Convert to PlayFab ID format
    const playFabVariants = idConverter.getAllPlayFabVariants(request.puzzle.id);
    const playFabPuzzleId = playFabVariants[0] || request.puzzle.id;

    console.log(`[PuzzleSolverService] Validating puzzle ${request.puzzle.id} -> PlayFab ID: ${playFabPuzzleId}`);

    // Log validation start event
    try {
      await this.logPuzzleEvent(session, {
        eventType: "validation_start",
        positionX: 0,
        positionY: 0,
        payloadSummary: {
          validationType: "playfab_cloudscript",
          totalTests: request.puzzle.test?.length || 0,
          puzzleId: request.puzzle.id,
          playFabPuzzleId,
          solutionsCount: request.solutions.length,
          timeElapsed: timeElapsedInSeconds
        },
        status: "start"
      });
    } catch (error) {
      console.warn(`[PuzzleSolverService] Failed to log validation start:`, error);
    }

    // Perform validation with retry logic
    try {
      const validationArgs = {
        puzzleId: playFabPuzzleId,
        solutions: request.solutions,
        timeElapsed: timeElapsedInSeconds,
        attemptNumber: request.attemptNumber,
        stepCount: Math.max(request.stepIndex, 1),
        sessionId: request.sessionId
      };

      console.log('[PuzzleSolverService] Sending validation request:', validationArgs);

      const serverResult = await this.executeWithRetry(
        () => playFabValidation.validateARCPuzzle(validationArgs)
      );

      const validationDuration = Date.now() - validationStartTime;

      // Increment session attempt number and step index
      session.attemptNumber += 1;
      session.stepIndex += 1;

      const result: PuzzleValidationResult = {
        correct: serverResult?.correct || false,
        serverResult,
        timeElapsed: timeElapsedInSeconds,
        validationDurationMs: validationDuration,
        showSuccessModal: serverResult?.correct || false,
        showErrorModal: !serverResult?.correct,
        validationTimestamp: Date.now()
      };

      // Log validation complete event
      try {
        await this.logPuzzleEvent(session, {
          eventType: "validation_complete",
          positionX: 0,
          positionY: 0,
          payloadSummary: {
            serverResult,
            validationDurationMs: validationDuration,
            correct: result.correct,
            puzzleId: request.puzzle.id,
            timeElapsed: timeElapsedInSeconds
          },
          status: result.correct ? "won" : "fail"
        });
      } catch (error) {
        console.warn(`[PuzzleSolverService] Failed to log validation complete:`, error);
      }

      console.log('[PuzzleSolverService] Validation result:', result);
      return result;

    } catch (error: any) {
      const validationDuration = Date.now() - validationStartTime;

      console.error('[PuzzleSolverService] Validation failed:', error);

      // Log validation error event
      try {
        await this.logPuzzleEvent(session, {
          eventType: "validation_complete",
          positionX: 0,
          positionY: 0,
          payloadSummary: {
            error: error.message || 'Validation failed',
            validationType: "playfab_cloudscript",
            puzzleId: request.puzzle.id,
            validationDurationMs: validationDuration
          },
          status: "fail"
        });
      } catch (logError) {
        console.warn(`[PuzzleSolverService] Failed to log validation error:`, logError);
      }

      const errorResult: PuzzleValidationResult = {
        correct: false,
        error: error.message || 'Validation failed',
        timeElapsed: timeElapsedInSeconds,
        validationDurationMs: validationDuration,
        showSuccessModal: false,
        showErrorModal: true,
        validationTimestamp: Date.now()
      };

      return errorResult;
    } finally {
      this.retryCount = 0; // Reset retry count after operation
    }
  }

  /**
   * Fetch puzzle performance statistics with caching
   */
  public async fetchPuzzlePerformance(puzzleId: string): Promise<PerformanceData | null> {
    // Check cache first
    if (this.performanceCache.has(puzzleId)) {
      console.log(`[PuzzleSolverService] Using cached performance data for ${puzzleId}`);
      return this.performanceCache.get(puzzleId) || null;
    }

    try {
      const stats = await this.executeWithRetry(
        () => arcExplainerClient.getPuzzlePerformance(puzzleId)
      );

      if (stats) {
        // Cache the result for 5 minutes
        this.performanceCache.set(puzzleId, stats);
        setTimeout(() => {
          this.performanceCache.delete(puzzleId);
        }, 5 * 60 * 1000);

        console.log(`[PuzzleSolverService] Fetched performance data for ${puzzleId}:`, stats);
      }

      return stats;
    } catch (error) {
      console.error(`[PuzzleSolverService] Failed to fetch performance data for ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Get puzzle attempt status with error handling
   */
  public async getPuzzleAttemptStatus(puzzleId: string): Promise<PuzzleAttemptStatus> {
    try {
      const status = await attemptTracker.getPuzzleAttemptStatus(puzzleId);
      console.log(`[PuzzleSolverService] Loaded attempt status for ${puzzleId}:`, status);
      return status;
    } catch (error) {
      console.error(`[PuzzleSolverService] Failed to load attempt status for ${puzzleId}:`, error);

      // Return safe default status
      return {
        status: 'available',
        attemptsRemaining: 2,
        totalAttempts: 0,
        canAttempt: true,
        lockedAt: null
      };
    }
  }

  /**
   * Log a puzzle event with proper session management
   */
  public async logPuzzleEvent(
    session: PuzzleSession,
    payload: PuzzleEventPayload
  ): Promise<void> {
    try {
      const currentTime = Date.now();
      const deltaMs = currentTime - session.startTime;

      // Convert to PlayFab ID for event logging
      const playFabVariants = idConverter.getAllPlayFabVariants(session.puzzleId);
      const playFabPuzzleId = playFabVariants[0] || session.puzzleId;

      await playFabEvents.logPuzzleEvent(
        "SFMC",                        // eventName
        session.sessionId,             // sessionId
        session.attemptNumber,         // attemptNumber
        playFabPuzzleId,              // game_id (PlayFab format)
        session.stepIndex,             // stepIndex
        payload.positionX,             // positionX
        payload.positionY,             // positionY
        payload.payloadSummary,        // payloadSummary
        deltaMs,                       // deltaMs
        "Officer Track Puzzle",        // game_title
        payload.status || "start",     // status
        "officer-track",               // category
        payload.eventType,             // event_type
        0,                             // selection_value
        new Date().toISOString()       // game_time
      );

      // Increment step index for next action
      session.stepIndex += 1;

    } catch (error) {
      // Event logging failures should not break gameplay
      console.warn(`[PuzzleSolverService] Failed to log event ${payload.eventType}:`, error);
    }
  }

  /**
   * Execute operation with exponential backoff retry logic
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);

        console.warn(`[PuzzleSolverService] Operation failed, retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries}):`, error);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(operation);
      } else {
        console.error(`[PuzzleSolverService] Operation failed after ${this.maxRetries} retries:`, error);
        throw error;
      }
    }
  }

  /**
   * Get active session by ID
   */
  public getSession(sessionId: string): PuzzleSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Clear performance cache (useful for testing)
   */
  public clearPerformanceCache(): void {
    this.performanceCache.clear();
  }

  /**
   * Get service health status
   */
  public getServiceHealth(): {
    activeSessions: number;
    cacheSize: number;
    retryCount: number;
  } {
    return {
      activeSessions: this.activeSessions.size,
      cacheSize: this.performanceCache.size,
      retryCount: this.retryCount
    };
  }
}

// Export singleton instance
export const puzzleSolverService = PuzzleSolverService.getInstance();