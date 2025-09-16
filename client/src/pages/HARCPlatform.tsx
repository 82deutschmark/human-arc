/**
 *
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-16
 * PURPOSE: HARC Platform landing page with navigation links to assessment, dashboard, and puzzle library.
 * Simplified version that focuses on navigation and core functionality without bogus stats.
 * SRP and DRY check: Pass - Single responsibility of providing navigation to HARC features.
 *
 */
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from 'lucide-react';
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabUserData
} from '@/services/playfab';
import type { PlayFabPlayer } from '@/services/playfab';


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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Smart Header with Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation('/')}
                variant="ghost"
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Home
              </Button>
              <h1 className="text-2xl font-bold text-blue-600">
                🧠 HARC PLATFORM
              </h1>
              <Badge className="bg-blue-600 text-white font-bold">
                RESEARCH HUB
              </Badge>
              {playFabReady && (
                <Badge className="bg-green-600 text-white">
                  ✓ Connected
                </Badge>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleStartAssessment}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                disabled={playFabInitializing}
              >
                📋 Take Assessment
              </Button>
              <Button
                onClick={handleViewDashboard}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                disabled={playFabInitializing}
              >
                📊 View Dashboard
              </Button>
              <Button
                onClick={() => setLocation('/leaderboards/harc_leaderboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={playFabInitializing}
              >
                🏆 Leaderboard
              </Button>
              <Button
                onClick={handleViewPuzzleLibrary}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                🧩 Puzzle Library
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            Could an AI solve novel abstract reasoning tasks better than you?
          </h1>
          <p className="text-xl text-gray-600">
            Compare yourself to the state of the art.
          </p>
        </div>
      </div>

      {/* Action Buttons - Right below Hero */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white p-6 h-auto"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-bold text-lg">View Dashboard</div>
              <div className="text-sm opacity-90 mt-1">See your performance results</div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/leaderboards/harc_leaderboard')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white p-6 h-auto"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-bold text-lg">Leaderboard</div>
              <div className="text-sm opacity-90 mt-1">Compare with other researchers</div>
            </div>
          </Button>

          <Button
            onClick={handleViewPuzzleLibrary}
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white p-6 h-auto"
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

        {/* Mission Statement */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">
            How Do Your Reasoning Abilities Compare to AI?
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
            ARC-AGI is a benchmark for AI reasoning ability. It is uniquely challenging and is designed to be easy for humans, but hard for AI. The Human - ARC Platform is a research initiative that collects and analyzes human performance
            on the exact same abstract reasoning tasks, providing direct comparisons with AI model performance.

          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-bold text-blue-700 text-center">🧩 Assessment</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center">
                We have curated some ARC-AGI puzzles as an easy introduction to the puzzles.

              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-bold text-blue-700 text-center">📊 Analysis</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center">
                View detailed comparisons of your performance against the latest state of the art AI models, with insights into
                how you compare to the best AI models.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-bold text-blue-700 text-center">🔬 Research</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center">
                Building a dataset of human performance on abstract reasoning tasks. Prove your worth
                to the future cybernetic overlords? Impress your friends?
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-white border-gray-200 shadow-sm mb-12">
          <CardHeader>
            <h3 className="text-2xl font-bold text-blue-700 text-center">How It Works</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h4 className="font-bold text-blue-700 mb-1">Complete the Assessment</h4>
                <p className="text-gray-700">Solve a curated set of Abstract Reasoning Corpus (ARC) puzzles that measure different aspects of cognitive reasoning.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h4 className="font-bold text-blue-700 mb-1">Receive Your Cognitive Performance Score</h4>
                <p className="text-gray-700">Get a detailed breakdown of your performance against state-of-the-art AI models and other humans!</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h4 className="font-bold text-blue-700 mb-1">Ongoing Cognitive Training</h4>
                <p className="text-gray-700">Fluid intelligence is the ability to solve novel problems that haven't been seen before. This is where AI breakdown and humans excel.  By regularly solving puzzles, you can improve your fluid intelligence and cognitive reasoning skills.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research Context */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">
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
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            🚀 Looking for Space Force Mission Control?
          </Button>
        </div>
      </main>
    </div>
  );
}