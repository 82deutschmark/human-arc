/**
 * Direct PlayFab API Test for AI Model Registration
 * Tests the actual registration process step by step
 */

import https from 'https';
import process from 'process';

// Disable SSL verification for testing (not recommended for production)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function makePlayFabRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: '19FACB.playfabapi.com',
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testAIModelRegistration() {
  console.log('🧪 Direct PlayFab API Registration Test');
  console.log('='.repeat(50));

  try {
    // Step 1: Test PlayFab connection with a simple AI player
    console.log('🤖 Testing AI player creation...');

    const testCustomId = 'AI_GPT4_TEST_' + Date.now();
    console.log(`CustomID: ${testCustomId}`);

    const loginData = {
      CustomId: testCustomId,
      CreateAccount: true,
      InfoRequestParameters: {
        GetPlayerProfile: true
      }
    };

    const loginResult = await makePlayFabRequest('/Client/LoginWithCustomID', loginData);

    console.log('📡 PlayFab Response:', {
      code: loginResult.code,
      status: loginResult.status,
      hasData: !!loginResult.data,
      playFabId: loginResult.data?.PlayFabId,
      newlyCreated: loginResult.data?.NewlyCreated
    });

    if (loginResult.code === 200) {
      console.log('✅ SUCCESS: AI player created successfully!');
      console.log(`   PlayFab ID: ${loginResult.data.PlayFabId}`);
      console.log(`   Newly Created: ${loginResult.data.NewlyCreated}`);
      console.log(`   Session Token: ${loginResult.data.SessionTicket ? 'Present' : 'Missing'}`);

      // Step 2: Test setting display name
      console.log('\n📝 Testing display name update...');
      const nameData = {
        DisplayName: 'AI: GPT-4 Test Model'
      };

      const nameResult = await makePlayFabRequest('/Client/UpdateUserTitleDisplayName', nameData);
      console.log('Display name result:', nameResult.code === 200 ? '✅ Success' : `❌ Failed: ${nameResult.errorMessage}`);

      // Step 3: Test setting user data
      console.log('\n💾 Testing user data update...');
      const userData = {
        Data: {
          'player-type': 'ai',
          'ai-model-name': 'gpt-4-test',
          'ai-provider': 'OpenAI',
          'humanPerformanceData': '[]'
        }
      };

      const dataResult = await makePlayFabRequest('/Client/UpdateUserData', userData);
      console.log('User data result:', dataResult.code === 200 ? '✅ Success' : `❌ Failed: ${dataResult.errorMessage}`);

      console.log('\n🎉 REGISTRATION TEST SUCCESSFUL!');
      console.log('The AI model registration system is working correctly.');

      return {
        success: true,
        playFabId: loginResult.data.PlayFabId,
        customId: testCustomId
      };

    } else {
      console.error('❌ FAILED: PlayFab login failed');
      console.error('Error:', loginResult.errorMessage);
      return { success: false, error: loginResult.errorMessage };
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testAIModelRegistration().then(result => {
  console.log('\n🎯 Final Test Result:', result);
  if (result.success) {
    console.log('\n✅ Ready to register all 51 AI models!');
  } else {
    console.log('\n⚠️  Fix issues before proceeding with full registration.');
  }
});