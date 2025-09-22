/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Manual test script to verify attempt tracking functionality.
 * This can be run from the browser console to test attempt tracking with real PlayFab integration.
 * SRP and DRY check: Pass - Single responsibility for manual testing of attempt tracking
 */

import { playFabValidation } from './validation';
import { attemptTracker } from './attemptTracker';
import { playFabAuthManager } from './authManager';

// Test configuration
const TEST_CONFIG = {
  PUZZLE_ID: 'manual-test-' + Date.now(),
  SESSION_ID: 'manual-session-' + Date.now(),
  INCORRECT_SOLUTION: [[[0, 0], [0, 0]]], // This should be incorrect for most puzzles
  CORRECT_SOLUTION: [[[1, 0], [0, 1]]], // This might be correct for some puzzles
};

/**
 * Run a comprehensive manual test of attempt tracking
 */
export async function runAttemptTrackingTest(): Promise<void> {
  console.log('🧪 [ManualAttemptTest] === STARTING MANUAL ATTEMPT TRACKING TEST ===');
  console.log('🧪 [ManualAttemptTest] Test configuration:', TEST_CONFIG);

  try {
    // Step 1: Verify authentication
    console.log('\n🔐 [ManualAttemptTest] Step 1: Checking authentication...');
    if (!playFabAuthManager.isAuthenticated()) {
      console.log('🔐 [ManualAttemptTest] Not authenticated, logging in as guest...');
      await playFabAuthManager.loginAsGuest();
      console.log('✅ [ManualAttemptTest] Successfully authenticated');
    } else {
      console.log('✅ [ManualAttemptTest] Already authenticated');
    }

    // Step 2: Check initial attempt status
    console.log('\n📊 [ManualAttemptTest] Step 2: Getting initial attempt status...');
    const initialStatus = await attemptTracker.getPuzzleAttemptStatus(TEST_CONFIG.PUZZLE_ID);
    console.log('📊 [ManualAttemptTest] Initial status:', initialStatus);

    // Step 3: Submit first incorrect attempt
    console.log('\n❌ [ManualAttemptTest] Step 3: Submitting FIRST incorrect attempt...');
    const firstAttemptResult = await playFabValidation.validateARCPuzzle({
      puzzleId: TEST_CONFIG.PUZZLE_ID,
      solutions: TEST_CONFIG.INCORRECT_SOLUTION,
      timeElapsed: 15,
      attemptNumber: 1,
      sessionId: TEST_CONFIG.SESSION_ID,
      stepCount: 5
    });
    console.log('📊 [ManualAttemptTest] First attempt result:', firstAttemptResult);

    // Step 4: Check status after first attempt
    console.log('\n🔍 [ManualAttemptTest] Step 4: Checking status after first attempt...');
    const statusAfterFirst = await attemptTracker.getPuzzleAttemptStatus(TEST_CONFIG.PUZZLE_ID, false);
    console.log('📊 [ManualAttemptTest] Status after first attempt:', statusAfterFirst);

    // Step 5: Submit second incorrect attempt
    console.log('\n❌ [ManualAttemptTest] Step 5: Submitting SECOND incorrect attempt...');
    const secondAttemptResult = await playFabValidation.validateARCPuzzle({
      puzzleId: TEST_CONFIG.PUZZLE_ID,
      solutions: TEST_CONFIG.INCORRECT_SOLUTION,
      timeElapsed: 25,
      attemptNumber: 2,
      sessionId: TEST_CONFIG.SESSION_ID,
      stepCount: 8
    });
    console.log('📊 [ManualAttemptTest] Second attempt result:', secondAttemptResult);

    // Step 6: Check final status (should be locked)
    console.log('\n🔍 [ManualAttemptTest] Step 6: Checking final status (should be locked)...');
    const finalStatus = await attemptTracker.getPuzzleAttemptStatus(TEST_CONFIG.PUZZLE_ID, false);
    console.log('📊 [ManualAttemptTest] Final status:', finalStatus);

    // Step 7: Try to submit third attempt (should be blocked)
    console.log('\n🚫 [ManualAttemptTest] Step 7: Trying to submit third attempt (should be blocked)...');
    const blockedAttemptResult = await playFabValidation.validateARCPuzzle({
      puzzleId: TEST_CONFIG.PUZZLE_ID,
      solutions: TEST_CONFIG.CORRECT_SOLUTION, // Even correct solution should be blocked
      timeElapsed: 35,
      attemptNumber: 3,
      sessionId: TEST_CONFIG.SESSION_ID,
      stepCount: 12
    });
    console.log('📊 [ManualAttemptTest] Blocked attempt result:', blockedAttemptResult);

    // Step 8: Verify results
    console.log('\n✅ [ManualAttemptTest] Step 8: Verifying test results...');
    const verificationResults = {
      initialStatusCorrect: initialStatus.status === 'available' && initialStatus.attemptsRemaining === 2,
      firstAttemptTracked: firstAttemptResult.success && !firstAttemptResult.correct && firstAttemptResult.attemptsRemaining === 1,
      statusUpdatedAfterFirst: statusAfterFirst.attemptsRemaining === 1 && statusAfterFirst.totalAttempts === 1,
      secondAttemptTracked: secondAttemptResult.success && !secondAttemptResult.correct && secondAttemptResult.locked,
      finalStatusLocked: finalStatus.status === 'locked' && finalStatus.attemptsRemaining === 0,
      thirdAttemptBlocked: !blockedAttemptResult.success && blockedAttemptResult.locked
    };

    console.log('📊 [ManualAttemptTest] Verification results:', verificationResults);

    const allTestsPassed = Object.values(verificationResults).every(result => result === true);

    if (allTestsPassed) {
      console.log('🎉 [ManualAttemptTest] === ALL TESTS PASSED! ATTEMPT TRACKING IS WORKING CORRECTLY ===');
    } else {
      console.error('❌ [ManualAttemptTest] === SOME TESTS FAILED! ATTEMPT TRACKING HAS ISSUES ===');
      console.error('❌ [ManualAttemptTest] Failed checks:',
        Object.entries(verificationResults).filter(([, result]) => result !== true)
      );
    }

    console.log('\n🏁 [ManualAttemptTest] === TEST COMPLETED ===');

  } catch (error) {
    console.error('❌ [ManualAttemptTest] Test failed with error:', error);
    throw error;
  }
}

/**
 * Test just incorrect attempt tracking
 */
export async function testIncorrectAttempt(): Promise<any> {
  console.log('🧪 [ManualAttemptTest] Testing single incorrect attempt...');

  const result = await playFabValidation.validateARCPuzzle({
    puzzleId: 'single-test-' + Date.now(),
    solutions: TEST_CONFIG.INCORRECT_SOLUTION,
    timeElapsed: 10,
    attemptNumber: 1,
    sessionId: 'single-test-session',
    stepCount: 3
  });

  console.log('📊 [ManualAttemptTest] Incorrect attempt result:', result);
  return result;
}

/**
 * Test CloudScript vs Fallback path detection
 */
export async function testValidationPath(): Promise<{ cloudScriptWorking: boolean; fallbackWorking: boolean; result: any }> {
  console.log('🧪 [ManualAttemptTest] Testing validation path (CloudScript vs Fallback)...');

  const result = await playFabValidation.validateARCPuzzle({
    puzzleId: 'path-test-' + Date.now(),
    solutions: TEST_CONFIG.INCORRECT_SOLUTION,
    timeElapsed: 5,
    attemptNumber: 1,
    sessionId: 'path-test-session',
    stepCount: 2
  });

  const cloudScriptWorking = !result.fallback;
  const fallbackWorking = result.fallback === true;

  console.log('📊 [ManualAttemptTest] Validation path result:', {
    cloudScriptWorking,
    fallbackWorking,
    usingFallback: result.fallback,
    result
  });

  return { cloudScriptWorking, fallbackWorking, result };
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).attemptTrackingTest = {
    runAttemptTrackingTest,
    testIncorrectAttempt,
    testValidationPath,
    config: TEST_CONFIG
  };

  console.log('🧪 [ManualAttemptTest] Manual test functions available globally:');
  console.log('🧪   window.attemptTrackingTest.runAttemptTrackingTest() - Run full test');
  console.log('🧪   window.attemptTrackingTest.testIncorrectAttempt() - Test single incorrect attempt');
  console.log('🧪   window.attemptTrackingTest.testValidationPath() - Test validation path detection');
}