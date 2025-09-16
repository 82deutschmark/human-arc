/**
 * AI Model Registration Script for Browser Console
 * Run this in the browser console at localhost:5173
 */

console.log('🚀 Starting AI Model Registration Process');
console.log('='.repeat(50));

async function registerAllAIModels() {
    try {
        console.log('📋 Step 1: Importing LLMPlayerManager...');

        // Import the service - this should work in the dev environment
        const module = await import('/src/services/playfab/index.ts');
        const { llmPlayerManager } = module;

        console.log('✅ LLMPlayerManager imported successfully');

        console.log('🔍 Step 2: Discovering models from arc-explainer API...');
        const models = await llmPlayerManager.getDiscoveredModels();
        console.log(`📊 Found ${models.length} models to register`);

        // Show sample models
        console.log('🎯 Sample models:');
        models.slice(0, 5).forEach((model, index) => {
            console.log(`  ${index + 1}. ${model.modelName} (${model.provider})`);
        });

        console.log('\n🤖 Step 3: Starting registration process...');
        console.log('⏱️  This may take several minutes...');

        const startTime = Date.now();
        const results = await llmPlayerManager.registerAllLLMPlayers();
        const endTime = Date.now();

        console.log(`🎉 Registration Complete in ${(endTime - startTime) / 1000}s!`);
        console.log(`✅ Successfully registered: ${results.length} AI players`);

        // Show summary by provider
        const providerCounts = {};
        results.forEach(result => {
            const provider = result.metadata.provider;
            providerCounts[provider] = (providerCounts[provider] || 0) + 1;
        });

        console.log('\n📊 Registration Summary by Provider:');
        Object.entries(providerCounts).forEach(([provider, count]) => {
            console.log(`  ${provider}: ${count} models`);
        });

        console.log('\n🎯 Next Steps:');
        console.log('1. Check PlayFab leaderboards for new AI players');
        console.log('2. Run data synchronization to populate AI performance records');
        console.log('3. Test mixed human/AI leaderboard display');

        return {
            success: true,
            totalRegistered: results.length,
            providerBreakdown: providerCounts,
            samplePlayers: results.slice(0, 3).map(r => ({
                displayName: r.displayName,
                provider: r.metadata.provider,
                playFabId: r.playFabId
            }))
        };

    } catch (error) {
        console.error('❌ Registration failed:', error);
        console.error('Error details:', error.message);

        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
}

// Make function globally available
window.registerAllAIModels = registerAllAIModels;

console.log('💡 Function ready! Run: window.registerAllAIModels()');
console.log('📝 Make sure you are on localhost:5173 with the app running');