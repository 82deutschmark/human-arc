/**
 * PlayFab User Data Service - Pure HTTP Implementation
 * Manages player profiles, progress tracking
 * Direct REST API calls - no SDK dependencies
 */

import type { PlayFabPlayer, RankLevel } from '@/types/playfab';
import { playFabAuthManager } from './authManager';
import { playFabRequestManager } from './requestManager';

// PlayFab GetUserData response format
interface GetUserDataResponse {
  Data?: Record<string, {
    Value: string;
    LastUpdated: string;
    Permission?: string;
  }>;
}

// PlayFab UpdateUserData request format
interface UpdateUserDataRequest {
  Data: Record<string, string>;
  Permission?: string;
}

export class PlayFabUserData {
  private static instance: PlayFabUserData;
  private currentPlayer: PlayFabPlayer | null = null;

  private constructor() {}

  public static getInstance(): PlayFabUserData {
    if (!PlayFabUserData.instance) {
      PlayFabUserData.instance = new PlayFabUserData();
    }
    return PlayFabUserData.instance;
  }

  /**
   * Get current player data from PlayFab User Data (HTTP implementation)
   * Creates default player data for new users
   */
  public async getPlayerData(): Promise<PlayFabPlayer> {
    const playFabId = playFabAuthManager.getPlayFabId();
    if (!playFabId) {
      throw new Error('No PlayFab ID available');
    }

    try {
      const result = await playFabRequestManager.makeRequest<{}, GetUserDataResponse>(
        'getUserData',
        {} // Empty request body
      );

      const userData = result?.Data || {};
      
      // Create player object from PlayFab data or defaults for new players
      const player: PlayFabPlayer = {
        id: playFabId,
        username: userData.username?.Value || playFabAuthManager.getDisplayName() || 'Anonymous',
        rank: userData.rank?.Value || 'Specialist 1',
        rankLevel: parseInt(userData.rankLevel?.Value || '1'),
        totalPoints: parseInt(userData.totalPoints?.Value || '0'),
        completedMissions: parseInt(userData.completedMissions?.Value || '0'),
        currentTask: userData.currentTask?.Value || undefined,
        hasCompletedTutorial: userData.hasCompletedTutorial?.Value === 'true',
        createdAt: new Date(userData.createdAt?.Value || Date.now()),
        updatedAt: new Date()
      };
      
      this.currentPlayer = player;
      console.log('[PlayFabUserData] Player Data Loaded:', {
        id: player.id,
        username: player.username,
        rank: player.rank
      });

      // Initialize new player data if this is a first-time user
      if (!userData.createdAt) {
        await this.initializeNewPlayer(player);
      }

      return player;
    } catch (error) {
      console.error('[PlayFabUserData] Player Data Load Failed:', error);
      throw error;
    }
  }

  /**
   * Update custom user data fields in PlayFab (for storing arbitrary data like ELO ratings)
   * September 14, 2025 - Added for ExplanationArena ELO storage
   */
  public async updateCustomUserData(customData: Record<string, string>): Promise<void> {
    try {
      const request: UpdateUserDataRequest = {
        Data: customData
      };

      await playFabRequestManager.makeRequest<UpdateUserDataRequest, {}>(
        'updateUserData',
        request
      );

      console.log('[PlayFabUserData] Custom User Data Updated:', Object.keys(customData));
    } catch (error) {
      console.error('[PlayFabUserData] Custom User Data Update Failed:', error);
      throw error;
    }
  }

  /**
   * Get custom user data fields from PlayFab
   * September 14, 2025 - Added for ExplanationArena ELO storage
   */
  public async getCustomUserData(keys: string[]): Promise<Record<string, string | undefined>> {
    try {
      const result = await playFabRequestManager.makeRequest<{ Keys: string[] }, GetUserDataResponse>(
        'getUserData',
        { Keys: keys }
      );

      const customData: Record<string, string | undefined> = {};
      keys.forEach(key => {
        customData[key] = result?.Data?.[key]?.Value;
      });

      return customData;
    } catch (error) {
      console.error('[PlayFabUserData] Failed to get custom user data:', error);
      throw error;
    }
  }

  /**
   * Update player data in PlayFab User Data (HTTP implementation)
   */
  public async updatePlayerData(updates: Partial<PlayFabPlayer>): Promise<void> {
    if (!this.currentPlayer) {
      throw new Error('Player data not loaded. Call getPlayerData() first.');
    }

    // Update local player data
    this.currentPlayer = { ...this.currentPlayer, ...updates, updatedAt: new Date() };

    const dataToUpdate: Record<string, string> = {};

    // Convert player data to PlayFab UserData format
    if (updates.username) dataToUpdate.username = updates.username;
    if (updates.rank) dataToUpdate.rank = updates.rank;
    if (updates.rankLevel !== undefined) dataToUpdate.rankLevel = updates.rankLevel.toString();
    if (updates.totalPoints !== undefined) dataToUpdate.totalPoints = updates.totalPoints.toString();
    if (updates.completedMissions !== undefined) dataToUpdate.completedMissions = updates.completedMissions.toString();
    if (updates.currentTask) dataToUpdate.currentTask = updates.currentTask;
    if (updates.hasCompletedTutorial !== undefined) dataToUpdate.hasCompletedTutorial = updates.hasCompletedTutorial.toString();
    dataToUpdate.updatedAt = new Date().toISOString();

    try {
      const request: UpdateUserDataRequest = {
        Data: dataToUpdate
      };

      await playFabRequestManager.makeRequest<UpdateUserDataRequest, {}>(
        'updateUserData',
        request
      );

      console.log('[PlayFabUserData] Player Data Updated:', Object.keys(dataToUpdate));
    } catch (error) {
      console.error('[PlayFabUserData] Player Data Update Failed:', error);
      throw error;
    }
  }

  /**
   * Add points and update rank progression
   */
  public async addPoints(points: number, missionCompleted: boolean = false): Promise<{
    newTotalPoints: number;
    newRank: string;
    rankUp: boolean;
    newCompletedMissions: number;
  }> {
    if (!this.currentPlayer) {
      throw new Error('Player data not loaded');
    }

    const oldRankLevel = this.currentPlayer.rankLevel;
    const newTotalPoints = this.currentPlayer.totalPoints + points;
    const newRankLevel = this.calculateRankLevel(newTotalPoints);
    const newRank = this.getRankName(newRankLevel);
    const rankUp = newRankLevel > oldRankLevel;
    const newCompletedMissions = missionCompleted 
      ? this.currentPlayer.completedMissions + 1 
      : this.currentPlayer.completedMissions;

    // Update player data
    await this.updatePlayerData({
      totalPoints: newTotalPoints,
      rankLevel: newRankLevel,
      rank: newRank,
      completedMissions: newCompletedMissions
    });

    console.log('[PlayFabUserData] Points Added:', { points, newTotal: newTotalPoints, rankUp });

    return {
      newTotalPoints,
      newRank,
      rankUp,
      newCompletedMissions
    };
  }

  /**
   * Set current task being worked on
   */
  public async setCurrentTask(taskId: string | undefined): Promise<void> {
    await this.updatePlayerData({ currentTask: taskId });
  }

  /**
   * Calculate rank level based on total points
   * Matches Unity's rank progression system
   */
  public calculateRankLevel(totalPoints: number): RankLevel {
    // Rank progression: every 1000 points = 1 rank level, max 11 levels
    const calculatedLevel = Math.floor(totalPoints / 1000) + 1;
    return Math.min(calculatedLevel, 11) as RankLevel;
  }

  /**
   * Get rank name based on rank level
   * Matches Unity's rank naming system
   */
  public getRankName(rankLevel: RankLevel): string {
    const ranks = [
      'Specialist 1',      // Level 1
      'Specialist 2',      // Level 2  
      'Specialist 3',      // Level 3
      'Specialist 4',      // Level 4
      'Corporal',          // Level 5
      'Sergeant',          // Level 6
      'Staff Sergeant',    // Level 7
      'Technical Sergeant', // Level 8
      'Master Sergeant',   // Level 9
      'Senior Master Sergeant', // Level 10
      'Chief Master Sergeant'   // Level 11+
    ];
    return ranks[rankLevel - 1] || 'Chief Master Sergeant';
  }

  /**
   * Get points needed for next rank
   */
  public getPointsToNextRank(currentPoints: number): number {
    const currentLevel = this.calculateRankLevel(currentPoints);
    if (currentLevel >= 11) return 0; // Max rank reached

    const nextLevelPoints = currentLevel * 1000;
    return Math.max(0, nextLevelPoints - currentPoints);
  }

  /**
   * Get current player (cached)
   */
  public getCurrentPlayer(): PlayFabPlayer | null {
    return this.currentPlayer;
  }

  /**
   * Initialize new player with default data (HTTP implementation)
   */
  private async initializeNewPlayer(player: PlayFabPlayer): Promise<void> {
    const initialData = {
      createdAt: new Date().toISOString(),
      username: player.username,
      rank: 'Specialist 1',
      rankLevel: '1',
      totalPoints: '0',
      completedMissions: '0',
      updatedAt: new Date().toISOString()
    };
    
    try {
      const request: UpdateUserDataRequest = {
        Data: initialData
      };

      await playFabRequestManager.makeRequest<UpdateUserDataRequest, {}>(
        'updateUserData',
        request
      );

      console.log(`[PlayFabUserData] New Player Initialized: ${player.username}`);
    } catch (error) {
      console.error('Failed to initialize new player:', error);
    }
  }

  /**
   * Reset player data (for testing purposes) (HTTP implementation)
   */
  public async resetPlayerData(): Promise<void> {
    const resetData = {
      rank: 'Specialist 1',
      rankLevel: '1',
      totalPoints: '0',
      completedMissions: '0',
      currentTask: '',
      updatedAt: new Date().toISOString()
    };
    
    try {
      const request: UpdateUserDataRequest = {
        Data: resetData
      };

      await playFabRequestManager.makeRequest<UpdateUserDataRequest, {}>(
        'updateUserData',
        request
      );

      // Update local cache
      if (this.currentPlayer) {
        this.currentPlayer = {
          ...this.currentPlayer,
          rank: 'Specialist 1',
          rankLevel: 1,
          totalPoints: 0,
          completedMissions: 0,
          currentTask: undefined,
          updatedAt: new Date()
        };
      }

      console.log('[PlayFabUserData] Player Data Reset');
    } catch (error) {
      console.error('[PlayFabUserData] Player Data Reset Failed:', error);
      throw error;
    }
  }

  /**
   * Get player statistics summary
   */
  /**
   * Get human performance data for assessment comparison
   */
  public async getHumanPerformanceData(): Promise<any[]> {
    const playFabId = playFabAuthManager.getPlayFabId();
    if (!playFabId) {
      throw new Error('No PlayFab ID available for fetching performance data');
    }

    try {
      const result = await playFabRequestManager.makeRequest<{ Keys: string[] }, GetUserDataResponse>(
        'getUserData',
        { Keys: ['humanPerformanceData'] }
      );

      const performanceDataString = result?.Data?.humanPerformanceData?.Value;
      if (performanceDataString) {
        // The data is stored as a JSON string, so it needs to be parsed.
        return JSON.parse(performanceDataString);
      }
      return []; // Return an empty array if no data is found.
    } catch (error) {
      console.error('[PlayFabUserData] Failed to get human performance data:', error);
      throw error;
    }
  }

  /**
   * Check if a specific puzzle has been completed by the player
   * Returns completion details if found, null otherwise
   */
  public async checkPuzzleCompletion(puzzleId: string): Promise<{
    completed: boolean;
    scoreData?: any;
    completionDate?: string;
    alreadySubmittedStrategy?: boolean;
  }> {
    const playFabId = playFabAuthManager.getPlayFabId();
    if (!playFabId) {
      console.log('[PlayFabUserData] No PlayFab ID - treating as not completed');
      return { completed: false };
    }

    try {
      const result = await playFabRequestManager.makeRequest<{ Keys: string[] }, GetUserDataResponse>(
        'getUserData',
        { Keys: ['humanPerformanceData', 'strategySubmissions'] }
      );

      // Check humanPerformanceData for completion
      const performanceDataString = result?.Data?.humanPerformanceData?.Value;
      const strategySubmissionsString = result?.Data?.strategySubmissions?.Value;

      let completionRecord = null;
      if (performanceDataString && performanceDataString !== 'undefined') {
        const performanceData = JSON.parse(performanceDataString);
        completionRecord = performanceData.find((record: any) => record.puzzleId === puzzleId);
      }

      // Check strategy submissions
      let strategySubmitted = false;
      if (strategySubmissionsString && strategySubmissionsString !== 'undefined') {
        const strategySubmissions = JSON.parse(strategySubmissionsString);
        strategySubmitted = strategySubmissions.includes(puzzleId);
      }

      const completed = !!completionRecord;

      console.log(`[PlayFabUserData] Puzzle ${puzzleId} completion check:`, {
        completed,
        hasScoreData: !!completionRecord,
        strategySubmitted
      });

      return {
        completed,
        scoreData: completionRecord || undefined,
        completionDate: completionRecord?.timestamp || undefined,
        alreadySubmittedStrategy: strategySubmitted
      };

    } catch (error) {
      console.error('[PlayFabUserData] Failed to check puzzle completion:', error);
      return { completed: false };
    }
  }

  /**
   * Award strategy bonus points via CloudScript
   * Calls the AwardStrategyBonus CloudScript function
   */
  public async awardStrategyBonus(puzzleId: string): Promise<{
    success: boolean;
    bonusAwarded: boolean;
    bonusPoints?: number;
    updatedScores?: any;
    message?: string;
    error?: string;
  }> {
    const playFabId = playFabAuthManager.getPlayFabId();
    if (!playFabId) {
      return {
        success: false,
        bonusAwarded: false,
        error: 'No PlayFab ID available'
      };
    }

    try {
      console.log(`[PlayFabUserData] Requesting strategy bonus for puzzle: ${puzzleId}`);

      const result = await playFabRequestManager.makeRequest<
        { FunctionName: string; FunctionParameter: any },
        { FunctionResult: any }
      >(
        'executeCloudScript',
        {
          FunctionName: 'AwardStrategyBonus',
          FunctionParameter: { puzzleId }
        }
      );

      const functionResult = result?.FunctionResult;

      console.log('[PlayFabUserData] Strategy bonus result:', functionResult);

      return {
        success: functionResult?.success || false,
        bonusAwarded: functionResult?.bonusAwarded || false,
        bonusPoints: functionResult?.bonusPoints,
        updatedScores: functionResult?.updatedScores,
        message: functionResult?.message,
        error: functionResult?.error
      };

    } catch (error) {
      console.error('[PlayFabUserData] Failed to award strategy bonus:', error);
      return {
        success: false,
        bonusAwarded: false,
        error: 'Failed to communicate with server'
      };
    }
  }

  public getPlayerStats(): {
    totalPoints: number;
    completedMissions: number;
    currentRank: string;
    rankLevel: RankLevel;
    pointsToNextRank: number;
    progressPercentage: number;
  } | null {
    if (!this.currentPlayer) return null;

    const pointsToNext = this.getPointsToNextRank(this.currentPlayer.totalPoints);
    const currentLevelBase = (this.currentPlayer.rankLevel - 1) * 1000;
    const pointsInCurrentLevel = this.currentPlayer.totalPoints - currentLevelBase;
    const progressPercentage = this.currentPlayer.rankLevel >= 11 
      ? 100 
      : (pointsInCurrentLevel / 1000) * 100;

    return {
      totalPoints: this.currentPlayer.totalPoints,
      completedMissions: this.currentPlayer.completedMissions,
      currentRank: this.currentPlayer.rank,
      rankLevel: this.currentPlayer.rankLevel as RankLevel,
      pointsToNextRank: pointsToNext,
      progressPercentage: Math.round(progressPercentage)
    };
  }
}

// Export singleton instance
export const playFabUserData = PlayFabUserData.getInstance();