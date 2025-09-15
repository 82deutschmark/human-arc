/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: Manages LLM models as PlayFab players, enabling unified leaderboards and comparisons.
 * Creates and maintains AI player profiles using the same data structures as human players.
 * SRP and DRY check: Pass - Single responsibility (LLM player management), reuses existing PlayFab patterns
 *
 */

import { playFabRequestManager } from './requestManager';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';
import { arcExplainerClient } from '@/services/core/arcExplainerClient';

interface ArcExplainerModelResponse {
  name: string;
  provider: string;
  capabilities?: string[];
  active: boolean;
}

export interface ModelMetadata {
  provider: string;
  modelName: string;
  version?: string;
  modelType?: 'chat' | 'reasoning' | 'code' | 'mini' | 'nano';
  capabilities?: string[];
  isActive: boolean;
}

export interface LLMPlayerInfo {
  customId: string;
  displayName: string;
  metadata: ModelMetadata;
  playFabId?: string;
}

/**
 * Service to manage LLM models as PlayFab players
 * Enables unified leaderboards and direct human vs AI comparisons
 */
export class LLMPlayerManager {
  private static instance: LLMPlayerManager;

  // Cache for discovered models
  private discoveredModels: ModelMetadata[] = [];
  private modelsLastFetched: number = 0;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  public static getInstance(): LLMPlayerManager {
    if (!LLMPlayerManager.instance) {
      LLMPlayerManager.instance = new LLMPlayerManager();
    }
    return LLMPlayerManager.instance;
  }

  /**
   * Convert model name to PlayFab-compatible CustomID
   * Example: "qwen/qwen3-30b-a3b-instruct-2507" -> "AI_QWEN_QWEN3_30B_A3B_INSTRUCT_2507"
   */
  private modelNameToCustomId(modelName: string): string {
    const cleaned = modelName
      .replace(/[^a-zA-Z0-9\-\_]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .toUpperCase()
      .substring(0, 50); // PlayFab CustomID limit

    return `AI_${cleaned}`;
  }

  /**
   * Discover all available models from arc-explainer API
   */
  async discoverModelsFromAPI(): Promise<ModelMetadata[]> {
    console.log('🔍 Discovering models from arc-explainer API...');

    try {
      // Check cache first
      const now = Date.now();
      if (this.discoveredModels.length > 0 && (now - this.modelsLastFetched) < this.CACHE_TTL) {
        console.log(`📋 Using cached models: ${this.discoveredModels.length} models`);
        return this.discoveredModels;
      }

      // Fetch fresh data from API
      const response = await fetch('https://arc-explainer-production.up.railway.app/api/models');

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected models array');
      }

      console.log(`🌐 Fetched ${data.length} models from API`);

      // Transform API response to our format
      this.discoveredModels = data.map((model: ArcExplainerModelResponse) =>
        this.parseModelMetadata(model)
      );

      this.modelsLastFetched = now;

      console.log(`✅ Successfully processed ${this.discoveredModels.length} models`);
      return this.discoveredModels;

    } catch (error) {
      console.error('❌ Failed to discover models from API:', error);

      // If we have cached data, return it as fallback
      if (this.discoveredModels.length > 0) {
        console.log(`🔄 Using cached models as fallback: ${this.discoveredModels.length} models`);
        return this.discoveredModels;
      }

      throw new Error(`Model discovery failed: ${error}`);
    }
  }

  /**
   * Parse and normalize model metadata from arc-explainer API
   */
  private parseModelMetadata(apiModel: ArcExplainerModelResponse): ModelMetadata {
    const modelName = apiModel.name;
    let provider = apiModel.provider || 'Unknown';

    // Normalize provider names
    if (modelName.toLowerCase().includes('gpt') || modelName.toLowerCase().includes('openai')) {
      provider = 'OpenAI';
    } else if (modelName.toLowerCase().includes('claude')) {
      provider = 'Anthropic';
    } else if (modelName.toLowerCase().includes('gemini')) {
      provider = 'Google';
    } else if (modelName.toLowerCase().includes('deepseek')) {
      provider = 'DeepSeek';
    } else if (modelName.toLowerCase().includes('llama')) {
      provider = 'Meta';
    } else if (modelName.toLowerCase().includes('qwen')) {
      provider = 'Qwen';
    } else if (modelName.toLowerCase().includes('mistral')) {
      provider = 'Mistral';
    } else if (modelName.toLowerCase().includes('grok')) {
      provider = 'xAI';
    }

    // Determine model type from name
    let modelType: ModelMetadata['modelType'] = 'chat';
    if (modelName.toLowerCase().includes('mini')) {
      modelType = 'mini';
    } else if (modelName.toLowerCase().includes('nano')) {
      modelType = 'nano';
    } else if (modelName.toLowerCase().includes('reason')) {
      modelType = 'reasoning';
    } else if (modelName.toLowerCase().includes('code')) {
      modelType = 'code';
    }

    // Extract version from name if possible
    const versionMatch = modelName.match(/(\d+\.?\d*)/);
    const version = versionMatch ? versionMatch[1] : undefined;

    return {
      provider,
      modelName,
      version,
      modelType,
      capabilities: apiModel.capabilities || [],
      isActive: apiModel.active !== false // Default to true if not specified
    };
  }

  /**
   * Generate human-readable display name for AI player
   * Example: "gpt-5-mini-2025-08-07" -> "AI: GPT-5 Mini"
   */
  private generateDisplayName(metadata: ModelMetadata): string {
    const name = metadata.modelName
      .replace(/^[^\/]*\//, '') // Remove provider prefix
      .replace(/-\d{4}-\d{2}-\d{2}$/, '') // Remove date suffix
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return `AI: ${name}`;
  }

  /**
   * Create or retrieve PlayFab player for an LLM model
   */
  async createLLMPlayer(metadata: ModelMetadata): Promise<LLMPlayerInfo> {
    const customId = this.modelNameToCustomId(metadata.modelName);
    const displayName = this.generateDisplayName(metadata);

    console.log(`🤖 Creating LLM player: ${customId} -> ${displayName}`);

    try {
      // Step 1: Login/Create the AI player using CustomID
      const loginResponse = await playFabRequestManager.makeRequest('/Client/LoginWithCustomID', {
        CustomId: customId,
        CreateAccount: true,
        InfoRequestParameters: {
          GetPlayerProfile: true
        }
      });

      if (!loginResponse.success) {
        throw new Error(`Failed to create LLM player ${customId}: ${loginResponse.error}`);
      }

      const playFabId = loginResponse.data.PlayFabId;
      console.log(`✅ Created/Retrieved PlayFab player: ${playFabId}`);

      // Step 2: Set display name
      await playFabRequestManager.makeRequest('/Client/UpdateUserTitleDisplayName', {
        DisplayName: displayName
      });

      // Step 3: Initialize player data
      await playFabRequestManager.makeRequest('/Client/UpdateUserData', {
        Data: {
          'player-type': 'ai',
          'model-metadata': JSON.stringify(metadata),
          'humanPerformanceData': '[]', // Empty performance data initially
          'ai-model-name': metadata.modelName, // For easy lookup
          'ai-provider': metadata.provider
        }
      });

      // Step 4: Initialize statistics (set to 0)
      await playFabRequestManager.makeRequest('/Client/UpdatePlayerStatistics', {
        Statistics: [
          {
            StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.OFFICER_TRACK_POINTS,
            Value: 0
          },
          {
            StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.ARC2_EVAL_POINTS,
            Value: 0
          }
        ]
      });

      console.log(`🎯 Initialized LLM player data for ${displayName}`);

      return {
        customId,
        displayName,
        metadata,
        playFabId
      };

    } catch (error) {
      console.error(`❌ Failed to create LLM player ${customId}:`, error);
      throw error;
    }
  }

  /**
   * Register all discovered LLM models as PlayFab players
   */
  async registerAllLLMPlayers(): Promise<LLMPlayerInfo[]> {
    console.log('🚀 Starting LLM player registration process...');

    try {
      // First, discover all models from the API
      const models = await this.discoverModelsFromAPI();
      console.log(`📋 Found ${models.length} models to register`);

      const results: LLMPlayerInfo[] = [];
      const failed: string[] = [];

      // Register each model with error handling
      for (let i = 0; i < models.length; i++) {
        const metadata = models[i];
        console.log(`[${i + 1}/${models.length}] Processing: ${metadata.modelName}`);

        try {
          const playerInfo = await this.createLLMPlayer(metadata);
          results.push(playerInfo);
          console.log(`✅ Registered: ${playerInfo.displayName}`);

        } catch (error) {
          console.error(`❌ Failed to register ${metadata.modelName}:`, error);
          failed.push(metadata.modelName);
        }

        // Rate limiting: small delay between registrations
        if (i < models.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`🎉 Registration complete: ${results.length}/${models.length} models registered`);

      if (failed.length > 0) {
        console.warn(`⚠️ Failed to register ${failed.length} models:`, failed);
      }

      return results;

    } catch (error) {
      console.error('❌ LLM player registration failed:', error);
      throw error;
    }
  }

  /**
   * Get all discovered model metadata (fetches from API if needed)
   */
  async getDiscoveredModels(): Promise<ModelMetadata[]> {
    return await this.discoverModelsFromAPI();
  }

  /**
   * Get cached model metadata (doesn't make API call)
   */
  getCachedModels(): ModelMetadata[] {
    return [...this.discoveredModels];
  }

  /**
   * Register a single LLM model by name
   */
  async registerModelByName(modelName: string): Promise<LLMPlayerInfo | null> {
    console.log(`🤖 Registering single model: ${modelName}`);

    try {
      const models = await this.discoverModelsFromAPI();
      const targetModel = models.find(m => m.modelName === modelName);

      if (!targetModel) {
        throw new Error(`Model not found: ${modelName}`);
      }

      const playerInfo = await this.createLLMPlayer(targetModel);
      console.log(`✅ Successfully registered: ${playerInfo.displayName}`);

      return playerInfo;

    } catch (error) {
      console.error(`❌ Failed to register model ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Find LLM player CustomID by model name
   */
  getCustomIdForModel(modelName: string): string {
    return this.modelNameToCustomId(modelName);
  }

  /**
   * Check if a player is an AI model
   */
  async isAIPlayer(playFabId: string): Promise<boolean> {
    try {
      const response = await playFabRequestManager.makeRequest('/Client/GetUserData', {
        PlayFabId: playFabId,
        Keys: ['player-type']
      });

      return response.success &&
             response.data?.Data?.['player-type']?.Value === 'ai';
    } catch (error) {
      console.error(`Error checking if player ${playFabId} is AI:`, error);
      return false;
    }
  }

  /**
   * Get AI player metadata
   */
  async getAIPlayerMetadata(playFabId: string): Promise<ModelMetadata | null> {
    try {
      const response = await playFabRequestManager.makeRequest('/Client/GetUserData', {
        PlayFabId: playFabId,
        Keys: ['model-metadata']
      });

      if (response.success && response.data?.Data?.['model-metadata']?.Value) {
        return JSON.parse(response.data.Data['model-metadata'].Value);
      }

      return null;
    } catch (error) {
      console.error(`Error getting AI player metadata for ${playFabId}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const llmPlayerManager = LLMPlayerManager.getInstance();