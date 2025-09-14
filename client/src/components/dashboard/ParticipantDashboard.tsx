/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-14
 * Purpose: HARC Participant Dashboard showing real puzzle performance data
 * SRP and DRY check: Pass - Single responsibility (dashboard display), uses existing PlayFab services
 *
 * Displays participant's actual puzzle performance using real finalScore data
 * from humanPerformanceData, comparing against AI benchmark data for completed puzzles.
 */

import { useState, useEffect } from 'react';
import { ComparisonCard } from './ComparisonCard';
import { playFabAuthManager } from '@/services/playfab/authManager';
import { playFabRequestManager } from '@/services/playfab/requestManager';
import { playFabUserData } from '@/services/playfab/userData';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';
import { idConverter } from '@/services/idConverter';

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
                        const uniquePuzzleIds = [
          ...new Set(
            humanPerformance
              .map(record => idConverter.normalizeToArcId(record.puzzleId))
              .filter((id): id is string => id !== null)
          )
        ];
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

  // Calculate summary statistics
  const totalScore = comparisonData.reduce((sum, data) => sum + data.human.finalScore, 0);
  const averageTime = comparisonData.length > 0
    ? (comparisonData.reduce((sum, data) => sum + data.human.timeElapsed, 0) / comparisonData.length).toFixed(1)
    : '0';

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">HARC Participant Dashboard</h1>

      {comparisonData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧩</div>
          <h2 className="text-xl text-slate-300 mb-2">No Performance Data</h2>
          <p className="text-slate-400">Complete some ARC puzzles to see your performance metrics and AI comparisons.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-amber-400 mb-2">Puzzles Completed</h3>
              <div className="text-3xl font-bold text-white">{comparisonData.length}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Total Score</h3>
              <div className="text-3xl font-bold text-white">{totalScore.toLocaleString()} pts</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Average Time</h3>
              <div className="text-3xl font-bold text-white">{averageTime}s</div>
            </div>
          </div>

          {/* Puzzle Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonData.map(data => (
              <ComparisonCard key={data.human.puzzleId} humanRecord={data.human} aiRecord={data.ai} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
