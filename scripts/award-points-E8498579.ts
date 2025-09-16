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

async function makeAdminRequest(endpoint: string, body: any): Promise<PlayFabAdminResponse> {
  const response = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SecretKey': PLAYFAB_SECRET_KEY!
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

async function findParticipant(participantId: string) {
  console.log(`🔍 Searching for participant: ${participantId}`);

  // First try to get user account info by PlayFab ID
  const accountInfo = await makeAdminRequest('GetUserAccountInfo', {
    PlayFabId: participantId
  });

  if (accountInfo.code === 200 && accountInfo.data) {
    console.log(`✅ Found participant ${participantId}:`);
    console.log(`   Display Name: ${accountInfo.data.UserInfo?.TitleInfo?.DisplayName || 'No display name'}`);
    console.log(`   Created: ${accountInfo.data.UserInfo?.Created}`);
    return accountInfo.data;
  }

  console.log(`❌ Participant ${participantId} not found or error occurred:`);
  console.log(`   Error: ${accountInfo.errorMessage || 'Unknown error'}`);
  return null;
}

async function awardPoints(participantId: string, points: number) {
  console.log(`💰 Awarding ${points.toLocaleString()} points to ${participantId}...`);

  // Get current statistics first
  const currentStats = await makeAdminRequest('GetUserStatistics', {
    PlayFabId: participantId
  });

  if (currentStats.code !== 200) {
    console.log(`❌ Could not get current statistics: ${currentStats.errorMessage}`);
    return false;
  }

  console.log('📊 Current statistics:');
  if (currentStats.data?.Statistics) {
    currentStats.data.Statistics.forEach((stat: any) => {
      console.log(`   ${stat.StatisticName}: ${stat.Value}`);
    });
  } else {
    console.log('   No current statistics found');
  }

  // Award points to OfficerTrackPoints (main leaderboard stat)
  const updateResult = await makeAdminRequest('UpdateUserStatistics', {
    PlayFabId: participantId,
    Statistics: [
      {
        StatisticName: 'OfficerTrackPoints',
        Value: points
      }
    ]
  });

  if (updateResult.code === 200) {
    console.log(`✅ Successfully awarded ${points.toLocaleString()} points to ${participantId}!`);
    return true;
  } else {
    console.log(`❌ Failed to award points: ${updateResult.errorMessage}`);
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
  const success = await awardPoints(participantId, pointsToAward);

  if (success) {
    console.log('');
    console.log('🎉 Mission accomplished! Points have been awarded.');
  } else {
    console.log('');
    console.log('💥 Mission failed! Could not award points.');
  }
}

main().catch(console.error);