/**
 * Authored by: Cascade using Gemini 2.5 Pro
 * Date: 2025-09-15T18:21:38-04:00
 * PURPOSE: Direct PlayFab Server API upload of LLM winner statistics
 * Uses UpdatePlayerStatistics Server API for immediate score updates
 * SRP and DRY check: Pass - Single responsibility (statistics upload), no unnecessary complexity
 */

import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PlayFab API configuration
const PLAYFAB_TITLE_ID = process.env.VITE_PLAYFAB_TITLE_ID || ''; // Will need from .env
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY || ''; // Will need from .env
const PLAYFAB_SERVER_BASE_URL = `https://${PLAYFAB_TITLE_ID}.playfabapi.com`;

// Much faster rate limiting since we're not doing complex operations
const RATE_LIMIT_DELAY_MS = 500; // 0.5 seconds between direct API calls

interface LLMPlayerUpdate {
  modelName: string;
  customId: string;
  playFabId: string;
  provider: string;
  puzzleId: string;
  correct: boolean;
  finalScore: number;
  basePoints: number;
  speedBonus: number;
  timestamp: string;
  fastestTimeMs?: number;
  totalAttempts: number;
}

interface UploadResult {
  modelName: string;
  puzzleId: string;
  status: 'success' | 'error';
  finalScore?: number;
  error?: string;
  playFabResponse?: any;
}

interface UploadSummary {
  timestamp: string;
  totalRecords: number;
  successfulUploads: number;
  failedUploads: number;
  totalPointsAwarded: number;
  results: UploadResult[];
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load all LLM winner data from our generated files
 */
function loadAllWinnerData(): LLMPlayerUpdate[] {
  const docsDir = join(__dirname, '..', 'docs');
  const files = readdirSync(docsDir).filter(f => f.startsWith('winners-fixed-') && f.endsWith('.json'));

  console.log(`📂 Found ${files.length} winner data files to process`);

  const allUpdates: LLMPlayerUpdate[] = [];

  for (const file of files) {
    try {
      const filePath = join(docsDir, file);
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));

      console.log(`📄 Processing ${file}: ${data.winners?.length || 0} winners`);

      if (data.winners && Array.isArray(data.winners)) {
        for (const winner of data.winners) {
          if (winner.solved && winner.playFabRegistered && winner.playFabMapping) {
            allUpdates.push({
              modelName: winner.modelName,
              customId: winner.playFabMapping.customId,
              playFabId: winner.playFabMapping.playFabId,
              provider: winner.playFabMapping.provider,
              puzzleId: winner.puzzleId,
              correct: true,
              finalScore: winner.finalScore,
              basePoints: winner.basePoints,
              speedBonus: winner.speedBonus,
              timestamp: winner.latestTimestamp,
              fastestTimeMs: winner.fastestTimeMs,
              totalAttempts: winner.totalAttempts
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error);
    }
  }

  console.log(`✅ Loaded ${allUpdates.length} total LLM player updates`);
  return allUpdates;
}

/**
 * Direct Server API call to update player statistics
 * No login required - uses secret key authentication
 */
async function updatePlayerStatistics(update: LLMPlayerUpdate): Promise<UploadResult> {
  console.log(`🔄 Updating statistics: ${update.modelName} on ${update.puzzleId} (${update.finalScore} points)`);

  try {
    // Use PlayFab Server API to directly update statistics
    // No login simulation - just update the statistic directly
    const requestData = {
      PlayFabId: update.playFabId,
      Statistics: [
        {
          StatisticName: 'OfficerTrackPoints',
          Value: update.finalScore
        }
      ]
    };

    const response = await fetch(`${PLAYFAB_SERVER_BASE_URL}/Server/UpdatePlayerStatistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Server API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.code !== 200) {
      throw new Error(`PlayFab error: ${result.error || result.errorMessage || 'Unknown error'}`);
    }

    console.log(`   ✅ Statistics updated successfully for ${update.modelName}`);
    console.log(`   📊 OfficerTrackPoints set to: ${update.finalScore}`);

    return {
      modelName: update.modelName,
      puzzleId: update.puzzleId,
      status: 'success',
      finalScore: update.finalScore,
      playFabResponse: result.data
    };

  } catch (error) {
    console.error(`   ❌ Failed to update statistics for ${update.modelName} on ${update.puzzleId}:`, error);
    return {
      modelName: update.modelName,
      puzzleId: update.puzzleId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload all LLM player updates with rate limiting
 */
async function uploadAllUpdates(updates: LLMPlayerUpdate[]): Promise<UploadSummary> {
  console.log(`🚀 Starting direct PlayFab statistics update of ${updates.length} LLM players`);
  console.log(`⏱️ Rate limiting: ${RATE_LIMIT_DELAY_MS / 1000}s between API calls`);
  console.log(`📅 Estimated completion time: ${Math.round((updates.length * RATE_LIMIT_DELAY_MS) / 60000)} minutes`);

  const results: UploadResult[] = [];
  let successCount = 0;
  let totalPointsAwarded = 0;

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];

    console.log(`\n[${i + 1}/${updates.length}] Processing ${update.modelName} on ${update.puzzleId}`);

    const result = await updatePlayerStatistics(update);
    results.push(result);

    if (result.status === 'success') {
      successCount++;
      totalPointsAwarded += result.finalScore || 0;
    }

    // Rate limiting: Wait between direct API calls (except for the last one)
    if (i < updates.length - 1) {
      console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY_MS / 1000}s before next API call...`);
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  const summary: UploadSummary = {
    timestamp: new Date().toISOString(),
    totalRecords: updates.length,
    successfulUploads: successCount,
    failedUploads: updates.length - successCount,
    totalPointsAwarded,
    results
  };

  // Save detailed summary
  const summaryFile = join(__dirname, '..', 'docs', `playfab-statistics-update-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log('\n📊 STATISTICS UPDATE SUMMARY:');
  console.log(`   Total records: ${summary.totalRecords}`);
  console.log(`   Successful updates: ${summary.successfulUploads}`);
  console.log(`   Failed updates: ${summary.failedUploads}`);
  console.log(`   Success rate: ${((summary.successfulUploads / summary.totalRecords) * 100).toFixed(1)}%`);
  console.log(`   Total points awarded: ${summary.totalPointsAwarded.toLocaleString()}`);
  console.log(`   Summary saved to: ${summaryFile}`);

  if (summary.failedUploads > 0) {
    console.log('\n❌ FAILED UPDATES:');
    summary.results
      .filter(r => r.status === 'error')
      .forEach(result => {
        console.log(`   ${result.modelName} on ${result.puzzleId}: ${result.error}`);
      });
  }

  return summary;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting PlayFab direct statistics update process...');

  // Validate environment variables
  if (!PLAYFAB_TITLE_ID) {
    console.error('❌ VITE_PLAYFAB_TITLE_ID environment variable not set');
    process.exit(1);
  }

  if (!PLAYFAB_SECRET_KEY) {
    console.error('❌ PLAYFAB_SECRET_KEY environment variable not set');
    process.exit(1);
  }

  try {
    // Load all winner data from our generated files
    const updates = loadAllWinnerData();

    if (updates.length === 0) {
      console.warn('⚠️ No LLM player updates found to upload');
      return;
    }

    // Group by provider for reporting
    const providerCounts = updates.reduce((acc, update) => {
      acc[update.provider] = (acc[update.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 STATISTICS UPDATE BREAKDOWN BY PROVIDER:');
    Object.entries(providerCounts).forEach(([provider, count]) => {
      console.log(`   ${provider}: ${count} statistics to update`);
    });

    // Confirm before proceeding
    console.log('\n⚠️ About to update PlayFab statistics using direct Server API');
    console.log(`⚡ Much faster than previous approach: ${RATE_LIMIT_DELAY_MS / 1000}s delays between calls`);
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to proceed...');
    await sleep(3000);

    // Execute statistics updates
    const summary = await uploadAllUpdates(updates);

    if (summary.successfulUploads > 0) {
      console.log('\n🎉 Statistics update completed! LLM players should now appear on leaderboards.');
      console.log(`✅ ${summary.successfulUploads} AI models now have OfficerTrackPoints updated`);
      console.log('🏆 Check the PlayFab dashboard to see the updated leaderboards!');
    }

  } catch (error) {
    console.error('❌ Statistics update process failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);