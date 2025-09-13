/**
 * Human vs. AI Comparison Page
 * ==============================
 * This page provides a detailed comparison of the user's assessment performance
 * against the performance of various Large Language Models (LLMs) on the same set of puzzles.
 */

import { useState, useEffect } from 'react';
import { playFabRequestManager, playFabAuthManager, playFabUserData } from '@/services/playfab';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';
import { idConverter } from '@/services/idConverter';
import { ASSESSMENT_PUZZLE_IDS } from '@/constants/assessmentPuzzles';
import { ComparisonSummary } from '@/components/comparison/ComparisonSummary';
import { PuzzleComparisonCard } from '@/components/comparison/PuzzleComparisonCard';

// Define a unified data structure for comparison
interface ComparisonData {
  puzzleId: string;
  human: any; // Replace with a more specific type later
  ai: AccuracyStatsData | null;
}

// New interface for accuracy stats data
interface AccuracyStatsData {
  totalSolverAttempts: number;
  totalCorrectPredictions: number;
  overallAccuracyPercentage: number;
  modelAccuracyRankings: ModelAccuracy[];
}

interface ModelAccuracy {
  modelName: string;
  totalAttempts: number;
  correctPredictions: number;
  accuracyPercentage: number;
}

export function HumanVsAiComparison() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [playFabId, setPlayFabId] = useState<string | null>(null);

  // Calculate summary statistics
  const humanCorrect = comparisonData.filter(d => d.human?.isCorrect).length;
  // New: Use overallAccuracyPercentage from accuracy stats endpoint
  const aiCorrect = Math.round(comparisonData.reduce((acc, d) => acc + ((d.ai?.overallAccuracyPercentage || 0) / 100), 0));
  const totalPuzzles = comparisonData.length;

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

        // 2. Fetch human performance data from PlayFab
        let allHumanData = await playFabUserData.getHumanPerformanceData();

        // Filter for assessment puzzles only - handle both ARC and PlayFab format IDs
        let humanData = allHumanData.filter(record => {
          const arcId = idConverter.normalizeToArcId(record.puzzleId);
          return arcId && ASSESSMENT_PUZZLE_IDS.includes(arcId);
        });

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
          setError('No human performance data found. Please complete the assessment first.');
          setIsLoading(false);
          return;
        }

        // 3. Use the NEW batch accuracy stats endpoint for better performance data
        console.log('🚀 Using NEW batch accuracy stats endpoint');
        const aiDataMap = await arcExplainerClient.getBatchAccuracyStats(ASSESSMENT_PUZZLE_IDS);

        // 4. Merge human and AI data
        console.log(`📊 AI data map contains:`, Array.from(aiDataMap.keys()));
        console.log(`👤 Human data contains ${humanData.length} records`);

        const mergedData = humanData.map(humanRecord => {
          const arcId = idConverter.normalizeToArcId(humanRecord.puzzleId);
          const aiData = arcId ? aiDataMap.get(arcId) : null;
          console.log(`🔗 Merging: ${humanRecord.puzzleId} -> ${arcId} -> ${aiData ? 'HAS AI DATA' : 'NO AI DATA'}`);
          return {
            puzzleId: humanRecord.puzzleId,
            human: humanRecord,
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
        <h1 className="text-3xl font-bold text-amber-400 mb-2 text-center">Human vs. AI Performance</h1>
        {playFabId && <p className="text-center text-slate-400 text-sm mb-4">PlayFab ID: {playFabId}</p>}
        
        {totalPuzzles > 0 && (
          <div className="mb-8">
            <ComparisonSummary 
              humanCorrect={humanCorrect}
              aiCorrect={aiCorrect}
              totalPuzzles={totalPuzzles}
            />
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
