/**
 * Human vs. AI Comparison Page
 * ==============================
 * This page provides a detailed comparison of the user's assessment performance
 * against the performance of various Large Language Models (LLMs) on the same set of puzzles.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { playFabRequestManager, playFabAuthManager, playFabUserData } from '@/services/playfab';
import { arcExplainerClient, type AggregatedAIStats } from '@/services/core/arcExplainerClient';
import { idConverter } from '@/services/idConverter';
import { ASSESSMENT_PUZZLE_IDS } from '@/constants/assessmentPuzzles';
import { ComparisonSummary } from '@/components/comparison/ComparisonSummary';
import { PuzzleComparisonCard } from '@/components/comparison/PuzzleComparisonCard';

// Define a unified data structure for comparison
interface ComparisonData {
  puzzleId: string;
  human: any; // Replace with a more specific type later
  ai: AggregatedAIStats | null;
}

export function HumanVsAiComparison() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [playFabId, setPlayFabId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Calculate summary statistics
  const humanCorrect = comparisonData.filter(d => d.human?.correct).length;
  // New: Use aggregated AI stats from explanations
  const totalAIAttempts = comparisonData.reduce((acc, d) => acc + (d.ai?.totalAttempts || 0), 0);
  const totalAICorrect = comparisonData.reduce((acc, d) => acc + (d.ai?.correctAttempts || 0), 0);
  const aiAccuracy = totalAIAttempts > 0 ? (totalAICorrect / totalAIAttempts) * 100 : 0;
  const totalPuzzles = comparisonData.length;
  const puzzlesWithAIData = comparisonData.filter(d => d.ai?.hasData).length;

  const handleBackToAssessment = () => {
    setLocation('/assessment');
  };

  const handleBackToPuzzles = () => {
    setLocation('/space-force/officer-track');
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setIsLoading(true);

        // 1. Initialize PlayFab and authenticate the user
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();
        setPlayFabId(playFabAuthManager.getPlayFabId());
        setDisplayName(playFabAuthManager.getDisplayName());

        // 2. Fetch human performance data from PlayFab
        let allHumanData = await playFabUserData.getHumanPerformanceData();

        // COMPREHENSIVE DEBUG: Log all data before filtering
        console.log('🔍 [DEBUG] Raw human performance data from PlayFab:', allHumanData);
        console.log('🔍 [DEBUG] ASSESSMENT_PUZZLE_IDS:', ASSESSMENT_PUZZLE_IDS);

        // Test the robust idConverter with expected formats
        console.log('🔧 [DEBUG] Testing robust idConverter with various formats:');
        const testIds = [
          'a699fb00', // Pure ARC
          'officer-tasks-evaluation-batch1-a699fb00', // Actual PlayFab format
          'ARC-EV-a699fb00', // Legacy PlayFab format
          'some-weird-prefix-a699fb00', // Unknown but ending with ARC ID
          '66e6c45b', // Second assessment puzzle
          'officer-tasks-evaluation-batch2-66e6c45b'
        ];
        testIds.forEach(testId => {
          const result = idConverter.normalizeToArcId(testId);
          console.log(`    "${testId}" -> "${result}" (matches assessment: ${ASSESSMENT_PUZZLE_IDS.includes(result || '')})`);
        });

        // Debug each record's ID conversion
        console.log('🔍 [DEBUG] Testing ID conversion for each record:');
        allHumanData.forEach((record, index) => {
          const arcId = idConverter.normalizeToArcId(record.puzzleId);
          const isAssessmentPuzzle = arcId && ASSESSMENT_PUZZLE_IDS.includes(arcId);
          console.log(`    Record ${index}: puzzleId="${record.puzzleId}" -> arcId="${arcId}" -> isAssessment=${isAssessmentPuzzle}`);
        });

        // Filter for assessment puzzles only - handle both ARC and PlayFab format IDs
        let humanData = allHumanData.filter(record => {
          const arcId = idConverter.normalizeToArcId(record.puzzleId);
          return arcId && ASSESSMENT_PUZZLE_IDS.includes(arcId);
        });

        // DEBUG: Log the filtering results
        console.log('🔍 [DEBUG] Filtered human data for assessment:', humanData);
        console.log('🔍 [DEBUG] Filtering result: Found', humanData.length, 'assessment records out of', allHumanData.length, 'total records');

        if (humanData.length > 0) {
          console.log('🔍 [DEBUG] Sample human record structure:', humanData[0]);
          console.log('🔍 [DEBUG] Sample record keys:', Object.keys(humanData[0]));
          console.log('🔍 [DEBUG] "correct" field value:', humanData[0].correct);
          console.log('🔍 [DEBUG] "correct" field type:', typeof humanData[0].correct);
          console.log('🔍 [DEBUG] finalScore value:', humanData[0].finalScore);
          console.log('🔍 [DEBUG] All human records with scores:');
          humanData.forEach((record, index) => {
            console.log(`    Record ${index}: puzzleId=${record.puzzleId}, correct=${record.correct} (${typeof record.correct}), finalScore=${record.finalScore}`);
          });
        } else if (allHumanData.length > 0) {
          console.log('🚨 [DEBUG] NO ASSESSMENT RECORDS FOUND! This suggests ID conversion issue.');
          console.log('🚨 [DEBUG] Testing idConverter directly with sample puzzleId:');
          const sampleId = allHumanData[0].puzzleId;
          console.log(`    Sample ID: "${sampleId}"`);
          console.log(`    normalizeToArcId result: "${idConverter.normalizeToArcId(sampleId)}"`);
          console.log(`    ASSESSMENT_PUZZLE_IDS[0]: "${ASSESSMENT_PUZZLE_IDS[0]}"`);
          console.log(`    Manual test - does "${idConverter.normalizeToArcId(sampleId)}" === "${ASSESSMENT_PUZZLE_IDS[0]}"?`, idConverter.normalizeToArcId(sampleId) === ASSESSMENT_PUZZLE_IDS[0]);
        }

        // Filter out duplicates to prevent key errors
        if (humanData) {
          const seen = new Set();
          humanData = humanData.filter(item => {
            const duplicate = seen.has(item.puzzleId);
            seen.add(item.puzzleId);
            return !duplicate;
          });
        }
        if (!humanData || humanData.length === 0) {
          if (allHumanData.length === 0) {
            setError('No performance data found. Please complete some puzzles first - you can start with the assessment or browse the puzzle library.');
          } else {
            setError(`Found ${allHumanData.length} completed puzzles, but none match the assessment puzzles. Please complete the assessment first, or check if your puzzle IDs are being converted correctly.`);
          }
          setIsLoading(false);
          return;
        }

        // 3. Use the PROPER explanations endpoint for real AI performance data
        console.log('🚀 Using PROPER explanations endpoint for real AI stats');
        const aiDataMap = await arcExplainerClient.getBatchExplanationsStats(ASSESSMENT_PUZZLE_IDS);

        // 4. Merge human and AI data
        console.log(`📊 AI data map contains:`, Array.from(aiDataMap.keys()));
        console.log(`👤 Human data contains ${humanData.length} records`);

        const mergedData = humanData.map(humanRecord => {
          const arcId = idConverter.normalizeToArcId(humanRecord.puzzleId);
          const aiData = arcId ? aiDataMap.get(arcId) : null;

          // Data Transformation Layer - FIX: Proper correctness determination
          const transformedHumanData = {
            puzzleId: humanRecord.puzzleId,
            // FIX: If a record exists in humanPerformanceData with a score, the player was correct
            // CloudScript only saves successful completions to this array
            correct: humanRecord.correct !== undefined
              ? humanRecord.correct
              : (humanRecord.finalScore > 0 ? true : false), // Score-based fallback
            timestamp: humanRecord.timestamp || new Date().toISOString(),
            basePoints: humanRecord.basePoints || 0,
            speedBonus: humanRecord.speedBonus || 0,
            efficiencyBonus: humanRecord.efficiencyBonus || 0,
            finalScore: humanRecord.finalScore || 0,
            timeElapsed: humanRecord.timeElapsed || 0,
            stepCount: humanRecord.stepCount || 0,
            attemptNumber: humanRecord.attemptNumber || 1,
          };

          // DEBUG: Log transformation for each record
          console.log(`🔄 [TRANSFORM] ${humanRecord.puzzleId}: correct=${humanRecord.correct} -> ${transformedHumanData.correct}, score=${transformedHumanData.finalScore}`);

          console.log(`🔗 Merging: ${humanRecord.puzzleId} -> ${arcId} -> ${
            aiData?.hasData
              ? `${aiData.correctAttempts}/${aiData.totalAttempts} (${aiData.accuracy.toFixed(1)}%)`
              : 'NO AI DATA'
          }`);

          return {
            puzzleId: humanRecord.puzzleId,
            human: transformedHumanData, // Use transformed data
            ai: aiData || null,
          };
        });

        setComparisonData(mergedData);

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred while fetching data.');
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <div>Loading Comparison Data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <div className="text-red-400 font-semibold mb-2">Failed to Load Comparison</div>
          <div className="text-slate-400 mb-4">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-6 text-center">Human vs. AI Performance</h1>
        
        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={handleBackToAssessment}
            variant="outline"
            className="border-green-400 text-green-400 hover:bg-green-400 hover:text-slate-900"
          >
            ← Retake Assessment
          </Button>
          <Button
            onClick={() => setLocation('/puzzles')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            🧩 Continue with More Puzzles
          </Button>
          <Button
            onClick={handleBackToPuzzles}
            variant="outline"
            className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
          >
            🚀 Space Force Mode
          </Button>
        </div>

        {/* Player Identity Section */}
        {playFabId && (
          <div className="mb-8">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h2 className="text-lg font-semibold text-amber-400 mb-3">Player Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-300 text-sm mb-1">Display Name:</p>
                  <p className="text-xl font-bold text-white">
                    {displayName || 'Loading...'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm mb-1">PlayFab ID:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono text-cyan-300 select-all">
                      {playFabId}
                    </p>
                    <button
                      onClick={() => navigator.clipboard?.writeText(playFabId)}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-700 rounded transition-colors"
                      title="Copy PlayFab ID"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Dev Tool: Get New Player ID */}
              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Debug Tool:</p>
                    <p className="text-xs text-slate-500">Generate new anonymous player account</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('⚠️ This will create a new player account and reset ALL progress.\n\nYour current progress will be lost. Continue?')) {
                        // Clear all PlayFab storage
                        localStorage.removeItem('playfab_device_id');
                        sessionStorage.removeItem('playfab_device_id');
                        localStorage.removeItem('debug_playfab_mapping');

                        // Clear PlayFab cookies (fallback recovery mechanism)
                        document.cookie = "playfab_device_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

                        // Clear any other PlayFab-related localStorage
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (key && key.includes('playfab')) {
                            keysToRemove.push(key);
                          }
                        }
                        keysToRemove.forEach(key => localStorage.removeItem(key));

                        // Force page refresh to create new player
                        window.location.reload();
                      }
                    }}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors font-medium"
                    title="Clear all data and generate new PlayFab ID"
                  >
                    🔄 Get New Player ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {totalPuzzles > 0 && (
          <div className="mb-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-amber-400 mb-4">Performance Summary</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{humanCorrect}/{totalPuzzles}</div>
                  <div className="text-slate-400">Human Correct</div>
                  <div className="text-sm text-slate-500">
                    ({totalPuzzles > 0 ? ((humanCorrect / totalPuzzles) * 100).toFixed(1) : 0}%)
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {totalAICorrect}/{totalAIAttempts}
                  </div>
                  <div className="text-slate-400">AI Correct</div>
                  <div className="text-sm text-slate-500">
                    ({aiAccuracy.toFixed(1)}% accuracy)
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{puzzlesWithAIData}/{totalPuzzles}</div>
                  <div className="text-slate-400">Puzzles with AI Data</div>
                  <div className="text-sm text-slate-500">
                    {totalAIAttempts} total AI attempts
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {comparisonData.map(data => (
            <PuzzleComparisonCard 
              key={data.puzzleId}
              puzzleId={data.puzzleId}
              humanResult={data.human}
              aiResult={data.ai}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HumanVsAiComparison;
