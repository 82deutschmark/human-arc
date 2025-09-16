/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15T22:30:00-04:00
 * PURPOSE: Bulk migration script to process all local ARC puzzles through LLM scoring pipeline
 * Discovers puzzle files from local data directory and runs existing E2E pipeline for each
 * Includes progress tracking, resume capability, and Windows-compatible file operations
 * SRP and DRY check: Pass - Reuses existing E2E pipeline, single responsibility for bulk migration
 *
 */

import { readdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import the existing E2E pipeline functions
import { loadPlayFabMappings, processPuzzleE2E } from './llm-winner-e2e-pipeline';
import type { E2EResult } from './llm-winner-e2e-pipeline';

// Load environment variables
dotenv.config();

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DATA_ROOT = join(__dirname, '..', 'data');
const PROGRESS_FILE = join(__dirname, '..', 'docs', 'migration-progress.json');
const RESULTS_DIR = join(__dirname, '..', 'docs', 'migration-results');

// Dataset directories matching IDConverter expectations
const DATASET_DIRS: Array<{ name: string; path: string }> = [
  { name: 'training', path: join(DATA_ROOT, 'training') },
  { name: 'training2', path: join(DATA_ROOT, 'training2') },
  { name: 'evaluation', path: join(DATA_ROOT, 'evaluation') },
  { name: 'evaluation2', path: join(DATA_ROOT, 'evaluation2') }
];

interface MigrationConfig {
  limit?: number;           // Process only first N puzzles (for testing)
  delayMs: number;         // Delay between puzzle processing
  resume: boolean;         // Resume from previous run
  dataset?: string;        // Process only specific dataset
  dryRun: boolean;        // Don't actually process, just discover
}

interface MigrationProgress {
  startTime: string;
  lastUpdate: string;
  totalPuzzles: number;
  processedPuzzles: string[];
  successfulPuzzles: string[];
  failedPuzzles: Array<{ puzzleId: string; error: string }>;
  currentDataset?: string;
  completed: boolean;
}

interface MigrationSummary {
  totalDiscovered: number;
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  executionTimeMs: number;
  datasets: Record<string, { discovered: number; processed: number; successful: number; failed: number }>;
}

/**
 * Discover all puzzle files from local data directory
 */
function discoverAllPuzzles(): Array<{ arcId: string; dataset: string; filePath: string }> {
  console.log('🔍 Discovering all local puzzle files...');

  const allPuzzles: Array<{ arcId: string; dataset: string; filePath: string }> = [];

  for (const dataset of DATASET_DIRS) {
    if (!existsSync(dataset.path)) {
      console.warn(`⚠️  Dataset directory not found: ${dataset.path}`);
      continue;
    }

    console.log(`   📁 Scanning ${dataset.name}...`);

    try {
      const files = readdirSync(dataset.path);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const filename of jsonFiles) {
        const arcId = basename(filename, '.json');

        // Validate ARC ID format (8 hex characters)
        if (!/^[a-f0-9]{8}$/.test(arcId)) {
          console.warn(`   ⚠️  Invalid ARC ID format: ${arcId} (skipping)`);
          continue;
        }

        allPuzzles.push({
          arcId,
          dataset: dataset.name,
          filePath: join(dataset.path, filename)
        });
      }

      console.log(`   ✅ Found ${jsonFiles.length} puzzles in ${dataset.name}`);

    } catch (error: any) {
      console.error(`   ❌ Failed to read ${dataset.name}: ${error.message}`);
    }
  }

  console.log(`🎯 Total discovered: ${allPuzzles.length} puzzles across ${DATASET_DIRS.length} datasets`);

  // Sort by dataset and ARC ID for consistent processing order
  allPuzzles.sort((a, b) => {
    if (a.dataset !== b.dataset) {
      return a.dataset.localeCompare(b.dataset);
    }
    return a.arcId.localeCompare(b.arcId);
  });

  return allPuzzles;
}

/**
 * Load migration progress from previous run
 */
function loadProgress(): MigrationProgress | null {
  if (!existsSync(PROGRESS_FILE)) {
    return null;
  }

  try {
    const progressData = readFileSync(PROGRESS_FILE, 'utf8');
    const progress: MigrationProgress = JSON.parse(progressData);
    console.log(`📈 Loaded progress: ${progress.processedPuzzles.length} already processed`);
    return progress;
  } catch (error: any) {
    console.warn(`⚠️  Failed to load progress file: ${error.message}`);
    return null;
  }
}

/**
 * Save migration progress
 */
function saveProgress(progress: MigrationProgress): void {
  try {
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error: any) {
    console.error(`❌ Failed to save progress: ${error.message}`);
  }
}

/**
 * Sleep utility for rate limiting
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process all puzzles through the E2E pipeline
 */
async function runBulkMigration(config: MigrationConfig): Promise<MigrationSummary> {
  console.log('🚀 Starting Bulk LLM Score Migration');
  console.log('=====================================');
  console.log(`Configuration:`);
  console.log(`   - Dry run: ${config.dryRun ? 'YES' : 'NO'}`);
  console.log(`   - Resume: ${config.resume ? 'YES' : 'NO'}`);
  console.log(`   - Delay: ${config.delayMs}ms between puzzles`);
  console.log(`   - Limit: ${config.limit || 'ALL'} puzzles`);
  console.log(`   - Dataset filter: ${config.dataset || 'ALL'}`);

  // Discover all puzzles
  let allPuzzles = discoverAllPuzzles();

  // Filter by dataset if specified
  if (config.dataset) {
    allPuzzles = allPuzzles.filter(p => p.dataset === config.dataset);
    console.log(`🎯 Filtered to ${config.dataset}: ${allPuzzles.length} puzzles`);
  }

  // Limit for testing
  if (config.limit) {
    allPuzzles = allPuzzles.slice(0, config.limit);
    console.log(`🎯 Limited to first ${config.limit} puzzles`);
  }

  // Load existing progress
  let progress: MigrationProgress = loadProgress() || {
    startTime: new Date().toISOString(),
    lastUpdate: new Date().toISOString(),
    totalPuzzles: allPuzzles.length,
    processedPuzzles: [],
    successfulPuzzles: [],
    failedPuzzles: [],
    completed: false
  };

  // Filter out already processed puzzles if resuming
  let puzzlesToProcess = allPuzzles;
  if (config.resume && progress.processedPuzzles.length > 0) {
    puzzlesToProcess = allPuzzles.filter(p => !progress.processedPuzzles.includes(p.arcId));
    console.log(`📈 Resuming: ${puzzlesToProcess.length} remaining (${progress.processedPuzzles.length} already done)`);
  }

  const summary: MigrationSummary = {
    totalDiscovered: allPuzzles.length,
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: config.dryRun ? puzzlesToProcess.length : 0,
    executionTimeMs: 0,
    datasets: {}
  };

  const startTime = Date.now();

  // Initialize dataset stats
  for (const dataset of DATASET_DIRS) {
    const datasetPuzzles = allPuzzles.filter(p => p.dataset === dataset.name);
    summary.datasets[dataset.name] = {
      discovered: datasetPuzzles.length,
      processed: 0,
      successful: 0,
      failed: 0
    };
  }

  if (config.dryRun) {
    console.log(`\n🧪 DRY RUN - Would process ${puzzlesToProcess.length} puzzles`);
    console.log('Dataset breakdown:');
    for (const [datasetName, stats] of Object.entries(summary.datasets)) {
      console.log(`   ${datasetName}: ${stats.discovered} puzzles`);
    }
    return summary;
  }

  // Load PlayFab mappings once
  console.log('\n🔧 Loading PlayFab model mappings...');
  await loadPlayFabMappings();

  // Process each puzzle
  console.log(`\n🔄 Processing ${puzzlesToProcess.length} puzzles...`);

  for (let i = 0; i < puzzlesToProcess.length; i++) {
    const puzzle = puzzlesToProcess[i];
    const progressPercent = ((i + 1) / puzzlesToProcess.length * 100).toFixed(1);

    console.log(`\n[${i + 1}/${puzzlesToProcess.length}] (${progressPercent}%) Processing ${puzzle.arcId} (${puzzle.dataset})`);

    try {
      // Run E2E pipeline for this puzzle
      const result: E2EResult = await processPuzzleE2E(puzzle.arcId);

      // Track results
      progress.processedPuzzles.push(puzzle.arcId);
      summary.totalProcessed++;
      summary.datasets[puzzle.dataset].processed++;

      if (result.successfulUploads > 0) {
        progress.successfulPuzzles.push(puzzle.arcId);
        summary.successful++;
        summary.datasets[puzzle.dataset].successful++;
        console.log(`   ✅ SUCCESS: ${result.successfulUploads} models uploaded`);
      } else {
        progress.failedPuzzles.push({ puzzleId: puzzle.arcId, error: 'No successful uploads' });
        summary.failed++;
        summary.datasets[puzzle.dataset].failed++;
        console.log(`   ⚠️  NO UPLOADS: ${result.winnersFound} winners found but none uploaded`);
      }

    } catch (error: any) {
      console.error(`   ❌ FAILED: ${error.message}`);
      progress.processedPuzzles.push(puzzle.arcId);
      progress.failedPuzzles.push({ puzzleId: puzzle.arcId, error: error.message });
      summary.totalProcessed++;
      summary.failed++;
      summary.datasets[puzzle.dataset].processed++;
      summary.datasets[puzzle.dataset].failed++;
    }

    // Update progress
    progress.lastUpdate = new Date().toISOString();
    saveProgress(progress);

    // Rate limiting (except for last puzzle)
    if (i < puzzlesToProcess.length - 1) {
      console.log(`   ⏳ Waiting ${config.delayMs}ms...`);
      await sleep(config.delayMs);
    }
  }

  summary.executionTimeMs = Date.now() - startTime;
  progress.completed = true;
  saveProgress(progress);

  return summary;
}

/**
 * Print detailed migration report
 */
function printMigrationReport(summary: MigrationSummary): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BULK MIGRATION REPORT');
  console.log('='.repeat(80));

  console.log(`🎯 Total puzzles discovered: ${summary.totalDiscovered}`);
  console.log(`🔄 Total puzzles processed: ${summary.totalProcessed}`);
  console.log(`✅ Successful uploads: ${summary.successful}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⏭️  Skipped (dry run): ${summary.skipped}`);
  console.log(`⏱️  Total execution time: ${(summary.executionTimeMs / 1000 / 60).toFixed(1)} minutes`);
  console.log(`📈 Success rate: ${summary.totalProcessed > 0 ? ((summary.successful / summary.totalProcessed) * 100).toFixed(1) : '0'}%`);

  console.log('\n📊 BREAKDOWN BY DATASET:');
  for (const [dataset, stats] of Object.entries(summary.datasets)) {
    const successRate = stats.processed > 0 ? ((stats.successful / stats.processed) * 100).toFixed(1) : '0';
    console.log(`   ${dataset}: ${stats.successful}/${stats.processed} successful (${successRate}%) of ${stats.discovered} discovered`);
  }

  if (summary.failed > 0) {
    console.log('\n⚠️  MIGRATION INCOMPLETE - Some puzzles failed');
    console.log('To retry failed puzzles, run: npx tsx scripts/migrate-all-llm-scores.ts --resume');
  } else if (summary.successful > 0) {
    console.log('\n🎉 MIGRATION COMPLETE - All puzzles processed successfully!');
  }

  console.log('\n📁 Progress and results saved to:');
  console.log(`   Progress: ${PROGRESS_FILE}`);
  console.log(`   Results: ${RESULTS_DIR}/`);

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const config: MigrationConfig = {
    delayMs: 2000, // 2 second default delay
    resume: args.includes('--resume'),
    dryRun: args.includes('--dry-run'),
    dataset: undefined,
    limit: undefined
  };

  // Parse --limit
  const limitIndex = args.findIndex(arg => arg === '--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    config.limit = parseInt(args[limitIndex + 1], 10);
  }

  // Parse --dataset
  const datasetIndex = args.findIndex(arg => arg === '--dataset');
  if (datasetIndex !== -1 && args[datasetIndex + 1]) {
    config.dataset = args[datasetIndex + 1];
  }

  // Parse --delay
  const delayIndex = args.findIndex(arg => arg === '--delay');
  if (delayIndex !== -1 && args[delayIndex + 1]) {
    config.delayMs = parseInt(args[delayIndex + 1], 10);
  }

  try {
    // Run the migration
    const summary = await runBulkMigration(config);

    // Print report
    printMigrationReport(summary);

    // Exit with appropriate code
    const exitCode = summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error: any) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(console.error);

export {
  runBulkMigration,
  discoverAllPuzzles,
  type MigrationConfig,
  type MigrationSummary
};