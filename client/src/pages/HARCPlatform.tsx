/**
 * HARC Platform Landing Page
 * ==========================
 * Authored by: Cascade using Claude Opus 4.1
 * Date: September 15, 2025
 * 
 * Human - ARC (HARC) Platform
 * A research platform for collecting and analyzing human performance on abstract reasoning tasks
 * compared directly against AI benchmark data.
 * 
 * Purpose:
 * - Collect structured human performance data on ARC-AGI puzzles
 * - Provide participants with detailed comparisons against AI model performance
 * - Build a comprehensive dataset for human vs AI reasoning research
 * 
 * CRITICAL: NO MOCK DATA - Real data or proper error states only
 */
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PuzzleInfoCard } from "@/components/ui/PuzzleInfoCard";
import { arcExplainerClient } from '@/services/core/arcExplainerClient';
import { 
  BarChart, 
  Zap, 
  Cpu, 
  AlertTriangle, 
  ArrowLeft, 
  TrendingDown, 
  Users, 
  Trophy,
  Brain,
  Target,
  Activity,
  RefreshCw
} from 'lucide-react';
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabUserData
} from '@/services/playfab';
import type { PlayFabPlayer } from '@/services/playfab';
import type { OfficerPuzzle } from '@/types/arcTypes';

// Comprehensive data interfaces for REAL API data
interface AccuracyStats {
  totalSolverAttempts: number;
  totalCorrectPredictions: number;
  overallAccuracyPercentage: number;
  modelAccuracyRankings: ModelAccuracyRanking[];
}

interface ModelAccuracyRanking {
  modelName: string;
  totalAttempts: number;
  correctPredictions: number;
  accuracyPercentage: number;
  singleTestAccuracy?: number;
  multiTestAccuracy?: number;
}

interface PerformanceLeaderboards {
  trustworthinessLeaders: Array<{
    modelName: string;
    avgTrustworthiness: number;
    avgConfidence: number;
    avgProcessingTime?: number;
    avgCost?: number;
  }>;
  overallTrustworthiness: number;
}

interface FeedbackStats {
  totalFeedback: number;
  helpfulPercentage: number;
  topModels: Array<{
    modelName: string;
    feedbackCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulPercentage: number;
  }>;
}

interface WorstPerformingPuzzle {
  id: string;
  performanceData?: {
    avgAccuracy: number;
    avgConfidence: number;
    wrongCount: number;
    dangerousOverconfidence?: boolean;
  };
}

interface ComprehensiveDashboardData {
  accuracy: AccuracyStats | null;
  performance: PerformanceLeaderboards | null;
  feedback: FeedbackStats | null;
  worstPuzzles: WorstPerformingPuzzle[];
  generalStats: any;
}

// Main dashboard component with REAL data fetching
function PlatformStats({ setLocation }: { setLocation: (path: string) => void }) {
  const [dashboardData, setDashboardData] = useState<ComprehensiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchComprehensiveDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🔄 Fetching comprehensive dashboard data (NO MOCK DATA)...');

        // Fetch all real data in parallel - NO FALLBACKS
        const [accuracyRes, performanceRes, worstRes, generalRes] = await Promise.allSettled([
          arcExplainerClient.getFeedbackAccuracyStats(),
          arcExplainerClient.getComprehensiveDashboard(), 
          arcExplainerClient.getWorstPerformingPuzzles({ limit: 5, zeroAccuracyOnly: true }),
          arcExplainerClient.getGeneralStats()
        ]);

        // Process results - only use successful data
        const accuracy = accuracyRes.status === 'fulfilled' ? accuracyRes.value?.data : null;
        const performance = performanceRes.status === 'fulfilled' ? performanceRes.value?.data : null;
        
        // Transform worst puzzles to match our interface
        const worstPuzzlesRaw = worstRes.status === 'fulfilled' ? worstRes.value : [];
        const worstPuzzles: WorstPerformingPuzzle[] = worstPuzzlesRaw.map((p: any) => ({
          id: p.id || p.puzzleId,
          performanceData: p.performanceData ? {
            avgAccuracy: p.performanceData.avgAccuracy || 0,
            avgConfidence: p.performanceData.avgConfidence || 0,
            wrongCount: p.performanceData.wrongCount || 0,
            dangerousOverconfidence: p.performanceData.dangerousOverconfidence
          } : undefined
        }));
        
        const generalStats = generalRes.status === 'fulfilled' ? generalRes.value : null;
        
        // For now, set feedback to null since we don't have a public method for it
        const feedback: FeedbackStats | null = null;

        // Check if we have at least some critical data
        if (!accuracy && !performance && worstPuzzles.length === 0) {
          throw new Error('Unable to fetch any dashboard data from arc-explainer API');
        }

        console.log('✅ Dashboard data fetched (partial or complete):', {
          hasAccuracy: !!accuracy,
          hasPerformance: !!performance,
          hasFeedback: !!feedback,
          worstPuzzlesCount: worstPuzzles?.length || 0
        });

        setDashboardData({
          accuracy,
          performance,
          feedback,
          worstPuzzles,
          generalStats
        });
        
      } catch (error) {
        console.error("❌ Failed to fetch dashboard data:", error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        // NO MOCK DATA - Just set error state
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComprehensiveDashboard();
  }, [retryCount]); // Re-fetch on retry

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-slate-700 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center text-slate-400">
          <Activity className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading real-time AI performance data...</p>
        </div>
      </div>
    );
  }

  // Error state - NO MOCK DATA
  if (error && !dashboardData) {
    return (
      <Card className="bg-red-900/20 border-red-600 mb-12">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-400 mb-2">Unable to Load Dashboard Data</h3>
          <p className="text-slate-300 mb-4">{error}</p>
          <Button 
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Partial data state - show what we have
  if (!dashboardData) return null;

  // Build stat items from REAL data only
  const statItems = [];
  
  // Add accuracy stats if available
  if (dashboardData.accuracy) {
    if (typeof dashboardData.accuracy.overallAccuracyPercentage === 'number') {
      statItems.push({
        icon: Target,
        value: Math.round(dashboardData.accuracy.overallAccuracyPercentage),
        label: 'AI Avg Accuracy %',
        color: 'text-cyan-400',
        suffix: '%'
      });
    }

    if (typeof dashboardData.accuracy.totalSolverAttempts === 'number') {
      statItems.push({
        icon: Brain,
        value: dashboardData.accuracy.totalSolverAttempts,
        label: 'Total AI Attempts',
        color: 'text-green-400'
      });
    }
  }
  
  // Add worst performing puzzles count
  if (dashboardData.worstPuzzles?.length > 0) {
    statItems.push({
      icon: AlertTriangle,
      value: dashboardData.worstPuzzles.length,
      label: 'Impossible for AI',
      color: 'text-red-400',
      tooltip: '0% AI success rate'
    });
  }
  
  // Add feedback stats if available
  if (dashboardData.feedback && typeof dashboardData.feedback.totalFeedback === 'number') {
    statItems.push({
      icon: Users,
      value: dashboardData.feedback.totalFeedback,
      label: 'Human Feedback',
      color: 'text-amber-400'
    });
  }
  
  // If we have no stats at all, show error
  if (statItems.length === 0) {
    return (
      <Card className="bg-amber-900/20 border-amber-600 mb-12">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-amber-300">Limited data available. Some API endpoints may be down.</p>
          <Button onClick={handleRetry} variant="ghost" className="mt-2 text-amber-400">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 mb-12">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map(item => (
          <Card key={item.label} className="bg-slate-800 border-slate-700 text-center hover:border-slate-600 transition-colors">
            <CardContent className="pt-6">
              <item.icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
              <div className={`text-3xl font-bold ${item.color}`}>
                {(item.value ?? 0).toLocaleString()}{item.suffix || ''}
              </div>
              <p className="text-sm text-slate-300 mt-1">{item.label}</p>
              {item.tooltip && (
                <p className="text-xs text-slate-500 mt-1">{item.tooltip}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* AI Model Leaderboard - if we have accuracy data */}
      {dashboardData.accuracy?.modelAccuracyRankings && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h3 className="text-xl font-bold text-cyan-400 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2" />
              Models Needing Improvement
            </h3>
            <p className="text-sm text-slate-400">AI models ranked by accuracy (worst first)</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.accuracy.modelAccuracyRankings
                .slice(0, 5)
                .map((model, idx) => (
                  <div key={model.modelName} className="flex justify-between items-center p-2 bg-slate-900 rounded">
                    <div className="flex items-center">
                      <span className="text-red-400 font-bold mr-3">#{idx + 1}</span>
                      <span className="text-slate-300">{model.modelName}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-500">
                        {model.totalAttempts} attempts
                      </span>
                      <Badge className={`${
                        model.accuracyPercentage < 20 ? 'bg-red-600' :
                        model.accuracyPercentage < 40 ? 'bg-amber-600' :
                        'bg-green-600'
                      } text-white`}>
                        {model.accuracyPercentage.toFixed(1)}% accurate
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* AI Failure Showcase - Zero Accuracy Puzzles */}
      {dashboardData.worstPuzzles?.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-red-400 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 mr-2" />
              Puzzles Where AI Completely Fails
            </h3>
            <p className="text-slate-400">Can you solve what AI cannot? These puzzles have 0% AI success rates.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dashboardData.worstPuzzles.slice(0, 8).map(puzzle => {
              // Convert WorstPerformingPuzzle to OfficerPuzzle format for PuzzleInfoCard
              const officerPuzzle: OfficerPuzzle = {
                id: puzzle.id,
                playFabId: puzzle.id, // Use same as id
                difficulty: 'practically_impossible', // These are 0% success rate puzzles
                avgAccuracy: puzzle.performanceData?.avgAccuracy || 0,
                avgConfidence: puzzle.performanceData?.avgConfidence || 0,
                wrongCount: puzzle.performanceData?.wrongCount || 0,
                totalExplanations: puzzle.performanceData?.wrongCount || 1, // Use wrongCount as attempts
                dataset: 'arc-agi',
                gridSize: 'Unknown',
                compositeScore: 0 // 0% success rate = 0 composite score
              };
              
              return (
                <PuzzleInfoCard 
                  key={puzzle.id}
                  puzzle={officerPuzzle}
                  onSelectPuzzle={(puzzle) => setLocation(`/puzzle-solver/${puzzle.id}`)}
                />
              );
            })}
          </div>
          
          {/* Challenge Call-to-Action */}
          <Card className="bg-gradient-to-r from-red-900/20 to-amber-900/20 border-red-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-amber-300 mb-2">Think You Can Beat AI?</h4>
                  <p className="text-slate-300">These puzzles have stumped the best AI models with 0% success rates.</p>
                </div>
                <Button
                  onClick={() => setLocation('/puzzles')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Browse All Impossible Puzzles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function HARCPlatform() {
  const [, setLocation] = useLocation();
  const [playFabReady, setPlayFabReady] = useState(false);
  const [playFabInitializing, setPlayFabInitializing] = useState(true);
  const [player, setPlayer] = useState<PlayFabPlayer | null>(null);

  // Initialize PlayFab on mount (similar to HARCPuzzleBrowser)
  useEffect(() => {
    const initializePlayFab = async () => {
      try {
        console.log('🎮 Initializing PlayFab for HARC Platform...');
        setPlayFabInitializing(true);

        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }

        if (!playFabAuthManager.isAuthenticated()) {
          await playFabAuthManager.loginAnonymously();
        }

        // Load player data
        const playerData = await playFabUserData.getPlayerData();
        setPlayer(playerData);
        setPlayFabReady(true);
        console.log('✅ PlayFab ready for HARC Platform');
      } catch (err) {
        console.error('❌ PlayFab initialization failed:', err);
        setPlayFabReady(false);
      } finally {
        setPlayFabInitializing(false);
      }
    };

    initializePlayFab();
  }, []);

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
      {/* Smart Header with Navigation (from HARCPuzzleBrowser pattern) */}
      <header className="bg-slate-800/50 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation('/')}
                variant="ghost"
                className="text-sky-400 hover:text-white hover:bg-slate-700 p-2"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Home
              </Button>
              <h1 className="text-2xl font-bold text-cyan-400">
                🧠 HARC PLATFORM
              </h1>
              <Badge className="bg-cyan-500 text-white font-bold">
                RESEARCH HUB
              </Badge>
              {playFabReady && (
                <Badge className="bg-green-500 text-white">
                  ✓ Connected
                </Badge>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleStartAssessment}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                disabled={playFabInitializing}
              >
                📋 Take Assessment
              </Button>
              <Button
                onClick={handleViewDashboard}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                disabled={playFabInitializing}
              >
                📊 View Dashboard
              </Button>
              <Button
                onClick={handleViewPuzzleLibrary}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold"
              >
                🧩 Puzzle Library
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-amber-400 mb-4">
            Could an AI solve novel abstract reasoning tasks better than you?
          </h1>
          <p className="text-xl text-slate-300">
            Compare yourself to the state of the art.
          </p>
        </div>
      </div>

      {/* Action Buttons - Right below Hero */}
      <div className="max-w-4xl mx-auto px-6 py-8">
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
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Real-time Dashboard Data */}
        <PlatformStats setLocation={setLocation} />

        {/* Mission Statement */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            How Do Your Reasoning Abilities Compare to AI?
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
            ARC-AGI is a benchmark for AI reasoning ability. It is uniquely challenging and is designed to be easy for humans, but hard for AI. The Human - ARC Platform is a research initiative that collects and analyzes human performance 
            on the exact same abstract reasoning tasks, providing direct comparisons with AI model performance. 
            
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
                We have curated some ARC-AGI puzzles as an easy introduction to the puzzles. 

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
                Building a dataset of human performance on abstract reasoning tasks. Prove your worth
                to the future cybernetic overlords? Impress your friends? 
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