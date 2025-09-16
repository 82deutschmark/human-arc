// Authored by: Cascade using Claude 3.5 Sonnet
// Date: 2025-09-15T12:08:50-04:00
// Purpose: Robust AI Model Registration Script - automatically discovers and registers AI models from arc-explainer API as PlayFab players
// How it works: Uses PlayFab Admin API with secret key to create players, fetches models dynamically, avoids duplicates through existing player checks
// Project usage: Runs as part of build process to keep AI players in sync with available models from arc-explainer

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;
const ARC_EXPLAINER_API = 'https://arc-explainer-production.up.railway.app/api';

// Logging utilities with timestamps and colors
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : 
                  type === 'success' ? '✅' : 
                  type === 'warning' ? '⚠️' : 
                  type === 'progress' ? '🔄' : '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// PlayFab API request handler following sync-cloudscript.cjs pattern
async function makePlayFabRequest(endpoint, payload) {
    const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-SecretKey': PLAYFAB_SECRET_KEY,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PlayFab API error (${response.status}): ${errorData.errorMessage}`);
    }

    const responseData = await response.json();
    if (responseData.code !== 200) {
        throw new Error(`PlayFab API error: ${responseData.errorMessage}`);
    }

    return responseData.data;
}

// Fetch all models from arc-explainer API
async function discoverModelsFromArcExplainer() {
    log('Discovering available AI models from arc-explainer API...', 'progress');
    
    try {
        const response = await fetch(`${ARC_EXPLAINER_API}/models`);
        if (!response.ok) {
            throw new Error(`Arc-explainer API error (${response.status}): ${response.statusText}`);
        }
        
        const models = await response.json();
        log(`Found ${models.length} models available from arc-explainer`, 'success');
        
        // Show sample models for verification
        if (models.length > 0) {
            log('Sample discovered models:', 'info');
            models.slice(0, 3).forEach((model, index) => {
                log(`  ${index + 1}. ${model.name} (${model.provider})`, 'info');
            });
        }
        
        return models;
    } catch (error) {
        throw new Error(`Failed to discover models from arc-explainer: ${error.message}`);
    }
}

// Get existing AI players from PlayFab to avoid duplicates
async function getExistingAIPlayers() {
    log('Checking existing AI players in PlayFab...', 'progress');
    
    try {
        // Use Admin API to search for players with ai player-type
        const data = await makePlayFabRequest('/Admin/GetAllUsersCharacters', {
            // We'll need to implement a different approach since GetAllUsersCharacters 
            // may not be the right endpoint. Let's use a more direct approach.
        });
        
        // For now, we'll create a simpler approach by attempting login and checking if account exists
        // This will be implemented in the registration logic
        return [];
    } catch (error) {
        log(`Warning: Could not fetch existing players (${error.message}). Will check individually during registration.`, 'warning');
        return [];
    }
}

// Generate consistent CustomID for AI models
function generateCustomID(model) {
    // Create a consistent, unique identifier based on model key and provider
    const cleanKey = model.key.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanProvider = model.provider.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return `AI_${cleanProvider}_${cleanKey}`;
}

// Check if a specific AI player already exists
async function checkPlayerExists(customId) {
    try {
        // Try to login with the CustomID - if it succeeds, player exists
        const response = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Client/LoginWithCustomID`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                CustomId: customId,
                CreateAccount: false  // Don't create if doesn't exist
            })
        });
        
        const result = await response.json();
        return result.code === 200;  // If successful, player exists
    } catch (error) {
        return false;  // If any error, assume player doesn't exist
    }
}

// Register a single AI model as PlayFab player
async function registerAIPlayer(model, retryCount = 0) {
    const customId = generateCustomID(model);
    const displayName = `AI: ${model.name}`;
    
    try {
        // First check if player already exists
        const exists = await checkPlayerExists(customId);
        if (exists) {
            log(`Skipping ${model.name} - already registered`, 'info');
            return { skipped: true, customId, displayName };
        }
        
        log(`Registering ${model.name} (${model.provider})...`, 'progress');
        
        // Create account using Client API (which allows account creation)
        const loginResponse = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Client/LoginWithCustomID`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                CustomId: customId,
                CreateAccount: true,
                InfoRequestParameters: {
                    GetPlayerProfile: true
                }
            })
        });
        
        if (!loginResponse.ok) {
            if (loginResponse.status === 429) {
                // Rate limited - get retry after seconds if available
                const errorBody = await loginResponse.json();
                const retryAfter = errorBody.retryAfterSeconds || 300; // Default 5 minutes
                throw new Error(`Rate limited. Please wait ${retryAfter} seconds before retrying.`);
            }
            throw new Error(`Failed to create player account: ${loginResponse.status}`);
        }
        
        const loginResult = await loginResponse.json();
        if (loginResult.code !== 200) {
            throw new Error(`PlayFab login error: ${loginResult.errorMessage}`);
        }
        
        const playFabId = loginResult.data.PlayFabId;
        const sessionTicket = loginResult.data.SessionTicket;
        
        // Set display name using the session ticket
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
        
        if (!nameResponse.ok || (await nameResponse.json()).code !== 200) {
            log(`Warning: Failed to set display name for ${model.name}`, 'warning');
        }
        
        // Set player metadata using session ticket
        const metadataResponse = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Client/UpdateUserData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': sessionTicket
            },
            body: JSON.stringify({
                Data: {
                    'player-type': 'ai',
                    'ai-model-name': model.name,
                    'ai-provider': model.provider,
                    'ai-model-key': model.key,
                    'ai-model-cost': JSON.stringify(model.cost),
                    'ai-model-speed': model.responseTime?.speed || 'unknown',
                    'humanPerformanceData': '[]',  // Initialize empty performance data
                    'registration-date': new Date().toISOString()
                }
            })
        });
        
        if (!metadataResponse.ok || (await metadataResponse.json()).code !== 200) {
            log(`Warning: Failed to set metadata for ${model.name}`, 'warning');
        }
        
        log(`Successfully registered ${model.name}`, 'success');
        
        return {
            success: true,
            playFabId,
            customId,
            displayName,
            provider: model.provider,
            modelName: model.name
        };
        
    } catch (error) {
        if (retryCount < 2) {
            log(`Retrying ${model.name} (attempt ${retryCount + 2}/3)...`, 'warning');
            // Wait longer before retrying to avoid rate limits (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 5000 * (retryCount + 1)));
            return registerAIPlayer(model, retryCount + 1);
        }
        
        log(`Failed to register ${model.name}: ${error.message}`, 'error');
        return {
            failed: true,
            customId,
            modelName: model.name,
            error: error.message
        };
    }
}

// Main registration process
async function registerAIModels() {
    // Verify environment variables
    if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
        log('Error: PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY must be set in your .env file.', 'error');
        process.exit(1);
    }
    
    log('🚀 Starting AI Model Registration Process', 'info');
    log(`PlayFab Title ID: ${PLAYFAB_TITLE_ID}`, 'info');
    log(`Arc-explainer API: ${ARC_EXPLAINER_API}`, 'info');
    
    try {
        // Step 1: Discover available models
        const discoveredModels = await discoverModelsFromArcExplainer();
        if (discoveredModels.length === 0) {
            log('No models found from arc-explainer API. Exiting.', 'warning');
            return;
        }
        
        // Step 2: Register each model with rate limiting
        log(`Starting registration of ${discoveredModels.length} models...`, 'progress');
        
        const results = {
            successful: [],
            skipped: [],
            failed: []
        };
        
        // Process models sequentially to avoid rate limits
        for (let i = 0; i < discoveredModels.length; i++) {
            const model = discoveredModels[i];
            log(`Processing ${i + 1}/${discoveredModels.length}: ${model.name}...`, 'progress');
            
            const result = await registerAIPlayer(model);
            
            if (result.success) results.successful.push(result);
            else if (result.skipped) results.skipped.push(result);
            else if (result.failed) results.failed.push(result);
            
            // Wait between each registration to avoid rate limits
            if (i < discoveredModels.length - 1) {
                log('Waiting 20 seconds before next registration to respect rate limits...', 'info');
                await new Promise(resolve => setTimeout(resolve, 20000));
            }
        }
        
        // Step 3: Report results
        log('🎉 AI Model Registration Complete!', 'success');
        log(`✅ Successfully registered: ${results.successful.length} new AI players`, 'success');
        log(`⏭️ Skipped (already exist): ${results.skipped.length} AI players`, 'info');
        log(`❌ Failed: ${results.failed.length} AI players`, results.failed.length > 0 ? 'error' : 'info');
        
        // Show breakdown by provider
        if (results.successful.length > 0) {
            const providerCounts = {};
            results.successful.forEach(result => {
                providerCounts[result.provider] = (providerCounts[result.provider] || 0) + 1;
            });
            
            log('Registration Summary by Provider:', 'success');
            Object.entries(providerCounts).forEach(([provider, count]) => {
                log(`  ${provider}: ${count} models`, 'success');
            });
        }
        
        // Show any failures for debugging
        if (results.failed.length > 0) {
            log('Failed Registrations:', 'error');
            results.failed.forEach(failure => {
                log(`  ${failure.modelName}: ${failure.error}`, 'error');
            });
        }
        
        log('Next steps: AI players are ready for leaderboard integration and performance tracking', 'info');
        
    } catch (error) {
        log(`Registration process failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run the registration process
registerAIModels();
