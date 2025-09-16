/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-16
 * PURPOSE: Find participant E8498579 and award them 5 million points using PlayFab Admin API
 * SRP and DRY check: Pass - Single responsibility script for awarding points to specific participant
 */

import { config } from 'dotenv';
config();

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
  console.error('Missing required environment variables: PLAYFAB_TITLE_ID or PLAYFAB_SECRET_KEY');
  process.exit(1);
}

interface PlayFabAdminResponse {
  code: number;
  status: string;
  data?: any;
  errorMessage?: string;
}

async function makePlayFabRequest(endpoint: string, body: any): Promise<any> {
  const response = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SecretKey': PLAYFAB_SECRET_KEY!
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.code !== 200) {
    throw new Error(`PlayFab error: ${result.error || result.errorMessage || 'Unknown error'}`);
  }

  return result;
}

async function findParticipant(participantId: string) {
  console.log(`🔍 Searching for participant: ${participantId}`);

  try {
    // Try to get user account info by PlayFab ID
    const result = await makePlayFabRequest('Admin/GetUserAccountInfo', {
      PlayFabId: participantId
    });

    console.log(`✅ Found participant ${participantId}:`);
    console.log(`   Display Name: ${result.data.UserInfo?.TitleInfo?.DisplayName || 'No display name'}`);
    console.log(`   Created: ${result.data.UserInfo?.Created}`);
    return result.data;

  } catch (error) {
    console.log(`❌ Participant ${participantId} not found by PlayFab ID`);

    // Get leaderboard to find users with similar IDs
    try {
      console.log(`🔍 Searching leaderboard for IDs starting with ${participantId}...`);
      const leaderboard = await makePlayFabRequest('Server/GetLeaderboard', {
        StatisticName: 'OfficerTrackPoints',
        MaxResultsCount: 100
      });

      // Show all users first
      console.log(`📋 All users on leaderboard:`);
      leaderboard.data.Leaderboard.forEach((entry: any, index: number) => {
        console.log(`   ${index + 1}. ${entry.PlayFabId} - ${entry.DisplayName || 'No name'} (${entry.StatValue} points)`);
      });

      const matches = leaderboard.data.Leaderboard.filter((entry: any) =>
        entry.PlayFabId.slice(-8) === participantId
      );

      if (matches.length > 0) {
        console.log(`\n🎯 Found ${matches.length} user(s) with IDs ending with ${participantId}:`);
        matches.forEach((match: any, index: number) => {
          console.log(`   ${index + 1}. ${match.PlayFabId} - ${match.DisplayName || 'No name'} (${match.StatValue} points)`);
        });
        return matches[0]; // Return first match
      } else {
        console.log(`\n❌ No users found with IDs ending with ${participantId}`);
        return null;
      }
    } catch (leaderboardError) {
      console.log(`❌ Could not search leaderboard: ${leaderboardError}`);
      return null;
    }
  }
}

async function awardPoints(participant: any, points: number) {
  const playFabId = participant.PlayFabId || participant.UserInfo?.PlayFabId;
  console.log(`💰 Awarding ${points.toLocaleString()} points to ${playFabId}...`);

  try {
    // Get current statistics first
    const currentStats = await makePlayFabRequest('Server/GetPlayerStatistics', {
      PlayFabId: playFabId,
      StatisticNames: ['OfficerTrackPoints']
    });

    console.log('📊 Current statistics:');
    const currentScore = currentStats.data?.Statistics?.find((stat: any) => stat.StatisticName === 'OfficerTrackPoints')?.Value || 0;
    console.log(`   OfficerTrackPoints: ${currentScore}`);

    const newTotalScore = currentScore + points;
    console.log(`   New total will be: ${newTotalScore} (${currentScore} + ${points})`);

    // Award points using Server API (additive)
    const updateResult = await makePlayFabRequest('Server/UpdatePlayerStatistics', {
      PlayFabId: playFabId,
      Statistics: [
        {
          StatisticName: 'OfficerTrackPoints',
          Value: newTotalScore
        }
      ]
    });

    console.log(`✅ Successfully awarded ${points.toLocaleString()} points to ${playFabId}!`);
    console.log(`   New total score: ${newTotalScore.toLocaleString()}`);
    return true;

  } catch (error) {
    console.log(`❌ Failed to award points: ${error}`);
    return false;
  }
}

async function main() {
  const participantId = 'E8498579';
  const pointsToAward = 5000000;

  console.log('🚀 Starting point award process...');
  console.log(`Target participant: ${participantId}`);
  console.log(`Points to award: ${pointsToAward.toLocaleString()}`);
  console.log('');

  // Find the participant
  const participant = await findParticipant(participantId);
  if (!participant) {
    console.log('❌ Cannot proceed - participant not found');
    return;
  }

  console.log('');

  // Award the points
  const success = await awardPoints(participant, pointsToAward);

  if (success) {
    console.log('');
    console.log('🎉 Mission accomplished! Points have been awarded.');
  } else {
    console.log('');
    console.log('💥 Mission failed! Could not award points.');
  }
}

main().catch(console.error);