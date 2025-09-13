/**
 * Puzzle Comparison Card Component
 * ================================
 * Displays a side-by-side comparison for a single puzzle.
 */

import { Link } from 'wouter';
import type { PerformanceData } from '@/services/core/arcExplainerClient';

// Define the detailed structure for a human performance record
interface HumanPerformanceRecord {
  puzzleId: string;
  isCorrect: boolean;
  timestamp: string;
  basePoints: number;
  speedBonus: number;
  efficiencyBonus: number;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
}

interface PuzzleComparisonCardProps {
  puzzleId: string;
  humanResult: HumanPerformanceRecord;
  aiResult: PerformanceData | null;
}

export function PuzzleComparisonCard({ puzzleId, humanResult, aiResult }: PuzzleComparisonCardProps) {
  const humanCorrect = humanResult?.isCorrect || false;
  const aiAccuracy = aiResult?.avgAccuracy || 0;
  const avgConfidence = aiResult?.avgConfidence || 0;
  const aiWrongCount = aiResult?.wrongCount || 0;
  const explanationQuality = (aiResult?.totalExplanations || 0) + (aiResult?.totalFeedback || 0) - (aiResult?.negativeFeedback || 0);

  const isOverconfident = aiAccuracy < 0.5 && avgConfidence > 80;

  const getExplanationQualityTier = () => {
    if (explanationQuality > 10) return { label: 'High', color: 'text-green-400' };
    if (explanationQuality > 5) return { label: 'Medium', color: 'text-yellow-400' };
    return { label: 'Low', color: 'text-red-400' };
  };

  const qualityTier = getExplanationQualityTier();


  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 transition-all hover:border-amber-400">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-amber-300">{puzzleId}</h3>
        <Link href={`/officer-track/solve/${puzzleId}`} className="text-sm text-sky-400 hover:text-sky-300 transition-colors self-start">
          Review Puzzle →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Human Performance */}
        <div className={`p-3 rounded-lg ${humanCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
          <p className="font-bold text-white mb-2">Your Result</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Status:</span>
              <span className={`font-bold text-xl ${humanCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {humanCorrect ? '✅ Correct' : '❌ Incorrect'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Score:</span>
              <span className="font-bold text-xl text-amber-300">{humanResult.finalScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Time:</span>
              <span className="font-bold text-xl">{(humanResult.timeElapsed / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Steps:</span>
              <span className="font-bold text-xl">{humanResult.stepCount}</span>
            </div>
          </div>
        </div>

        {/* AI Performance */}
                <div className="p-3 rounded-lg bg-slate-700/50 space-y-2">
          <p className="font-bold text-white mb-2">AI Benchmark</p>
          {aiResult ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Success Rate:</span>
                <span className={`font-bold text-xl ${aiResult.avgAccuracy > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {`${(aiResult.avgAccuracy * 100).toFixed(0)}%`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Attempts:</span>
                <span className="font-bold text-xl text-amber-300">{aiResult.totalExplanations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Avg. Confidence:</span>
                <span className="font-bold text-xl text-cyan-300">{aiResult.avgConfidence ? `${aiResult.avgConfidence.toFixed(0)}%` : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total Failures:</span>
                <span className="font-bold text-xl text-purple-300">{aiResult.wrongCount}</span>
              </div>
              {isOverconfident && (
                <div className="pt-2 text-center bg-red-900/50 rounded-md p-1 mt-2">
                  <p className="text-red-300 font-bold text-sm">🚨 Dangerous Overconfidence Detected</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-center">No AI data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
