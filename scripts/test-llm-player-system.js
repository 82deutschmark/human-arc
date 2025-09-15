/**
 * Test Script for LLM Player System
 * Tests model discovery, registration, and data synchronization before full deployment
 */

import { llmPlayerManager, llmDataSyncService } from '../client/src/services/playfab/index.js';

async function testModelDiscovery() {
  console.log('🔍 Testing model discovery from arc-explainer API...');

  try {
    const models = await llmPlayerManager.getDiscoveredModels();
    console.log(`✅ Successfully discovered ${models.length} models`);

    // Show first 5 models as sample
    console.log('📋 Sample models:');
    models.slice(0, 5).forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.modelName} (${model.provider})`);
    });

    return models;

  } catch (error) {
    console.error('❌ Model discovery failed:', error);
    return [];
  }
}

async function testPlayerRegistration() {
  console.log('🤖 Testing PlayFab player registration...');

  try {
    // Test with a single model first
    const testModel = 'gpt-5-mini-2025-08-07'; // Pick a known model

    const playerInfo = await llmPlayerManager.registerModelByName(testModel);

    if (playerInfo) {
      console.log(`✅ Successfully registered test model: ${playerInfo.displayName}`);
      console.log(`   CustomID: ${playerInfo.customId}`);
      console.log(`   PlayFabID: ${playerInfo.playFabId}`);
      return true;
    } else {
      console.error('❌ Failed to register test model');
      return false;
    }

  } catch (error) {
    console.error('❌ Player registration test failed:', error);
    return false;
  }
}

async function testDataSync() {
  console.log('📊 Testing data synchronization with small subset...');

  try {
    // Run in test mode (only 3 models, 10 puzzles)
    const progress = await llmDataSyncService.startFullSync({
      testMode: true,
      batchSize: 5,
      rateLimitMs: 1000,
      validateOnly: true // Don't actually update PlayFab yet
    });

    console.log('✅ Data sync test completed:');
    console.log(`   Models processed: ${progress.processedModels}/${progress.totalModels}`);
    console.log(`   Puzzles processed: ${progress.processedPuzzles}/${progress.totalPuzzles}`);
    console.log(`   Successful syncs: ${progress.successfulSyncs}`);
    console.log(`   Failed syncs: ${progress.failedSyncs}`);

    if (progress.errors.length > 0) {
      console.log('⚠️ Errors encountered:');
      progress.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
    }

    return progress.failedSyncs < progress.successfulSyncs; // Success if more successes than failures

  } catch (error) {
    console.error('❌ Data sync test failed:', error);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Starting LLM Player System Test Suite\n');

  const results = {
    modelDiscovery: false,
    playerRegistration: false,
    dataSync: false
  };

  // Test 1: Model Discovery
  console.log('='.repeat(50));
  const models = await testModelDiscovery();
  results.modelDiscovery = models.length > 0;
  console.log('');

  // Test 2: Player Registration (only if discovery worked)
  if (results.modelDiscovery) {
    console.log('='.repeat(50));
    results.playerRegistration = await testPlayerRegistration();
    console.log('');
  }

  // Test 3: Data Sync (only if registration worked)
  if (results.playerRegistration) {
    console.log('='.repeat(50));
    results.dataSync = await testDataSync();
    console.log('');
  }

  // Final Results
  console.log('='.repeat(50));
  console.log('🎯 TEST RESULTS SUMMARY:');
  console.log(`   Model Discovery: ${results.modelDiscovery ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Player Registration: ${results.playerRegistration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Data Synchronization: ${results.dataSync ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);

  console.log('');
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - System ready for full deployment!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run llmPlayerManager.registerAllLLMPlayers() to register all 44 models');
    console.log('2. Run llmDataSyncService.startFullSync() to sync all performance data');
    console.log('3. Update leaderboard components to handle AI players');
  } else {
    console.log('⚠️ SOME TESTS FAILED - Fix issues before proceeding');
  }

  return allPassed;
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullTest().catch(console.error);
}

export { runFullTest, testModelDiscovery, testPlayerRegistration, testDataSync };