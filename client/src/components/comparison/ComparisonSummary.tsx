/** WHERE IS THIS USED???  Needs audit for deletion!
 * Comparison Summary Component
 * ============================
 * Displays a high-level summary of the human vs. AI performance.  HOW IS ANY OF THIS BEING CALCULATED??!
 */

interface ComparisonSummaryProps {
  humanCorrect: number;
  aiCorrect: number;
  totalPuzzles: number;
}

export function ComparisonSummary({ humanCorrect, aiCorrect, totalPuzzles }: ComparisonSummaryProps) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold text-amber-400 mb-2">Performance Summary</h2>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-4xl font-bold">{humanCorrect}/{totalPuzzles}</p>
          <p className="text-slate-400">Your Score</p>
        </div>
        <div>
          <p className="text-4xl font-bold">{aiCorrect}/{totalPuzzles}</p>
          <p className="text-slate-400">AI Average Score</p>
        </div>
      </div>
    </div>
  );
}
