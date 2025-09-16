/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-15T15:50:00-04:00
 * PURPOSE: Test script to verify LLM analysis works for a single puzzle
 * SRP and DRY check: Pass - Single test purpose
 *
 */

console.log('🔍 Testing single puzzle processing...');

try {
  // Use dynamic import to handle potential module issues
  const { triggerLLMAnalysis } = await import('../server/llm-analysis-endpoint');

  console.log('✅ Successfully imported triggerLLMAnalysis');

  const testPuzzleId = 'a699fb00'; // Connect the dots - known working puzzle
  console.log(`🎯 Testing puzzle: ${testPuzzleId}`);

  const result = await triggerLLMAnalysis({
    puzzleId: testPuzzleId,
    triggeredBy: 'single-test-script'
  });

  console.log('📊 Result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('🎉 SUCCESS! Single puzzle processing works');
    console.log(`🏆 Winners found: ${result.winnersFound || 'Unknown'}`);
    console.log(`⏱️  Execution time: ${result.executionTimeMs}ms`);
  } else {
    console.log('❌ FAILED:', result.message);
    if (result.error) {
      console.log('💥 Error:', result.error);
    }
  }

} catch (error) {
  console.error('💥 Script failed:', error);
  process.exit(1);
}