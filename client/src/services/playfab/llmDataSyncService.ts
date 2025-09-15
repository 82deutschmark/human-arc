/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15
 * PURPOSE: Synchronizes LLM performance data from arc-explainer API to PlayFab player records.
 * Handles massive scale (44 models × thousands of puzzles) with rate limiting and error recovery.
 * SRP and DRY check: Pass - Single responsibility (data sync), reuses existing PlayFab and arc-explainer services
 *
 */

import { playFabCore } from './core';
import { llmPlayerManager } from './llmPlayerManager';
import { idConverter } from '@/services/idConverter';
import { arcExplainerClient, ExplanationRecord } from '@/services/core/arcExplainerClient';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

export interface SyncProgress {
  totalModels: number;
  processedModels: number;
  totalPuzzles: number;
  processedPuzzles: number;
  successfulSyncs: number;
  failedSyncs: number;
  currentModel?: string;
  currentPuzzle?: string;
  errors: string[];
  startTime: number;
  estimatedCompletion?: number;
}

export interface PlayFabPerformanceRecord {
  puzzleId: string;
  correct: boolean;
  scoreData: {
    finalScore: number;
    timeBonus: number;
    basePoints: number;
  };
  newTotalPoints: number;
  timestamp: string;
}

export interface SyncOptions {
  batchSize: number;
  rateLimitMs: number;
  maxRetries: number;
  resumeFromModel?: string;
  resumeFromPuzzle?: string;
  testMode?: boolean; // Only sync first few models/puzzles
  validateOnly?: boolean; // Don't update, just validate
}

/**
 * Service to synchronize LLM performance data from arc-explainer to PlayFab
 * Handles the complexity of massive scale with proper error handling and progress tracking
 */
export class LLMDataSyncService {
  private static instance: LLMDataSyncService;
  private syncProgress: SyncProgress | null = null;
  private isRunning = false;
  private shouldStop = false;

  // Configuration
  private readonly DEFAULT_OPTIONS: SyncOptions = {
    batchSize: 100, // Puzzles per batch
    rateLimitMs: 500, // Delay between API calls
    maxRetries: 3,
    testMode: false,
    validateOnly: false
  };

  private constructor() {}

  public static getInstance(): LLMDataSyncService {
    if (!LLMDataSyncService.instance) {
      LLMDataSyncService.instance = new LLMDataSyncService();
    }
    return LLMDataSyncService.instance;
  }

  /**
   * Start the complete synchronization process for all LLM models
   */
  async startFullSync(options: Partial<SyncOptions> = {}): Promise<SyncProgress> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    if (this.isRunning) {
      throw new Error('Sync is already running. Stop the current sync before starting a new one.');
    }

    console.log('🚀 Starting LLM data synchronization...');
    console.log('📊 Configuration:', config);

    this.isRunning = true;
    this.shouldStop = false;

    try {
      // Initialize progress tracking
      this.syncProgress = {
        totalModels: 0,
        processedModels: 0,
        totalPuzzles: 0,
        processedPuzzles: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        errors: [],
        startTime: Date.now()
      };

      // Step 1: Discover all models and puzzles
      const models = await llmPlayerManager.getDiscoveredModels();
      const puzzleIds = await this.discoverAllPuzzleIds();

      this.syncProgress.totalModels = config.testMode ? Math.min(3, models.length) : models.length;
      this.syncProgress.totalPuzzles = config.testMode ? Math.min(10, puzzleIds.length) : puzzleIds.length;

      console.log(`📋 Sync scope: ${this.syncProgress.totalModels} models × ${this.syncProgress.totalPuzzles} puzzles`);

      // Step 2: Process each model
      const modelsToProcess = config.testMode ? models.slice(0, 3) : models;
      const puzzlesToProcess = config.testMode ? puzzleIds.slice(0, 10) : puzzleIds;

      for (const model of modelsToProcess) {
        if (this.shouldStop) {
          console.log('🛑 Sync stopped by user request');
          break;
        }

        this.syncProgress.currentModel = model.modelName;
        this.syncProgress.processedPuzzles = 0; // Reset for each model

        console.log(`🤖 Processing model: ${model.modelName} (${this.syncProgress.processedModels + 1}/${this.syncProgress.totalModels})`);

        await this.syncModelPerformance(model.modelName, puzzlesToProcess, config);

        this.syncProgress.processedModels++;
        this.updateEstimatedCompletion();
      }

      console.log('✅ LLM data synchronization completed');
      return this.syncProgress;

    } catch (error) {
      console.error('❌ LLM data synchronization failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.syncProgress = null;
    }
  }

  /**
   * Synchronize performance data for a specific model
   */
  private async syncModelPerformance(
    modelName: string,
    puzzleIds: string[],
    config: SyncOptions
  ): Promise<void> {
    console.log(`📊 Syncing performance data for ${modelName}...`);

    const performanceRecords: PlayFabPerformanceRecord[] = [];
    let totalScore = 0;

    // Process puzzles in batches
    for (let i = 0; i < puzzleIds.length; i += config.batchSize) {
      if (this.shouldStop) break;

      const batch = puzzleIds.slice(i, i + config.batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / config.batchSize) + 1}: puzzles ${i + 1}-${Math.min(i + config.batchSize, puzzleIds.length)}`);

      for (const puzzleId of batch) {
        if (this.shouldStop) break;

        this.syncProgress!.currentPuzzle = puzzleId;

        try {
          const record = await this.getModelPerformanceForPuzzle(modelName, puzzleId);

          if (record) {
            performanceRecords.push(record);
            totalScore += record.scoreData.finalScore;
            this.syncProgress!.successfulSyncs++;
          }

          this.syncProgress!.processedPuzzles++;

        } catch (error) {
          console.error(`❌ Failed to process puzzle ${puzzleId} for model ${modelName}:`, error);
          this.syncProgress!.errors.push(`${modelName}/${puzzleId}: ${error}`);
          this.syncProgress!.failedSyncs++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, config.rateLimitMs));
      }
    }

    // Update PlayFab player data
    if (!config.validateOnly && performanceRecords.length > 0) {
      await this.updatePlayFabPlayerData(modelName, performanceRecords, totalScore);
    }

    console.log(`✅ Completed ${modelName}: ${performanceRecords.length} performance records`);
  }

  /**
   * Get model performance for a specific puzzle from arc-explainer
   */
  private async getModelPerformanceForPuzzle(
    modelName: string,
    puzzleId: string
  ): Promise<PlayFabPerformanceRecord | null> {
    try {
      // Convert PlayFab puzzle ID to arc-explainer format
      const arcId = idConverter.normalizeToArcId(puzzleId);
      if (!arcId) {
        console.warn(`⚠️ Could not convert puzzle ID: ${puzzleId}`);
        return null;
      }

      // Fetch explanations for this puzzle
      const response = await fetch(`https://arc-explainer-production.up.railway.app/api/puzzle/${arcId}/explanations`);

      if (!response.ok) {
        if (response.status === 404) {
          // No explanations for this puzzle - not an error
          return null;
        }
        throw new Error(`API responded with status: ${response.status}`);
      }

      const explanations: ExplanationRecord[] = await response.json();

      // Find explanation for this specific model
      const modelExplanation = explanations.find(exp => exp.modelName === modelName);

      if (!modelExplanation) {
        // This model hasn't attempted this puzzle
        return null;
      }

      // Transform to PlayFab format
      return this.transformToPlayFabRecord(modelExplanation, puzzleId);

    } catch (error) {
      console.error(`Failed to get performance for ${modelName}/${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Transform arc-explainer ExplanationRecord to PlayFab performance record
   */
  private transformToPlayFabRecord(
    explanation: ExplanationRecord,
    puzzleId: string
  ): PlayFabPerformanceRecord {
    // Calculate AI score
    const baseScore = explanation.isPredictionCorrect ? 100 : 0;
    const confidenceBonus = explanation.confidence ? (explanation.confidence / 100) * 50 : 0;
    const finalScore = Math.round(baseScore + confidenceBonus);

    return {
      puzzleId,
      correct: explanation.isPredictionCorrect,
      scoreData: {
        finalScore,
        timeBonus: 0, // AI doesn't have time constraints
        basePoints: baseScore
      },
      newTotalPoints: 0, // Will be calculated when updating PlayFab
      timestamp: explanation.createdAt
    };
  }

  /**
   * Update PlayFab player data with performance records
   */
  private async updatePlayFabPlayerData(
    modelName: string,
    records: PlayFabPerformanceRecord[],
    totalScore: number
  ): Promise<void> {
    try {
      // Get the AI player's CustomID
      const customId = llmPlayerManager.getCustomIdForModel(modelName);

      // Login as the AI player to update their data
      const loginResponse = await playFabCore.makeHttpRequest('/Client/LoginWithCustomID', {
        CustomId: customId
      });

      if (!loginResponse.success) {
        throw new Error(`Failed to login as AI player: ${loginResponse.error}`);
      }

      // Update performance data
      await playFabCore.makeHttpRequest('/Client/UpdateUserData', {
        Data: {
          'humanPerformanceData': JSON.stringify(records)
        }
      });

      // Update statistics
      await playFabCore.makeHttpRequest('/Client/UpdatePlayerStatistics', {
        Statistics: [
          {
            StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.OFFICER_TRACK_POINTS,
            Value: totalScore
          }
        ]
      });

      console.log(`📊 Updated PlayFab data for ${modelName}: ${records.length} records, ${totalScore} points`);

    } catch (error) {
      console.error(`❌ Failed to update PlayFab data for ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Discover all puzzle IDs from PlayFab Title Data
   */
  private async discoverAllPuzzleIds(): Promise<string[]> {
    console.log('🔍 Discovering puzzle IDs from PlayFab Title Data...');

    try {
      const response = await playFabCore.makeHttpRequest('/Client/GetTitleData', {
        Keys: [
          'officer-tasks-training-batch1.json',
          'officer-tasks-training-batch2.json',
          'officer-tasks-training2-batch1.json',
          'officer-tasks-evaluation-batch1.json',
          'officer-tasks-evaluation2-batch1.json'
        ]
      });

      if (!response.success) {
        throw new Error(`Failed to get title data: ${response.error}`);
      }

      const allPuzzleIds: string[] = [];

      // Extract puzzle IDs from each batch
      for (const [key, data] of Object.entries(response.data.Data || {})) {
        try {
          const batchData = JSON.parse((data as any).Value);
          if (Array.isArray(batchData)) {
            const puzzleIds = batchData.map(puzzle => puzzle.id).filter(id => id);
            allPuzzleIds.push(...puzzleIds);
            console.log(`📦 Found ${puzzleIds.length} puzzles in ${key}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse ${key}:`, error);
        }
      }

      console.log(`✅ Total puzzle IDs discovered: ${allPuzzleIds.length}`);
      return allPuzzleIds;

    } catch (error) {
      console.error('❌ Failed to discover puzzle IDs:', error);
      throw error;
    }
  }

  /**
   * Update estimated completion time
   */
  private updateEstimatedCompletion(): void {
    if (!this.syncProgress) return;

    const elapsed = Date.now() - this.syncProgress.startTime;
    const totalWork = this.syncProgress.totalModels * this.syncProgress.totalPuzzles;
    const completedWork = (this.syncProgress.processedModels * this.syncProgress.totalPuzzles) +
                          this.syncProgress.processedPuzzles;

    if (completedWork > 0) {
      const rate = completedWork / elapsed;
      const remainingWork = totalWork - completedWork;
      this.syncProgress.estimatedCompletion = Date.now() + (remainingWork / rate);
    }
  }

  /**
   * Get current sync progress
   */
  getSyncProgress(): SyncProgress | null {
    return this.syncProgress;
  }

  /**
   * Stop the current sync operation
   */
  stopSync(): void {
    if (this.isRunning) {
      console.log('🛑 Stopping sync operation...');
      this.shouldStop = true;
    }
  }

  /**
   * Check if sync is currently running
   */
  isRunningSync(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const llmDataSyncService = LLMDataSyncService.getInstance();