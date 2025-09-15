/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: FIXED LLM winner detection pipeline with proper data source integration
 * Uses actual PlayFab mappings instead of hardcoded data - follows DRY and SRP principles
 * SRP and DRY check: Pass - Single responsibility (winner detection), uses existing constants
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Direct API base URL
const ARC_EXPLAINER_BASE_URL = 'https://arc-explainer-production.up.railway.app';

// PROPER APPROACH: Import actual PlayFab mappings as single source of truth
// Note: In Node.js script context, we'll load this dynamically to avoid import issues
let AI_MODEL_MAPPINGS: Record<string, any> = {};
let REGISTERED_MODEL_KEYS: Set<string> = new Set();

/**
 * Load PlayFab model mappings from the actual constants file
 * This is the CORRECT way - single source of truth
 */
async function loadPlayFabMappings(): Promise<void> {
  try {
    // Import the actual TypeScript module with mappings
    const mappingsModule = await import('../client/src/constants/modelsPlayfab.js');
    AI_MODEL_MAPPINGS = mappingsModule.AI_MODEL_PLAYFAB_MAPPINGS;
    REGISTERED_MODEL_KEYS = new Set(Object.keys(AI_MODEL_MAPPINGS));

    console.log(`✅ Loaded ${REGISTERED_MODEL_KEYS.size} registered PlayFab models from actual mappings`);

    // Show provider breakdown for verification
    const providerCount = new Map<string, number>();
    Object.values(AI_MODEL_MAPPINGS).forEach((mapping: any) => {
      const provider = mapping.provider;
      providerCount.set(provider, (providerCount.get(provider) || 0) + 1);
    });

    console.log('📊 Provider breakdown:', Object.fromEntries(providerCount));

  } catch (error) {
    console.error('❌ Failed to load PlayFab mappings:', error);
    console.error('💡 This likely means the TypeScript file needs to be compiled or path is wrong');
    throw error;
  }
}

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

interface ModelPuzzleResult {
  modelName: string;
  puzzleId: string;
  solved: boolean;
  totalAttempts: number;
  latestTimestamp: string;
  playFabRegistered: boolean;
  playFabMapping?: any; // Full mapping data if registered
  bestConfidence: number;
  basePoints: number;
  speedBonus: number;
  finalScore: number;
  fastestTimeMs?: number;
}

interface PipelineResult {
  puzzleId: string;
  timestamp: string;
  totalModels: number;
  winnersFound: number;
  playFabUpdatesReady: number;
  unregisteredWinners: number;
  winners: ModelPuzzleResult[];
}

/**
 * Calculate speed bonus using the correct logic:
 * ≤30 seconds: 10,000 bonus
 * Reduces by 1,000 per minute
 * 10+ minutes: 0 bonus
 */
function calculateSpeedBonus(timeInMs: number): number {
  const timeInMinutes = timeInMs / (1000 * 60);

  if (timeInMinutes <= 0.5) return 10000; // 30 seconds or less = 10,000 bonus
  if (timeInMinutes >= 10) return 0;      // 10+ minutes = no bonus

  return Math.max(0, 10000 - (Math.floor(timeInMinutes) * 1000));
}

/**
 * Calculate final score for a model (base + speed bonus)
 */
function calculateModelScore(explanations: ExplanationRecord[]): { basePoints: number; speedBonus: number; finalScore: number; fastestTimeMs?: number } {
  const basePoints = 10000; // Fixed base for solving puzzle

  // Find fastest response time (if any explanations have timing data)
  const timings = explanations
    .map(e => e.apiProcessingTimeMs)
    .filter(t => typeof t === 'number' && t > 0);

  if (timings.length === 0) {
    // No timing data available, base points only
    return { basePoints, speedBonus: 0, finalScore: basePoints };
  }

  const fastestTimeMs = Math.min(...timings);
  const speedBonus = calculateSpeedBonus(fastestTimeMs);

  return {
    basePoints,
    speedBonus,
    finalScore: basePoints + speedBonus,
    fastestTimeMs
  };
}

/**
 * Direct API call to arc-explainer
 */
async function fetchExplanations(puzzleId: string): Promise<ExplanationRecord[]> {
  const url = `${ARC_EXPLAINER_BASE_URL}/api/puzzle/${puzzleId}/explanations`;
  console.log(`🌐 Fetching explanations: ${url}`);

  try {
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

  } catch (error) {
    console.error(`❌ Failed to fetch explanations for ${puzzleId}:`, error);
    throw error;
  }
}

/**
 * Group explanations by model and detect winners using ACTUAL PlayFab data
 */
function detectWinners(explanations: ExplanationRecord[], puzzleId: string): ModelPuzzleResult[] {
  console.log(`🔍 Detecting winners from ${explanations.length} explanations...`);

  // Group by model name
  const modelGroups = new Map<string, ExplanationRecord[]>();

  for (const explanation of explanations) {
    if (!modelGroups.has(explanation.modelName)) {
      modelGroups.set(explanation.modelName, []);
    }
    modelGroups.get(explanation.modelName)!.push(explanation);
  }

  console.log(`📊 Found ${modelGroups.size} unique models`);

  // Analyze each model's performance using REAL PlayFab data
  const results: ModelPuzzleResult[] = [];

  for (const [modelName, modelExplanations] of modelGroups) {
    // Check if ANY attempt was successful
    const solved = modelExplanations.some(e => e.isPredictionCorrect);

    // Get best confidence and latest timestamp
    const bestConfidence = Math.max(...modelExplanations.map(e => e.confidence || 0));
    const latestTimestamp = modelExplanations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      .createdAt;

    // PROPER CHECK: Use actual PlayFab mappings
    const isRegistered = REGISTERED_MODEL_KEYS.has(modelName);
    const playFabMapping = isRegistered ? AI_MODEL_MAPPINGS[modelName] : undefined;

    // Calculate score (only matters for winners)
    let scoring = { basePoints: 0, speedBonus: 0, finalScore: 0, fastestTimeMs: undefined };
    if (solved) {
      scoring = calculateModelScore(modelExplanations);
    }

    const result: ModelPuzzleResult = {
      modelName,
      puzzleId,
      solved,
      totalAttempts: modelExplanations.length,
      latestTimestamp,
      playFabRegistered: isRegistered,
      playFabMapping,
      bestConfidence,
      basePoints: scoring.basePoints,
      speedBonus: scoring.speedBonus,
      finalScore: scoring.finalScore,
      fastestTimeMs: scoring.fastestTimeMs
    };

    results.push(result);
  }

  const winners = results.filter(r => r.solved);
  console.log(`🏆 Found ${winners.length} winners out of ${results.length} models`);

  return winners;
}

/**
 * Process a single puzzle through the complete pipeline
 */
async function processPuzzle(puzzleId: string): Promise<PipelineResult> {
  console.log(`\n🚀 Processing puzzle: ${puzzleId}`);

  try {
    // Stage 1: Fetch all explanations
    const explanations = await fetchExplanations(puzzleId);

    if (explanations.length === 0) {
      console.warn(`⚠️ No explanations found for puzzle ${puzzleId}`);
      return {
        puzzleId,
        timestamp: new Date().toISOString(),
        totalModels: 0,
        winnersFound: 0,
        playFabUpdatesReady: 0,
        unregisteredWinners: 0,
        winners: []
      };
    }

    // Stage 2: Detect winners using ACTUAL PlayFab data
    const winners = detectWinners(explanations, puzzleId);

    // Stage 3: Separate registered vs unregistered winners
    const registeredWinners = winners.filter(w => w.playFabRegistered);
    const unregisteredWinners = winners.filter(w => !w.playFabRegistered);

    console.log(`📊 Winner Analysis:`);
    console.log(`   Total models: ${new Set(explanations.map(e => e.modelName)).size}`);
    console.log(`   Winners found: ${winners.length}`);
    console.log(`   PlayFab-registered winners: ${registeredWinners.length}`);
    console.log(`   Unregistered winners: ${unregisteredWinners.length}`);

    // Show top registered winners
    if (registeredWinners.length > 0) {
      console.log(`\n🏆 PlayFab-Registered Winners (ready for update):`);
      registeredWinners
        .sort((a, b) => b.finalScore - a.finalScore)
        .forEach((winner, index) => {
          const timeDisplay = winner.fastestTimeMs
            ? `${(winner.fastestTimeMs / 1000).toFixed(1)}s`
            : 'no timing';
          const provider = winner.playFabMapping?.provider || 'Unknown';
          console.log(`   ${index + 1}. ${winner.modelName} (${provider}): ${winner.finalScore} points (base: ${winner.basePoints}, speed: ${winner.speedBonus}, time: ${timeDisplay})`);
        });
    }

    // Show unregistered winners (should be very few now)
    if (unregisteredWinners.length > 0) {
      console.log(`\n⚠️ Unregistered Winners (missing from PlayFab):`);
      unregisteredWinners
        .sort((a, b) => b.bestConfidence - a.bestConfidence)
        .slice(0, 5) // Top 5 only
        .forEach((winner, index) => {
          console.log(`   ${index + 1}. ${winner.modelName} (${winner.bestConfidence}% confidence) - NOT IN PLAYFAB MAPPINGS`);
        });
    }

    const result: PipelineResult = {
      puzzleId,
      timestamp: new Date().toISOString(),
      totalModels: new Set(explanations.map(e => e.modelName)).size,
      winnersFound: winners.length,
      playFabUpdatesReady: registeredWinners.length,
      unregisteredWinners: unregisteredWinners.length,
      winners
    };

    // Write results to file for analysis
    const outputFile = join(__dirname, '..', 'docs', `winners-fixed-${puzzleId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`📁 Results written to: ${outputFile}`);

    return result;

  } catch (error) {
    console.error(`❌ Failed to process puzzle ${puzzleId}:`, error);
    throw error;
  }
}

/**
 * Generate PlayFab update records for winners using REAL mapping data
 */
function generatePlayFabUpdates(winners: ModelPuzzleResult[]): any[] {
  const updates = winners
    .filter(w => w.solved && w.playFabRegistered)
    .map(winner => ({
      modelName: winner.modelName,
      customId: winner.playFabMapping?.customId,
      playFabId: winner.playFabMapping?.playFabId,
      provider: winner.playFabMapping?.provider,
      puzzleId: winner.puzzleId,
      correct: true,
      scoreData: {
        finalScore: winner.finalScore,
        basePoints: winner.basePoints,
        timeBonus: winner.speedBonus
      },
      timestamp: winner.latestTimestamp,
      metadata: {
        totalAttempts: winner.totalAttempts,
        bestConfidence: winner.bestConfidence,
        fastestTimeMs: winner.fastestTimeMs
      }
    }));

  console.log(`\n🎯 Generated ${updates.length} PlayFab update records with REAL mapping data`);
  return updates;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting FIXED LLM Winner Detection Pipeline...');

  try {
    // CRITICAL: Load actual PlayFab mappings first
    await loadPlayFabMappings();

    // Process the target puzzle
    const puzzleId = '66e6c45b'; // Fifth puzzle
    const result = await processPuzzle(puzzleId);

    // Generate PlayFab update records using REAL data
    const playFabUpdates = generatePlayFabUpdates(result.winners);

    console.log('\n📈 FIXED PIPELINE SUMMARY:');
    console.log(`   Puzzle: ${result.puzzleId}`);
    console.log(`   Models analyzed: ${result.totalModels}`);
    console.log(`   Winners found: ${result.winnersFound}`);
    console.log(`   PlayFab updates ready: ${result.playFabUpdatesReady}`);
    console.log(`   Unregistered winners: ${result.unregisteredWinners} (should be 0 or very few)`);
    console.log(`   Registration coverage: ${((result.playFabUpdatesReady / result.winnersFound) * 100).toFixed(1)}%`);

    if (playFabUpdates.length > 0) {
      console.log('\n✅ Ready for PlayFab integration with ACCURATE data!');
      console.log(`   ${playFabUpdates.length} models will receive points for solving ${puzzleId}`);
    } else {
      console.log('\n⚠️ No registered models solved this puzzle');
    }

    console.log('\n🎉 FIXED winner detection pipeline complete!');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);