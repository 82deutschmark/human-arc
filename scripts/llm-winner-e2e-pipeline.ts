/**
 * Authored by: Cascade using Gemini 2.5 Pro
 * Date: 2025-09-15T19:27:02-04:00
 * PURPOSE: End-to-end LLM winner detection and PlayFab upload pipeline
 * Reusable for any puzzle ID - designed for processing 2000+ puzzles
 * Combines winner detection + direct PlayFab Server API upload
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API Configuration
const ARC_EXPLAINER_BASE_URL = 'https://arc-explainer-production.up.railway.app';
const PLAYFAB_TITLE_ID = process.env.VITE_PLAYFAB_TITLE_ID || '';
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY || '';
const PLAYFAB_SERVER_BASE_URL = `https://${PLAYFAB_TITLE_ID}.playfabapi.com`;

// PlayFab model mappings
let AI_MODEL_MAPPINGS: Record<string, any> = {};
let REGISTERED_MODEL_KEYS: Set<string> = new Set();

interface ExplanationRecord {
  id: number;
  puzzleId: string;
  modelName: string;
  isPredictionCorrect: boolean;
  confidence: number;
  createdAt: string;
  patternDescription?: string;
  solvingStrategy?: string;
  apiProcessingTimeMs?: number;
}

interface ModelWinner {
  modelName: string;
  puzzleId: string;
  solved: boolean;
  totalAttempts: number;
  correctAttempts: number;
  latestTimestamp: string;
  playFabRegistered: boolean;
  playFabMapping?: any;
  bestConfidence: number;
  basePoints: number;
  speedBonus: number;
  finalScore: number;
  fastestTimeMs?: number;
}

interface E2EResult {
  puzzleId: string;
  timestamp: string;
  totalModels: number;
  winnersFound: number;
  playFabUpdatesReady: number;
  successfulUploads: number;
  failedUploads: number;
  winners: ModelWinner[];
}

/**
 * Load PlayFab model mappings
 */
async function loadPlayFabMappings(): Promise<void> {
  try {
    const mappingsModule = await import('../client/src/constants/modelsPlayfab.js');
    AI_MODEL_MAPPINGS = mappingsModule.AI_MODEL_PLAYFAB_MAPPINGS;
    REGISTERED_MODEL_KEYS = new Set(Object.keys(AI_MODEL_MAPPINGS));
    console.log(`✅ Loaded ${REGISTERED_MODEL_KEYS.size} registered PlayFab models`);
  } catch (error) {
    console.error('❌ Failed to load PlayFab mappings:', error);
    throw error;
  }
}

/**
 * Calculate speed bonus: 10,000 points minus 1 per millisecond
 * Maximum bonus: 9,999 points (1ms), 0 bonus over 10 seconds
 */
function calculateSpeedBonus(timeInMs: number): number {
  if (timeInMs >= 10000) return 0;
  return Math.max(0, 10000 - timeInMs);
}

/**
 * Calculate final score for a model from correct attempts only
 */
function calculateModelScore(correctAttempts: ExplanationRecord[]): { basePoints: number; speedBonus: number; finalScore: number; fastestTimeMs?: number } {
  const basePoints = 10000;

  const successfulTimings = correctAttempts
    .map(e => e.apiProcessingTimeMs)
    .filter((t): t is number => typeof t === 'number' && t > 0);

  if (successfulTimings.length === 0) {
    return { basePoints, speedBonus: 0, finalScore: basePoints };
  }

  const fastestTimeMs = Math.min(...successfulTimings);
  const speedBonus = calculateSpeedBonus(fastestTimeMs);

  return {
    basePoints,
    speedBonus,
    finalScore: basePoints + speedBonus,
    fastestTimeMs
  };
}

/**
 * Fetch explanations from arc-explainer API
 */
async function fetchExplanations(puzzleId: string): Promise<ExplanationRecord[]> {
  const url = `${ARC_EXPLAINER_BASE_URL}/api/puzzle/${puzzleId}/explanations`;
  console.log(`🌐 Fetching explanations: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  let explanations: ExplanationRecord[] = [];

  if (data?.success && Array.isArray(data?.data)) {
    explanations = data.data;
  } else if (Array.isArray(data)) {
    explanations = data;
  }

  console.log(`📊 Found ${explanations.length} total explanations`);
  return explanations;
}

/**
 * Detect winners from explanations (only models with correct predictions)
 */
function detectWinners(explanations: ExplanationRecord[], puzzleId: string): ModelWinner[] {
  console.log(`🔍 Detecting winners from ${explanations.length} explanations...`);

  const modelGroups = new Map<string, ExplanationRecord[]>();
  for (const explanation of explanations) {
    if (!modelGroups.has(explanation.modelName)) {
      modelGroups.set(explanation.modelName, []);
    }
    modelGroups.get(explanation.modelName)!.push(explanation);
  }

  const winners: ModelWinner[] = [];

  for (const [modelName, modelExplanations] of modelGroups) {
    const correctAttempts = modelExplanations.filter(e => e.isPredictionCorrect === true);
    const solved = correctAttempts.length > 0;

    // Only process models that actually solved the puzzle
    if (!solved) continue;

    const bestConfidence = Math.max(...modelExplanations.map(e => e.confidence || 0));
    const latestTimestamp = modelExplanations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      .createdAt;

    const isRegistered = REGISTERED_MODEL_KEYS.has(modelName);
    const playFabMapping = isRegistered ? AI_MODEL_MAPPINGS[modelName] : undefined;

    const scoring = calculateModelScore(correctAttempts);

    winners.push({
      modelName,
      puzzleId,
      solved,
      totalAttempts: modelExplanations.length,
      correctAttempts: correctAttempts.length,
      latestTimestamp,
      playFabRegistered: isRegistered,
      playFabMapping,
      bestConfidence,
      basePoints: scoring.basePoints,
      speedBonus: scoring.speedBonus,
      finalScore: scoring.finalScore,
      fastestTimeMs: scoring.fastestTimeMs
    });
  }

  console.log(`🏆 Found ${winners.length} winners from ${modelGroups.size} unique models`);
  return winners;
}

/**
 * Upload a single winner to PlayFab using direct Server API
 */
async function uploadWinnerToPlayFab(winner: ModelWinner): Promise<{ success: boolean; error?: string }> {
  if (!winner.playFabRegistered || !winner.playFabMapping) {
    return { success: false, error: 'Model not registered in PlayFab' };
  }

  try {
    const requestData = {
      PlayFabId: winner.playFabMapping.playFabId,
      Statistics: [
        {
          StatisticName: 'OfficerTrackPoints',
          Value: winner.finalScore
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(`PlayFab error: ${result.error || result.errorMessage || 'Unknown error'}`);
    }

    console.log(`   ✅ ${winner.modelName}: ${winner.finalScore} points uploaded`);
    return { success: true };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ ${winner.modelName}: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Process a single puzzle end-to-end: detect winners + upload to PlayFab
 */
async function processPuzzleE2E(puzzleId: string): Promise<E2EResult> {
  console.log(`\n🚀 Processing puzzle E2E: ${puzzleId}`);

  // Step 1: Fetch explanations
  const explanations = await fetchExplanations(puzzleId);
  if (explanations.length === 0) {
    console.warn(`⚠️ No explanations found for puzzle ${puzzleId}`);
    return {
      puzzleId,
      timestamp: new Date().toISOString(),
      totalModels: 0,
      winnersFound: 0,
      playFabUpdatesReady: 0,
      successfulUploads: 0,
      failedUploads: 0,
      winners: []
    };
  }

  // Step 2: Detect winners
  const winners = detectWinners(explanations, puzzleId);
  const registeredWinners = winners.filter(w => w.playFabRegistered);

  console.log(`📊 Winners: ${winners.length} total, ${registeredWinners.length} registered in PlayFab`);

  // Step 3: Upload to PlayFab
  let successfulUploads = 0;
  let failedUploads = 0;

  if (registeredWinners.length > 0) {
    console.log(`\n📤 Uploading ${registeredWinners.length} winners to PlayFab...`);
    
    for (let i = 0; i < registeredWinners.length; i++) {
      const winner = registeredWinners[i];
      console.log(`[${i + 1}/${registeredWinners.length}] ${winner.modelName} (${winner.finalScore} points)`);
      
      const result = await uploadWinnerToPlayFab(winner);
      if (result.success) {
        successfulUploads++;
      } else {
        failedUploads++;
      }

      // Rate limiting
      if (i < registeredWinners.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  const result: E2EResult = {
    puzzleId,
    timestamp: new Date().toISOString(),
    totalModels: new Set(explanations.map(e => e.modelName)).size,
    winnersFound: winners.length,
    playFabUpdatesReady: registeredWinners.length,
    successfulUploads,
    failedUploads,
    winners
  };

  // Save results
  const outputFile = join(__dirname, '..', 'docs', `e2e-results-${puzzleId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(outputFile, JSON.stringify(result, null, 2));

  console.log(`\n📊 E2E PIPELINE SUMMARY:`);
  console.log(`   Puzzle: ${result.puzzleId}`);
  console.log(`   Models analyzed: ${result.totalModels}`);
  console.log(`   Winners found: ${result.winnersFound}`);
  console.log(`   PlayFab uploads: ${result.successfulUploads}/${result.playFabUpdatesReady} successful`);
  console.log(`   Results saved: ${outputFile}`);

  return result;
}

/**
 * Main execution - accepts puzzle ID as command line argument
 */
async function main() {
  console.log('🚀 Starting E2E LLM Winner Pipeline...');

  // Validate environment
  if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
    console.error('❌ Missing required environment variables: VITE_PLAYFAB_TITLE_ID, PLAYFAB_SECRET_KEY');
    process.exit(1);
  }

  // Get puzzle ID from command line or use default
  const puzzleId = process.argv[2] || 'a699fb00';
  console.log(`🎯 Target puzzle: ${puzzleId}`);

  try {
    // Load PlayFab mappings
    await loadPlayFabMappings();

    // Run E2E pipeline
    const result = await processPuzzleE2E(puzzleId);

    if (result.successfulUploads > 0) {
      console.log(`\n🎉 SUCCESS: ${result.successfulUploads} AI models now have scores on PlayFab!`);
    } else {
      console.log(`\n⚠️ No models were successfully uploaded to PlayFab`);
    }

  } catch (error) {
    console.error('❌ E2E pipeline failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
