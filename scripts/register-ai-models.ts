/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: Direct Node.js script to register all AI models as PlayFab players
 * Uses existing LLMPlayerManager service with proper TypeScript imports
 * SRP and DRY check: Pass - Single responsibility (registration), reuses existing services
 *
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.resolve(projectRoot, '.env') });

// Mock browser APIs required by PlayFab services
globalThis.localStorage = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    length: 0,
    key: (index: number) => null
};

globalThis.sessionStorage = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {},
    length: 0,
    key: (index: number) => null
};

// Mock other browser globals if needed
globalThis.window = globalThis as any;
globalThis.document = {
    cookie: ''
} as any;

console.log('🚀 AI Model Registration Script Starting...');
console.log('='.repeat(60));

async function registerAllAIModels() {
    try {
        console.log('📋 Step 1: Setting up module resolution...');

        // Add the client/src directory to the module resolution
        const clientSrcPath = path.resolve(projectRoot, 'client', 'src');
        console.log(`Client src path: ${clientSrcPath}`);

        // Dynamic import with file:// URL (required for Windows)
        const llmManagerPath = path.resolve(clientSrcPath, 'services', 'playfab', 'llmPlayerManager.ts');
        const llmManagerUrl = `file://${llmManagerPath.replace(/\\/g, '/')}`;
        console.log(`Importing from: ${llmManagerUrl}`);

        // Import the services
        const llmModule = await import(llmManagerUrl);
        const { llmPlayerManager } = llmModule;

        // Also import the auth and request manager to initialize them
        const authManagerPath = path.resolve(clientSrcPath, 'services', 'playfab', 'authManager.ts');
        const authManagerUrl = `file://${authManagerPath.replace(/\\/g, '/')}`;
        const { playFabAuthManager } = await import(authManagerUrl);

        const requestManagerPath = path.resolve(clientSrcPath, 'services', 'playfab', 'requestManager.ts');
        const requestManagerUrl = `file://${requestManagerPath.replace(/\\/g, '/')}`;
        const { playFabRequestManager } = await import(requestManagerUrl);

        console.log('✅ PlayFab services imported successfully');

        console.log('\n🔧 Step 2: Initializing PlayFab services...');

        // Initialize PlayFab with environment variables
        const titleId = process.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
            throw new Error('VITE_PLAYFAB_TITLE_ID not found in environment variables');
        }

        // Initialize the request manager
        await playFabRequestManager.initialize(titleId);
        console.log('✅ PlayFab request manager initialized');

        // Login anonymously to get session token
        const authResult = await playFabAuthManager.loginAnonymously();
        if (!authResult.success) {
            throw new Error(`Failed to authenticate with PlayFab: ${authResult.error}`);
        }
        console.log('✅ PlayFab authentication successful');

        console.log('\n🔍 Step 3: Discovering models from arc-explainer API...');
        const models = await llmPlayerManager.getDiscoveredModels();
        console.log(`📊 Found ${models.length} models to register`);

        // Show sample models
        console.log('\n🎯 Sample models:');
        models.slice(0, 5).forEach((model, index) => {
            console.log(`  ${index + 1}. ${model.modelName} (${model.provider})`);
        });

        console.log('\n🤖 Step 4: Starting registration process...');
        console.log('⏱️  This may take several minutes due to rate limiting...');
        console.log('📈 Progress will be shown for each model...');

        const startTime = Date.now();
        const results = await llmPlayerManager.registerAllLLMPlayers();
        const endTime = Date.now();

        const duration = (endTime - startTime) / 1000;
        console.log(`\n🎉 Registration Complete in ${duration.toFixed(1)}s!`);
        console.log(`✅ Successfully registered: ${results.length} AI players`);

        // Show summary by provider
        const providerCounts: Record<string, number> = {};
        results.forEach(result => {
            const provider = result.metadata.provider;
            providerCounts[provider] = (providerCounts[provider] || 0) + 1;
        });

        console.log('\n📊 Registration Summary by Provider:');
        console.log('-'.repeat(40));
        Object.entries(providerCounts)
            .sort(([,a], [,b]) => b - a) // Sort by count desc
            .forEach(([provider, count]) => {
                console.log(`  ${provider.padEnd(15)}: ${count.toString().padStart(2)} models`);
            });

        console.log('\n🎯 Sample Registered Players:');
        console.log('-'.repeat(40));
        results.slice(0, 5).forEach(result => {
            console.log(`  ${result.displayName}`);
            console.log(`    PlayFab ID: ${result.playFabId}`);
            console.log(`    Custom ID:  ${result.customId}`);
            console.log('');
        });

        console.log('🔄 Next Steps:');
        console.log('1. ✅ All AI models are now registered as PlayFab players');
        console.log('2. 📊 Check PlayFab dashboard for the new player accounts');
        console.log('3. 🏆 AI players will appear on leaderboards once they have scores');
        console.log('4. 🔗 Run data synchronization to populate AI performance records');

        return {
            success: true,
            totalRegistered: results.length,
            providerBreakdown: providerCounts,
            duration: duration,
            samplePlayers: results.slice(0, 3)
        };

    } catch (error) {
        console.error('\n❌ Registration failed:');
        console.error('Error:', error.message);

        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }

        // Common error cases
        if (error.message.includes('Cannot resolve module')) {
            console.error('\n💡 Troubleshooting tips:');
            console.error('  - Make sure all dependencies are installed (npm install)');
            console.error('  - Check that the PlayFab services are properly configured');
            console.error('  - Verify .env file has correct PlayFab credentials');
        }

        return {
            success: false,
            error: error.message
        };
    }
}

// Execute the registration
registerAllAIModels()
    .then(result => {
        if (result.success) {
            console.log('\n🎊 SUCCESS! AI model registration completed successfully.');
            console.log(`📈 Total registered: ${result.totalRegistered} models`);
            process.exit(0);
        } else {
            console.log('\n💥 FAILED! AI model registration encountered errors.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n🚨 CRITICAL ERROR:', error);
        process.exit(1);
    });