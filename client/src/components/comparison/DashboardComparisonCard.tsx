/**
 * 
 * Author: Cascade using Claude 4 Sonnet
 * Date: 2025-09-21T22:37:36-04:00
 * PURPOSE: Compact dashboard comparison card built from ground up using shadcn/ui components
 * Displays human vs AI performance with 50% size reduction, proper light theme, and reusable UI components
 * SRP and DRY check: Pass - Single responsibility (puzzle comparison), reuses shadcn/ui design system
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { AggregatedAIStats, ModelStats } from '@/services/core/arcExplainerClient';

// Clean interface definitions
interface HumanPerformanceRecord {
  puzzleId: string;
  correct: boolean;
  timestamp: string;
  basePoints: number;
  speedBonus: number;
  efficiencyBonus: number;
  firstTryBonus?: number;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
}

interface DashboardComparisonCardProps {
  puzzleId: string;
  humanResult: HumanPerformanceRecord;
  aiResult: AggregatedAIStats | null;
}

// Utility functions
const formatTime = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Invalid Date';
  }
};

const getPerformanceVariant = (accuracy: number): 'default' | 'secondary' | 'destructive' => {
  const percentage = accuracy > 1 ? accuracy : accuracy * 100;
  if (percentage >= 70) return 'default'; // Green/primary for good performance
  if (percentage >= 40) return 'secondary'; // Yellow/secondary for moderate performance  
  return 'destructive'; // Red for poor performance
};

const getPerformanceIcon = (accuracy: number): string => {
  const percentage = accuracy > 1 ? accuracy : accuracy * 100;
  if (percentage >= 70) return '✅';
  if (percentage >= 40) return '⚠️';
  return '❌';
};

export function DashboardComparisonCard({ puzzleId, humanResult, aiResult }: DashboardComparisonCardProps) {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showModelBreakdown, setShowModelBreakdown] = useState(false);
  
  // Calculate AI stats
  const aiAccuracy = aiResult?.accuracy || 0;
  const totalAttempts = aiResult?.totalAttempts || 0;
  const correctAttempts = aiResult?.correctAttempts || 0;
  const failedAttempts = totalAttempts - correctAttempts;
  const avgConfidence = aiResult?.averageConfidence || 0;
  
  // Calculate model failure stats (replacing "struggled most")
  const modelBreakdown = aiResult?.modelBreakdown || [];
  const failedModels = modelBreakdown.filter(model => (model.accuracy < 50));
  const failedModelCount = failedModels.length;
  const totalModelCount = modelBreakdown.length;

  return (
    <Card className="h-fit transition-all hover:shadow-md">
      {/* Compact Header */}
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-semibold">{puzzleId}</CardTitle>
          <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
            <Link href={`/puzzles/solve/${puzzleId}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              Review
            </Link>
          </Button>
        </div>
      </CardHeader>

      {/* Compact Content */}
      <CardContent className="p-3 pt-0 space-y-3">
        
        {/* Performance Summary Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={humanResult.correct ? 'default' : 'destructive'} className="text-xs">
              {humanResult.correct ? '✅ You' : '❌ You'}
            </Badge>
            <span className="text-xs text-muted-foreground">vs</span>
            <Badge variant={getPerformanceVariant(aiAccuracy)} className="text-xs">
              {getPerformanceIcon(aiAccuracy)} AI {aiAccuracy.toFixed(0)}%
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(humanResult.timestamp)}
          </span>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-primary">{humanResult.finalScore?.toLocaleString() || '0'}</div>
            <div className="text-muted-foreground">Score</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{formatTime(humanResult.timeElapsed)}</div>
            <div className="text-muted-foreground">Time</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{humanResult.stepCount || '0'}</div>
            <div className="text-muted-foreground">Steps</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{humanResult.attemptNumber || '1'}</div>
            <div className="text-muted-foreground">Attempt</div>
          </div>
        </div>

        {/* AI Performance Summary */}
        {aiResult && aiResult.hasData && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-primary">{correctAttempts}/{totalAttempts}</div>
                <div className="text-muted-foreground">AI Success</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">{avgConfidence.toFixed(0)}%</div>
                <div className="text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-destructive">{failedModelCount}/{totalModelCount}</div>
                <div className="text-muted-foreground">Failed Models</div>
              </div>
            </div>
          </>
        )}

        {/* Expandable Sections */}
        <div className="space-y-2">
          
          {/* Score Breakdown */}
          <Collapsible open={showScoreBreakdown} onOpenChange={setShowScoreBreakdown}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-6 text-xs">
                Score Breakdown
                {showScoreBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <div className="text-xs bg-muted/30 rounded p-2 space-y-1">
                <div className="flex justify-between">
                  <span>Base Points:</span>
                  <span className="font-medium">{humanResult.basePoints?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed Bonus:</span>
                  <span className="font-medium text-emerald-600">+{humanResult.speedBonus?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency Bonus:</span>
                  <span className="font-medium text-emerald-600">+{humanResult.efficiencyBonus?.toLocaleString() || '0'}</span>
                </div>
                {humanResult.firstTryBonus && (
                  <div className="flex justify-between">
                    <span>First Try Bonus:</span>
                    <span className="font-medium text-emerald-600">+{humanResult.firstTryBonus.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span className="text-primary">{humanResult.finalScore?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Model Performance Breakdown */}
          {aiResult && aiResult.hasData && modelBreakdown.length > 0 && (
            <Collapsible open={showModelBreakdown} onOpenChange={setShowModelBreakdown}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between h-6 text-xs">
                  Model Performance ({totalModelCount} models)
                  {showModelBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                
                {/* Failed Models Summary */}
                {failedModelCount > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {failedModelCount} Models Failed
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        &lt;50% accuracy
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {failedModels.map(model => model.modelName).join(', ')}
                    </div>
                  </div>
                )}

                {/* All Models Grid */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {modelBreakdown
                    .sort((a, b) => b.accuracy - a.accuracy) // Sort by performance, best first
                    .map((model) => (
                      <div key={model.modelName} className="flex items-center justify-between p-1 border rounded bg-muted/20">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span>{getPerformanceIcon(model.accuracy)}</span>
                          <span className="truncate font-medium">{model.modelName}</span>
                        </div>
                        <span className={`font-medium whitespace-nowrap ml-1 ${
                          model.accuracy >= 70 ? 'text-emerald-600' : 
                          model.accuracy >= 40 ? 'text-amber-600' : 'text-destructive'
                        }`}>
                          {model.accuracy.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
