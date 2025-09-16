/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: Direct explanation fetcher for puzzle e7dd8335 without Vite dependencies
 * Uses direct fetch to arc-explainer API and processes explanation data
 * SRP and DRY check: Pass - Single responsibility (explanation fetching)
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Direct API base URL (avoiding Vite env variables)
const ARC_EXPLAINER_BASE_URL = 'https://arc-explainer-production.up.railway.app';

// Import PlayFab model mappings for cross-reference
const AI_MODEL_MAPPINGS = {
  'gpt-4.1-nano-2025-04-14': { provider: 'OpenAI', name: 'GPT-4.1 Nano', playFabId: '2944C7385E107278' },
  'gpt-4.1-mini-2025-04-14': { provider: 'OpenAI', name: 'GPT-4.1 Mini', playFabId: 'BC1BB5987F7FDBA9' },
  'gpt-4o-mini-2024-07-18': { provider: 'OpenAI', name: 'GPT-4o Mini', playFabId: '4456156A86933343' },
  'claude-sonnet-4-20250514': { provider: 'Anthropic', name: 'Claude Sonnet 4', playFabId: 'someId' },
  'claude-3-5-sonnet-20241022': { provider: 'Anthropic', name: 'Claude 3.5 Sonnet', playFabId: 'someId' },
  'gemini-2.5-pro': { provider: 'Google', name: 'Gemini 2.5 Pro', playFabId: 'someId' },
  'gemini-2.0-flash': { provider: 'Google', name: 'Gemini 2.0 Flash', playFabId: 'someId' },
  'deepseek-chat': { provider: 'DeepSeek', name: 'DeepSeek Chat', playFabId: 'someId' },
  // Add more as needed when we see the actual data
};

interface ExplanationRecord {
  id: number;
  puzzleId: string;
  patternDescription: string;
  solvingStrategy: string;
  hints: string;
  confidence: number;
  modelName: string;
  predictedOutputGrid: any[][];
  isPredictionCorrect: boolean;
  predictionAccuracyScore: number;
  createdAt: string;
  helpfulVotes: number;
  notHelpfulVotes: number;
}

interface ProcessedExplanation {
  modelName: string;
  provider: string;
  hasPlayFabMapping: boolean;
  isPredictionCorrect: boolean;
  confidence: number;
  patternDescription: string;
  solvingStrategy: string;
  hints: string;
  predictedOutputGrid: any[][];
  createdAt: string;
  helpfulVotes: number;
  notHelpfulVotes: number;
  // Calculated scores for PlayFab
  basePoints: number;
  finalScore: number;
}

/**
 * Direct API call to arc-explainer
 */
async function makeAPICall(endpoint: string): Promise<any> {
  const url = `${ARC_EXPLAINER_BASE_URL}${endpoint}`;
  console.log(`🌐 Calling: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API success: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`❌ API error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Calculate PlayFab score for explanation
 */
function calculateScore(explanation: ExplanationRecord): { basePoints: number; finalScore: number } {
  const basePoints = explanation.isPredictionCorrect ? 10000 : 0;
  const timeBonus = explanation.isPredictionCorrect ? 1000 : 0; // Simplified
  const finalScore = basePoints + timeBonus;
  return { basePoints, finalScore };
}

/**
 * Process raw explanation into structured format
 */
function processExplanation(explanation: ExplanationRecord): ProcessedExplanation {
  const mapping = AI_MODEL_MAPPINGS[explanation.modelName as keyof typeof AI_MODEL_MAPPINGS];
  const scores = calculateScore(explanation);

  return {
    modelName: explanation.modelName,
    provider: mapping?.provider || 'Unknown',
    hasPlayFabMapping: !!mapping,
    isPredictionCorrect: explanation.isPredictionCorrect,
    confidence: explanation.confidence || 0,
    patternDescription: explanation.patternDescription || '',
    solvingStrategy: explanation.solvingStrategy || '',
    hints: explanation.hints || '',
    predictedOutputGrid: explanation.predictedOutputGrid || [],
    createdAt: explanation.createdAt,
    helpfulVotes: explanation.helpfulVotes || 0,
    notHelpfulVotes: explanation.notHelpfulVotes || 0,
    ...scores
  };
}

/**
 * Fetch explanations for puzzle e7dd8335
 */
async function fetchExplanationsForPuzzle(puzzleId: string): Promise<void> {
  console.log(`🔍 Fetching explanations for puzzle: ${puzzleId}`);

  try {
    // Make API call to get explanations
    const response = await makeAPICall(`/api/puzzle/${puzzleId}/explanations`);

    console.log(`📊 API Response structure:`, {
      success: response?.success,
      hasData: !!response?.data,
      dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
      dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A'
    });

    // Extract explanations array
    let explanations: ExplanationRecord[] = [];
    if (response?.success && Array.isArray(response?.data)) {
      explanations = response.data;
    } else if (Array.isArray(response)) {
      explanations = response;
    } else {
      console.warn(`⚠️ Unexpected response structure:`, response);
      return;
    }

    console.log(`📈 Found ${explanations.length} explanations for puzzle ${puzzleId}`);

    if (explanations.length === 0) {
      console.warn(`⚠️ No explanations found for puzzle ${puzzleId}`);
      return;
    }

    // Process explanations
    const processedExplanations = explanations.map(processExplanation);

    // Generate summary statistics
    const totalExplanations = processedExplanations.length;
    const successfulExplanations = processedExplanations.filter(e => e.isPredictionCorrect).length;
    const successRate = (successfulExplanations / totalExplanations) * 100;
    const mappedModels = processedExplanations.filter(e => e.hasPlayFabMapping).length;

    // Group by provider
    const providerBreakdown: { [provider: string]: any } = {};
    const unmappedModels: string[] = [];

    processedExplanations.forEach(explanation => {
      if (explanation.hasPlayFabMapping) {
        if (!providerBreakdown[explanation.provider]) {
          providerBreakdown[explanation.provider] = {
            count: 0,
            successCount: 0,
            models: []
          };
        }
        providerBreakdown[explanation.provider].count++;
        providerBreakdown[explanation.provider].models.push(explanation.modelName);
        if (explanation.isPredictionCorrect) {
          providerBreakdown[explanation.provider].successCount++;
        }
      } else {
        unmappedModels.push(explanation.modelName);
      }
    });

    // Calculate provider success rates
    Object.keys(providerBreakdown).forEach(provider => {
      const data = providerBreakdown[provider];
      data.successRate = (data.successCount / data.count) * 100;
    });

    // Create comprehensive output
    const output = {
      puzzleId,
      timestamp: new Date().toISOString(),
      summary: {
        totalExplanations,
        successfulExplanations,
        successRate: Number(successRate.toFixed(1)),
        mappedModels,
        unmappedModels: unmappedModels.length,
        providerBreakdown
      },
      unmappedModelsList: unmappedModels,
      explanations: processedExplanations
    };

    // Write to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = join(__dirname, '..', 'docs', `explanations-${puzzleId}-${timestamp}.json`);
    writeFileSync(outputFile, JSON.stringify(output, null, 2));

    console.log(`📁 Results written to: ${outputFile}`);
    console.log('\n📊 SUMMARY:');
    console.log(`   Puzzle ID: ${puzzleId}`);
    console.log(`   Total explanations: ${totalExplanations}`);
    console.log(`   Successful explanations: ${successfulExplanations} (${successRate.toFixed(1)}%)`);
    console.log(`   Models with PlayFab mapping: ${mappedModels}/${totalExplanations}`);
    console.log(`   Unmapped models: ${unmappedModels.length}`);

    console.log('\n🏭 PROVIDER BREAKDOWN:');
    Object.entries(providerBreakdown).forEach(([provider, data]: [string, any]) => {
      console.log(`   ${provider}: ${data.count} models, ${data.successCount} successful (${data.successRate.toFixed(1)}%)`);
    });

    if (unmappedModels.length > 0) {
      console.log('\n⚠️ UNMAPPED MODELS:');
      unmappedModels.forEach(model => console.log(`   - ${model}`));
      console.log('\n💡 These models need to be added to AI_MODEL_MAPPINGS or registered in PlayFab');
    }

    // Show top performers
    const topPerformers = processedExplanations
      .filter(e => e.isPredictionCorrect && e.hasPlayFabMapping)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5);

    if (topPerformers.length > 0) {
      console.log('\n🏆 TOP PERFORMERS (PlayFab-mapped):');
      topPerformers.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.modelName} (${model.provider}): ${model.finalScore} points`);
      });
    }

    console.log('\n✅ Explanation analysis complete!');

  } catch (error) {
    console.error(`❌ Error fetching explanations for ${puzzleId}:`, error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting direct explanation fetcher...');

  try {
    await fetchExplanationsForPuzzle('e7dd8335');
    console.log('\n🎉 All done! Check the generated JSON file for detailed data.');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);