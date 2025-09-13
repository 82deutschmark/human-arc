/**
 * Test script to investigate the new arc-explainer API endpoints
 * Run this to see what data structure these endpoints return
 */

const BASE_URL = 'https://arc-explainer-production.up.railway.app';

async function testEndpoint(endpoint, description, puzzleId = null) {
  const url = puzzleId ? `${endpoint}/${puzzleId}` : endpoint;
  console.log(`\n🔍 Testing: ${url}`);
  console.log(`📝 Description: ${description}`);
  if (puzzleId) console.log(`🎯 Puzzle ID: ${puzzleId}`);
  console.log(`🌐 URL: ${BASE_URL}${url}`);

  try {
    const response = await fetch(`${BASE_URL}${url}`);

    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Response received`);
    console.log(`📊 Response structure:`, {
      success: data?.success,
      hasData: !!data?.data,
      dataType: typeof data?.data,
      dataKeys: data?.data && typeof data.data === 'object' ? Object.keys(data.data) : 'N/A'
    });

    // Show sample data for the assessment puzzle IDs
    const assessmentIds = ['e7dd8335', 'fc754716', 'a699fb00', 'ea786f4a', '66e6c45b'];
    console.log(`🎯 Looking for our assessment puzzle IDs in the data...`);

    if (data?.data && typeof data.data === 'object') {
      assessmentIds.forEach(id => {
        const found = JSON.stringify(data.data).includes(id);
        console.log(`  ${id}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
      });

      // Show first few entries if it's an array or object with many entries
      if (Array.isArray(data.data)) {
        console.log(`📋 Array with ${data.data.length} items`);
        console.log(`🔍 First item sample:`, JSON.stringify(data.data[0], null, 2));
      } else if (typeof data.data === 'object') {
        const keys = Object.keys(data.data);
        console.log(`📋 Object with ${keys.length} keys`);
        console.log(`🔍 Sample keys:`, keys.slice(0, 10));
        if (keys.length > 0) {
          const firstKey = keys[0];
          console.log(`🔍 Sample data for "${firstKey}":`, JSON.stringify(data.data[firstKey], null, 2));
        }
      }
    }

    return data;

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing new arc-explainer API endpoints for bulk performance data');

  const assessmentIds = ['e7dd8335', 'fc754716', 'a699fb00', 'ea786f4a', '66e6c45b'];

  const endpoints = [
    ['/api/puzzles/stats', 'Gets performance metrics for all puzzles, used by the Puzzle DB Viewer'],
    ['/api/feedback/accuracy-stats', 'A dedicated route to get accuracy stats from the feedback controller'],
    ['/api/metrics/reliability', 'Retrieves model reliability statistics'],
    ['/api/metrics/comprehensive-dashboard', 'Gets data for a comprehensive analytics dashboard']
  ];

  // First test without puzzle ID
  console.log('\n=== TESTING ENDPOINTS WITHOUT PUZZLE IDS ===');
  for (const [endpoint, description] of endpoints) {
    await testEndpoint(endpoint, description);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Then test with first assessment puzzle ID
  console.log('\n=== TESTING ENDPOINTS WITH PUZZLE ID: e7dd8335 ===');
  for (const [endpoint, description] of endpoints) {
    await testEndpoint(endpoint, description, 'e7dd8335');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test a few more puzzle IDs on the most promising endpoint
  console.log('\n=== TESTING MOST PROMISING ENDPOINT WITH ALL ASSESSMENT IDS ===');
  for (const puzzleId of assessmentIds) {
    console.log(`\n--- Testing /api/puzzles/stats with ${puzzleId} ---`);
    const data = await testEndpoint('/api/puzzles/stats', 'Bulk performance data', puzzleId);
    if (data && data.data) {
      console.log(`🎯 Data found for ${puzzleId}: avgAccuracy=${data.data.avgAccuracy}, totalAttempts=${data.data.totalAttempts}`);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n🎯 Assessment puzzle IDs we need data for:');
  console.log('e7dd8335, fc754716, a699fb00, ea786f4a, 66e6c45b');
}

main().catch(console.error);