/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: Batch process all 5 assessment puzzles for LLM winner detection
 * Processes each puzzle and generates comprehensive results for PlayFab integration
 * SRP and DRY check: Pass - Single responsibility (batch processing), reuses existing pipeline
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Assessment puzzle IDs from constants
const ASSESSMENT_PUZZLES = [
  'e7dd8335', // Easy answer, fill the bottom half of the symmetrical shape
  'fc754716', // Make the outline whatever the dot is
  'a699fb00', // Connect the dots
  'ea786f4a', // Make an X
  '66e6c45b'  // Expand!
];

interface BatchResult {
  puzzleId: string;
  status: 'success' | 'error';
  winnersFound: number;
  playFabUpdatesReady: number;
  error?: string;
  outputFile?: string;
}

interface BatchSummary {
  timestamp: string;
  totalPuzzles: number;
  successfulPuzzles: number;
  totalWinners: number;
  totalPlayFabUpdates: number;
  results: BatchResult[];
}

/**
 * Process a single puzzle using the fixed pipeline
 */
async function processSinglePuzzle(puzzleId: string): Promise<BatchResult> {
  console.log(`\n🚀 Processing puzzle: ${puzzleId}`);

  try {
    // Read the current fixed script
    const scriptPath = join(__dirname, 'llm-winner-pipeline-fixed.ts');

    // We need to modify the script to use this puzzleId
    // For now, we'll run the script and capture output
    const result = execSync(`npx tsx "${scriptPath}"`, {
      cwd: join(__dirname, '..'),
      encoding: 'utf-8',
      env: { ...process.env, PUZZLE_ID: puzzleId }
    });

    // Parse the output to extract key metrics
    const winnersMatch = result.match(/Winners found: (\d+)/);
    const playFabMatch = result.match(/PlayFab updates ready: (\d+)/);
    const outputFileMatch = result.match(/Results written to: (.+\.json)/);

    const winnersFound = winnersMatch ? parseInt(winnersMatch[1]) : 0;
    const playFabUpdatesReady = playFabMatch ? parseInt(playFabMatch[1]) : 0;
    const outputFile = outputFileMatch ? outputFileMatch[1] : undefined;

    console.log(`✅ Completed ${puzzleId}: ${winnersFound} winners, ${playFabUpdatesReady} PlayFab updates`);

    return {
      puzzleId,
      status: 'success',
      winnersFound,
      playFabUpdatesReady,
      outputFile
    };

  } catch (error) {
    console.error(`❌ Failed to process ${puzzleId}:`, error);
    return {
      puzzleId,
      status: 'error',
      winnersFound: 0,
      playFabUpdatesReady: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process all assessment puzzles in sequence
 */
async function processAllPuzzles(): Promise<BatchSummary> {
  console.log('🚀 Starting batch processing of all assessment puzzles...');
  console.log(`📊 Processing ${ASSESSMENT_PUZZLES.length} puzzles: ${ASSESSMENT_PUZZLES.join(', ')}`);

  const results: BatchResult[] = [];

  for (const puzzleId of ASSESSMENT_PUZZLES) {
    const result = await processSinglePuzzle(puzzleId);
    results.push(result);

    // Small delay between puzzles to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Calculate summary statistics
  const successfulPuzzles = results.filter(r => r.status === 'success').length;
  const totalWinners = results.reduce((sum, r) => sum + r.winnersFound, 0);
  const totalPlayFabUpdates = results.reduce((sum, r) => sum + r.playFabUpdatesReady, 0);

  const summary: BatchSummary = {
    timestamp: new Date().toISOString(),
    totalPuzzles: ASSESSMENT_PUZZLES.length,
    successfulPuzzles,
    totalWinners,
    totalPlayFabUpdates,
    results
  };

  // Write comprehensive summary
  const summaryFile = join(__dirname, '..', 'docs', `assessment-batch-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log('\n📊 BATCH PROCESSING SUMMARY:');
  console.log(`   Total puzzles: ${summary.totalPuzzles}`);
  console.log(`   Successful: ${summary.successfulPuzzles}`);
  console.log(`   Total winners found: ${summary.totalWinners}`);
  console.log(`   Total PlayFab updates ready: ${summary.totalPlayFabUpdates}`);
  console.log(`   Summary written to: ${summaryFile}`);

  // Show per-puzzle breakdown
  console.log('\n📋 PER-PUZZLE RESULTS:');
  results.forEach((result, index) => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${index + 1}. ${result.puzzleId}: ${status} ${result.winnersFound} winners, ${result.playFabUpdatesReady} updates`);
  });

  return summary;
}

/**
 * Main execution
 */
async function main() {
  try {
    const summary = await processAllPuzzles();

    if (summary.successfulPuzzles === summary.totalPuzzles) {
      console.log('\n🎉 All assessment puzzles processed successfully!');
      console.log(`✅ Ready for PlayFab integration with ${summary.totalPlayFabUpdates} total updates`);
    } else {
      console.log(`\n⚠️ ${summary.totalPuzzles - summary.successfulPuzzles} puzzles failed processing`);
      const failedPuzzles = summary.results.filter(r => r.status === 'error').map(r => r.puzzleId);
      console.log(`❌ Failed puzzles: ${failedPuzzles.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);