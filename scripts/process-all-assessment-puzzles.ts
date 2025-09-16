/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15T15:45:00-04:00
 * PURPOSE: Process ALL assessment puzzles (active + commented) from assessmentPuzzles.ts
 * Sends real results to PlayFab using the LLM winner detection pipeline
 * SRP and DRY check: Pass - Single responsibility for comprehensive puzzle processing
 *
 */

import { triggerLLMAnalysis } from '../server/llm-analysis-endpoint';

// ALL puzzles from assessmentPuzzles.ts (active + commented out)
const ALL_ASSESSMENT_PUZZLES = [
  // Currently active puzzles
  'e7dd8335', // Easy answer, fill the bottom half of the symmetrical shape
  'fc754716', // Make the outline whatever the dot is
  'a699fb00', // Connect the dots
  'ea786f4a', // Make an X
  '66e6c45b', // Expand!

  // Previously commented out puzzles - NOW PROCESSING
  '22425bda', // 16x16 -> 1x6  Think of them as strings, the bottom string has priority order in the output
  'dc1df850', // Surround the specific cell
  '27a28665', // 7 Examples, 3 Tests!
  '3bdb4ada', // Make a little dot in each
  'e7639916', // Connect the dots! Large!
  '12eac192', // 8x8 and very confusing with complex rules...
  '3aa6fb7a', // Simple 7x7, make the shape a square by filling in the missing bit
  '0bb8deee', // Corral the shapes
  '32e9702f', // Easy answer, everything pulled to the left and change 0 to 5
  '7b80bb43', // Close the gates! Very Large and unusual size
  '1caeab9d', // Line them up!
  '87ab05b8', // 2/Red Fills up whatever quarter of the 4x4 grid it appears in, the rest remain 6
  'bc1d5164', // 5x7 -> 3x3 where the grid is a rectangle, where a set of 2x2 grids are divided, solve by welding
];

interface ProcessingResult {
  puzzleId: string;
  success: boolean;
  message: string;
  executionTimeMs: number;
  winnersFound?: number;
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processAllAssessmentPuzzles(): Promise<void> {
  console.log('🚀 PROCESSING ALL ASSESSMENT PUZZLES - REAL EXECUTION');
  console.log(`📊 Total puzzles to process: ${ALL_ASSESSMENT_PUZZLES.length}`);
  console.log(`🎯 Puzzle IDs: ${ALL_ASSESSMENT_PUZZLES.join(', ')}`);
  console.log('⏱️  Estimated time: 5-10 minutes with real PlayFab uploads\n');

  const startTime = Date.now();
  const results: ProcessingResult[] = [];

  for (let i = 0; i < ALL_ASSESSMENT_PUZZLES.length; i++) {
    const puzzleId = ALL_ASSESSMENT_PUZZLES[i];

    console.log(`\n📈 Progress: ${i + 1}/${ALL_ASSESSMENT_PUZZLES.length}`);
    console.log(`🎯 Processing puzzle: ${puzzleId}`);

    const puzzleStartTime = Date.now();

    try {
      const result = await triggerLLMAnalysis({
        puzzleId,
        triggeredBy: `comprehensive-batch-${new Date().toISOString()}`
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
        message: result.message,
        executionTimeMs: executionTime,
        winnersFound: result.winnersFound,
        error: result.error
      });

    } catch (error: any) {
      const executionTime = Date.now() - puzzleStartTime;
      console.log(`   💥 EXCEPTION: ${error.message}`);

      results.push({
        puzzleId,
        success: false,
        message: 'Processing exception occurred',
        executionTimeMs: executionTime,
        error: error.message
      });
    }

    // Rate limiting between puzzles
    if (i < ALL_ASSESSMENT_PUZZLES.length - 1) {
      console.log(`   ⏳ Waiting 3 seconds before next puzzle...`);
      await sleep(3000);
    }
  }

  const totalTime = Date.now() - startTime;

  // Generate comprehensive report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE ASSESSMENT PUZZLE PROCESSING REPORT');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalWinners = results
    .filter(r => r.success && r.winnersFound)
    .reduce((sum, r) => sum + (r.winnersFound || 0), 0);

  console.log(`🎯 Total puzzles processed: ${ALL_ASSESSMENT_PUZZLES.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🏆 Total AI winners uploaded to PlayFab: ${totalWinners}`);
  console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`📈 Success rate: ${((successful / ALL_ASSESSMENT_PUZZLES.length) * 100).toFixed(1)}%`);

  if (successful > 0) {
    console.log(`📊 Average winners per successful puzzle: ${(totalWinners / successful).toFixed(1)}`);
    console.log(`⚡ Average processing time per puzzle: ${(totalTime / ALL_ASSESSMENT_PUZZLES.length / 1000).toFixed(1)}s`);
  }

  console.log('\n📋 DETAILED RESULTS BY PUZZLE:');
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const time = (result.executionTimeMs / 1000).toFixed(1);
    const winners = result.winnersFound ? ` (${result.winnersFound} winners → PlayFab)` : '';

    console.log(`   ${icon} ${result.puzzleId}: ${result.success ? 'SUCCESS' : 'FAILED'} [${time}s]${winners}`);

    if (!result.success && result.error) {
      console.log(`      💥 Error: ${result.error}`);
    }
  });

  if (failed > 0) {
    console.log('\n🔧 FAILED PUZZLES - MANUAL RETRY COMMANDS:');
    results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(`   npx tsx scripts/llm-winner-e2e-pipeline.ts ${result.puzzleId}`);
      });
  }

  console.log('\n🎉 REAL PLAYFAB UPDATES COMPLETED!');
  console.log('📊 Check your PlayFab leaderboards to see the new AI model scores');
  console.log('='.repeat(80));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// ES Module compatible main execution check
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  processAllAssessmentPuzzles().catch(error => {
    console.error('💥 Batch processing failed:', error);
    process.exit(1);
  });
}

export { processAllAssessmentPuzzles, ALL_ASSESSMENT_PUZZLES };