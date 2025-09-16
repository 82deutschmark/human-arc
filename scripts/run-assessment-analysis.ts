/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15T15:35:00-04:00
 * PURPOSE: Simple runner script for assessment puzzle batch analysis using existing server endpoint batch function
 * Uses the triggerBatchLLMAnalysis function that's already implemented in llm-analysis-endpoint.ts
 * SRP and DRY check: Pass - Reuses existing batch functionality, single purpose runner
 *
 */

import { ASSESSMENT_PUZZLE_IDS } from '../client/src/constants/assessmentPuzzles';
import { triggerBatchLLMAnalysis } from '../server/llm-analysis-endpoint';

/**
 * Simple runner that uses the existing batch analysis function
 */
async function runAssessmentAnalysis(): Promise<void> {
  console.log('🚀 Starting Assessment Puzzle Analysis');
  console.log(`📊 Processing ${ASSESSMENT_PUZZLE_IDS.length} puzzles: ${ASSESSMENT_PUZZLE_IDS.join(', ')}`);
  console.log('⏳ This will take approximately 2-3 minutes...\n');

  const startTime = Date.now();

  try {
    // Use the existing batch analysis function
    const results = await triggerBatchLLMAnalysis(
      ASSESSMENT_PUZZLE_IDS,
      'assessment-batch-analysis'
    );

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    // Calculate summary statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalWinners = results
      .filter(r => r.success && r.winnersFound)
      .reduce((sum, r) => sum + (r.winnersFound || 0), 0);

    // Print detailed results
    console.log('\n' + '='.repeat(60));
    console.log('📊 ASSESSMENT ANALYSIS RESULTS');
    console.log('='.repeat(60));

    console.log(`🎯 Total puzzles: ${ASSESSMENT_PUZZLE_IDS.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🏆 Total AI winners found: ${totalWinners}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)}s`);
    console.log(`📈 Success rate: ${((successful / ASSESSMENT_PUZZLE_IDS.length) * 100).toFixed(1)}%`);

    if (successful > 0) {
      console.log(`📊 Average winners per successful puzzle: ${(totalWinners / successful).toFixed(1)}`);
    }

    console.log('\n📋 DETAILED BREAKDOWN:');
    results.forEach((result, index) => {
      const puzzleId = ASSESSMENT_PUZZLE_IDS[index];
      const icon = result.success ? '✅' : '❌';
      const time = result.executionTimeMs ? `${(result.executionTimeMs / 1000).toFixed(1)}s` : 'N/A';
      const winners = result.winnersFound ? ` (${result.winnersFound} winners)` : '';

      console.log(`   ${icon} ${puzzleId}: ${result.message} [${time}]${winners}`);

      if (!result.success && result.error) {
        console.log(`      ⚠️  Error: ${result.error}`);
      }
    });

    if (failed > 0) {
      console.log('\n🔍 FAILED PUZZLES (for manual retry):');
      results.forEach((result, index) => {
        if (!result.success) {
          const puzzleId = ASSESSMENT_PUZZLE_IDS[index];
          console.log(`   npx tsx scripts/llm-winner-e2e-pipeline.ts ${puzzleId}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));

    // Exit with appropriate code
    if (failed > 0) {
      console.log(`⚠️  Some puzzles failed. Exiting with code 1.`);
      process.exit(1);
    } else {
      console.log(`🎉 All puzzles processed successfully!`);
      process.exit(0);
    }

  } catch (error: any) {
    console.error('💥 Batch analysis failed:', error);
    console.log('\nTo retry individual puzzles manually:');
    ASSESSMENT_PUZZLE_IDS.forEach(puzzleId => {
      console.log(`   npx tsx scripts/llm-winner-e2e-pipeline.ts ${puzzleId}`);
    });
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runAssessmentAnalysis();
}

export { runAssessmentAnalysis };