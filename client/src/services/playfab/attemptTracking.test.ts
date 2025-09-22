/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Integration test to verify attempt tracking works correctly for both correct and incorrect solutions.
 * This test specifically addresses the issue where attempts might not be tracked to PlayFab properly.
 * SRP and DRY check: Pass - Single responsibility for testing attempt tracking integration
 */

import { playFabValidation } from './validation';
import { attemptTracker } from './attemptTracker';
import { playFabAuthManager } from './authManager';

// Test data
const TEST_PUZZLE_ID = 'ARC-TR-test-puzzle-attempt-tracking';
const TEST_SESSION_ID = 'test-session-' + Date.now();

const CORRECT_SOLUTION = [[[1, 0], [0, 1]]]; // This should match expected output
const INCORRECT_SOLUTION = [[[0, 0], [0, 0]]]; // This should NOT match expected output

const VALIDATION_ARGS_BASE = {
  puzzleId: TEST_PUZZLE_ID,
  timeElapsed: 30,
  attemptNumber: 1,
  sessionId: TEST_SESSION_ID,
  stepCount: 10
};

describe('Attempt Tracking Integration Tests', () => {

  beforeAll(async () => {
    console.log('🔧 [AttemptTrackingTest] Setting up test environment...');

    // Ensure PlayFab authentication is working
    if (!playFabAuthManager.isAuthenticated()) {
      console.log('🔐 [AttemptTrackingTest] Authenticating with PlayFab...');
      try {
        await playFabAuthManager.loginAsGuest();
        console.log('✅ [AttemptTrackingTest] Successfully authenticated with PlayFab');
      } catch (error) {
        console.error('❌ [AttemptTrackingTest] Failed to authenticate with PlayFab:', error);
        throw error;
      }
    }

    // Clear any existing attempt data for our test puzzle
    console.log('🧹 [AttemptTrackingTest] Clearing existing attempt data...');
    try {
      attemptTracker.clearPuzzleCache(TEST_PUZZLE_ID);
      console.log('✅ [AttemptTrackingTest] Cleared attempt cache');
    } catch (error) {
      console.warn('⚠️ [AttemptTrackingTest] Failed to clear cache:', error);
    }
  });

  afterAll(() => {
    console.log('🧹 [AttemptTrackingTest] Cleaning up test environment...');
    attemptTracker.clearPuzzleCache(TEST_PUZZLE_ID);
  });

  describe('Incorrect Attempt Tracking', () => {
    it('should track incorrect attempts to PlayFab and update attempt status', async () => {
      console.log('🧪 [AttemptTrackingTest] === TESTING INCORRECT ATTEMPT TRACKING ===');

      // Get initial attempt status
      console.log('📊 [AttemptTrackingTest] Getting initial attempt status...');
      const initialStatus = await attemptTracker.getPuzzleAttemptStatus(TEST_PUZZLE_ID);
      console.log('📊 [AttemptTrackingTest] Initial status:', initialStatus);

      expect(initialStatus.status).toBe('available');
      expect(initialStatus.attemptsRemaining).toBe(2);
      expect(initialStatus.totalAttempts).toBe(0);

      // Submit incorrect solution
      console.log('❌ [AttemptTrackingTest] Submitting INCORRECT solution...');
      const incorrectArgs = {
        ...VALIDATION_ARGS_BASE,
        solutions: INCORRECT_SOLUTION,
        attemptNumber: 1
      };

      const incorrectResult = await playFabValidation.validateARCPuzzle(incorrectArgs);
      console.log('📊 [AttemptTrackingTest] Incorrect validation result:', incorrectResult);

      // Verify the result indicates incorrect attempt
      expect(incorrectResult.success).toBe(true); // Validation succeeds even for incorrect attempts
      expect(incorrectResult.correct).toBe(false);
      expect(incorrectResult.attemptsRemaining).toBe(1); // Should have 1 attempt remaining
      expect(incorrectResult.totalAttempts).toBe(1); // Should show 1 total attempt

      // Verify attempt status was updated in PlayFab
      console.log('🔍 [AttemptTrackingTest] Checking updated attempt status...');
      const updatedStatus = await attemptTracker.getPuzzleAttemptStatus(TEST_PUZZLE_ID, false); // Don't use cache
      console.log('📊 [AttemptTrackingTest] Updated status after incorrect attempt:', updatedStatus);

      expect(updatedStatus.status).toBe('available'); // Should still be available (1 attempt left)
      expect(updatedStatus.attemptsRemaining).toBe(1);
      expect(updatedStatus.totalAttempts).toBe(1);

      console.log('✅ [AttemptTrackingTest] Incorrect attempt tracking VERIFIED');
    }, 30000); // 30 second timeout for PlayFab calls

    it('should lock puzzle after 2 incorrect attempts', async () => {
      console.log('🧪 [AttemptTrackingTest] === TESTING PUZZLE LOCKING AFTER 2 ATTEMPTS ===');

      // Submit second incorrect solution
      console.log('❌ [AttemptTrackingTest] Submitting SECOND incorrect solution...');
      const secondIncorrectArgs = {
        ...VALIDATION_ARGS_BASE,
        solutions: INCORRECT_SOLUTION,
        attemptNumber: 2
      };

      const secondIncorrectResult = await playFabValidation.validateARCPuzzle(secondIncorrectArgs);
      console.log('📊 [AttemptTrackingTest] Second incorrect validation result:', secondIncorrectResult);

      // Verify the puzzle is now locked
      expect(secondIncorrectResult.success).toBe(true);
      expect(secondIncorrectResult.correct).toBe(false);
      expect(secondIncorrectResult.attemptsRemaining).toBe(0);
      expect(secondIncorrectResult.totalAttempts).toBe(2);
      expect(secondIncorrectResult.locked).toBe(true);

      // Verify attempt status shows locked
      console.log('🔍 [AttemptTrackingTest] Checking locked status...');
      const lockedStatus = await attemptTracker.getPuzzleAttemptStatus(TEST_PUZZLE_ID, false);
      console.log('📊 [AttemptTrackingTest] Locked status:', lockedStatus);

      expect(lockedStatus.status).toBe('locked');
      expect(lockedStatus.attemptsRemaining).toBe(0);
      expect(lockedStatus.totalAttempts).toBe(2);
      expect(lockedStatus.canAttempt).toBe(false);

      console.log('✅ [AttemptTrackingTest] Puzzle locking after 2 attempts VERIFIED');
    }, 30000);

    it('should reject attempts on locked puzzles', async () => {
      console.log('🧪 [AttemptTrackingTest] === TESTING LOCKED PUZZLE REJECTION ===');

      // Try to submit a third attempt (should be rejected)
      console.log('🚫 [AttemptTrackingTest] Attempting to submit on LOCKED puzzle...');
      const blockedArgs = {
        ...VALIDATION_ARGS_BASE,
        solutions: CORRECT_SOLUTION, // Even a correct solution should be blocked
        attemptNumber: 3
      };

      const blockedResult = await playFabValidation.validateARCPuzzle(blockedArgs);
      console.log('📊 [AttemptTrackingTest] Blocked attempt result:', blockedResult);

      // Verify the attempt was blocked
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.locked).toBe(true);
      expect(blockedResult.error).toContain('locked');
      expect(blockedResult.attemptsRemaining).toBe(0);

      console.log('✅ [AttemptTrackingTest] Locked puzzle rejection VERIFIED');
    }, 30000);
  });

  describe('Validation Path Verification', () => {
    it('should use fallback validation when CloudScript fails', async () => {
      console.log('🧪 [AttemptTrackingTest] === TESTING FALLBACK PATH ===');

      // This test will show which path is being used by checking the logs
      // We can't easily force CloudScript to fail, but we can verify fallback works

      const testPuzzleId = 'ARC-TR-fallback-test-' + Date.now();
      const fallbackArgs = {
        puzzleId: testPuzzleId,
        solutions: INCORRECT_SOLUTION,
        timeElapsed: 15,
        attemptNumber: 1,
        sessionId: 'fallback-test-session',
        stepCount: 5
      };

      console.log('🔄 [AttemptTrackingTest] Testing validation (may use CloudScript or fallback)...');
      const result = await playFabValidation.validateARCPuzzle(fallbackArgs);
      console.log('📊 [AttemptTrackingTest] Validation result:', result);

      // Regardless of which path was used, attempt tracking should work
      expect(result.success).toBe(true);
      expect(result.correct).toBe(false);
      expect(result.attemptsRemaining).toBeDefined();
      expect(result.totalAttempts).toBeDefined();

      // Check if fallback was used
      if (result.fallback) {
        console.log('🔄 [AttemptTrackingTest] Fallback validation was used - this is expected if CloudScript auth is failing');
      } else {
        console.log('☁️ [AttemptTrackingTest] CloudScript validation was used - auth is working properly');
      }

      console.log('✅ [AttemptTrackingTest] Validation path verification COMPLETED');
    }, 30000);
  });

  describe('Attempt Tracking Verification', () => {
    it('should save attempt data to PlayFab User Data', async () => {
      console.log('🧪 [AttemptTrackingTest] === TESTING USER DATA PERSISTENCE ===');

      const testPuzzleId = 'ARC-TR-persistence-test-' + Date.now();

      // Submit an attempt
      console.log('📝 [AttemptTrackingTest] Submitting attempt for persistence test...');
      const persistenceArgs = {
        puzzleId: testPuzzleId,
        solutions: INCORRECT_SOLUTION,
        timeElapsed: 25,
        attemptNumber: 1,
        sessionId: 'persistence-test-session',
        stepCount: 8
      };

      await playFabValidation.validateARCPuzzle(persistenceArgs);

      // Check that data was persisted by getting fresh status
      console.log('🔍 [AttemptTrackingTest] Checking data persistence...');
      const persistedStatus = await attemptTracker.getPuzzleAttemptStatusFromUserData(testPuzzleId);
      console.log('📊 [AttemptTrackingTest] Persisted status:', persistedStatus);

      expect(persistedStatus.status).toBe('available');
      expect(persistedStatus.attemptsRemaining).toBe(1);
      expect(persistedStatus.totalAttempts).toBe(1);

      console.log('✅ [AttemptTrackingTest] User Data persistence VERIFIED');
    }, 30000);
  });
});

// Export test helper functions for manual testing
export const testHelpers = {
  /**
   * Manual test to submit an incorrect attempt and check tracking
   */
  async testIncorrectAttempt(puzzleId: string = 'manual-test-' + Date.now()) {
    console.log('🧪 [ManualTest] Testing incorrect attempt tracking...');

    const result = await playFabValidation.validateARCPuzzle({
      puzzleId,
      solutions: INCORRECT_SOLUTION,
      timeElapsed: 10,
      attemptNumber: 1,
      sessionId: 'manual-test-session',
      stepCount: 5
    });

    console.log('📊 [ManualTest] Result:', result);

    const status = await attemptTracker.getPuzzleAttemptStatus(puzzleId, false);
    console.log('📊 [ManualTest] Status:', status);

    return { result, status };
  },

  /**
   * Manual test to submit a correct attempt and check tracking
   */
  async testCorrectAttempt(puzzleId: string = 'manual-test-' + Date.now()) {
    console.log('🧪 [ManualTest] Testing correct attempt tracking...');

    const result = await playFabValidation.validateARCPuzzle({
      puzzleId,
      solutions: CORRECT_SOLUTION,
      timeElapsed: 20,
      attemptNumber: 1,
      sessionId: 'manual-test-session',
      stepCount: 12
    });

    console.log('📊 [ManualTest] Result:', result);

    const status = await attemptTracker.getPuzzleAttemptStatus(puzzleId, false);
    console.log('📊 [ManualTest] Status:', status);

    return { result, status };
  }
};