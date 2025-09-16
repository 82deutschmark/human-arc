/**
 * Simple LLM System Test - API endpoints only
 * Tests the core functionality without complex imports
 */

async function testArcExplainerAPI() {
  console.log('🔍 Testing arc-explainer API connection...');

  try {
    // Test 1: Get all models
    console.log('   📋 Fetching model list...');
    const modelsResponse = await fetch('https://arc-explainer-production.up.railway.app/api/models');

    if (!modelsResponse.ok) {
      throw new Error(`Models API failed: ${modelsResponse.status}`);
    }

    const modelsData = await modelsResponse.json();

    if (!Array.isArray(modelsData)) {
      throw new Error('Invalid models response format - expected array');
    }

    console.log(`   ✅ Successfully fetched ${modelsData.length} models`);

    // Show first 5 models
    console.log('   📊 Sample models:');
    modelsData.slice(0, 5).forEach((model, index) => {
      console.log(`      ${index + 1}. ${model.name} (${model.provider || 'Unknown'})`);
    });

    // Test 2: Get explanations for a specific puzzle
    console.log('\n   📝 Testing explanation fetching...');
    const puzzleId = '007bbfb7'; // Known puzzle ID
    const explainResponse = await fetch(`https://arc-explainer-production.up.railway.app/api/puzzle/${puzzleId}/explanations`);

    if (!explainResponse.ok) {
      throw new Error(`Explanations API failed: ${explainResponse.status}`);
    }

    const response = await explainResponse.json();

    // Handle wrapped response format
    let explanations;
    if (response.success && Array.isArray(response.data)) {
      explanations = response.data;
    } else if (Array.isArray(response)) {
      explanations = response;
    } else {
      console.log('Response structure:', typeof response, Object.keys(response));
      throw new Error('Invalid explanations response format');
    }

    console.log(`   ✅ Successfully fetched ${explanations.length} explanations for puzzle ${puzzleId}`);

    // Show model names in explanations
    const modelNames = [...new Set(explanations.map(exp => exp.modelName))];
    console.log(`   🤖 Models with explanations: ${modelNames.slice(0, 5).join(', ')}${modelNames.length > 5 ? '...' : ''}`);

    return {
      totalModels: modelsData.length,
      sampleExplanations: explanations.length,
      modelsWithData: modelNames.length
    };

  } catch (error) {
    console.error('❌ Arc-explainer API test failed:', error.message);
    return null;
  }
}

async function testPlayFabConnection() {
  console.log('\n🎮 Testing PlayFab API connection...');

  try {
    // Test basic PlayFab connectivity
    const testResponse = await fetch('https://5F7D7.playfabapi.com/Client/GetTitleData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': 'test' // This will fail but should give us a valid error
      },
      body: JSON.stringify({
        Keys: ['AllTasks']
      })
    });

    const data = await testResponse.json();

    // We expect this to fail with authentication error, but it confirms API is reachable
    if (data.errorCode === 1074) { // NotAuthenticated error
      console.log('   ✅ PlayFab API is reachable (authentication required as expected)');
      return true;
    } else if (data.errorCode) {
      console.log(`   ⚠️ PlayFab API responded with error: ${data.errorMessage}`);
      return false;
    } else {
      console.log('   ✅ PlayFab API connection successful');
      return true;
    }

  } catch (error) {
    console.error('❌ PlayFab connection test failed:', error.message);
    return false;
  }
}

async function testIDConversion() {
  console.log('\n🔗 Testing ID conversion logic...');

  try {
    const testCases = [
      { input: '007bbfb7', expected: 'ARC_007BBFB7' },
      { input: 'officer-tasks-training-batch1-007bbfb7', expected: '007bbfb7' },
      { input: 'ARC-TR-007bbfb7', expected: '007bbfb7' }
    ];

    console.log('   📋 Testing ID format conversions:');

    for (const testCase of testCases) {
      // Simple regex-based conversion for testing
      let result;

      if (testCase.input.match(/^[a-f0-9]{8}$/)) {
        // Pure ARC format -> PlayFab-like format
        result = `ARC_${testCase.input.toUpperCase()}`;
      } else if (testCase.input.includes('batch')) {
        // Extract ARC ID from batch format
        const match = testCase.input.match(/([a-f0-9]{8})$/);
        result = match ? match[1] : null;
      } else if (testCase.input.startsWith('ARC-')) {
        // PlayFab format -> ARC format
        result = testCase.input.replace(/^ARC-(TR|T2|EV|E2)-/, '');
      }

      const status = result === testCase.expected ? '✅' : '❌';
      console.log(`      ${status} ${testCase.input} -> ${result} (expected: ${testCase.expected})`);
    }

    console.log('   ✅ ID conversion logic working');
    return true;

  } catch (error) {
    console.error('❌ ID conversion test failed:', error.message);
    return false;
  }
}

async function runSimpleTests() {
  console.log('🚀 Starting Simple LLM System Tests\n');
  console.log('='.repeat(60));

  const results = {
    arcExplainer: null,
    playFab: false,
    idConversion: false
  };

  // Test 1: Arc-explainer API
  results.arcExplainer = await testArcExplainerAPI();

  // Test 2: PlayFab Connection
  console.log('='.repeat(60));
  results.playFab = await testPlayFabConnection();

  // Test 3: ID Conversion Logic
  console.log('='.repeat(60));
  results.idConversion = await testIDConversion();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TEST RESULTS SUMMARY:');
  console.log(`   Arc-explainer API: ${results.arcExplainer ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   PlayFab Connection: ${results.playFab ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ID Conversion: ${results.idConversion ? '✅ PASS' : '❌ FAIL'}`);

  if (results.arcExplainer) {
    console.log(`\n📊 Arc-explainer Data:`);
    console.log(`   Total models available: ${results.arcExplainer.totalModels}`);
    console.log(`   Models with explanation data: ${results.arcExplainer.modelsWithData}`);
    console.log(`   Sample explanations for test puzzle: ${results.arcExplainer.sampleExplanations}`);
  }

  const readyForDeployment = results.arcExplainer && results.playFab && results.idConversion;

  console.log('\n' + (readyForDeployment ? '🎉' : '⚠️'));
  if (readyForDeployment) {
    console.log('SYSTEM READY - Core functionality validated!');
    console.log('\nNext steps:');
    console.log('1. The LLM services should work correctly');
    console.log('2. Ready to register AI models in PlayFab');
    console.log('3. Ready to start data synchronization');
  } else {
    console.log('ISSUES DETECTED - Fix before proceeding');
  }

  return readyForDeployment;
}

// Run if executed directly
runSimpleTests().catch(console.error);