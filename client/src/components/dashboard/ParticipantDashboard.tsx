/**AUTHOR: Claude Sonnet 4
 * DATE: 2025-09-12
 * PURPOSE: TOTALLY UNKNOWN!!!!  
 * SRP and DRY check: ????
 * HARC Platform - Participant Dashboard
 * =====================================
 * Displays a participant's cognitive performance score (CPS) and compares it
 * directly against AI benchmark data for the same puzzles.
 * 
 * 
 * THIS PAGE SOUNDS LIKE IT WAS LARGELY HALLUCINATED BY THE AI
 * NEEDS Audit!
 * Cognitive Performance Score (CPS) is not a real thing and I am worried about how it is being used
 */

import { useState, useEffect } from 'react';
import { ComparisonCard } from './ComparisonCard';
import { playFabAuthManager } from '@/services/playfab/authManager';
import { playFabRequestManager } from '@/services/playfab/requestManager';
import { playFabUserData } from '@/services/playfab/userData';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';

// Defines the structure of a single performance record
interface HumanPerformanceRecord {
  puzzleId: string;
  timestamp: string;
  basePoints: number;
  speedBonus: number;
  efficiencyBonus: number;
  firstTryBonus?: number;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
}


interface ComparisonData {
  human: HumanPerformanceRecord;
  ai: PerformanceData | null;
}


export function ParticipantDashboard() {
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
            const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // 1. Initialize PlayFab
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) throw new Error('VITE_PLAYFAB_TITLE_ID not set');
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();

        // 2. Fetch human performance data
        const humanPerformance = await playFabUserData.getHumanPerformanceData();

        if (!humanPerformance || humanPerformance.length === 0) {
          setIsLoading(false);
          return; // Nothing to compare
        }

        // 3. Get unique puzzle IDs and fetch AI data for each one
        const uniquePuzzleIds = [...new Set(humanPerformance.map(record => record.puzzleId))];
        const aiDataPromises = uniquePuzzleIds.map(id => arcExplainerClient.getPuzzlePerformance(id));
        const aiDataResults = await Promise.all(aiDataPromises);

        const aiDataMap = new Map<string, PerformanceData | null>();
        uniquePuzzleIds.forEach((id, index) => {
          aiDataMap.set(id, aiDataResults[index]);
        });

        // 4. Merge human and AI data, taking the latest human record for each puzzle
        const latestHumanRecords = new Map<string, HumanPerformanceRecord>();
        humanPerformance.forEach(record => {
          const existing = latestHumanRecords.get(record.puzzleId);
          if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
            latestHumanRecords.set(record.puzzleId, record);
          }
        });

        const mergedData: ComparisonData[] = Array.from(latestHumanRecords.values()).map(humanRecord => ({
          human: humanRecord,
          ai: aiDataMap.get(humanRecord.puzzleId) || null
        }));

        setComparisonData(mergedData);

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <div className="p-4 text-center">Loading participant dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 bg-slate-800 text-white">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">Participant Dashboard</h1>
      
      {comparisonData.length === 0 ? (
        <p>No performance data found. Complete some puzzles in the Assessment section to see your results.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisonData.map(data => (
            <ComparisonCard key={data.human.puzzleId} humanRecord={data.human} aiRecord={data.ai} />
          ))}
        </div>
      )}
    </div>
  );
}
