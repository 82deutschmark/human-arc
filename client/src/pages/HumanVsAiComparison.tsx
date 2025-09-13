/**
 * Human vs. AI Comparison Page
 * ==============================
 * This page provides a detailed comparison of the user's assessment performance
 * against the performance of various Large Language Models (LLMs) on the same set of puzzles.
 */

import { useState, useEffect } from 'react';
import { playFabRequestManager, playFabAuthManager, playFabUserData } from '@/services/playfab';
import { getEvaluation2Puzzles, type OfficerPuzzle } from '@/services/officerArcAPI';
import { ASSESSMENT_PUZZLE_IDS } from '@/constants/assessmentPuzzles';
import { ComparisonSummary } from '@/components/comparison/ComparisonSummary';
import { PuzzleComparisonCard } from '@/components/comparison/PuzzleComparisonCard';

// Define a unified data structure for comparison
interface ComparisonData {
  puzzleId: string;
  human: any; // Replace with a more specific type later
  ai: OfficerPuzzle | null;
}

export function HumanVsAiComparison() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
const [playFabId, setPlayFabId] = useState<string | null>(null);

  // Calculate summary statistics
  const humanCorrect = comparisonData.filter(d => d.human?.isCorrect).length;
  const aiCorrect = Math.round(comparisonData.reduce((acc, d) => acc + (d.ai?.avgAccuracy || 0), 0));
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

        // Filter for assessment puzzles only
        let humanData = allHumanData.filter(record => ASSESSMENT_PUZZLE_IDS.includes(record.puzzleId));

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

        // 3. Extract puzzle IDs
        const puzzleIds = humanData.map(record => record.puzzleId);

        // 3. Fetch all AI puzzle data from the correct API
        const aiPuzzlesResponse = await getEvaluation2Puzzles();
        const aiDataMap = new Map<string, OfficerPuzzle>();
        aiPuzzlesResponse.puzzles.forEach(p => aiDataMap.set(p.id, p));

        // 4. Merge human and AI data
        const mergedData = humanData.map(humanRecord => ({
          puzzleId: humanRecord.puzzleId,
          human: humanRecord,
          ai: aiDataMap.get(humanRecord.puzzleId) || null,
        }));

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
