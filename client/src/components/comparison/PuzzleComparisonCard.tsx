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
  const aiConfidenceWhenWrong = aiResult?.avgConfidence || 0;
  const aiWrongCount = aiResult?.wrongCount || 0;
  const explanationQuality = (aiResult?.totalExplanations || 0) + (aiResult?.totalFeedback || 0) - (aiResult?.negativeFeedback || 0);

  const isOverconfident = aiAccuracy < 0.5 && aiConfidenceWhenWrong > 0.8;

  const getExplanationQualityTier = () => {
    if (explanationQuality > 10) return { label: 'High', color: 'text-green-400' };
    if (explanationQuality > 5) return { label: 'Medium', color: 'text-yellow-400' };
    return { label: 'Low', color: 'text-red-400' };
  };

  const qualityTier = getExplanationQualityTier();


  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 transition-all hover:border-amber-400">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-amber-300">Puzzle: {puzzleId}</h3>
        <Link href={`/officer-track/solve/${puzzleId}`}>
          <a className="text-sm text-sky-400 hover:text-sky-300 transition-colors">Review Puzzle →</a>
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
          <p className="font-bold text-white mb-1">AI Collective Performance</p>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Avg. Accuracy:</span>
            <span className={`font-bold text-xl ${aiAccuracy > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
              {(aiAccuracy * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Models Failed:</span>
            <span className="font-bold text-xl">{aiWrongCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Analysis Quality:</span>
            <span className={`font-bold text-xl ${qualityTier.color}`}>{qualityTier.label}</span>
          </div>
          {isOverconfident && (
            <div className="pt-2 text-center bg-red-900/50 rounded-md p-1 mt-2">
              <p className="text-red-300 font-bold text-sm">🚨 Dangerous Overconfidence Detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
