/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-26
 * PURPOSE: Enhanced assessment information modal with improved responsive design using shadcn/ui components. Provides compelling introduction to ARC-AGI assessment with proper mobile optimization.
 * shadcn/ui and SRP and DRY check: Pass - Uses shadcn/ui Dialog components, single responsibility (assessment introduction), responsive design
 */

import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, Target, Lightbulb, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentModalProps {
  open: boolean;
  onClose: () => void;
}

export function AssessmentModal({ open, onClose }: AssessmentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto",
        "bg-background border text-foreground p-0"
      )}>
        <DialogHeader className="sr-only">
          <DialogTitle>ARC Assessment Information</DialogTitle>
          <DialogDescription>
            Learn about the ARC-AGI assessment and how it compares human and AI reasoning capabilities.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-6xl mb-4">
              <Brain className="h-12 w-12 text-amber-500" />
              <span>🤖</span>
              <Target className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-amber-400 mb-2">Are you smarter than an LLM?</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Challenge the limits of your cognitive abilities and discover how you compare to state-of-the-art AI models.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - About ARC */}
            <div className="space-y-4">
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-amber-400 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    ARC-AGI Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground font-medium">
                    ARC-AGI is a unique benchmark for AI systems, one they haven't been able to beat yet.
                  </p>
                  <div className="space-y-3">
                    <p>
                      You will be presented with <Badge variant="outline" className="mx-1 border-amber-500 text-amber-500">Abstract Reasoning Corpus (ARC)</Badge> puzzles designed to evaluate abstract reasoning abilities.
                    </p>
                    <p>
                      Each puzzle contains <Badge variant="outline" className="mx-1 border-green-500 text-green-500">training examples</Badge> that demonstrate a transformation logic.
                    </p>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Transformation Types:
                      </p>
                      <ul className="text-sm space-y-1 list-disc list-inside ml-4 text-muted-foreground">
                        <li>Geometric operations (rotation, reflection, scaling)</li>
                        <li>Pattern completion and extension</li>
                        <li>Logical operations and conditional rules</li>
                        <li>Object counting, sorting, and grouping</li>
                      </ul>
                    </div>

                    <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                      <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        <strong>Hint System Available:</strong> Hint 1 will size the output grid correctly!
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-muted">
                    <p className="text-green-500 font-medium">
                      Sure, AI can chat like humans and pass hard exams — but that's because those tests follow patterns, and <Badge className="mx-1 bg-yellow-500 text-background">AI are pattern masters</Badge>.
                    </p>
                    <p>
                      What they're <em>not</em>? <strong className="text-primary">Real problem-solvers</strong>. Give them something brand new — something they've never seen — and they struggle.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Assessment Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Assessment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-500" />
                        Assessment Type
                      </h4>
                      <p className="text-muted-foreground text-sm">ARC-AGI Benchmark Tests</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Duration
                      </h4>
                      <p className="text-muted-foreground text-sm">Self-paced (no time limit)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Human vs AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-foreground font-medium">
                    Discover how your reasoning compares to state-of-the-art AI models.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">🧠 Human Intuition</Badge>
                    <span>vs</span>
                    <Badge variant="outline">🤖 AI Pattern Recognition</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center pt-4 border-t">
            <div className="space-y-3">
              <p className="text-muted-foreground text-lg">
                Ready to prove that human intelligence still has the edge?
              </p>
              <Button
                onClick={onClose}
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-background font-bold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Brain className="mr-2 h-5 w-5" />
                Start the Challenge!
              </Button>
              <p className="text-xs text-muted-foreground">
                Join thousands of humans taking on AI at reasoning tasks
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}