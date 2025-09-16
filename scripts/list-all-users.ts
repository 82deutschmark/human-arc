/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-16
 * PURPOSE: List all users in PlayFab to find the correct participant ID
 * SRP and DRY check: Pass - Single responsibility to list users
 */

import { config } from 'dotenv';
config();

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

async function makeAdminRequest(endpoint: string, body: any) {
  const response = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SecretKey': PLAYFAB_SECRET_KEY!
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  return result;
}

async function listUsers() {
  console.log('📋 Getting leaderboard to find users...');

  const leaderboard = await makeAdminRequest('/Admin/GetLeaderboard', {
    StatisticName: 'OfficerTrackPoints',
    MaxResultsCount: 100
  });

  if (leaderboard.code === 200 && leaderboard.data?.Leaderboard) {
    console.log(`Found ${leaderboard.data.Leaderboard.length} users:`);
    leaderboard.data.Leaderboard.forEach((entry: any, index: number) => {
      const playfabId = entry.PlayFabId;
      const startsWithE8498579 = playfabId.startsWith('E8498579') ? ' ⭐ MATCH!' : '';
      console.log(`${index + 1}. PlayFab ID: ${playfabId}, Display: ${entry.DisplayName || 'No name'}, Points: ${entry.StatValue}${startsWithE8498579}`);
    });
  } else {
    console.log('Failed to get leaderboard:', leaderboard.errorMessage || leaderboard.error);
  }
}

listUsers().catch(console.error);