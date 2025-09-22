/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Enhanced loading system types for real progress tracking and detailed status reporting
 * SRP and DRY check: Pass - Single responsibility for loading state type definitions
 */

export interface LoadingStage {
  id: string;
  name: string;
  weight: number; // Percentage of total load time
  status: 'pending' | 'active' | 'complete' | 'error';
  details?: string;
  startTime?: number;
  endTime?: number;
}

export interface DetailedStatus {
  primaryMessage: string;      // Main operation
  secondaryMessage?: string;   // Additional context
  technicalDetails?: string;   // API endpoints, counts, etc.
  performanceStats?: string;   // Accuracy, difficulty breakdown
  errorContext?: string;       // Helpful error information
}

export interface PerformanceMetrics {
  totalPuzzles: number;
  processedPuzzles: number;
  averageAccuracy?: number;
  impossibleCount?: number;
  processingRate?: number; // puzzles per second
  timeElapsed?: number; // milliseconds
  estimatedTimeRemaining?: number; // milliseconds
}

export interface EnhancedError {
  title: string;
  message: string;
  context: string;
  suggestions: string[];
  technicalDetails?: string;
}

export const PUZZLE_LOADING_STAGES: LoadingStage[] = [
  { id: 'init', name: 'Initializing connection', weight: 5, status: 'pending' },
  { id: 'api-call', name: 'Calling arc-explainer API', weight: 30, status: 'pending' },
  { id: 'data-fetch', name: 'Fetching puzzle metadata', weight: 40, status: 'pending' },
  { id: 'processing', name: 'Processing difficulty analysis', weight: 15, status: 'pending' },
  { id: 'sorting', name: 'Sorting puzzles', weight: 5, status: 'pending' },
  { id: 'finalize', name: 'Finalizing puzzle data', weight: 5, status: 'pending' }
];

/**
 * Calculate real progress based on completed stages
 */
export const calculateProgress = (stages: LoadingStage[]): number => {
  return stages.reduce((total, stage) => {
    if (stage.status === 'complete') return total + stage.weight;
    if (stage.status === 'active') return total + (stage.weight * 0.5);
    return total;
  }, 0);
};

/**
 * Get current active stage
 */
export const getCurrentStage = (stages: LoadingStage[]): LoadingStage | null => {
  return stages.find(stage => stage.status === 'active') || null;
};

/**
 * Update stage status and timing
 */
export const updateStageStatus = (
  stages: LoadingStage[],
  stageId: string,
  status: LoadingStage['status'],
  details?: string
): LoadingStage[] => {
  return stages.map(stage => {
    if (stage.id === stageId) {
      const updated: LoadingStage = {
        ...stage,
        status,
        details,
        startTime: status === 'active' ? Date.now() : stage.startTime,
        endTime: status === 'complete' || status === 'error' ? Date.now() : undefined
      };
      return updated;
    }
    return stage;
  });
};

/**
 * Calculate processing metrics
 */
export const calculateMetrics = (
  startTime: number,
  processedCount: number,
  totalCount: number
): PerformanceMetrics => {
  const timeElapsed = Date.now() - startTime;
  const processingRate = processedCount > 0 ? (processedCount / timeElapsed) * 1000 : 0; // per second
  const estimatedTimeRemaining = processingRate > 0 && totalCount > processedCount
    ? ((totalCount - processedCount) / processingRate) * 1000
    : 0;

  return {
    totalPuzzles: totalCount,
    processedPuzzles: processedCount,
    processingRate,
    timeElapsed,
    estimatedTimeRemaining
  };
};