import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AssessmentModalProps {
  open: boolean;
  onClose: () => void;
}

export function AssessmentModal({ open, onClose }: AssessmentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-slate-800 border-amber-400 text-slate-50">
        <DialogTitle className="sr-only">ARC Assessment Information</DialogTitle>
        <div className="text-center space-y-2 p-3">
          <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-1">Are you smarter than an LLM?</h1>
            <p className="text-slate-400 font-mono text-sm">Are you ready to challenge the limits of your cognitive abilities and be compared to the state of the art in "AI"?</p>
          </div>

          <div className="space-y-2">
            <div className="bg-slate-900 border border-slate-600 rounded p-2">
              <h3 className="text-amber-400 font-semibold mb-1">ARC-AGI is a unique benchmark for AI systems, one they haven't been able to beat yet.</h3>
              <div className="text-slate-200 text-sm leading-snug space-y-2">
                <p>
                  You will be presented with a series of <span className="text-amber-400 font-bold">Abstract Reasoning Corpus (ARC)</span> puzzles designed to evaluate abstract reasoning abilities.
                </p>
                <p>
                  Each puzzle contains <strong className="text-green-400">training examples</strong> that demonstrate a transformation logic. Take some time to reason about what the output grid should look like.
                </p>
                <p>
                  The puzzles may involve various types of transformations including:
                </p>
                <ul className="text-slate-300 text-xs space-y-0.5 list-disc list-inside ml-2">
                  <li>Geometric operations (rotation, reflection, scaling)</li>
                  <li>Pattern completion and extension</li>
                  <li>Logical operations and conditional rules</li>
                  <li>Object counting, sorting, and grouping</li>
                </ul>
                <p>
                  Take your time to analyze the training examples carefully. There are no time limits and these first 5 will be quick.
                </p>
                <p className="text-amber-300">
                  <strong>Hint System Available:</strong> Hint 1 will size the output grid to be the correct size, this is a big help on some puzzles!
                </p>
                <p className="text-green-300">
                Sure, they can chat like a human and even pass hard exams — like the ones to become a lawyer or a doctor. But that's because those tests follow patterns, and <strong className="text-yellow-300">AI 🤖 are pattern masters</strong>.
                </p>
                <p>
                  What they're <em>not</em>? <strong className="text-red-400">Real problem-solvers</strong>. Give them something brand new — something they've never seen, with no clear answer in their memory — and they freeze. Or worse: <em className="text-red-300">they make up confident-sounding nonsense</em>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900 border border-slate-600 rounded p-2">
                <h4 className="text-amber-400 font-semibold text-xs mb-0.5">Assessment Type</h4>
                <p className="text-slate-400 text-xs">ARC-AGI Benchmark Tests for AI Systems</p>
              </div>
              <div className="bg-slate-900 border border-slate-600 rounded p-2">
                <h4 className="text-amber-400 font-semibold text-xs mb-0.5">Duration</h4>
                <p className="text-slate-400 text-xs">Self-paced (no time limit)</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full max-w-xs mx-auto bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold py-2 px-4 text-sm"
          >
            See how you compare!!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}