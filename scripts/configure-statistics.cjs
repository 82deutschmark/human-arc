/**
 * Configure PlayFab Statistics for ARC High-Score System
 * 
 * This script configures the required statistics for the ARC puzzle high-score system:
 * - OfficerTrackPoints: Standard ARC puzzle points (10,000+ base)
 * - ARC2EvalPoints: Premium ARC-2 evaluation puzzle points (25,000+ base)
 * 
 * Designed by: 82deutschmark github.com/82deutschmark
 * Updated: 2025-09-07
 * Version: 0.0.1  OUT OF DATE
 * Author: Claude Code using Sonnet 4
 */

const https = require('https');

// Load environment variables from .env file  use cross-env!!!
require('dotenv').config();

// PlayFab Configuration - MUST SET THESE!
const PLAYFAB_TITLE_ID = process.env.VITE_PLAYFAB_TITLE_ID || '19FACB';
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

if (!PLAYFAB_SECRET_KEY) {
  console.error('❌ ERROR: PLAYFAB_SECRET_KEY environment variable not set!');
  console.error('   Please set it in your .env file or environment');
  process.exit(1);
}

/**
 * Make authenticated request to PlayFab Admin API
 */
function makePlayFabRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify(data);
    
    const options = {
      hostname: `${PLAYFAB_TITLE_ID}.playfabapi.com`,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'X-SecretKey': PLAYFAB_SECRET_KEY
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.code === 200) {
            resolve(response.data);
          } else {
            reject(new Error(`PlayFab API Error: ${response.error || response.errorMessage || 'Unknown error'}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Configure a single statistic
 */
async function configureStatistic(statisticName, aggregationMethod = 'Last') {
  try {
    console.log(`🔧 Configuring statistic: ${statisticName}...`);
    
    const requestData = {
      StatisticName: statisticName,
      AggregationMethod: aggregationMethod,
      VersionChangeInterval: 'Never' // Keep all-time high scores
    };

    const result = await makePlayFabRequest('/Admin/CreatePlayerStatisticDefinition', requestData);
    console.log(`✅ Successfully configured: ${statisticName}`);
    return result;
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`ℹ️  Statistic already exists: ${statisticName}`);
      return null;
    } else {
      console.error(`❌ Failed to configure ${statisticName}:`, error.message);
      throw error;
    }
  }
}

/**
 * Main configuration function
 */
async function configureAllStatistics() {
  console.log('🚀 Starting PlayFab Statistics Configuration...');
  console.log(`📋 Title ID: ${PLAYFAB_TITLE_ID}`);
  console.log('');

  try {
    // First, let's see what existing statistics look like
    console.log('🔍 Checking existing statistics...');
    try {
      const existingStats = await makePlayFabRequest('/Admin/GetPlayerStatisticDefinitions', {});
      console.log('📊 Current statistics:');
      if (existingStats && existingStats.length > 0) {
        existingStats.forEach(stat => {
          console.log(`   • ${stat.StatisticName} (${stat.AggregationMethod || 'Unknown'})`);
        });
      } else {
        console.log('   No existing statistics found');
      }
    } catch (error) {
      console.log('   Could not retrieve existing statistics:', error.message);
    }
    console.log('');

    // Configure Officer Track Points (Standard ARC Puzzles)
    await configureStatistic('OfficerTrackPoints', 'Last');

    // Configure ARC-2 Evaluation Points (Premium Puzzles)  
    await configureStatistic('ARC2EvalPoints', 'Last');

    console.log('');
    console.log('🎉 All statistics configured successfully!');
    console.log('');
    console.log('📊 Configured Statistics:');
    console.log('   • OfficerTrackPoints - Standard ARC puzzle high scores (10,000+ base points)');
    console.log('   • ARC2EvalPoints - Premium ARC-2 evaluation high scores (25,000+ base points)');
    console.log('');
    console.log('✨ The ARC puzzle high-score system is now ready!');
    console.log('   Players will earn massive point rewards for completing puzzles.');
    
  } catch (error) {
    console.error('❌ Configuration failed:', error.message);
    process.exit(1);
  }
}

// Run the configuration
if (require.main === module) {
  configureAllStatistics().catch(console.error);
}

module.exports = { configureAllStatistics };