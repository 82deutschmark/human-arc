// Authored by: Cascade using Claude 3.5 Sonnet  
// Date: 2025-09-15T13:51:00-04:00
// Purpose: Test single AI model registration to validate approach before full batch
// How it works: Registers just one AI model to verify PlayFab integration and authentication
// Project usage: Quick test to ensure registration logic works before running full script

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

// Logging utilities
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : 
                  type === 'success' ? '✅' : 
                  type === 'warning' ? '⚠️' : 
                  type === 'progress' ? '🔄' : '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Generate consistent CustomID for AI models
function generateCustomID(model) {
    const cleanKey = model.key.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanProvider = model.provider.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return `AI_${cleanProvider}_${cleanKey}`;
}

// Test registering a single AI model
async function testSingleRegistration() {
    if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
        log('Error: PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY must be set in your .env file.', 'error');
        process.exit(1);
    }
    
    log('🧪 Testing Single AI Model Registration', 'info');
    log(`PlayFab Title ID: ${PLAYFAB_TITLE_ID}`, 'info');
    
    // Use a simple test model
    const testModel = {
        key: 'test-gpt-4o-mini',
        name: 'Test GPT-4o Mini',
        provider: 'OpenAI',
        cost: { input: '$0.15', output: '$0.60' },
        responseTime: { speed: 'fast', estimate: '<30 sec' }
    };
    
    const customId = generateCustomID(testModel);
    const displayName = `AI: ${testModel.name}`;
    
    try {
        log(`Attempting to register: ${testModel.name}`, 'progress');
        log(`Custom ID: ${customId}`, 'info');
        
        // Create account using Client API with TitleId in body
        const loginResponse = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Client/LoginWithCustomID`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                TitleId: PLAYFAB_TITLE_ID,
                CustomId: customId,
                CreateAccount: true,
                InfoRequestParameters: {
                    GetPlayerProfile: true
                }
            })
        });
        
        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            log(`Failed to create player account: ${loginResponse.status} - ${errorText}`, 'error');
            return;
        }
        
        const loginResult = await loginResponse.json();
        if (loginResult.code !== 200) {
            log(`PlayFab login error: ${loginResult.errorMessage}`, 'error');
            return;
        }
        
        const playFabId = loginResult.data.PlayFabId;
        const sessionTicket = loginResult.data.SessionTicket;
        const newlyCreated = loginResult.data.NewlyCreated;
        
        log(`${newlyCreated ? 'Created' : 'Found existing'} player: ${playFabId}`, 'success');
        
        // Set display name using Client API
        const nameResponse = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Client/UpdateUserTitleDisplayName`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': sessionTicket
            },
            body: JSON.stringify({
                DisplayName: displayName
            })
        });
        
        if (nameResponse.ok && (await nameResponse.json()).code === 200) {
            log(`Display name set: ${displayName}`, 'success');
        } else {
            log(`Warning: Failed to set display name`, 'warning');
        }
        
        // Set player metadata using Client API
        const metadataResponse = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Client/UpdateUserData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': sessionTicket
            },
            body: JSON.stringify({
                Data: {
                    'player-type': 'ai',
                    'ai-model-name': testModel.name,
                    'ai-provider': testModel.provider,
                    'ai-model-key': testModel.key,
                    'ai-model-cost': JSON.stringify(testModel.cost),
                    'ai-model-speed': testModel.responseTime?.speed || 'unknown',
                    'humanPerformanceData': '[]',
                    'registration-date': new Date().toISOString(),
                    'test-registration': 'true'
                }
            })
        });
        
        if (metadataResponse.ok && (await metadataResponse.json()).code === 200) {
            log(`Metadata set successfully`, 'success');
        } else {
            log(`Warning: Failed to set metadata`, 'warning');
        }
        
        log('🎉 Single AI Model Registration Test SUCCESSFUL!', 'success');
        log(`PlayFab ID: ${playFabId}`, 'success');
        log(`Custom ID: ${customId}`, 'success');
        log(`Display Name: ${displayName}`, 'success');
        log('The full registration script should work correctly now.', 'info');
        
    } catch (error) {
        log(`Test failed: ${error.message}`, 'error');
        if (error.stack) {
            log(`Stack trace: ${error.stack}`, 'error');
        }
    }
}

testSingleRegistration();
