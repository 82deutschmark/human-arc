/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: Fetch and analyze AI model explanations for specific puzzles
 * Extracts explanation data from arc-explainer API and prepares for PlayFab integration
 * SRP and DRY check: Pass - Single responsibility (explanation fetching), uses existing services
 */

import { arcExplainerClient, type ExplanationRecord } from '../client/src/services/core/arcExplainerClient';
import { idConverter } from '../client/src/services/idConverter';
import { AI_MODEL_PLAYFAB_MAPPINGS } from '../client/src/constants/modelsPlayfab';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface ProcessedExplanation {
  modelName: string;
  puzzleId: string;
  arcId: string;
  isPredictionCorrect: boolean;
  confidence: number;
  patternDescription: string;
  solvingStrategy: string;
  hints: string;
  predictedOutputGrid: any[][];
  createdAt: string;
  hasPlayFabMapping: boolean;
  playFabCustomId?: string;
  playFabId?: string;
  provider?: string;
  // Calculated fields for PlayFab integration
  basePoints: number;
  timeBonus: number;
  finalScore: number;
}

interface PuzzleExplanationSummary {
  puzzleId: string;
  arcId: string;
  totalExplanations: number;
  successfulExplanations: number;
  successRate: number;
  averageConfidence: number;
  modelsWithPlayFabMapping: number;
  modelsWithoutMapping: number;
  explanations: ProcessedExplanation[];
  modelBreakdown: {
    [provider: string]: {
      count: number;
      successCount: number;
      successRate: number;
      avgConfidence: number;
    };
  };
  unmappedModels: string[];
}

/**
 * Calculate PlayFab-compatible score for an explanation
 */
function calculatePlayFabScore(explanation: ExplanationRecord): { basePoints: number; timeBonus: number; finalScore: number } {
  // Base points: 10,000 for correct, 0 for incorrect (matches CloudScript logic)
  const basePoints = explanation.isPredictionCorrect ? 10000 : 0;

  // Time bonus calculation (simplified - assumes explanation was generated quickly)
  // In real CloudScript, this would be based on actual solving time
  const timeBonus = explanation.isPredictionCorrect ? 1000 : 0;

  const finalScore = basePoints + timeBonus;

  return { basePoints, timeBonus, finalScore };
}

/**
 * Process explanation record into PlayFab-ready format
 */
function processExplanation(explanation: ExplanationRecord, puzzleId: string, arcId: string): ProcessedExplanation {
  const mapping = AI_MODEL_PLAYFAB_MAPPINGS[explanation.modelName];
  const scoreData = calculatePlayFabScore(explanation);

  return {
    modelName: explanation.modelName,
    puzzleId,
    arcId,
    isPredictionCorrect: explanation.isPredictionCorrect,
    confidence: explanation.confidence || 0,
    patternDescription: explanation.patternDescription || '',
    solvingStrategy: explanation.solvingStrategy || '',
    hints: explanation.hints || '',
    predictedOutputGrid: explanation.predictedOutputGrid || [],
    createdAt: explanation.createdAt,
    hasPlayFabMapping: !!mapping,
    playFabCustomId: mapping?.customId,
    playFabId: mapping?.playFabId,
    provider: mapping?.provider,
    ...scoreData
  };
}

/**
 * Generate summary statistics for a puzzle's explanations
 */
function generateSummary(puzzleId: string, arcId: string, explanations: ProcessedExplanation[]): PuzzleExplanationSummary {
  const totalExplanations = explanations.length;
  const successfulExplanations = explanations.filter(e => e.isPredictionCorrect).length;
  const successRate = totalExplanations > 0 ? (successfulExplanations / totalExplanations) * 100 : 0;

  const validConfidences = explanations
    .map(e => e.confidence)
    .filter(c => typeof c === 'number' && !isNaN(c) && c > 0);
  const averageConfidence = validConfidences.length > 0
    ? validConfidences.reduce((sum, c) => sum + c, 0) / validConfidences.length
    : 0;

  const modelsWithPlayFabMapping = explanations.filter(e => e.hasPlayFabMapping).length;
  const modelsWithoutMapping = totalExplanations - modelsWithPlayFabMapping;

  // Group by provider
  const modelBreakdown: { [provider: string]: any } = {};
  const unmappedModels: string[] = [];

  for (const explanation of explanations) {
    if (explanation.hasPlayFabMapping && explanation.provider) {
      if (!modelBreakdown[explanation.provider]) {
        modelBreakdown[explanation.provider] = {
          count: 0,
          successCount: 0,
          successRate: 0,
          avgConfidence: 0,
          confidenceSum: 0,
          confidenceCount: 0
        };
      }

      const provider = modelBreakdown[explanation.provider];
      provider.count++;
      if (explanation.isPredictionCorrect) provider.successCount++;
      if (explanation.confidence > 0) {
        provider.confidenceSum += explanation.confidence;
        provider.confidenceCount++;
      }
    } else {
      unmappedModels.push(explanation.modelName);
    }
  }

  // Calculate final provider stats
  for (const provider in modelBreakdown) {
    const data = modelBreakdown[provider];
    data.successRate = data.count > 0 ? (data.successCount / data.count) * 100 : 0;
    data.avgConfidence = data.confidenceCount > 0 ? data.confidenceSum / data.confidenceCount : 0;
    delete data.confidenceSum;
    delete data.confidenceCount;
  }

  return {
    puzzleId,
    arcId,
    totalExplanations,
    successfulExplanations,
    successRate,
    averageConfidence,
    modelsWithPlayFabMapping,
    modelsWithoutMapping,
    explanations,
    modelBreakdown,
    unmappedModels
  };
}

/**
 * Fetch and process explanations for a specific puzzle
 */
async function fetchPuzzleExplanations(puzzleId: string): Promise<PuzzleExplanationSummary> {
  console.log(`🔍 Fetching explanations for puzzle: ${puzzleId}`);

  // Convert to ARC ID format for API call
  const arcId = idConverter.normalizeToArcId(puzzleId);
  if (!arcId) {
    throw new Error(`Invalid puzzle ID: ${puzzleId}`);
  }

  console.log(`🔗 Using ARC ID: ${arcId}`);

  // Fetch explanations from arc-explainer API
  const explanations = await arcExplainerClient.getPuzzleExplanations(arcId);

  console.log(`📊 Found ${explanations.length} explanations for puzzle ${arcId}`);

  if (explanations.length === 0) {
    console.warn(`⚠️ No explanations found for puzzle ${arcId}`);
    return generateSummary(puzzleId, arcId, []);
  }

  // Process each explanation
  const processedExplanations = explanations.map(explanation =>
    processExplanation(explanation, puzzleId, arcId)
  );

  // Generate summary
  const summary = generateSummary(puzzleId, arcId, processedExplanations);

  console.log(`✅ Processed ${summary.totalExplanations} explanations:`);
  console.log(`   Success rate: ${summary.successRate.toFixed(1)}%`);
  console.log(`   Average confidence: ${summary.averageConfidence.toFixed(1)}`);
  console.log(`   PlayFab mapped models: ${summary.modelsWithPlayFabMapping}/${summary.totalExplanations}`);
  console.log(`   Provider breakdown:`, Object.keys(summary.modelBreakdown));

  if (summary.unmappedModels.length > 0) {
    console.warn(`⚠️ Unmapped models found:`, summary.unmappedModels);
  }

  return summary;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting explanation fetcher for puzzle e7dd8335...');

  try {
    // Fetch explanations for the target puzzle
    const puzzleId = 'e7dd8335';
    const summary = await fetchPuzzleExplanations(puzzleId);

    // Generate output filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = join(__dirname, '..', 'docs', `explanations-${puzzleId}-${timestamp}.json`);

    // Write detailed results to file
    writeFileSync(outputFile, JSON.stringify(summary, null, 2));

    console.log(`📁 Results written to: ${outputFile}`);
    console.log('\n📈 Summary:');
    console.log(`   Puzzle: ${summary.puzzleId} (${summary.arcId})`);
    console.log(`   Total explanations: ${summary.totalExplanations}`);
    console.log(`   Success rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`   Average confidence: ${summary.averageConfidence.toFixed(1)}`);
    console.log(`   PlayFab integration ready: ${summary.modelsWithPlayFabMapping} models`);

    // List top performing models
    const topModels = summary.explanations
      .filter(e => e.isPredictionCorrect && e.hasPlayFabMapping)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5);

    if (topModels.length > 0) {
      console.log('\n🏆 Top performing models for this puzzle:');
      topModels.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.modelName} (${model.provider}): ${model.finalScore} points`);
      });
    }

    console.log('\n✅ Explanation fetching complete!');

  } catch (error) {
    console.error('❌ Error fetching explanations:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { fetchPuzzleExplanations, type PuzzleExplanationSummary, type ProcessedExplanation };