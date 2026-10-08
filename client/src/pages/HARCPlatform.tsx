/**
 *
 * Author: Claude Code using Sonnet 4; cleanup by Codex
 * Date: 2026-10-07
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
import { Navbar } from '@/components/layout/Navbar';
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
      <Navbar title="Human ARC Platform" />

      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            Could an AI solve novel abstract reasoning tasks better than you?
          </h1>
          <p className="text-xl text-gray-600">
            Solve ARC puzzles and explore published AI results.
          </p>
        </div>
      </div>

      {/* Action Buttons - Right below Hero */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Button
            onClick={handleStartAssessment}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-8 h-auto shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <div className="text-center w-full">
              <div className="text-4xl mb-3">🚀</div>
              <div className="font-bold text-xl mb-2">Compare Yourself to AI</div>
              <div className="text-base opacity-90 leading-relaxed">Start the Intro</div>
            </div>
          </Button>

          <Button
            onClick={handleViewDashboard}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-8 h-auto shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <div className="text-center w-full">
              <div className="text-4xl mb-3">📈</div>
              <div className="font-bold text-xl mb-2">View Dashboard</div>
              <div className="text-base opacity-90 leading-relaxed">See your performance results</div>
            </div>
          </Button>

          <Button
            onClick={() => setLocation('/leaderboards/harc_leaderboard')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-8 h-auto shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <div className="text-center w-full">
              <div className="text-4xl mb-3">🏆</div>
              <div className="font-bold text-xl mb-2">Leaderboard</div>
              <div className="text-base opacity-90 leading-relaxed">Compare and compete!</div>
            </div>
          </Button>

          <Button
            onClick={handleViewPuzzleLibrary}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white p-8 h-auto shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <div className="text-center w-full">
              <div className="text-4xl mb-3">🧩</div>
              <div className="font-bold text-xl mb-2">Directly from ARC-AGI-2 Data</div>
              <div className="text-base opacity-90 leading-relaxed">Test yourself on the exact same puzzles</div>
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
          <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
              <h3 className="text-xl font-bold text-emerald-700 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🧩</span> Assessment
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 text-center leading-relaxed">
                We have curated some ARC-AGI puzzles as an easy introduction to the puzzles.
                Get started with carefully selected challenges designed to showcase the depth of abstract reasoning.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100">
              <h3 className="text-xl font-bold text-blue-700 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">📊</span> Analysis
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 text-center leading-relaxed">
                Compare your puzzle results with AI runs available in ARC Explainer's archive.
                Model coverage and evaluation conditions vary; these are not a current official leaderboard.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
              <h3 className="text-xl font-bold text-purple-700 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🔬</span> Research
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 text-center leading-relaxed">
                Building a dataset of human performance on abstract reasoning tasks. Contribute to research while
                exploring how you approach unfamiliar patterns and rules.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-blue-200 shadow-xl mb-12">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="text-2xl font-bold text-center">How It Works</h3>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="flex items-start space-x-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">1</div>
              <div className="flex-1">
                <h4 className="font-bold text-emerald-700 mb-2 text-lg">Complete the Assessment</h4>
                <p className="text-gray-700 leading-relaxed">Solve a curated set of Abstraction and Reasoning Corpus (ARC) puzzles. Use the examples to identify patterns and rules, then draw the missing output.</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">2</div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-700 mb-2 text-lg">Review Your Puzzle Results</h4>
                <p className="text-gray-700 leading-relaxed">See your results on the puzzles you attempted and compare available human and AI records. This is a puzzle performance record, not an intelligence test.</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">3</div>
              <div className="flex-1">
                <h4 className="font-bold text-purple-700 mb-2 text-lg">Keep Practicing</h4>
                <p className="text-gray-700 leading-relaxed">Explore more puzzles, try different approaches and learn from the examples. Practice helps you become familiar with ARC tasks; this site does not establish that it improves general intelligence.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research Context */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">🔬</span>
                <h3 className="text-xl font-bold text-slate-700">Research Foundation</h3>
              </div>
              <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
                The Abstraction and Reasoning Corpus (ARC) is a benchmark designed to measure AI progress on abstract reasoning.
                The HARC Platform extends this work by collecting systematic human performance data,
                enabling direct human vs AI comparisons on identical reasoning tasks. Someday it might contribute to the
                understanding of the unique capabilities that distinguish human and artificial intelligence.  Collaborators to the project are always welcome!
              </p>
            </CardContent>
          </Card>
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
