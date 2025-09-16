// Simple AI model registration script for browser console
// Run this in the browser console at localhost:5174

console.log('🚀 Starting AI Model Registration');

// Import and run the registration
import('/src/services/playfab/index.ts').then(async (module) => {
    const { llmPlayerManager } = module;

    console.log('✅ LLMPlayerManager imported');

    // Register all models
    const results = await llmPlayerManager.registerAllLLMPlayers();

    console.log(`🎉 Registration complete: ${results.length} models registered`);

    // Show summary
    const providers = {};
    results.forEach(r => {
        providers[r.metadata.provider] = (providers[r.metadata.provider] || 0) + 1;
    });

    console.log('📊 Summary by provider:', providers);

}).catch(error => {
    console.error('❌ Registration failed:', error);
});