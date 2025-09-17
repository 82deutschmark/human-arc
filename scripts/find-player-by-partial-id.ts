/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-16
 * PURPOSE: Admin utility to find PlayFab players by partial ID (last 8 characters)
 * SRP and DRY check: Pass - Single responsibility for player lookup by partial ID
 */

import { config } from 'dotenv';
config();

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
  console.error('Missing required environment variables: PLAYFAB_TITLE_ID or PLAYFAB_SECRET_KEY');
  process.exit(1);
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

async function findPlayersByPartialId(partialId: string) {
  const searchId = partialId.toLowerCase().trim();
  console.log(`🔍 Searching for players with IDs ending in: ${searchId}`);
  console.log('');

  try {
    // Get leaderboard to search through all players
    const leaderboard = await makePlayFabRequest('Server/GetLeaderboard', {
      StatisticName: 'OfficerTrackPoints',
      MaxResultsCount: 100
    });

    const matches = leaderboard.data.Leaderboard.filter((entry: any) =>
      entry.PlayFabId.slice(-8).toLowerCase() === searchId
    );

    if (matches.length === 0) {
      console.log(`❌ No players found with IDs ending in: ${searchId}`);
      console.log('');
      console.log('💡 All players on leaderboard:');
      leaderboard.data.Leaderboard.forEach((entry: any, index: number) => {
        const last8 = entry.PlayFabId.slice(-8);
        console.log(`   ${index + 1}. ...${last8} | ${entry.PlayFabId} | ${entry.DisplayName || 'No name'} | ${entry.StatValue} pts`);
      });
      return [];
    }

    console.log(`✅ Found ${matches.length} player(s) with IDs ending in: ${searchId}`);
    console.log('');

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      console.log(`🎯 Player ${i + 1}:`);
      console.log(`   Full PlayFab ID: ${match.PlayFabId}`);
      console.log(`   Display Name: ${match.DisplayName || 'No display name'}`);
      console.log(`   Current Score: ${match.StatValue.toLocaleString()} points`);

      // Get additional player details
      try {
        const playerInfo = await makePlayFabRequest('Admin/GetUserAccountInfo', {
          PlayFabId: match.PlayFabId
        });

        console.log(`   Account Created: ${playerInfo.data.UserInfo?.Created}`);
        console.log(`   Last Login: ${playerInfo.data.UserInfo?.TitleInfo?.LastLogin || 'Unknown'}`);
      } catch (error) {
        console.log(`   Additional info unavailable`);
      }
      console.log('');
    }

    return matches;

  } catch (error) {
    console.log(`❌ Search failed: ${error}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm run ts-node scripts/find-player-by-partial-id.ts <last8chars>');
    console.log('Example: npm run ts-node scripts/find-player-by-partial-id.ts e8498579');
    return;
  }

  const partialId = args[0];

  if (partialId.length !== 8) {
    console.log('⚠️  Warning: Expected 8 characters for partial ID');
  }

  console.log('🚀 HARC Player Search Tool');
  console.log('=============================');
  console.log('');

  const players = await findPlayersByPartialId(partialId);

  if (players.length > 0) {
    console.log('🎉 Search completed successfully!');
    console.log(`Copy the full PlayFab ID above to use in other admin scripts.`);
  } else {
    console.log('💔 No matching players found.');
  }
}

main().catch(console.error);