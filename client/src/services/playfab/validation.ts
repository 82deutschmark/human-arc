/**
 * PlayFab Validation Service - Pure HTTP Implementation
 * SECURITY CRITICAL: Server-side solution validation via CloudScript
 * Direct REST API calls - no SDK dependencies
 */

import type { 
  CloudScriptValidationRequest, 
  CloudScriptValidationResponse,
  TaskValidationResult 
} from '@/types/playfab';
import { playFabAuthManager } from './authManager';
import { playFabRequestManager } from './requestManager';
import { playFabTasks } from './tasks';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

// PlayFab ExecuteCloudScript request format
interface ExecuteCloudScriptRequest {
  FunctionName: string;
  FunctionParameter?: any;
  GeneratePlayStreamEvent?: boolean;
}

// PlayFab ExecuteCloudScript response format
interface ExecuteCloudScriptResponse {
  FunctionName: string;
  FunctionResult?: any;
  Error?: {
    Error: string;
    Message: string;
  };
  ExecutionTimeSeconds?: number;
  ProcessorTimeSeconds?: number;
  MemoryConsumedBytes?: number;
}

export class PlayFabValidation {
  private static instance: PlayFabValidation;

  private constructor() {}

  public static getInstance(): PlayFabValidation {
    if (!PlayFabValidation.instance) {
      PlayFabValidation.instance = new PlayFabValidation();
    }
    return PlayFabValidation.instance;
  }

  /**
   * Validate task solution via CloudScript (SECURITY CRITICAL) (HTTP implementation)
   * Replaces client-side validation to prevent cheating
   * 
   * This method calls the ValidateTaskSolution CloudScript function which:
   * 1. Retrieves task data from Title Data (server-side, unhackable)
   * 2. Validates solution server-side (unhackable)
   * 3. Calculates points with time bonus/penalty (unhackable)
   * 4. Updates user data and statistics atomically
   * 5. Returns validation result with all scoring details
   */
  public async validateSolution(request: CloudScriptValidationRequest): Promise<TaskValidationResult> {
    // Authentication handled automatically by requestManager
    
    // Prepare CloudScript request
    const cloudScriptRequest: ExecuteCloudScriptRequest = {
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.VALIDATE_SOLUTION,
      FunctionParameter: request,
      GeneratePlayStreamEvent: true // Enable for analytics
    };

    console.log(`[PlayFabValidation] Validating solution for task: ${request.taskId}`);

    try {
      const result = await playFabRequestManager.makeRequest<ExecuteCloudScriptRequest, ExecuteCloudScriptResponse>(
        'executeCloudScript',
        cloudScriptRequest
      );

      // Check for CloudScript execution errors
      if (result.Error) {
        const errorMsg = `CloudScript error: ${result.Error.Error} - ${result.Error.Message}`;
        console.error('[PlayFabValidation] CloudScript Error:', result.Error);
        throw new Error(errorMsg);
      }

      // Parse CloudScript response
      const validationResponse = result.FunctionResult as CloudScriptValidationResponse;
      
      if (!validationResponse) {
        throw new Error('No result returned from CloudScript validation');
      }

      // Create extended result for compatibility
      const taskValidationResult: TaskValidationResult = {
        ...validationResponse,
        basePoints: validationResponse.pointsEarned - (validationResponse.timeBonus || 0) + (validationResponse.hintPenalty || 0),
        speedBonus: validationResponse.timeBonus,
        totalPoints: validationResponse.totalScore,
        attempts: request.attemptId || 1
      };

      if (validationResponse.correct) {
        console.log('[PlayFabValidation] Solution Correct:', { 
          points: validationResponse.pointsEarned, 
          totalScore: validationResponse.totalScore 
        });
      } else {
        console.warn(`[PlayFabValidation] Solution Incorrect for task: ${request.taskId}`);
      }

      return taskValidationResult;

    } catch (error) {
      console.error('[PlayFabValidation] Validation Failed:', error);
      throw error;
    }
  }

  /**
   * Validate solution with automatic retry on CloudScript errors
   * Provides resilience against temporary CloudScript issues
   */
  public async validateSolutionWithRetry(
    request: CloudScriptValidationRequest,
    maxRetries: number = 2
  ): Promise<TaskValidationResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await this.validateSolution(request);
      } catch (error: any) {
        lastError = error;
        
        // Only retry on CloudScript errors, not on validation failures
        if (attempt <= maxRetries && this.isRetriableError(error)) {
          console.warn(`[PlayFabValidation] Retrying validation... Attempt ${attempt}/${maxRetries}`);
          await this.delay(1000 * attempt); // Exponential backoff
          continue;
        }
        break;
      }
    }

    throw lastError;
  }

  /**
   * Client-side fallback validation (ONLY used if CloudScript fails)
   * WARNING: This is hackable and should only be used as emergency fallback
   */
  public async fallbackValidation(request: CloudScriptValidationRequest): Promise<TaskValidationResult> {
    console.warn('🚨 Using client-side fallback validation - This is hackable!');
    
    // Get task data
    const task = await playFabTasks.getTaskById(request.taskId);
    if (!task) {
      throw new Error(`Task ${request.taskId} not found`);
    }

    // Client-side validation (hackable)
    const isCorrect = this.arraysEqual(request.solution, task.testOutput);
    
    let pointsEarned = 0;
    let timeBonus = 0;
    let hintPenalty = 0;

    if (isCorrect) {
      pointsEarned = task.basePoints;
      
      // Calculate time bonus
      if (request.timeElapsed && request.timeElapsed < 60) {
        timeBonus = Math.max(0, Math.floor((60 - request.timeElapsed) / 10) * 10);
        pointsEarned += timeBonus;
      }
      
      // Apply hint penalty
      if (request.hintsUsed && request.hintsUsed > 0) {
        hintPenalty = request.hintsUsed * 5;
        pointsEarned = Math.max(0, pointsEarned - hintPenalty);
      }
    }

    const result: TaskValidationResult = {
      success: isCorrect,
      correct: isCorrect,
      pointsEarned,
      timeBonus,
      hintPenalty,
      totalScore: 0, // Cannot update server-side data
      message: isCorrect 
        ? 'Mission accomplished! (Offline mode - sync when online)' 
        : 'Mission failed. Try again.',
      basePoints: task.basePoints,
      speedBonus: timeBonus,
      totalPoints: 0,
      attempts: request.attemptId || 1,
      hintsUsed: request.hintsUsed || 0
    };

    console.log('[PlayFabValidation] Fallback validation result:', { correct: isCorrect, points: pointsEarned });
    return result;
  }

  /**
   * Check if error is retriable (CloudScript timeout, network issues, etc.)
   */
  private isRetriableError(error: any): boolean {
    const retriableCodes = [
      'CloudScriptTimeout',
      'CloudScriptHTTPRequestError',
      'ServiceUnavailable',
      'RequestTimeout'
    ];
    
    return retriableCodes.includes(error.error) || 
           error.errorMessage?.includes('timeout') ||
           error.errorMessage?.includes('network');
  }

  /**
   * Helper function to compare 2D arrays
   */
  private arraysEqual<T extends string | number>(a: T[][], b: T[][]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return false;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate ARC puzzle solution via CloudScript (Officer Track) with Automatic Fallback
   * If CloudScript fails, automatically falls back to client-side validation with full PlayFab integration
   * NOW INCLUDES 2-ATTEMPT LIMIT ENFORCEMENT
   */
  public async validateARCPuzzle(args: {
    puzzleId: string;
    solutions: number[][][];
    timeElapsed: number;
    attemptNumber: number;
    sessionId: string;
    stepCount: number;
  }): Promise<any> {
    const startTime = Date.now();

    console.log(`[PlayFabValidation] Validating ARC puzzle: ${args.puzzleId}`);

    // CHECK ATTEMPT STATUS FIRST - CRITICAL FOR 2-ATTEMPT LIMIT
    const { attemptTracker } = await import('./attemptTracker');
    const { playFabEvents } = await import('./events');

    try {
      const attemptStatus = await attemptTracker.getPuzzleAttemptStatus(args.puzzleId);

      console.log(`[PlayFabValidation] Attempt status for ${args.puzzleId}:`, attemptStatus);

      // Log attempt status check event
      await playFabEvents.logEvent('puzzle_attempt_status_check', {
        puzzleId: args.puzzleId,
        sessionId: args.sessionId,
        status: attemptStatus.status,
        attemptsRemaining: attemptStatus.attemptsRemaining,
        totalAttempts: attemptStatus.totalAttempts,
        canAttempt: attemptStatus.canAttempt,
        timestamp: new Date().toISOString()
      });

      // Block validation if puzzle is locked
      if (attemptStatus.status === 'locked') {
        console.warn(`[PlayFabValidation] Blocked validation - puzzle ${args.puzzleId} is locked`);

        // Log puzzle locked event
        await playFabEvents.logEvent('puzzle_locked_attempt_blocked', {
          puzzleId: args.puzzleId,
          sessionId: args.sessionId,
          totalAttempts: attemptStatus.totalAttempts,
          lockedAt: attemptStatus.lockedAt,
          timestamp: new Date().toISOString()
        });

        return {
          success: false,
          error: "Puzzle locked: Maximum 2 attempts exceeded",
          locked: true,
          attemptsRemaining: 0,
          totalAttempts: attemptStatus.totalAttempts,
          message: "This puzzle is locked due to exceeding the maximum number of attempts (2)."
        };
      }

      // Warn if this is the last attempt
      if (attemptStatus.attemptsRemaining === 1) {
        console.warn(`[PlayFabValidation] Warning: Last attempt for puzzle ${args.puzzleId}`);

        // Log last attempt warning event
        await playFabEvents.logEvent('puzzle_last_attempt_warning', {
          puzzleId: args.puzzleId,
          sessionId: args.sessionId,
          attemptsRemaining: attemptStatus.attemptsRemaining,
          totalAttempts: attemptStatus.totalAttempts,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`[PlayFabValidation] Failed to check attempt status for ${args.puzzleId}:`, error);

      // Log attempt status check failure
      try {
        await playFabEvents.logEvent('puzzle_attempt_status_check_failed', {
          puzzleId: args.puzzleId,
          sessionId: args.sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      } catch (eventError) {
        console.error('Failed to log attempt status check failure event:', eventError);
      }

      // Continue with validation despite status check failure (fail-safe)
    }

    try {
      // First, try CloudScript validation
      const request: ExecuteCloudScriptRequest = {
        FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.VALIDATE_ARC_PUZZLE,
        FunctionParameter: args,
        GeneratePlayStreamEvent: true
      };

      const result = await playFabRequestManager.makeRequest<ExecuteCloudScriptRequest, ExecuteCloudScriptResponse>(
        'executeCloudScript',
        request
      );

      if (result.Error) {
        throw new Error(`CloudScript error: ${result.Error.Error} - ${result.Error.Message}`);
      }

      const validationResult = result.FunctionResult;

      // Check for the "DEBUG: undefined" error that indicates CloudScript failure
      if (!validationResult || !validationResult.success || (validationResult.error && validationResult.error.includes('undefined'))) {
        throw new Error('CloudScript validation failed with undefined error');
      }

      console.log(`✅ [PlayFabValidation] CloudScript validation successful: ${validationResult.correct ? 'Correct' : 'Incorrect'}`);

      // Clear attempt status cache to get fresh data on next check
      attemptTracker.clearPuzzleCache(args.puzzleId);

      return validationResult;

    } catch (error) {
      console.warn(`⚠️ [PlayFabValidation] CloudScript failed for ${args.puzzleId}, using fallback:`, error);

      // Fallback to enhanced client-side validation with full PlayFab integration
      try {
        const fallbackResult = await this.enhancedARCFallbackValidation(args);
        console.log(`🔄 [PlayFabValidation] Fallback validation result: ${fallbackResult.correct ? 'Correct' : 'Incorrect'}`);

        // Clear attempt status cache to get fresh data on next check
        attemptTracker.clearPuzzleCache(args.puzzleId);

        return fallbackResult;
      } catch (fallbackError) {
        console.error(`❌ [PlayFabValidation] Both CloudScript and fallback failed:`, fallbackError);
        throw new Error(`Validation completely failed: ${fallbackError}`);
      }
    }
  }

  /**
   * Enhanced ARC Puzzle Fallback Validation with Full PlayFab Integration
   * Provides all the same functionality as CloudScript validation but client-side
   */
  public async enhancedARCFallbackValidation(args: {
    puzzleId: string;
    solutions: number[][][];
    timeElapsed: number;
    attemptNumber: number;
    sessionId: string;
    stepCount: number;
  }): Promise<any> {
    console.warn('🚨 Using enhanced client-side fallback validation with PlayFab integration');

    // Get puzzle data from PlayFab (same as CloudScript would do)
    const puzzleData = await this.getPuzzleFromPlayFab(args.puzzleId);
    if (!puzzleData) {
      throw new Error(`Puzzle ${args.puzzleId} not found in PlayFab Title Data`);
    }

    // Validate solutions (same logic as CloudScript)
    const validationResult = this.validateSolutionsClientSide(puzzleData, args.solutions);

    if (!validationResult.allCorrect) {
      // Return failure result (no scoring for incorrect)
      return {
        success: true,
        correct: false,
        failures: validationResult.failures,
        message: 'Solution incorrect. Please try again.',
        fallback: true
      };
    }

    // Calculate score using same formulas as CloudScript
    const scoreData = this.calculateOfficerTrackScore({
      timeElapsed: args.timeElapsed,
      stepCount: args.stepCount,
      attemptNumber: args.attemptNumber
    });

    // Update PlayFab data directly (same as CloudScript would do)
    await this.updatePlayFabDataDirectly(args.puzzleId, scoreData, args);

    return {
      success: true,
      correct: true,
      ...scoreData,
      message: 'Puzzle solved! (Client-side validation)',
      fallback: true
    };
  }

  /**
   * Get puzzle data from PlayFab Title Data (client-side version of CloudScript logic)
   */
  private async getPuzzleFromPlayFab(puzzleId: string): Promise<any> {
    const batchKeys = [
      "officer-tasks-training-batch1.json", "officer-tasks-training-batch2.json",
      "officer-tasks-training-batch3.json", "officer-tasks-training-batch4.json",
      "officer-tasks-training2-batch1.json", "officer-tasks-training2-batch2.json",
      "officer-tasks-training2-batch3.json", "officer-tasks-training2-batch4.json",
      "officer-tasks-training2-batch5.json", "officer-tasks-training2-batch6.json",
      "officer-tasks-training2-batch7.json", "officer-tasks-training2-batch8.json",
      "officer-tasks-training2-batch9.json", "officer-tasks-training2-batch10.json",
      "officer-tasks-evaluation-batch1.json", "officer-tasks-evaluation-batch2.json",
      "officer-tasks-evaluation-batch3.json", "officer-tasks-evaluation-batch4.json",
      "officer-tasks-evaluation2-batch1.json", "officer-tasks-evaluation2-batch2.json"
    ];

    for (const batchKey of batchKeys) {
      try {
        const response = await playFabRequestManager.makeRequest('getTitleData', {
          Keys: [batchKey]
        });

        if (response.Data && response.Data[batchKey]) {
          const puzzles = JSON.parse(response.Data[batchKey]);
          const cleanPuzzleId = puzzleId.replace(/^ARC-(TR|T2|EV|E2)-/, '');

          for (const puzzle of puzzles) {
            const cleanStoredId = puzzle.id.replace(/^ARC-(TR|T2|EV|E2)-/, '');
            if (puzzle.id === puzzleId || cleanStoredId === cleanPuzzleId) {
              console.log(`🔍 Found puzzle ${puzzleId} in batch ${batchKey}`);
              return puzzle;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to check batch ${batchKey}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Client-side solution validation (same logic as CloudScript ValidationService.compareSolutions)
   */
  private validateSolutionsClientSide(puzzle: any, solutions: number[][][]): { allCorrect: boolean; failures: any[] } {
    const failures: any[] = [];
    const testCases = Array.isArray(puzzle.test) ? puzzle.test : [puzzle.test];

    if (solutions.length !== testCases.length) {
      console.error(`Expected ${testCases.length} solutions, got ${solutions.length}`);
      return { allCorrect: false, failures: [{ error: 'Solution count mismatch' }] };
    }

    for (let i = 0; i < testCases.length; i++) {
      if (!this.arraysEqual(solutions[i], testCases[i].output)) {
        failures.push({ index: i, expected: testCases[i].output, got: solutions[i] });
      }
    }

    return { allCorrect: failures.length === 0, failures };
  }

  /**
   * Calculate Officer Track score (same formulas as CloudScript)
   */
  private calculateOfficerTrackScore(args: { timeElapsed: number; stepCount: number; attemptNumber?: number }) {
    const BASE_POINTS = 10000;
    const SPEED_BONUS = { PER_MINUTE_POINTS: 100, UNDER_MINUTES: 20 };
    const EFFICIENCY_BONUS = { PER_ACTION_POINTS: 50, UNDER_ACTIONS: 100 };

    const timeInMinutes = Math.ceil((args.timeElapsed || 0) / 60);
    const speedBonus = timeInMinutes < SPEED_BONUS.UNDER_MINUTES ?
      (SPEED_BONUS.UNDER_MINUTES - timeInMinutes) * SPEED_BONUS.PER_MINUTE_POINTS : 0;

    const efficiencyBonus = args.stepCount < EFFICIENCY_BONUS.UNDER_ACTIONS ?
      (EFFICIENCY_BONUS.UNDER_ACTIONS - args.stepCount) * EFFICIENCY_BONUS.PER_ACTION_POINTS : 0;

    const finalScore = BASE_POINTS + speedBonus + efficiencyBonus;

    return {
      basePoints: BASE_POINTS,
      speedBonus,
      efficiencyBonus,
      finalScore,
      timeElapsed: args.timeElapsed,
      stepCount: args.stepCount,
      attemptNumber: args.attemptNumber
    };
  }

  /**
   * Update PlayFab data directly (same updates as CloudScript would do)
   */
  private async updatePlayFabDataDirectly(puzzleId: string, scoreData: any, args: any): Promise<void> {
    try {
      // Get current player data
      const userData = await playFabRequestManager.makeRequest('getUserData', {
        Keys: ['completedARCPuzzles', 'officerTrackPoints', 'humanPerformanceData']
      });

      const currentPoints = parseInt(userData.Data?.officerTrackPoints?.Value || '0');
      const completedPuzzles = JSON.parse(userData.Data?.completedARCPuzzles?.Value || '[]');
      const humanPerformanceData = JSON.parse(userData.Data?.humanPerformanceData?.Value || '[]');

      // Update completed puzzles
      if (!completedPuzzles.includes(puzzleId)) {
        completedPuzzles.push(puzzleId);
      }

      // Add performance record
      humanPerformanceData.push({
        puzzleId,
        correct: true,
        timestamp: new Date().toISOString(),
        ...scoreData
      });

      const newTotalPoints = currentPoints + scoreData.finalScore;

      // Update player statistics
      await playFabRequestManager.makeRequest('updateStatistics', {
        Statistics: [{
          StatisticName: 'OfficerTrackPoints',
          Value: newTotalPoints
        }]
      });

      // Update user data
      await playFabRequestManager.makeRequest('updateUserData', {
        Data: {
          completedARCPuzzles: JSON.stringify(completedPuzzles),
          officerTrackPoints: newTotalPoints.toString(),
          humanPerformanceData: JSON.stringify(humanPerformanceData)
        }
      });

      console.log(`✅ [PlayFabValidation] Fallback: Updated PlayFab data for ${puzzleId}, new total: ${newTotalPoints}`);

    } catch (error) {
      console.error('Failed to update PlayFab data in fallback mode:', error);
      // Don't throw - we still want to return success to user even if data update fails
    }
  }

  /**
   * Test CloudScript connection without validating a solution
   */
  public async testCloudScriptConnection(): Promise<boolean> {
    try {
      // Try to generate an anonymous name as a CloudScript connectivity test
      await playFabAuthManager.generateAnonymousName();
      return true;
    } catch (error) {
      console.error('[PlayFabValidation] CloudScript connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const playFabValidation = PlayFabValidation.getInstance();