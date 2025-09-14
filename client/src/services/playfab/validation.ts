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
  private arraysEqual(a: string[][], b: string[][]): boolean {
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
   * Validate ARC puzzle solution via CloudScript (Officer Track)
   */
  public async validateARCPuzzle(args: {
    puzzleId: string;
    solutions: number[][][];
    timeElapsed: number;
    attemptNumber: number;
    sessionId: string;
    stepCount: number;
  }): Promise<any> {
    // Authentication handled automatically by requestManager
    
    const request: ExecuteCloudScriptRequest = {
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.VALIDATE_ARC_PUZZLE,
      FunctionParameter: args, // Pass the entire object
      GeneratePlayStreamEvent: true
    };

    console.log(`[PlayFabValidation] Validating ARC puzzle: ${args.puzzleId}`);

    try {
      const result = await playFabRequestManager.makeRequest<ExecuteCloudScriptRequest, ExecuteCloudScriptResponse>(
        'executeCloudScript',
        request
      );

      if (result.Error) {
        const errorMsg = `CloudScript error: ${result.Error.Error} - ${result.Error.Message}`;
        console.error('[PlayFabValidation] ARC CloudScript Error:', result.Error);
        throw new Error(errorMsg);
      }

      const validationResult = result.FunctionResult;
      
      console.log(`[PlayFabValidation] ARC puzzle validation result: ${validationResult?.correct ? 'Correct' : 'Incorrect'}`);

      return validationResult;
    } catch (error) {
      console.error(`[PlayFabValidation] ARC puzzle validation failed for ${args.puzzleId}:`, error);
      throw error;
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