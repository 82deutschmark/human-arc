/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15T15:30:00-04:00
 * PURPOSE: Professional batch processing of all assessment puzzles through LLM analysis pipeline
 * Processes puzzles sequentially with comprehensive logging, error handling, and reporting
 * SRP and DRY check: Pass - Single responsibility for batch processing assessment puzzles
 *
 */

import { ASSESSMENT_PUZZLE_IDS } from '../client/src/constants/assessmentPuzzles';
import { triggerLLMAnalysis } from '../server/llm-analysis-endpoint';
import type { AnalysisResponse } from '../server/llm-analysis-endpoint';

interface BatchProcessingConfig {
  delayBetweenPuzzles: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  dryRun: boolean;
}

interface BatchResult {
  puzzleId: string;
  status: 'success' | 'failed' | 'skipped';
  response?: AnalysisResponse;
  error?: string;
  attemptNumber: number;
  executionTimeMs: number;
}

interface BatchSummary {
  totalPuzzles: number;
  successful: number;
  failed: number;
  skipped: number;
  totalExecutionTimeMs: number;
  results: BatchResult[];
}

const DEFAULT_CONFIG: BatchProcessingConfig = {
  delayBetweenPuzzles: 5000, // 5 seconds between puzzles
  maxRetries: 2,
  retryDelay: 10000, // 10 seconds between retries
  dryRun: false
};

/**
 * Sleep utility for rate limiting
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process a single puzzle with retry logic
 */
async function processPuzzleWithRetry(
  puzzleId: string,
  config: BatchProcessingConfig
): Promise<BatchResult> {
  console.log(`\n🎯 Processing puzzle: ${puzzleId}`);

  const startTime = Date.now();

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      if (config.dryRun) {
        console.log(`   📋 DRY RUN - Would process puzzle ${puzzleId} (attempt ${attempt})`);
        await sleep(1000); // Simulate processing time

        return {
          puzzleId,
          status: 'success',
          response: {
            success: true,
            message: 'DRY RUN - Analysis simulated successfully',
            puzzleId,
            executionTimeMs: 1000,
            winnersFound: Math.floor(Math.random() * 10) + 1
          },
          attemptNumber: attempt,
          executionTimeMs: Date.now() - startTime
        };
      }

      console.log(`   🔄 Attempt ${attempt}/${config.maxRetries + 1} for puzzle ${puzzleId}`);

      const response = await triggerLLMAnalysis({
        puzzleId,
        triggeredBy: `batch-assessment-${new Date().toISOString()}`
      });

      if (response.success) {
        console.log(`   ✅ Success: ${response.message} (${response.winnersFound || 0} winners found)`);
        return {
          puzzleId,
          status: 'success',
          response,
          attemptNumber: attempt,
          executionTimeMs: Date.now() - startTime
        };
      } else {
        console.log(`   ❌ Failed: ${response.message}`);
        if (attempt <= config.maxRetries) {
          console.log(`   ⏳ Retrying in ${config.retryDelay / 1000}s...`);
          await sleep(config.retryDelay);
        }
      }

    } catch (error: any) {
      console.log(`   💥 Exception on attempt ${attempt}: ${error.message}`);
      if (attempt <= config.maxRetries) {
        console.log(`   ⏳ Retrying in ${config.retryDelay / 1000}s...`);
        await sleep(config.retryDelay);
      }
    }
  }

  // All retries exhausted
  return {
    puzzleId,
    status: 'failed',
    error: 'All retry attempts exhausted',
    attemptNumber: config.maxRetries + 1,
    executionTimeMs: Date.now() - startTime
  };
}

/**
 * Process all assessment puzzles in batch
 */
async function processAssessmentBatch(config: BatchProcessingConfig = DEFAULT_CONFIG): Promise<BatchSummary> {
  const startTime = Date.now();
  const results: BatchResult[] = [];

  console.log('🚀 Starting Assessment Puzzle Batch Processing');
  console.log(`📊 Configuration:`);
  console.log(`   - Puzzles to process: ${ASSESSMENT_PUZZLE_IDS.length}`);
  console.log(`   - Delay between puzzles: ${config.delayBetweenPuzzles / 1000}s`);
  console.log(`   - Max retries per puzzle: ${config.maxRetries}`);
  console.log(`   - Retry delay: ${config.retryDelay / 1000}s`);
  console.log(`   - Dry run: ${config.dryRun ? 'YES' : 'NO'}`);
  console.log(`   - Puzzle IDs: ${ASSESSMENT_PUZZLE_IDS.join(', ')}`);

  for (let i = 0; i < ASSESSMENT_PUZZLE_IDS.length; i++) {
    const puzzleId = ASSESSMENT_PUZZLE_IDS[i];

    console.log(`\n📈 Progress: ${i + 1}/${ASSESSMENT_PUZZLE_IDS.length} puzzles`);

    const result = await processPuzzleWithRetry(puzzleId, config);
    results.push(result);

    // Add delay between puzzles (except for the last one)
    if (i < ASSESSMENT_PUZZLE_IDS.length - 1) {
      console.log(`   ⏳ Waiting ${config.delayBetweenPuzzles / 1000}s before next puzzle...`);
      await sleep(config.delayBetweenPuzzles);
    }
  }

  const totalTime = Date.now() - startTime;
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  const summary: BatchSummary = {
    totalPuzzles: ASSESSMENT_PUZZLE_IDS.length,
    successful,
    failed,
    skipped,
    totalExecutionTimeMs: totalTime,
    results
  };

  return summary;
}

/**
 * Print detailed batch processing report
 */
function printBatchReport(summary: BatchSummary): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 BATCH PROCESSING REPORT');
  console.log('='.repeat(70));

  console.log(`🎯 Total puzzles processed: ${summary.totalPuzzles}`);
  console.log(`✅ Successful: ${summary.successful}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⏭️  Skipped: ${summary.skipped}`);
  console.log(`⏱️  Total execution time: ${(summary.totalExecutionTimeMs / 1000).toFixed(1)}s`);
  console.log(`📈 Success rate: ${((summary.successful / summary.totalPuzzles) * 100).toFixed(1)}%`);

  if (summary.successful > 0) {
    const successfulWinners = summary.results
      .filter(r => r.status === 'success' && r.response?.winnersFound)
      .reduce((sum, r) => sum + (r.response?.winnersFound || 0), 0);

    console.log(`🏆 Total AI winners found: ${successfulWinners}`);
    console.log(`📊 Average winners per puzzle: ${(successfulWinners / summary.successful).toFixed(1)}`);
  }

  console.log('\n📋 DETAILED RESULTS:');
  summary.results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
    const time = (result.executionTimeMs / 1000).toFixed(1);
    const winners = result.response?.winnersFound ? ` (${result.response.winnersFound} winners)` : '';
    const attempts = result.attemptNumber > 1 ? ` [${result.attemptNumber} attempts]` : '';

    console.log(`   ${icon} ${result.puzzleId}: ${result.status} in ${time}s${winners}${attempts}`);

    if (result.error) {
      console.log(`      ⚠️  Error: ${result.error}`);
    }
  });

  if (summary.failed > 0) {
    console.log('\n🔍 FAILED PUZZLES FOR MANUAL INVESTIGATION:');
    summary.results
      .filter(r => r.status === 'failed')
      .forEach(result => {
        console.log(`   ❌ ${result.puzzleId}: ${result.error || 'Unknown error'}`);
      });
  }

  console.log('\n' + '='.repeat(70));
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const config: BatchProcessingConfig = { ...DEFAULT_CONFIG };

  if (args.includes('--dry-run')) {
    config.dryRun = true;
    console.log('🧪 DRY RUN MODE ENABLED - No actual processing will occur');
  }

  if (args.includes('--fast')) {
    config.delayBetweenPuzzles = 1000; // 1 second
    config.retryDelay = 3000; // 3 seconds
    console.log('⚡ FAST MODE ENABLED - Reduced delays');
  }

  if (args.includes('--patient')) {
    config.delayBetweenPuzzles = 15000; // 15 seconds
    config.retryDelay = 30000; // 30 seconds
    console.log('🐌 PATIENT MODE ENABLED - Extended delays for rate limiting');
  }

  const maxRetriesIndex = args.findIndex(arg => arg === '--max-retries');
  if (maxRetriesIndex !== -1 && args[maxRetriesIndex + 1]) {
    config.maxRetries = parseInt(args[maxRetriesIndex + 1]);
    console.log(`🔄 Max retries set to: ${config.maxRetries}`);
  }

  try {
    const summary = await processAssessmentBatch(config);
    printBatchReport(summary);

    // Exit with appropriate code
    const exitCode = summary.failed > 0 ? 1 : 0;
    if (exitCode !== 0) {
      console.log(`\n⚠️  Exiting with code ${exitCode} due to failed puzzles`);
    }
    process.exit(exitCode);

  } catch (error: any) {
    console.error('💥 Batch processing failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export {
  processAssessmentBatch,
  printBatchReport,
  type BatchProcessingConfig,
  type BatchSummary,
  type BatchResult
};