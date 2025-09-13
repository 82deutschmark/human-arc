/**
 * Puzzle Comparison Card Component
 * ================================
 * Displays a side-by-side comparison for a single puzzle.
 */

import { Link } from 'wouter';
import type { AggregatedAIStats } from '@/services/core/arcExplainerClient';

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
  aiResult: AggregatedAIStats | null;
}

export function PuzzleComparisonCard({ puzzleId, humanResult, aiResult }: PuzzleComparisonCardProps) {
  // Add debugging to see exact data structure
  console.log(`🧩 PuzzleComparisonCard for ${puzzleId}:`, aiResult);

  // DEBUG: Detailed logging of human result data
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult:`, humanResult);
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult type:`, typeof humanResult);
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult.isCorrect:`, humanResult?.isCorrect);
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - humanResult keys:`, humanResult ? Object.keys(humanResult) : 'null/undefined');

  const humanCorrect = humanResult?.isCorrect || false;
  console.log(`🔍 [DEBUG] PuzzleComparisonCard ${puzzleId} - final humanCorrect:`, humanCorrect);

  // Fix property mappings for AggregatedAIStats interface
  const aiAccuracy = aiResult?.accuracy || 0;  // was avgAccuracy
  const avgConfidence = aiResult?.averageConfidence || 0;  // was avgConfidence
  const totalAttempts = aiResult?.totalAttempts || 0;  // was totalExplanations
  const correctAttempts = aiResult?.correctAttempts || 0;
  const aiWrongCount = totalAttempts - correctAttempts;  // calculated from new data

  // Convert accuracy percentage (0-100) to decimal for comparison
  const aiAccuracyDecimal = aiAccuracy / 100;
  const isOverconfident = aiAccuracyDecimal < 0.5 && avgConfidence > 80;

  // Simplified quality assessment based on total attempts and accuracy
  const getExplanationQualityTier = () => {
    if (totalAttempts > 20 && aiAccuracy > 60) return { label: 'High', color: 'text-green-400' };
    if (totalAttempts > 10 && aiAccuracy > 40) return { label: 'Medium', color: 'text-yellow-400' };
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
              <span className="font-bold text-xl text-amber-300">{humanResult.finalScore?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Time:</span>
              <span className="font-bold text-xl">
                {humanResult.timeElapsed ? (humanResult.timeElapsed / 1000).toFixed(1) : 'N/A'}s
                {/* DEBUG: Log time value and conversion */}
                {console.log(`🔍 [DEBUG] ${puzzleId} - timeElapsed raw:`, humanResult.timeElapsed, 'converted:', humanResult.timeElapsed ? (humanResult.timeElapsed / 1000).toFixed(1) : 'N/A')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Steps:</span>
              <span className="font-bold text-xl">{humanResult.stepCount || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* AI Performance */}
        <div className="p-3 rounded-lg bg-slate-700/50 space-y-2">
          <p className="font-bold text-white mb-2">AI Benchmark</p>
          {aiResult && aiResult.hasData ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Success Rate:</span>
                <span className={`font-bold text-xl ${aiAccuracyDecimal > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {`${aiAccuracy.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Correct/Total:</span>
                <span className="font-bold text-xl text-amber-300">{correctAttempts}/{totalAttempts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Avg. Confidence:</span>
                <span className="font-bold text-xl text-cyan-300">
                  {avgConfidence > 0 ? `${avgConfidence.toFixed(0)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Failed Attempts:</span>
                <span className="font-bold text-xl text-purple-300">{aiWrongCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">AI Models:</span>
                <span className="font-bold text-xl text-orange-300">{aiResult.modelBreakdown.length}</span>
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
