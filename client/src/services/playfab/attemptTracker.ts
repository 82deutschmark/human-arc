/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Client-side service for tracking and checking puzzle attempt status.
 * Implements 2-attempt limit per puzzle according to ARC-AGI Prize standards.
 * Integrates with CloudScript attempt tracking system.
 * SRP and DRY check: Pass - Single responsibility for attempt status management
 *
 */

import { playFabRequestManager } from './requestManager';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';
import { idConverter } from '@/services/idConverter';

// Types for attempt tracking
export interface PuzzleAttemptStatus {
  status: 'available' | 'locked' | 'completed';
  attemptsRemaining: number;
  totalAttempts: number;
  canAttempt: boolean;
  lockedAt?: string | null;
}

export interface PuzzleAttemptRecord {
  timestamp: string;
  result: 'correct' | 'incorrect';
  solutions: number[][][];
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
  scoreData?: any;
}

export interface PuzzleAttemptData {
  attempts: PuzzleAttemptRecord[];
  status: 'available' | 'locked' | 'completed';
  attemptsRemaining: number;
  lockedAt?: string | null;
}

// CloudScript request/response types
interface GetPuzzleAttemptStatusRequest {
  puzzleIds: string[];
}

interface GetPuzzleAttemptStatusResponse {
  success: boolean;
  puzzleStatuses: Record<string, PuzzleAttemptStatus>;
  totalPuzzlesChecked: number;
  error?: string;
}

interface GetSinglePuzzleAttemptStatusRequest {
  puzzleId: string;
}

interface GetSinglePuzzleAttemptStatusResponse extends PuzzleAttemptStatus {
  success: boolean;
  puzzleId: string;
  error?: string;
}

export class AttemptTracker {
  private static instance: AttemptTracker;
  private statusCache: Map<string, { status: PuzzleAttemptStatus; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): AttemptTracker {
    if (!AttemptTracker.instance) {
      AttemptTracker.instance = new AttemptTracker();
    }
    return AttemptTracker.instance;
  }

  /**
   * Get attempt status for a single puzzle
   */
  public async getPuzzleAttemptStatus(puzzleId: string, useCache: boolean = true): Promise<PuzzleAttemptStatus> {
    // Normalize puzzle ID to ARC format for CloudScript
    const normalizedId = idConverter.normalizeToArcId(puzzleId);
    if (!normalizedId) {
      console.error(`[AttemptTracker] Invalid puzzle ID format: ${puzzleId}`);
      return {
        status: 'available',
        attemptsRemaining: 2,
        totalAttempts: 0,
        canAttempt: true,
        lockedAt: null
      };
    }

    // Check cache first (use original puzzleId as cache key for UI consistency)
    if (useCache) {
      const cached = this.getCachedStatus(puzzleId);
      if (cached) {
        console.log(`[AttemptTracker] Using cached status for ${puzzleId}:`, cached);
        return cached;
      }
    }

    console.log(`[AttemptTracker] Fetching attempt status for puzzle: ${puzzleId} (normalized: ${normalizedId})`);

    try {
      const request = {
        FunctionName: 'GetSinglePuzzleAttemptStatus',
        FunctionParameter: { puzzleId: normalizedId } as GetSinglePuzzleAttemptStatusRequest,
        GeneratePlayStreamEvent: false
      };

      const result = await playFabRequestManager.makeRequest('executeCloudScript', request);

      if (result.Error) {
        throw new Error(`CloudScript error: ${result.Error.Error} - ${result.Error.Message}`);
      }

      const response = result.FunctionResult as GetSinglePuzzleAttemptStatusResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to get puzzle attempt status');
      }

      const status: PuzzleAttemptStatus = {
        status: response.status,
        attemptsRemaining: response.attemptsRemaining,
        totalAttempts: response.totalAttempts,
        canAttempt: response.canAttempt,
        lockedAt: response.lockedAt
      };

      // Cache the result
      this.setCachedStatus(puzzleId, status);

      console.log(`[AttemptTracker] Status for ${puzzleId}:`, status);
      return status;

    } catch (error) {
      console.error(`[AttemptTracker] Failed to get attempt status for ${puzzleId}:`, error);

      // Return default status on error (assume available)
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
   * Get attempt status for multiple puzzles (batch operation)
   */
  public async getBatchPuzzleAttemptStatus(puzzleIds: string[]): Promise<Record<string, PuzzleAttemptStatus>> {
    console.log(`[AttemptTracker] Fetching attempt status for ${puzzleIds.length} puzzles`);

    // Normalize all puzzle IDs to ARC format for CloudScript
    const normalizedIds: string[] = [];
    const idMapping: Record<string, string> = {}; // normalizedId -> originalId

    for (const puzzleId of puzzleIds) {
      const normalizedId = idConverter.normalizeToArcId(puzzleId);
      if (normalizedId) {
        normalizedIds.push(normalizedId);
        idMapping[normalizedId] = puzzleId;
      } else {
        console.error(`[AttemptTracker] Invalid puzzle ID format: ${puzzleId}`);
      }
    }

    if (normalizedIds.length === 0) {
      console.warn(`[AttemptTracker] No valid puzzle IDs to fetch`);
      return {};
    }

    try {
      const request = {
        FunctionName: 'GetPuzzleAttemptStatus',
        FunctionParameter: { puzzleIds: normalizedIds } as GetPuzzleAttemptStatusRequest,
        GeneratePlayStreamEvent: false
      };

      const result = await playFabRequestManager.makeRequest('executeCloudScript', request);

      if (result.Error) {
        throw new Error(`CloudScript error: ${result.Error.Error} - ${result.Error.Message}`);
      }

      const response = result.FunctionResult as GetPuzzleAttemptStatusResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to get puzzle attempt statuses');
      }

      // Map results back to original puzzle IDs and cache
      const results: Record<string, PuzzleAttemptStatus> = {};
      for (const [normalizedId, status] of Object.entries(response.puzzleStatuses)) {
        const originalId = idMapping[normalizedId];
        if (originalId) {
          results[originalId] = status;
          this.setCachedStatus(originalId, status);
        }
      }

      console.log(`[AttemptTracker] Retrieved status for ${Object.keys(results).length} puzzles`);
      return results;

    } catch (error) {
      console.error(`[AttemptTracker] Failed to get batch attempt status:`, error);

      // Return default statuses for all valid original puzzle IDs on error
      const defaultStatuses: Record<string, PuzzleAttemptStatus> = {};
      for (const puzzleId of puzzleIds) {
        // Only return defaults for IDs that passed normalization
        if (idConverter.normalizeToArcId(puzzleId)) {
          defaultStatuses[puzzleId] = {
            status: 'available',
            attemptsRemaining: 2,
            totalAttempts: 0,
            canAttempt: true,
            lockedAt: null
          };
        }
      }
      return defaultStatuses;
    }
  }

  /**
   * Check if a puzzle can be attempted
   */
  public async canAttemptPuzzle(puzzleId: string): Promise<boolean> {
    const status = await this.getPuzzleAttemptStatus(puzzleId);
    return status.canAttempt && status.status !== 'locked';
  }

  /**
   * Get number of remaining attempts for a puzzle
   */
  public async getRemainingAttempts(puzzleId: string): Promise<number> {
    const status = await this.getPuzzleAttemptStatus(puzzleId);
    return status.attemptsRemaining;
  }

  /**
   * Check if a puzzle is locked due to failed attempts
   */
  public async isPuzzleLocked(puzzleId: string): Promise<boolean> {
    const status = await this.getPuzzleAttemptStatus(puzzleId);
    return status.status === 'locked';
  }

  /**
   * Check if a puzzle is completed
   */
  public async isPuzzleCompleted(puzzleId: string): Promise<boolean> {
    const status = await this.getPuzzleAttemptStatus(puzzleId);
    return status.status === 'completed';
  }

  /**
   * Get human-readable status message for a puzzle
   */
  public async getStatusMessage(puzzleId: string): Promise<string> {
    const status = await this.getPuzzleAttemptStatus(puzzleId);

    switch (status.status) {
      case 'available':
        return `${status.attemptsRemaining} attempt(s) remaining`;
      case 'locked':
        return 'Locked: Maximum attempts exceeded';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Clear cache for a specific puzzle (call after validation)
   */
  public clearPuzzleCache(puzzleId: string): void {
    this.statusCache.delete(puzzleId);
    console.log(`[AttemptTracker] Cleared cache for puzzle ${puzzleId}`);
  }

  /**
   * Clear all cached statuses
   */
  public clearAllCache(): void {
    this.statusCache.clear();
    console.log(`[AttemptTracker] Cleared all cached attempt statuses`);
  }

  /**
   * Get cached status if available and not expired
   */
  private getCachedStatus(puzzleId: string): PuzzleAttemptStatus | null {
    const cached = this.statusCache.get(puzzleId);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.statusCache.delete(puzzleId);
      return null;
    }

    return cached.status;
  }

  /**
   * Cache a puzzle status
   */
  private setCachedStatus(puzzleId: string, status: PuzzleAttemptStatus): void {
    this.statusCache.set(puzzleId, {
      status,
      timestamp: Date.now()
    });
  }

  /**
   * Get cache statistics for debugging
   */
  public getCacheStats(): { size: number; puzzles: string[] } {
    return {
      size: this.statusCache.size,
      puzzles: Array.from(this.statusCache.keys())
    };
  }
}

// Export singleton instance
export const attemptTracker = AttemptTracker.getInstance();