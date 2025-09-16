/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15T16:00:00-04:00
 * PURPOSE: Test processing of 3 puzzles to verify output and results
 * SRP and DRY check: Pass - Testing batch functionality with small sample
 *
 */

import { triggerLLMAnalysis } from '../server/llm-analysis-endpoint';

const TEST_PUZZLES = [
  'e7dd8335', // Easy answer, fill the bottom half of the symmetrical shape
  'fc754716', // Make the outline whatever the dot is
  'a699fb00', // Connect the dots
];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testThreePuzzles(): Promise<void> {
  console.log('🚀 TESTING 3 ASSESSMENT PUZZLES - REAL EXECUTION');
  console.log(`📊 Puzzles: ${TEST_PUZZLES.join(', ')}`);
  console.log('⏱️  Expected time: ~2-3 minutes\n');

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < TEST_PUZZLES.length; i++) {
    const puzzleId = TEST_PUZZLES[i];

    console.log(`\n📈 Progress: ${i + 1}/${TEST_PUZZLES.length}`);
    console.log(`🎯 Processing puzzle: ${puzzleId}`);

    const puzzleStartTime = Date.now();

    try {
      const result = await triggerLLMAnalysis({
        puzzleId,
        triggeredBy: `test-batch-${new Date().toISOString()}`
      });

      const executionTime = Date.now() - puzzleStartTime;

      if (result.success) {
        console.log(`   ✅ SUCCESS: ${result.message}`);
        console.log(`   🏆 Winners found: ${result.winnersFound || 'Unknown'}`);
        console.log(`   ⏱️  Execution time: ${(executionTime / 1000).toFixed(1)}s`);
      } else {
        console.log(`   ❌ FAILED: ${result.message}`);
        if (result.error) {
          console.log(`   💥 Error: ${result.error}`);
        }
      }

      results.push({
        puzzleId,
        success: result.success,
        winnersFound: result.winnersFound,
        executionTime
      });

    } catch (error: any) {
      console.log(`   💥 EXCEPTION: ${error.message}`);
      results.push({
        puzzleId,
        success: false,
        error: error.message,
        executionTime: Date.now() - puzzleStartTime
      });
    }

    // Wait between puzzles
    if (i < TEST_PUZZLES.length - 1) {
      console.log(`   ⏳ Waiting 3 seconds...`);
      await sleep(3000);
    }
  }

  const totalTime = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const totalWinners = results
    .filter(r => r.success && r.winnersFound)
    .reduce((sum, r) => sum + (r.winnersFound || 0), 0);

  console.log('\n' + '='.repeat(60));
  console.log('📊 3-PUZZLE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successful}/${TEST_PUZZLES.length}`);
  console.log(`🏆 Total AI winners uploaded to PlayFab: ${totalWinners}`);
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(1)}s`);

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const time = (result.executionTime / 1000).toFixed(1);
    const winners = result.winnersFound ? ` (${result.winnersFound} winners)` : '';
    console.log(`   ${icon} ${result.puzzleId}: ${time}s${winners}`);
  });

  console.log('\n🎉 3-PUZZLE TEST COMPLETE!');
  console.log('='.repeat(60));
}