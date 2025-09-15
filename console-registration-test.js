/**
 * Console Test for AI Model Registration
 * Copy and paste this into the browser console at localhost:5173
 */

// Test AI Model Registration
async function testAIModelRegistration() {
    console.log('🚀 Starting AI Model Registration Test');
    console.log('='.repeat(50));

    try {
        // Step 1: Test model discovery
        console.log('🔍 Testing model discovery...');

        const response = await fetch('https://arc-explainer-production.up.railway.app/api/models');
        const models = await response.json();

        console.log(`✅ Discovered ${models.length} models from arc-explainer`);
        console.log('Sample models:', models.slice(0, 3).map(m => `${m.name} (${m.provider || 'Unknown'})`));

        // Step 2: Test a single model registration (safer than all at once)
        console.log('\n🤖 Testing single model registration...');

        const testModel = models[0]; // Use first model for test
        console.log(`Testing with: ${testModel.name}`);

        // Create a custom ID
        const customId = `AI_${testModel.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().substring(0, 40)}`;
        console.log(`CustomID: ${customId}`);

        // Test PlayFab login
        const loginData = {
            CustomId: customId,
            CreateAccount: true,
            InfoRequestParameters: {
                GetPlayerProfile: true
            }
        };

        console.log('📝 Attempting PlayFab login...');

        // Make the API call using the browser's fetch
        const loginResponse = await fetch('https://19FACB.playfabapi.com/Client/LoginWithCustomID', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const loginResult = await loginResponse.json();

        if (loginResult.code === 200) {
            console.log('✅ PlayFab login successful!');
            console.log('PlayFab ID:', loginResult.data.PlayFabId);
            console.log('Newly Created:', loginResult.data.NewlyCreated);

            return {
                success: true,
                playFabId: loginResult.data.PlayFabId,
                model: testModel.name,
                customId: customId
            };
        } else {
            console.error('❌ PlayFab login failed:', loginResult);
            return { success: false, error: loginResult };
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
    }
}

// Run the test
testAIModelRegistration().then(result => {
    console.log('\n🎯 Final Result:', result);
});