/**
 * Test the new endpoints with puzzle IDs to see performance data
 */

const BASE_URL = 'https://arc-explainer-production.up.railway.app';

async function testPuzzleIdEndpoint(endpoint, puzzleId) {
  // Try as query parameter instead of URL path
  const url = `${BASE_URL}${endpoint}?puzzleId=${puzzleId}`;
  console.log(`\n🔍 Testing: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Response received for ${puzzleId}`);
    console.log(`📊 Data structure:`, {
      success: data?.success,
      hasData: !!data?.data,
      hasPerformanceData: !!(data?.data?.performanceData || data?.data?.avgAccuracy)
    });

    if (data?.data) {
      // Check for performance indicators
      const performanceKeys = ['avgAccuracy', 'totalAttempts', 'modelPerformance', 'performanceData'];
      const foundKeys = performanceKeys.filter(key => data.data[key] !== undefined);
      console.log(`🎯 Performance keys found:`, foundKeys);

      // Show all keys in the data object
      console.log(`🔑 All keys in data:`, Object.keys(data.data));

      // Show sample of the actual data structure (first 500 chars)
      console.log(`📋 Sample data:`, JSON.stringify(data.data, null, 2).substring(0, 500) + '...');

      if (data.data.avgAccuracy !== undefined) {
        console.log(`📈 avgAccuracy: ${data.data.avgAccuracy}`);
      }
      if (data.data.totalAttempts !== undefined) {
        console.log(`🔢 totalAttempts: ${data.data.totalAttempts}`);
      }
      if (data.data.modelPerformance) {
        console.log(`🤖 modelPerformance: ${data.data.modelPerformance.length} models`);
      }
    }

    return data;

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  const assessmentIds = ['e7dd8335', 'fc754716', 'a699fb00', 'ea786f4a', '66e6c45b'];
  const endpoints = ['/api/puzzles/stats', '/api/feedback/accuracy-stats'];

  for (const endpoint of endpoints) {
    console.log(`\n==== TESTING ${endpoint} WITH PUZZLE IDS ====`);

    for (const puzzleId of assessmentIds) {
      await testPuzzleIdEndpoint(endpoint, puzzleId);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

main().catch(console.error);