/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-14
 * PURPOSE: ELO Rating Service for LMArena-style explanation comparisons
 * Uses standard chess ELO formula to rank AI models and human explanations
 * Tracks individual model performance and maintains ratings in PlayFab
 * SRP and DRY check: Pass - Single responsibility for ELO calculations
 */

import { playFabUserData } from '@/services/playfab';

// Standard ELO rating constants
const DEFAULT_RATING = 1200;
const K_FACTOR_NEW = 32;    // For players/models with < 30 games
const K_FACTOR_ESTABLISHED = 16; // For established players/models
const GAMES_THRESHOLD = 30; // Games needed to be considered "established"

export interface ELORating {
  rating: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  lastUpdated: string;
  modelName?: string;
  playerName?: string;
  type: 'ai' | 'human';
}

export interface ELOMatchResult {
  winnerId: string;
  loserId: string;
  isDraw: boolean;
}

export interface ELORatings {
  [playerId: string]: ELORating;
}

export class ELORatingService {
  private static instance: ELORatingService;

  private constructor() {}

  public static getInstance(): ELORatingService {
    if (!ELORatingService.instance) {
      ELORatingService.instance = new ELORatingService();
    }
    return ELORatingService.instance;
  }

  /**
   * Calculate ELO rating changes for a match result
   * Uses standard chess ELO formula: newRating = oldRating + K * (result - expected)
   */
  public calculateELOChange(
    playerARating: number,
    playerBRating: number,
    playerAGames: number,
    playerBGames: number,
    result: 'A_WINS' | 'B_WINS' | 'DRAW'
  ): { newRatingA: number; newRatingB: number } {
    // Determine K-factors based on experience
    const kFactorA = playerAGames < GAMES_THRESHOLD ? K_FACTOR_NEW : K_FACTOR_ESTABLISHED;
    const kFactorB = playerBGames < GAMES_THRESHOLD ? K_FACTOR_NEW : K_FACTOR_ESTABLISHED;

    // Calculate expected scores
    const expectedA = this.calculateExpectedScore(playerARating, playerBRating);
    const expectedB = this.calculateExpectedScore(playerBRating, playerARating);

    // Determine actual scores based on result
    let actualScoreA: number;
    let actualScoreB: number;

    switch (result) {
      case 'A_WINS':
        actualScoreA = 1;
        actualScoreB = 0;
        break;
      case 'B_WINS':
        actualScoreA = 0;
        actualScoreB = 1;
        break;
      case 'DRAW':
        actualScoreA = 0.5;
        actualScoreB = 0.5;
        break;
    }

    // Calculate new ratings
    const newRatingA = Math.round(playerARating + kFactorA * (actualScoreA - expectedA));
    const newRatingB = Math.round(playerBRating + kFactorB * (actualScoreB - expectedB));

    return { newRatingA, newRatingB };
  }

  /**
   * Calculate expected score for a player given their rating vs opponent's rating
   * Formula: 1 / (1 + 10^((opponentRating - playerRating) / 400))
   */
  private calculateExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Get current ELO ratings from PlayFab User Data
   */
  public async getELORatings(): Promise<ELORatings> {
    try {
      const result = await playFabUserData.getPlayerData();
      // ELO ratings will be stored in a separate userData field
      const userData = await this.getELOUserData();

      if (userData.explanationELORatings) {
        const ratingsString = userData.explanationELORatings;
        if (ratingsString && ratingsString !== 'undefined') {
          return JSON.parse(ratingsString);
        }
      }

      return {};
    } catch (error) {
      console.error('Failed to get ELO ratings:', error);
      return {};
    }
  }

  /**
   * Save ELO ratings to PlayFab User Data
   */
  public async saveELORatings(ratings: ELORatings): Promise<void> {
    try {
      await playFabUserData.updatePlayerData({
        explanationELORatings: JSON.stringify(ratings)
      } as any);
      console.log('ELO ratings saved successfully');
    } catch (error) {
      console.error('Failed to save ELO ratings:', error);
      throw error;
    }
  }

  /**
   * Get or create ELO rating for a player/model
   */
  public getOrCreateRating(
    ratings: ELORatings,
    playerId: string,
    type: 'ai' | 'human',
    modelName?: string,
    playerName?: string
  ): ELORating {
    if (ratings[playerId]) {
      return ratings[playerId];
    }

    // Create new rating entry
    const newRating: ELORating = {
      rating: DEFAULT_RATING,
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      lastUpdated: new Date().toISOString(),
      type,
      modelName,
      playerName
    };

    ratings[playerId] = newRating;
    return newRating;
  }

  /**
   * Process a match result and update ratings
   */
  public async processMatchResult(
    playerAId: string,
    playerBId: string,
    result: 'A_WINS' | 'B_WINS' | 'DRAW',
    playerAInfo: { type: 'ai' | 'human'; name?: string; modelName?: string },
    playerBInfo: { type: 'ai' | 'human'; name?: string; modelName?: string }
  ): Promise<{ updatedRatings: ELORatings; changes: { playerA: number; playerB: number } }> {
    const ratings = await this.getELORatings();

    // Get or create ratings for both players
    const ratingA = this.getOrCreateRating(
      ratings,
      playerAId,
      playerAInfo.type,
      playerAInfo.modelName,
      playerAInfo.name
    );
    const ratingB = this.getOrCreateRating(
      ratings,
      playerBId,
      playerBInfo.type,
      playerBInfo.modelName,
      playerBInfo.name
    );

    // Calculate new ratings
    const { newRatingA, newRatingB } = this.calculateELOChange(
      ratingA.rating,
      ratingB.rating,
      ratingA.games,
      ratingB.games,
      result
    );

    // Update rating records
    const oldRatingA = ratingA.rating;
    const oldRatingB = ratingB.rating;

    ratingA.rating = newRatingA;
    ratingA.games += 1;
    ratingA.lastUpdated = new Date().toISOString();

    ratingB.rating = newRatingB;
    ratingB.games += 1;
    ratingB.lastUpdated = new Date().toISOString();

    // Update win/loss/tie records
    switch (result) {
      case 'A_WINS':
        ratingA.wins += 1;
        ratingB.losses += 1;
        break;
      case 'B_WINS':
        ratingA.losses += 1;
        ratingB.wins += 1;
        break;
      case 'DRAW':
        ratingA.ties += 1;
        ratingB.ties += 1;
        break;
    }

    // Save updated ratings
    await this.saveELORatings(ratings);

    console.log(`ELO Update: ${playerAId} (${oldRatingA} → ${newRatingA}) vs ${playerBId} (${oldRatingB} → ${newRatingB}), Result: ${result}`);

    return {
      updatedRatings: ratings,
      changes: {
        playerA: newRatingA - oldRatingA,
        playerB: newRatingB - oldRatingB
      }
    };
  }

  /**
   * Get top-rated players/models
   */
  public getLeaderboard(ratings: ELORatings, type?: 'ai' | 'human', minGames: number = 5): ELORating[] {
    const filteredRatings = Object.values(ratings)
      .filter(rating => rating.games >= minGames)
      .filter(rating => !type || rating.type === type)
      .sort((a, b) => b.rating - a.rating);

    return filteredRatings;
  }

  /**
   * Get stats for a specific player/model
   */
  public getPlayerStats(ratings: ELORatings, playerId: string): ELORating | null {
    return ratings[playerId] || null;
  }

  /**
   * Calculate win percentage for a rating
   */
  public calculateWinPercentage(rating: ELORating): number {
    if (rating.games === 0) return 0;
    return ((rating.wins + rating.ties * 0.5) / rating.games) * 100;
  }

  /**
   * Get ELO-specific user data from PlayFab
   */
  private async getELOUserData(): Promise<{ explanationELORatings?: string }> {
    try {
      // This is a simplified version - in real implementation we'd need to call PlayFab getUserData
      // with specific keys for ELO data
      const playerData = await playFabUserData.getPlayerData();
      return {
        explanationELORatings: (playerData as any).explanationELORatings
      };
    } catch (error) {
      console.error('Failed to get ELO user data:', error);
      return {};
    }
  }

  /**
   * Reset all ELO ratings (for testing/admin purposes)
   */
  public async resetAllRatings(): Promise<void> {
    await this.saveELORatings({});
    console.log('All ELO ratings have been reset');
  }
}

// Export singleton instance
export const eloRatingService = ELORatingService.getInstance();