/**
 * Register All AI Models as PlayFab Players
 * Production script to create PlayFab player accounts for all discovered AI models
 */

async function discoverModels() {
  console.log('🔍 Discovering all AI models from arc-explainer API...');

  try {
    const response = await fetch('https://arc-explainer-production.up.railway.app/api/models');

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const models = await response.json();

    if (!Array.isArray(models)) {
      throw new Error('Invalid response format');
    }

    console.log(`✅ Discovered ${models.length} AI models`);
    return models;

  } catch (error) {
    console.error('❌ Failed to discover models:', error);
    return [];
  }
}

function normalizeModelNameToCustomID(modelName) {
  // Convert model name to PlayFab-compatible CustomID
  const cleaned = modelName
    .replace(/[^a-zA-Z0-9\-\_]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toUpperCase()
    .substring(0, 50); // PlayFab CustomID limit

  return `AI_${cleaned}`;
}

function generateDisplayName(modelName, provider) {
  const name = modelName
    .replace(/^[^\/]*\//, '') // Remove provider prefix
    .replace(/-\d{4}-\d{2}-\d{2}$/, '') // Remove date suffix
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return `AI: ${name}`;
}

function normalizeProvider(modelName, apiProvider) {
  const name = modelName.toLowerCase();

  if (name.includes('gpt') || name.includes('openai') || name.includes('o3') || name.includes('o4')) {
    return 'OpenAI';
  } else if (name.includes('claude')) {
    return 'Anthropic';
  } else if (name.includes('gemini')) {
    return 'Google';
  } else if (name.includes('deepseek')) {
    return 'DeepSeek';
  } else if (name.includes('llama')) {
    return 'Meta';
  } else if (name.includes('qwen')) {
    return 'Qwen';
  } else if (name.includes('mistral')) {
    return 'Mistral';
  } else if (name.includes('grok')) {
    return 'xAI';
  } else if (name.includes('command')) {
    return 'Cohere';
  } else if (name.includes('moonshot') || name.includes('kimi')) {
    return 'Moonshot';
  } else {
    return apiProvider || 'Unknown';
  }
}

async function registerSingleModel(model) {
  const customId = normalizeModelNameToCustomID(model.name);
  const displayName = generateDisplayName(model.name, model.provider);
  const provider = normalizeProvider(model.name, model.provider);

  console.log(`🤖 Registering: ${model.name}`);
  console.log(`   CustomID: ${customId}`);
  console.log(`   Display: ${displayName}`);
  console.log(`   Provider: ${provider}`);

  try {
    // Step 1: Create PlayFab player using Server API (requires secret key)
    const loginPayload = {
      CustomId: customId,
      CreateAccount: true,
      InfoRequestParameters: {
        GetPlayerProfile: true
      }
    };

    console.log('   📝 Creating PlayFab player account...');
    const loginResponse = await fetch('https://19FACB.playfabapi.com/Server/LoginWithServerCustomId', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': 'SSITWBPFT7XWSHFAEGFFTWBEYJFUMQHM8MSOZB8BEUY8UQ5Q6W'
      },
      body: JSON.stringify(loginPayload)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();

    if (loginData.errorCode) {
      throw new Error(`PlayFab error: ${loginData.errorMessage}`);
    }

    const playFabId = loginData.data.PlayFabId;
    const sessionTicket = loginData.data.SessionTicket;

    console.log(`   ✅ PlayFab ID: ${playFabId}`);

    // Step 2: Set display name using Server API
    console.log('   📝 Setting display name...');
    const nameResponse = await fetch('https://19FACB.playfabapi.com/Server/UpdateUserTitleDisplayName', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': 'SSITWBPFT7XWSHFAEGFFTWBEYJFUMQHM8MSOZB8BEUY8UQ5Q6W'
      },
      body: JSON.stringify({
        PlayFabId: playFabId,
        DisplayName: displayName
      })
    });

    if (!nameResponse.ok) {
      console.warn(`   ⚠️ Failed to set display name: ${nameResponse.status}`);
    }

    // Step 3: Set player metadata using Server API
    console.log('   📝 Setting player metadata...');
    const metadata = {
      provider: provider,
      modelName: model.name,
      capabilities: model.capabilities || [],
      isActive: model.active !== false,
      registrationDate: new Date().toISOString()
    };

    const dataResponse = await fetch('https://19FACB.playfabapi.com/Server/UpdateUserData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': 'SSITWBPFT7XWSHFAEGFFTWBEYJFUMQHM8MSOZB8BEUY8UQ5Q6W'
      },
      body: JSON.stringify({
        PlayFabId: playFabId,
        Data: {
          'player-type': 'ai',
          'model-metadata': JSON.stringify(metadata),
          'humanPerformanceData': '[]',
          'ai-model-name': model.name,
          'ai-provider': provider
        }
      })
    });

    if (!dataResponse.ok) {
      console.warn(`   ⚠️ Failed to set metadata: ${dataResponse.status}`);
    }

    // Step 4: Initialize statistics using Server API
    console.log('   📝 Initializing statistics...');
    const statsResponse = await fetch('https://19FACB.playfabapi.com/Server/UpdatePlayerStatistics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': 'SSITWBPFT7XWSHFAEGFFTWBEYJFUMQHM8MSOZB8BEUY8UQ5Q6W'
      },
      body: JSON.stringify({
        PlayFabId: playFabId,
        Statistics: [
          { StatisticName: 'OfficerTrackPoints', Value: 0 },
          { StatisticName: 'ARC2EvalPoints', Value: 0 },
          { StatisticName: 'LevelPoints', Value: 0 },
          { StatisticName: 'HARCTotalPoints', Value: 0 }
        ]
      })
    });

    if (!statsResponse.ok) {
      console.warn(`   ⚠️ Failed to initialize statistics: ${statsResponse.status}`);
    }

    console.log(`   🎉 Successfully registered: ${displayName}`);

    return {
      success: true,
      customId,
      displayName,
      playFabId,
      provider,
      modelName: model.name
    };

  } catch (error) {
    console.error(`   ❌ Failed to register ${model.name}:`, error.message);
    return {
      success: false,
      customId,
      displayName,
      error: error.message,
      modelName: model.name
    };
  }
}

async function registerAllModels() {
  console.log('🚀 Starting AI Model Registration Process\n');
  console.log('=' .repeat(60));

  // Step 1: Discover all models
  const models = await discoverModels();

  if (models.length === 0) {
    console.error('❌ No models found. Exiting.');
    return;
  }

  console.log(`\n📋 Found ${models.length} models to register\n`);

  // Step 2: Register each model
  const results = [];
  const successful = [];
  const failed = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    console.log(`[${i + 1}/${models.length}] Processing: ${model.name}`);

    const result = await registerSingleModel(model);
    results.push(result);

    if (result.success) {
      successful.push(result);
    } else {
      failed.push(result);
    }

    // Rate limiting - don't overwhelm PlayFab
    if (i < models.length - 1) {
      console.log('   ⏳ Waiting 1 second...\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 REGISTRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successful.length}/${models.length}`);
  console.log(`❌ Failed: ${failed.length}/${models.length}`);

  if (successful.length > 0) {
    console.log('\n🎉 Successfully Registered Models:');
    successful.forEach(result => {
      console.log(`   • ${result.displayName} (${result.provider})`);
    });
  }

  if (failed.length > 0) {
    console.log('\n⚠️ Failed Registrations:');
    failed.forEach(result => {
      console.log(`   • ${result.modelName}: ${result.error}`);
    });
  }

  console.log('\n📊 Summary by Provider:');
  const providerCounts = {};
  successful.forEach(result => {
    providerCounts[result.provider] = (providerCounts[result.provider] || 0) + 1;
  });

  Object.entries(providerCounts).forEach(([provider, count]) => {
    console.log(`   ${provider}: ${count} models`);
  });

  const readyForSync = successful.length > 0;
  console.log(`\n${readyForSync ? '🚀' : '⚠️'} ${readyForSync ? 'READY FOR DATA SYNC' : 'FIX ISSUES BEFORE SYNC'}`);

  return {
    totalModels: models.length,
    successful: successful.length,
    failed: failed.length,
    results
  };
}

// Run the registration
registerAllModels().catch(console.error);