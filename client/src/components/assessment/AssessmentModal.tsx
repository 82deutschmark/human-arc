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
        <div className="text-center space-y-2 p-2">
          <h1 className="text-xl font-bold text-amber-400">Are you smarter than an LLM?</h1>

          <div className="bg-slate-900 border border-slate-600 rounded p-2">
            <div className="text-slate-200 text-xs leading-tight space-y-1.5">
              <p>
                You'll solve <span className="text-amber-400 font-bold">Abstract Reasoning</span> puzzles. Each has <strong className="text-green-400">training examples</strong> showing the pattern.
              </p>
              <p className="text-amber-300">
                <strong>Hint 1</strong> sizes your output grid correctly. Use it!
              </p>
              <p>
                AI models excel at exams and chat, but struggle with novel problems. They're <strong className="text-yellow-300">pattern masters</strong>, not <strong className="text-red-400">problem-solvers</strong>. Let's see how you compare.
              </p>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full max-w-xs mx-auto bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold py-1.5 px-3 text-xs"
          >
            Start Assessment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}