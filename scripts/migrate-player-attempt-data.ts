/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Data migration script for existing players to initialize their puzzle attempt data.
 * Creates empty attempt tracking data structure for all existing players.
 * Uses PlayFab Server API with admin keys for direct data manipulation.
 * SRP and DRY check: Pass - Single responsibility for migrating existing player data
 *
 */

import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PlayFab Configuration
const PLAYFAB_TITLE_ID = process.env.VITE_PLAYFAB_TITLE_ID || '';
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY || '';
const PLAYFAB_SERVER_BASE_URL = `https://${PLAYFAB_TITLE_ID}.playfabapi.com`;

// Results tracking
const RESULTS_FILE = join(__dirname, '..', 'docs', 'migration-attempt-data-results.json');

interface PlayerInfo {
  PlayFabId: string;
  DisplayName: string;
  Created: string;
  LastLogin: string;
}

interface MigrationResult {
  PlayFabId: string;
  DisplayName: string;
  success: boolean;
  error?: string;
  hadExistingData: boolean;
  dataCreated: boolean;
}

interface MigrationSummary {
  startTime: string;
  endTime: string;
  totalPlayers: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  results: MigrationResult[];
  errors: string[];
}

/**
 * Get all players from PlayFab using Server API
 */
async function getAllPlayers(maxResults: number = 10000): Promise<PlayerInfo[]> {
  console.log('🔍 Fetching all players from PlayFab...');

  try {
    const requestData = {
      MaxResultsCount: maxResults
    };

    const response = await fetch(`${PLAYFAB_SERVER_BASE_URL}/Server/GetAllUsersCharacters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(`PlayFab error: ${result.error || result.errorMessage || 'Unknown error'}`);
    }

    // Try a different endpoint for user list
    const userListRequest = {};
    const userListResponse = await fetch(`${PLAYFAB_SERVER_BASE_URL}/Admin/GetAllSegments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(userListRequest)
    });

    // Let's try GetLeaderboard to get players instead
    const leaderboardRequest = {
      StatisticName: 'OfficerTrackPoints',
      StartPosition: 0,
      MaxResultsCount: maxResults
    };

    const leaderboardResponse = await fetch(`${PLAYFAB_SERVER_BASE_URL}/Server/GetLeaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(leaderboardRequest)
    });

    if (!leaderboardResponse.ok) {
      throw new Error(`Leaderboard HTTP ${leaderboardResponse.status}: ${leaderboardResponse.statusText}`);
    }

    const leaderboardResult = await leaderboardResponse.json();
    if (leaderboardResult.code !== 200) {
      throw new Error(`Leaderboard PlayFab error: ${leaderboardResult.error || leaderboardResult.errorMessage || 'Unknown error'}`);
    }

    const players: PlayerInfo[] = leaderboardResult.data?.Leaderboard?.map((entry: any) => ({
      PlayFabId: entry.PlayFabId,
      DisplayName: entry.DisplayName || 'Unknown',
      Created: 'Unknown',
      LastLogin: 'Unknown'
    })) || [];

    console.log(`✅ Found ${players.length} players from leaderboard`);
    return players;

  } catch (error) {
    console.error('❌ Failed to fetch players:', error);
    throw error;
  }
}

/**
 * Check if player already has attempt tracking data
 */
async function getPlayerAttemptData(playFabId: string): Promise<any> {
  try {
    const requestData = {
      PlayFabId: playFabId,
      Keys: ['puzzleAttemptData']
    };

    const response = await fetch(`${PLAYFAB_SERVER_BASE_URL}/Server/GetUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(`PlayFab error: ${result.error || result.errorMessage || 'Unknown error'}`);
    }

    return result.data?.Data?.puzzleAttemptData?.Value || null;

  } catch (error) {
    console.warn(`⚠️ Could not get attempt data for ${playFabId}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Initialize empty attempt tracking data for a player
 */
async function initializePlayerAttemptData(playFabId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Create empty attempt tracking structure
    const emptyAttemptData = {
      puzzles: {},
      lastUpdated: new Date().toISOString(),
      migrationDate: new Date().toISOString(),
      version: '1.0'
    };

    const requestData = {
      PlayFabId: playFabId,
      Data: {
        puzzleAttemptData: JSON.stringify(emptyAttemptData)
      }
    };

    const response = await fetch(`${PLAYFAB_SERVER_BASE_URL}/Server/UpdateUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(`PlayFab error: ${result.error || result.errorMessage || 'Unknown error'}`);
    }

    return { success: true };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Process migration for a single player
 */
async function migratePlayerData(player: PlayerInfo): Promise<MigrationResult> {
  console.log(`   Processing ${player.DisplayName} (${player.PlayFabId})...`);

  const result: MigrationResult = {
    PlayFabId: player.PlayFabId,
    DisplayName: player.DisplayName,
    success: false,
    hadExistingData: false,
    dataCreated: false
  };

  try {
    // Check if player already has attempt data
    const existingData = await getPlayerAttemptData(player.PlayFabId);

    if (existingData) {
      console.log(`   ✅ ${player.DisplayName}: Already has attempt data, skipping`);
      result.success = true;
      result.hadExistingData = true;
      return result;
    }

    // Initialize empty attempt data
    const initResult = await initializePlayerAttemptData(player.PlayFabId);

    if (initResult.success) {
      console.log(`   ✅ ${player.DisplayName}: Attempt data initialized`);
      result.success = true;
      result.dataCreated = true;
    } else {
      console.log(`   ❌ ${player.DisplayName}: Failed to initialize - ${initResult.error}`);
      result.error = initResult.error;
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ❌ ${player.DisplayName}: Migration failed - ${errorMsg}`);
    result.error = errorMsg;
  }

  return result;
}

/**
 * Sleep utility for rate limiting
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main migration function
 */
async function runAttemptDataMigration(options: {
  dryRun?: boolean;
  limit?: number;
  delayMs?: number;
}): Promise<MigrationSummary> {
  const startTime = new Date().toISOString();
  console.log('🚀 Starting Player Attempt Data Migration');
  console.log('==========================================');
  console.log(`Configuration:`);
  console.log(`   - Dry run: ${options.dryRun ? 'YES' : 'NO'}`);
  console.log(`   - Limit: ${options.limit || 'ALL'} players`);
  console.log(`   - Delay: ${options.delayMs || 1000}ms between players`);

  const summary: MigrationSummary = {
    startTime,
    endTime: '',
    totalPlayers: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
    errors: []
  };

  try {
    // Get all players
    let players = await getAllPlayers();
    summary.totalPlayers = players.length;

    // Apply limit if specified
    if (options.limit) {
      players = players.slice(0, options.limit);
      console.log(`🎯 Limited to first ${options.limit} players`);
    }

    if (options.dryRun) {
      console.log(`\n🧪 DRY RUN - Would process ${players.length} players`);
      summary.skipped = players.length;
      summary.endTime = new Date().toISOString();
      return summary;
    }

    // Process each player
    console.log(`\n🔄 Processing ${players.length} players...`);

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const progressPercent = ((i + 1) / players.length * 100).toFixed(1);

      console.log(`\n[${i + 1}/${players.length}] (${progressPercent}%)`);

      const result = await migratePlayerData(player);
      summary.results.push(result);
      summary.processed++;

      if (result.success) {
        if (result.hadExistingData) {
          summary.skipped++;
        } else {
          summary.successful++;
        }
      } else {
        summary.failed++;
        if (result.error) {
          summary.errors.push(`${player.DisplayName}: ${result.error}`);
        }
      }

      // Rate limiting (except for last player)
      if (i < players.length - 1) {
        await sleep(options.delayMs || 1000);
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Migration failed:', errorMsg);
    summary.errors.push(`Migration failed: ${errorMsg}`);
  }

  summary.endTime = new Date().toISOString();
  return summary;
}

/**
 * Print migration report
 */
function printMigrationReport(summary: MigrationSummary): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ATTEMPT DATA MIGRATION REPORT');
  console.log('='.repeat(80));

  console.log(`🎯 Total players found: ${summary.totalPlayers}`);
  console.log(`🔄 Players processed: ${summary.processed}`);
  console.log(`✅ Successfully migrated: ${summary.successful}`);
  console.log(`⏭️ Already had data (skipped): ${summary.skipped}`);
  console.log(`❌ Failed: ${summary.failed}`);

  const executionTime = new Date(summary.endTime).getTime() - new Date(summary.startTime).getTime();
  console.log(`⏱️ Total execution time: ${(executionTime / 1000 / 60).toFixed(1)} minutes`);

  if (summary.successful > 0) {
    console.log(`📈 Success rate: ${((summary.successful / summary.processed) * 100).toFixed(1)}%`);
  }

  if (summary.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    summary.errors.slice(0, 10).forEach(error => console.log(`   ${error}`));
    if (summary.errors.length > 10) {
      console.log(`   ... and ${summary.errors.length - 10} more errors`);
    }
  }

  // Save detailed results
  try {
    writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2));
    console.log(`\n📁 Detailed results saved to: ${RESULTS_FILE}`);
  } catch (error) {
    console.error('⚠️ Failed to save results file:', error);
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const options = {
    dryRun: args.includes('--dry-run'),
    limit: undefined as number | undefined,
    delayMs: 1000
  };

  // Parse --limit
  const limitIndex = args.findIndex(arg => arg === '--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
  }

  // Parse --delay
  const delayIndex = args.findIndex(arg => arg === '--delay');
  if (delayIndex !== -1 && args[delayIndex + 1]) {
    options.delayMs = parseInt(args[delayIndex + 1], 10);
  }

  // Validate environment
  if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   VITE_PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY must be set');
    process.exit(1);
  }

  try {
    // Run the migration
    const summary = await runAttemptDataMigration(options);

    // Print report
    printMigrationReport(summary);

    // Exit with appropriate code
    const exitCode = summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(console.error);

export {
  runAttemptDataMigration,
  getAllPlayers,
  type MigrationSummary
};