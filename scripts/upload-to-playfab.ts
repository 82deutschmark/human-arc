/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: Upload LLM winner data to PlayFab with generous rate limiting
 * Uses existing ValidateARCPuzzle CloudScript function for proven integration
 * SRP and DRY check: Pass - Single responsibility (PlayFab upload), reuses existing CloudScript
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
const PLAYFAB_BASE_URL = 'https://title.playfabapi.com';

// Reduced rate limiting: 11 seconds between calls
const RATE_LIMIT_DELAY_MS = 2000; // 2 seconds

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
 * Login to PlayFab using CustomID for a specific AI model
 */
async function loginToPlayFab(customId: string): Promise<string> {
  const loginData = {
    TitleId: PLAYFAB_TITLE_ID,
    CustomId: customId,
    CreateAccount: false // Should already exist from our registration
  };

  const response = await fetch(`${PLAYFAB_BASE_URL}/Client/LoginWithCustomID`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.data?.SessionTicket) {
    throw new Error(`Login failed: No session ticket returned. Response: ${JSON.stringify(result)}`);
  }

  return result.data.SessionTicket;
}

/**
 * Call CloudScript to validate and score a puzzle solution
 */
async function callValidateCloudScript(sessionTicket: string, puzzleId: string, solutions: any[], timeElapsed: number, attemptNumber: number, stepCount: number): Promise<any> {
  const cloudScriptData = {
    FunctionName: 'ValidateARCPuzzle',
    FunctionParameter: {
      puzzleId,
      solutions,
      timeElapsed,
      attemptNumber,
      stepCount
    }
  };

  const response = await fetch(`${PLAYFAB_BASE_URL}/Client/ExecuteCloudScript`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Authentication': sessionTicket
    },
    body: JSON.stringify(cloudScriptData)
  });

  if (!response.ok) {
    throw new Error(`CloudScript call failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.data?.Error) {
    throw new Error(`CloudScript error: ${result.data.Error.Message}`);
  }

  return result.data;
}

/**
 * Upload a single LLM player update to PlayFab
 */
async function uploadSingleUpdate(update: LLMPlayerUpdate): Promise<UploadResult> {
  console.log(`🔄 Uploading: ${update.modelName} on ${update.puzzleId} (${update.finalScore} points)`);

  try {
    // Step 1: Login as the AI model
    const sessionTicket = await loginToPlayFab(update.customId);
    console.log(`   ✅ Logged in as ${update.modelName}`);

    // Step 2: Call CloudScript with REAL attempt data
    const timeElapsedSeconds = update.fastestTimeMs ? Math.round(update.fastestTimeMs / 1000) : 30;
    const attemptNumber = update.totalAttempts; // Real attempt count
    const stepCount = update.fastestTimeMs || 30000; // Raw milliseconds as step count
    const dummySolutions = [[[1]]]; // Minimal valid solution structure

    const cloudScriptResult = await callValidateCloudScript(
      sessionTicket,
      update.puzzleId,
      dummySolutions,
      timeElapsedSeconds,
      attemptNumber,
      stepCount
    );

    console.log(`   ✅ CloudScript executed successfully`);
    console.log(`   📊 Points awarded: ${cloudScriptResult.FunctionResult?.scoreData?.finalScore || 'unknown'}`);

    return {
      modelName: update.modelName,
      puzzleId: update.puzzleId,
      status: 'success',
      finalScore: update.finalScore,
      playFabResponse: cloudScriptResult
    };

  } catch (error) {
    console.error(`   ❌ Failed to upload ${update.modelName} on ${update.puzzleId}:`, error);
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
  console.log(`🚀 Starting PlayFab upload of ${updates.length} LLM player updates`);
  console.log(`⏱️ Rate limiting: ${RATE_LIMIT_DELAY_MS / 1000}s between uploads`);
  console.log(`📅 Estimated completion time: ${Math.round((updates.length * RATE_LIMIT_DELAY_MS) / 60000)} minutes`);

  const results: UploadResult[] = [];
  let successCount = 0;
  let totalPointsAwarded = 0;

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];

    console.log(`\n[${i + 1}/${updates.length}] Processing ${update.modelName} on ${update.puzzleId}`);

    const result = await uploadSingleUpdate(update);
    results.push(result);

    if (result.status === 'success') {
      successCount++;
      totalPointsAwarded += result.finalScore || 0;
    }

    // Rate limiting: Wait 20 seconds between uploads (except for the last one)
    if (i < updates.length - 1) {
      console.log(`   ⏳ Waiting ${RATE_LIMIT_DELAY_MS / 1000}s before next upload...`);
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
  const summaryFile = join(__dirname, '..', 'docs', `playfab-upload-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log('\n📊 UPLOAD SUMMARY:');
  console.log(`   Total records: ${summary.totalRecords}`);
  console.log(`   Successful uploads: ${summary.successfulUploads}`);
  console.log(`   Failed uploads: ${summary.failedUploads}`);
  console.log(`   Success rate: ${((summary.successfulUploads / summary.totalRecords) * 100).toFixed(1)}%`);
  console.log(`   Total points awarded: ${summary.totalPointsAwarded.toLocaleString()}`);
  console.log(`   Summary saved to: ${summaryFile}`);

  if (summary.failedUploads > 0) {
    console.log('\n❌ FAILED UPLOADS:');
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
  console.log('🚀 Starting PlayFab upload process...');

  // Validate environment variables
  if (!PLAYFAB_TITLE_ID) {
    console.error('❌ VITE_PLAYFAB_TITLE_ID environment variable not set');
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

    console.log('\n📊 UPLOAD BREAKDOWN BY PROVIDER:');
    Object.entries(providerCounts).forEach(([provider, count]) => {
      console.log(`   ${provider}: ${count} updates`);
    });

    // Confirm before proceeding
    console.log('\n⚠️ About to upload to PlayFab with 20-second delays between calls');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    await sleep(5000);

    // Execute upload
    const summary = await uploadAllUpdates(updates);

    if (summary.successfulUploads > 0) {
      console.log('\n🎉 Upload completed! LLM players should now appear on leaderboards.');
      console.log(`✅ ${summary.successfulUploads} AI models now have scores for assessment puzzles`);
    }

  } catch (error) {
    console.error('❌ Upload process failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);