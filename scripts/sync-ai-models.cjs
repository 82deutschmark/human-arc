// Authored by: Cascade using Claude 3.5 Sonnet
// Date: 2025-09-15T14:31:51-04:00
// Purpose: Comprehensive AI Model Registration & Sync System
// How it works: Reads existing PlayFab mappings, discovers new models from arc-explainer, registers missing ones, updates constants file
// Project usage: Runs during build to keep AI player registrations in sync with arc-explainer models

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;
const ARC_EXPLAINER_API = 'https://arc-explainer-production.up.railway.app/api';
const MODELS_PLAYFAB_FILE = path.resolve(process.cwd(), 'client/src/constants/modelsPlayfab.ts');

// Logging utilities with timestamps and colors
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : 
                  type === 'success' ? '✅' : 
                  type === 'warning' ? '⚠️' : 
                  type === 'progress' ? '🔄' : 
                  type === 'skip' ? '⏭️' : '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Generate consistent CustomID for AI models
function generateCustomID(model) {
    const cleanKey = model.key.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const cleanProvider = model.provider.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return `AI_${cleanProvider}_${cleanKey}`;
}

// Read existing PlayFab mappings from constants file
function readExistingMappings() {
    try {
        if (!fs.existsSync(MODELS_PLAYFAB_FILE)) {
            log('No existing mappings file found. Will create new one.', 'info');
            return {};
        }
        
        const fileContent = fs.readFileSync(MODELS_PLAYFAB_FILE, 'utf-8');
        
        // Extract the mappings object using regex (basic parsing)
        const mappingMatch = fileContent.match(/AI_MODEL_PLAYFAB_MAPPINGS:\s*Record<string,\s*AIModelMapping>\s*=\s*({[\s\S]*?});/);
        if (!mappingMatch) {
            log('Could not parse existing mappings. Starting fresh.', 'warning');
            return {};
        }
        
        // Use eval to parse the object (safe since we control the file)
        const mappingsStr = mappingMatch[1];
        const mappings = eval(`(${mappingsStr})`);
        
        log(`Found ${Object.keys(mappings).length} existing model mappings`, 'success');
        return mappings;
    } catch (error) {
        log(`Error reading existing mappings: ${error.message}`, 'error');
        return {};
    }
}

// Write updated mappings back to constants file
function writeUpdatedMappings(mappings) {
    try {
        const mappingEntries = Object.entries(mappings).map(([key, mapping]) => {
            return `  '${key}': {
    key: '${mapping.key}',
    name: '${mapping.name}',
    provider: '${mapping.provider}',
    playFabId: '${mapping.playFabId}',
    customId: '${mapping.customId}',
    registrationDate: '${mapping.registrationDate}'
  }`;
        }).join(',\n');
        
        const fileContent = `// Authored by: Cascade using Claude 3.5 Sonnet
// Date: ${new Date().toISOString()}
// Purpose: Source of truth for AI model to PlayFab ID mappings
// How it works: Maps arc-explainer model keys to their corresponding PlayFab player IDs
// Project usage: Used by client-side code to reference AI players and for duplicate detection during registration

export interface AIModelMapping {
  key: string;
  name: string;
  provider: string;
  playFabId: string;
  customId: string;
  registrationDate: string;
}

export const AI_MODEL_PLAYFAB_MAPPINGS: Record<string, AIModelMapping> = {
${mappingEntries}
};

// Helper functions for working with mappings
export const getPlayFabIdByModelKey = (modelKey: string): string | undefined => {
  return AI_MODEL_PLAYFAB_MAPPINGS[modelKey]?.playFabId;
};

export const isModelRegistered = (modelKey: string): boolean => {
  return modelKey in AI_MODEL_PLAYFAB_MAPPINGS;
};

export const getAllRegisteredModels = (): AIModelMapping[] => {
  return Object.values(AI_MODEL_PLAYFAB_MAPPINGS);
};

export const getRegisteredModelCount = (): number => {
  return Object.keys(AI_MODEL_PLAYFAB_MAPPINGS).length;
};
`;
        
        fs.writeFileSync(MODELS_PLAYFAB_FILE, fileContent);
        log(`Updated mappings file with ${Object.keys(mappings).length} models`, 'success');
        return true;
    } catch (error) {
        log(`Error writing mappings file: ${error.message}`, 'error');
        return false;
    }
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
        
        return models;
    } catch (error) {
        throw new Error(`Failed to discover models from arc-explainer: ${error.message}`);
    }
}

// Register a single AI model as PlayFab player
async function registerAIPlayer(model, retryCount = 0) {
    const customId = generateCustomID(model);
    const displayName = `AI: ${model.name}`;
    
    try {
        log(`Registering ${model.name} (${model.provider})...`, 'progress');
        
        // Create account using Client API with TitleId in body (working pattern)
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
            if (loginResponse.status === 429) {
                const errorBody = await loginResponse.json();
                const retryAfter = errorBody.retryAfterSeconds || 300;
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
        const newlyCreated = loginResult.data.NewlyCreated;
        
        if (!newlyCreated) {
            log(`Model ${model.name} already exists with PlayFab ID: ${playFabId}`, 'skip');
        }
        
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
        
        if (!nameResponse.ok || (await nameResponse.json()).code !== 200) {
            log(`Warning: Failed to set display name for ${model.name}`, 'warning');
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
                    'ai-model-name': model.name,
                    'ai-provider': model.provider,
                    'ai-model-key': model.key,
                    'ai-model-cost': JSON.stringify(model.cost),
                    'ai-model-speed': model.responseTime?.speed || 'unknown',
                    'humanPerformanceData': '[]',
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
            modelName: model.name,
            modelKey: model.key,
            newlyCreated
        };
        
    } catch (error) {
        if (retryCount < 2) {
            log(`Retrying ${model.name} (attempt ${retryCount + 2}/3)...`, 'warning');
            // Wait longer before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 10000 * (retryCount + 1)));
            return registerAIPlayer(model, retryCount + 1);
        }
        
        log(`Failed to register ${model.name}: ${error.message}`, 'error');
        return {
            failed: true,
            customId,
            modelName: model.name,
            modelKey: model.key,
            error: error.message
        };
    }
}

// Main sync process
async function syncAIModels() {
    // Verify environment variables
    if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
        log('Error: PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY must be set in your .env file.', 'error');
        process.exit(1);
    }
    
    log('🚀 Starting AI Models Sync Process', 'info');
    log(`PlayFab Title ID: ${PLAYFAB_TITLE_ID}`, 'info');
    
    try {
        // Step 1: Read existing mappings
        const existingMappings = readExistingMappings();
        
        // Step 2: Discover available models from arc-explainer
        const discoveredModels = await discoverModelsFromArcExplainer();
        if (discoveredModels.length === 0) {
            log('No models found from arc-explainer API. Exiting.', 'warning');
            return;
        }
        
        // Step 3: Filter out already registered models
        const newModels = discoveredModels.filter(model => !(model.key in existingMappings));
        
        log(`Found ${discoveredModels.length} total models, ${Object.keys(existingMappings).length} already registered, ${newModels.length} new models to register`, 'info');
        
        if (newModels.length === 0) {
            log('✅ All models are already registered. No action needed.', 'success');
            return;
        }
        
        // Show models that will be registered
        log('New models to register:', 'info');
        newModels.slice(0, 5).forEach((model, index) => {
            log(`  ${index + 1}. ${model.name} (${model.provider})`, 'info');
        });
        if (newModels.length > 5) {
            log(`  ... and ${newModels.length - 5} more`, 'info');
        }
        
        // Step 4: Register new models with 25-second delays
        const results = {
            successful: [],
            failed: []
        };
        
        const updatedMappings = { ...existingMappings };
        
        for (let i = 0; i < newModels.length; i++) {
            const model = newModels[i];
            log(`Processing ${i + 1}/${newModels.length}: ${model.name}...`, 'progress');
            
            const result = await registerAIPlayer(model);
            
            if (result.success) {
                results.successful.push(result);
                
                // Add to mappings
                updatedMappings[model.key] = {
                    key: model.key,
                    name: model.name,
                    provider: model.provider,
                    playFabId: result.playFabId,
                    customId: result.customId,
                    registrationDate: new Date().toISOString()
                };
            } else if (result.failed) {
                results.failed.push(result);
            }
            
            // Wait 25 seconds between registrations
            if (i < newModels.length - 1) {
                log('Waiting 25 seconds before next registration to respect rate limits...', 'info');
                await new Promise(resolve => setTimeout(resolve, 25000));
            }
        }
        
        // Step 5: Update constants file with new mappings
        if (results.successful.length > 0) {
            if (writeUpdatedMappings(updatedMappings)) {
                log(`Successfully updated constants file with ${results.successful.length} new model mappings`, 'success');
            } else {
                log('Failed to update constants file. Manual update may be required.', 'error');
            }
        }
        
        // Step 6: Report results
        log('🎉 AI Models Sync Complete!', 'success');
        log(`✅ Successfully registered: ${results.successful.length} new AI players`, 'success');
        log(`❌ Failed: ${results.failed.length} AI players`, results.failed.length > 0 ? 'error' : 'info');
        log(`📊 Total models now registered: ${Object.keys(updatedMappings).length}`, 'success');
        
        // Show breakdown by provider for new registrations
        if (results.successful.length > 0) {
            const providerCounts = {};
            results.successful.forEach(result => {
                providerCounts[result.provider] = (providerCounts[result.provider] || 0) + 1;
            });
            
            log('New registrations by provider:', 'success');
            Object.entries(providerCounts).forEach(([provider, count]) => {
                log(`  ${provider}: ${count} models`, 'success');
            });
        }
        
        // Show any failures for debugging
        if (results.failed.length > 0) {
            log('Failed registrations:', 'error');
            results.failed.forEach(failure => {
                log(`  ${failure.modelName}: ${failure.error}`, 'error');
            });
        }
        
        log('Next steps: AI players are ready for leaderboard integration and performance tracking', 'info');
        
    } catch (error) {
        log(`Sync process failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run the sync process
syncAIModels();
