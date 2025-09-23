/*
 * App.tsx
 * Author: Gemini 2.5 Pro
 * Updated: 2025-09-14
 * 
 * PURPOSE: Main application component that handles routing and UI providers.
 * 
 * HOW IT WORKS:
 * - Provides routing configuration for HARC Platform and Space Force modes
 * - Manages onboarding modal state
 * - Applies dynamic document metadata based on current route
 * 
 * HOW THE PROJECT USES IT:
 * - Entry point for the React application
 * - Central routing configuration for all application pages
 * - UI provider setup (tooltips, toasts)
 */
import { useState } from 'react';
import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDocumentMeta } from "@/utils/useDocumentMeta";
import MissionControl from "@/pages/MissionControl";
import HARCPuzzleBrowser from "@/pages/HARCPuzzleBrowser";
import PuzzleSolver from "@/pages/PuzzleSolver";

import { AssessmentInterface } from "@/components/assessment/AssessmentInterface";
import HARCDashboard from "@/pages/HARCDashboard";

import HARCPlatform from "@/pages/HARCPlatform";
import Leaderboards from "@/pages/Leaderboards";
import Profile from "@/pages/Profile";
import HumanVsAiComparison from "@/pages/HumanVsAiComparison";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";
import ExplanationArena from "@/pages/ExplanationArena";
import LeaderboardLanding from "@/pages/LeaderboardLanding";
import { LoadingSplash } from "@/components/game/LoadingSplash";
import { OnboardingModal } from "@/components/game/OnboardingModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DynamicFavicon from '@/components/util/DynamicFavicon';
import { AttemptTrackingDebug } from '@/pages/AttemptTrackingDebug';

function Router() {
  // Apply dynamic document metadata based on current route
  useDocumentMeta();

  return (
    <Switch>
      <Route path="/" component={HARCPlatform} />
      <Route path="/space-force" component={MissionControl} />
      
      <Route path="/space-force/officer-track/solve/:puzzleId" component={PuzzleSolver} />
     
      
      <Route path="/assessment" component={AssessmentInterface} />
      <Route path="/officer-track/solve/:puzzleId" component={PuzzleSolver} />
      <Route path="/puzzles" component={HARCPuzzleBrowser} />
      <Route path="/puzzles/solve/:puzzleId" component={PuzzleSolver} />
      <Route path="/dashboard" component={HARCDashboard} />
      <Route path="/comparison" component={HARCDashboard} />
      <Route path="/leaderboards/harc_leaderboard" component={Leaderboards} />
      <Route path="/leaderboards/explanation-arena" component={ExplanationArena} />
      <Route path="/profile" component={Profile} />
      <Route path="/assessment/comparison" component={HumanVsAiComparison} />
      <Route path="/about" component={About} />
      <Route path="/debug/attempt-tracking" component={AttemptTrackingDebug} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <DynamicFavicon />
        <Router />
        <OnboardingModal open={showOnboarding} onClose={handleOnboardingComplete} />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
