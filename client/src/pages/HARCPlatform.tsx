/**
 * HARC Platform Landing Page
 * ==========================
 * Human - ARC (HARC) Platform
 * A research platform for collecting and analyzing human performance on abstract reasoning tasks
 * compared directly against AI benchmark data.
 * 
 * Purpose:
 * - Collect structured human performance data on ARC-AGI puzzles
 * - Provide participants with detailed comparisons against AI model performance
 * - Build a comprehensive dataset for human vs AI reasoning research
 */
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { arcExplainerClient, type PerformanceStatsResponse } from '@/services/core/arcExplainerClient';
import { BarChart, Zap, Cpu, AlertTriangle } from 'lucide-react';

interface PlatformStatsData {
  performance: PerformanceStatsResponse;
  general: {
    totalPuzzles: number;
    totalModels: number;
  };
}

function PlatformStats() {
  const [stats, setStats] = useState<PlatformStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const performance = await arcExplainerClient.getPerformanceStats();
        const general = await arcExplainerClient.getGeneralStats();
        setStats({ performance, general });
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
            <CardContent className="pt-6">
              <div className="h-6 bg-slate-700 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    { icon: BarChart, value: stats.general.totalPuzzles, label: 'Puzzles Analyzed', color: 'text-cyan-400' },
    { icon: Cpu, value: stats.general.totalModels, label: 'AI Models Tracked', color: 'text-green-400' },
    { icon: Zap, value: stats.performance.impossible, label: 'Impossible for AI', color: 'text-amber-400' },
    { icon: AlertTriangle, value: stats.performance.extremely_hard, label: 'Extremely Hard for AI', color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {statItems.map(item => (
        <Card key={item.label} className="bg-slate-800 border-slate-700 text-center">
          <CardContent className="pt-6">
            <item.icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
            <div className={`text-3xl font-bold ${item.color}`}>{item.value.toLocaleString()}</div>
            <p className="text-sm text-slate-300 mt-1">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function HARCPlatform() {
  const [, setLocation] = useLocation();

  const handleStartAssessment = () => {
    setLocation('/assessment');
  };

  const handleViewDashboard = () => {
    setLocation('/dashboard');
  };

  const handleViewPuzzleLibrary = () => {
    setLocation('/puzzles');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-amber-400 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-amber-400 mb-2">
              HARC Platform
            </h1>
            <p className="text-xl text-slate-300">
              Are you going to be replaced by a LLM?
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Mission Statement */}
        <PlatformStats />

        {/* Mission Statement */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            How Do Your Reasoning Abilities Compare to AI?
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
            ARC-AGI is a benchmark for AI reasoning ability. It is uniquely challenging and is designed to be easy for humans, but hard for AI. The Human - ARC Platform is a research initiative that collects and analyzes human performance 
            on the exact same abstract reasoning tasks, providing direct comparisons with AI model performance. 
            Contribute to cutting-edge research while discovering your unique cognitive strengths over state of the art AI models.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <h3 className="text-xl font-bold text-amber-400 text-center">🧩 Assessment</h3>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-center">
                We have curated a set of authentic ARC-AGI puzzles from the training and evaluation sets. 

              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <h3 className="text-xl font-bold text-amber-400 text-center">📊 Analysis</h3>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-center">
                View detailed comparisons of your performance against the latest state of the art AI models, with insights into 
                how you compare to the best AI models.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <h3 className="text-xl font-bold text-amber-400 text-center">🔬 Research</h3>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-center">
                Contribute to research on human vs AI reasoning capabilities while 
                building a dataset of human performance on abstract reasoning tasks.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-slate-800 border-slate-600 mb-12">
          <CardHeader>
            <h3 className="text-2xl font-bold text-cyan-400 text-center">How It Works</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-amber-500 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h4 className="font-bold text-amber-300 mb-1">Complete the Assessment</h4>
                <p className="text-slate-300">Solve a curated set of Abstract Reasoning Corpus (ARC) puzzles that measure different aspects of cognitive reasoning.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-amber-500 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h4 className="font-bold text-amber-300 mb-1">Receive Your Cognitive Performance Score</h4>
                <p className="text-slate-300">Get a detailed breakdown of your performance against state-of-the-art AI models and other humans!</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-amber-500 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h4 className="font-bold text-amber-300 mb-1">Ongoing Cognitive Training</h4>
                <p className="text-slate-300">Fluid intelligence is the ability to solve novel problems that haven't been seen before. This is where AI breakdown and humans excel.  By regularly solving puzzles, you can improve your fluid intelligence and cognitive reasoning skills.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-6">
          <Button
            onClick={handleStartAssessment}
            className="bg-green-600 hover:bg-green-700 text-white p-6 h-auto"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-bold text-lg">Start Assessment</div>
              <div className="text-sm opacity-90 mt-1">Begin your cognitive evaluation</div>
            </div>
          </Button>

          <Button
            onClick={handleViewDashboard}
            variant="outline"
            className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 p-6 h-auto"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-bold text-lg">View Dashboard</div>
              <div className="text-sm opacity-90 mt-1">See your performance results</div>
            </div>
          </Button>

          <Button
            onClick={handleViewPuzzleLibrary}
            variant="outline"
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 p-6 h-auto"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🧩</div>
              <div className="font-bold text-lg">Puzzle Library</div>
              <div className="text-sm opacity-90 mt-1">Practice with research puzzles</div>
            </div>
          </Button>
        </div>

        {/* Research Context */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            The Abstract Reasoning Corpus (ARC) is a benchmark designed to measure AI progress on abstract reasoning.
            The HARC Platform extends this work by collecting systematic human performance data,
            enabling direct human vs AI comparisons on identical reasoning tasks.
          </p>
        </div>

        {/* Space Force Easter Egg Link */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setLocation('/space-force')}
            variant="ghost"
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            🚀 Looking for Space Force Mission Control?
          </Button>
        </div>
      </main>
    </div>
  );
}