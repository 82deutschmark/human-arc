# Arc-Explainer API Integration Guide

**Author**: Claude Code using Sonnet 4
**Date**: 2025-09-16
**Purpose**: Complete guide for integrating with arc-explainer API for AI performance data and human-AI comparison features

## Overview

The arc-explainer API provides AI model performance data, explanations, and analytics that enable human-AI comparison features in the SFMC platform. This guide documents integration patterns, data models, and best practices.

**API Base URL**: `https://arc-explainer-production.up.railway.app`

## Core Integration Purpose

While PlayFab handles all human performance data, the arc-explainer API provides:
- AI model performance benchmarks
- Puzzle difficulty analysis from AI perspective
- Overconfidence detection in AI predictions
- Model explanation quality metrics
- Research-grade AI performance datasets

## Key API Endpoints

### Primary Data Endpoints

#### `/api/feedback/accuracy-stats` - Pure Accuracy Data
**Primary endpoint for accuracy leaderboards**

```typescript
interface PureAccuracyStats {
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
    singleTestAccuracy: number;
    multiTestAccuracy: number;
}
```

**Usage**:
```typescript
const accuracyData = await arcExplainerClient.getAccuracyStats();
const worstPerformers = accuracyData.modelAccuracyRankings
    .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage);
```

#### `/api/puzzle/performance-stats` - Trustworthiness Metrics
**AI confidence reliability analysis**

```typescript
interface PerformanceLeaderboards {
    trustworthinessLeaders: Array<{
        modelName: string;
        avgTrustworthiness: number;
        avgConfidence: number;
        avgProcessingTime: number;
    }>;
    overallTrustworthiness: number;
}
```

**Usage**:
```typescript
const trustData = await arcExplainerClient.getPerformanceStats();
const overconfidentModels = trustData.trustworthinessLeaders
    .filter(model => model.avgConfidence > 80 && model.avgTrustworthiness < 50);
```

#### `/api/puzzle/:puzzleId/explanations` - Individual Puzzle Analysis
**Detailed AI performance for specific puzzles**

```typescript
interface PuzzleExplanation {
    modelName: string;
    isPredictionCorrect: boolean;
    confidence: number;
    prediction_accuracy_score: number; // Trustworthiness
    estimated_cost: number;
    total_tokens: number;
}
```

**Usage**:
```typescript
const explanations = await arcExplainerClient.getPuzzleExplanations('a699fb00');
const aiWinners = explanations.filter(exp => exp.isPredictionCorrect);
const overconfidentFailures = explanations.filter(exp =>
    !exp.isPredictionCorrect && exp.confidence > 80
);
```

#### `/api/puzzle/worst-performing` - AI Failure Analysis
**Identify puzzles where AI struggles most**

```typescript
const worstPuzzles = await arcExplainerClient.getWorstPerformingPuzzles();
// Returns puzzles with lowest AI success rates
```

### Community & Feedback Endpoints

#### `/api/feedback/stats` - Community Engagement
```typescript
interface FeedbackStats {
    totalFeedback: number;
    helpfulPercentage: number;
    topModels: Array<{
        modelName: string;
        helpfulPercentage: number;
    }>;
}
```

## Integration Service Architecture

### ArcExplainerClient Service

```typescript
class ArcExplainerClient {
    private baseUrl = 'https://arc-explainer-production.up.railway.app';
    private cache = new Map<string, CachedResponse>();

    async getAccuracyStats(): Promise<PureAccuracyStats> {
        return this.cachedRequest('/api/feedback/accuracy-stats', 300); // 5min cache
    }

    async getPerformanceStats(): Promise<PerformanceLeaderboards> {
        return this.cachedRequest('/api/puzzle/performance-stats', 600); // 10min cache
    }

    async getPuzzleExplanations(puzzleId: string): Promise<PuzzleExplanation[]> {
        const normalizedId = this.normalizePuzzleId(puzzleId);
        return this.cachedRequest(`/api/puzzle/${normalizedId}/explanations`, 900); // 15min cache
    }

    // Batch processing with error resilience
    async getBatchExplanationsStats(puzzleIds: string[]): Promise<Map<string, AggregatedAIStats>> {
        const results = new Map<string, AggregatedAIStats>();

        const requests = puzzleIds.map(async (puzzleId) => {
            try {
                const explanations = await this.getPuzzleExplanations(puzzleId);
                const stats = this.aggregateExplanations(explanations);
                results.set(puzzleId, stats);
            } catch (error) {
                console.warn(`Failed to load AI stats for ${puzzleId}:`, error);
                // Graceful degradation - continue processing other puzzles
            }
        });

        await Promise.allSettled(requests);
        return results;
    }

    private async cachedRequest<T>(endpoint: string, cacheSeconds: number): Promise<T> {
        const cacheKey = `${this.baseUrl}${endpoint}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < cacheSeconds * 1000) {
            return cached.data as T;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, {
                data: data.success ? data.data : data,
                timestamp: Date.now()
            });

            return data.success ? data.data : data;
        } catch (error) {
            console.error(`Arc-explainer API error for ${endpoint}:`, error);
            throw error;
        }
    }

    private normalizePuzzleId(puzzleId: string): string {
        // Convert from PlayFab format to arc-explainer format if needed
        if (puzzleId.startsWith('ARC-')) {
            const match = puzzleId.match(/ARC-[A-Z0-9]+-([a-f0-9]{8})/);
            return match ? match[1] : puzzleId;
        }
        return puzzleId;
    }

    private aggregateExplanations(explanations: PuzzleExplanation[]): AggregatedAIStats {
        const totalAttempts = explanations.length;
        const correctPredictions = explanations.filter(e => e.isPredictionCorrect).length;
        const averageConfidence = explanations.reduce((sum, e) => sum + (e.confidence || 0), 0) / totalAttempts;
        const averageTrustworthiness = explanations.reduce((sum, e) => sum + (e.prediction_accuracy_score || 0), 0) / totalAttempts;

        return {
            puzzleId: explanations[0]?.puzzleId || 'unknown',
            totalAttempts,
            correctPredictions,
            accuracy: (correctPredictions / totalAttempts) * 100,
            averageConfidence,
            averageTrustworthiness,
            isOverconfident: averageConfidence > 70 && (correctPredictions / totalAttempts) < 0.5,
            models: explanations.map(e => ({
                name: e.modelName,
                correct: e.isPredictionCorrect,
                confidence: e.confidence,
                trustworthiness: e.prediction_accuracy_score
            }))
        };
    }
}
```

## Data Integration Patterns

### Human-AI Comparison Data Merging

```typescript
interface ComparisonData {
    puzzleId: string;
    human?: HumanPerformanceRecord;
    ai?: AggregatedAIStats;
    comparison?: {
        humanAdvantage: boolean;
        aiOverconfident: boolean;
        difficultyClass: 'easy-for-both' | 'human-advantage' | 'ai-advantage' | 'hard-for-both';
    };
}

class HumanAIComparisonService {
    async getComparisonData(puzzleIds: string[]): Promise<ComparisonData[]> {
        // Fetch data from both sources in parallel
        const [humanData, aiData] = await Promise.all([
            playFabUserData.getHumanPerformanceData(),
            arcExplainerClient.getBatchExplanationsStats(puzzleIds)
        ]);

        return puzzleIds.map(puzzleId => {
            const human = humanData.find(h => h.puzzleId === puzzleId);
            const ai = aiData.get(puzzleId);

            return {
                puzzleId,
                human,
                ai,
                comparison: this.calculateComparison(human, ai)
            };
        });
    }

    private calculateComparison(human?: HumanPerformanceRecord, ai?: AggregatedAIStats) {
        if (!human && !ai) return undefined;

        const humanSuccess = human?.correct || false;
        const aiSuccess = (ai?.accuracy || 0) > 50;
        const aiOverconfident = (ai?.averageConfidence || 0) > 70 && !aiSuccess;

        let difficultyClass: ComparisonData['comparison']['difficultyClass'];
        if (humanSuccess && aiSuccess) {
            difficultyClass = 'easy-for-both';
        } else if (humanSuccess && !aiSuccess) {
            difficultyClass = 'human-advantage';
        } else if (!humanSuccess && aiSuccess) {
            difficultyClass = 'ai-advantage';
        } else {
            difficultyClass = 'hard-for-both';
        }

        return {
            humanAdvantage: humanSuccess && !aiSuccess,
            aiOverconfident,
            difficultyClass
        };
    }
}
```

### HARC Platform Data Loading

```typescript
class HARCPlatformService {
    async loadHARCDashboardData(): Promise<HARCDashboardData> {
        try {
            // Load core metrics in parallel
            const [accuracyStats, performanceStats, feedbackStats] = await Promise.all([
                arcExplainerClient.getAccuracyStats(),
                arcExplainerClient.getPerformanceStats(),
                arcExplainerClient.getFeedbackStats()
            ]);

            // Identify interesting puzzle categories
            const worstPerformingPuzzles = await arcExplainerClient.getWorstPerformingPuzzles();
            const overconfidentModels = performanceStats.trustworthinessLeaders
                .filter(model => model.avgConfidence > 75 && model.avgTrustworthiness < 60);

            return {
                overview: {
                    totalModels: accuracyStats.modelAccuracyRankings.length,
                    overallAccuracy: accuracyStats.overallAccuracyPercentage,
                    overallTrustworthiness: performanceStats.overallTrustworthiness,
                    communityEngagement: feedbackStats.helpfulPercentage
                },
                modelRankings: accuracyStats.modelAccuracyRankings,
                trustworthinessLeaders: performanceStats.trustworthinessLeaders,
                challengingPuzzles: worstPerformingPuzzles.slice(0, 10),
                overconfidentModels,
                researchOpportunities: this.identifyResearchOpportunities(accuracyStats, performanceStats)
            };
        } catch (error) {
            console.error('Failed to load HARC dashboard data:', error);
            // Return fallback data structure
            return this.getFallbackDashboardData();
        }
    }

    private identifyResearchOpportunities(accuracy: PureAccuracyStats, performance: PerformanceLeaderboards) {
        return {
            zeroAccuracyPuzzles: 'Puzzles where no AI model succeeded',
            overconfidentFailures: 'Models confident in wrong answers',
            humanOutperformingAI: 'Areas where humans consistently beat AI',
            unexpectedAISuccess: 'Puzzles AI solved but humans struggle with'
        };
    }
}
```

## Error Handling & Resilience Patterns

### Circuit Breaker Pattern

```typescript
class ArcExplainerCircuitBreaker {
    private failureCount = 0;
    private lastFailureTime = 0;
    private readonly threshold = 3;
    private readonly timeout = 60000; // 1 minute

    async execute<T>(operation: () => Promise<T>): Promise<T | null> {
        if (this.isOpen()) {
            console.warn('Arc-explainer circuit breaker OPEN - using fallback');
            return null;
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private isOpen(): boolean {
        return this.failureCount >= this.threshold &&
               (Date.now() - this.lastFailureTime) < this.timeout;
    }

    private onSuccess(): void {
        this.failureCount = 0;
    }

    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
    }
}
```

### Graceful Degradation

```typescript
class HARCComparisonView extends React.Component {
    async loadComparisonData(puzzleIds: string[]) {
        this.setState({ loading: true, error: null });

        try {
            // Always load human data (from PlayFab - more reliable)
            const humanData = await playFabUserData.getHumanPerformanceData();

            // Try to load AI data with fallback
            let aiData: Map<string, AggregatedAIStats> | null = null;
            try {
                aiData = await arcExplainerClient.getBatchExplanationsStats(puzzleIds);
            } catch (error) {
                console.warn('AI data unavailable, showing human-only view:', error);
                // Continue with human data only
            }

            this.setState({
                humanData,
                aiData,
                loading: false,
                showAIComparison: aiData !== null
            });

        } catch (error) {
            this.setState({ loading: false, error: error.message });
        }
    }

    render() {
        const { humanData, aiData, showAIComparison, loading, error } = this.state;

        if (loading) return <LoadingSpinner />;
        if (error) return <ErrorMessage error={error} />;

        return (
            <div>
                <HumanPerformanceView data={humanData} />
                {showAIComparison && aiData ? (
                    <HumanAIComparisonView humanData={humanData} aiData={aiData} />
                ) : (
                    <div className="info-banner">
                        AI comparison data temporarily unavailable. Showing human performance only.
                    </div>
                )}
            </div>
        );
    }
}
```

## Caching Strategy

### Multi-Level Cache Architecture

```typescript
interface CacheConfig {
    ttl: number;        // Time to live in seconds
    maxSize: number;    // Maximum cache entries
    persistent: boolean; // Use localStorage
}

class ArcExplainerCache {
    private memoryCache = new Map<string, CachedItem>();
    private configs: Record<string, CacheConfig> = {
        accuracy: { ttl: 300, maxSize: 1, persistent: true },      // 5 minutes
        performance: { ttl: 600, maxSize: 1, persistent: true },   // 10 minutes
        puzzleExplanations: { ttl: 900, maxSize: 100, persistent: false }, // 15 minutes
        feedback: { ttl: 1800, maxSize: 10, persistent: true }     // 30 minutes
    };

    set(category: string, key: string, data: any): void {
        const config = this.configs[category];
        const cacheKey = `${category}:${key}`;
        const item: CachedItem = {
            data,
            timestamp: Date.now(),
            ttl: config.ttl * 1000
        };

        // Memory cache
        this.memoryCache.set(cacheKey, item);

        // Persistent cache for important data
        if (config.persistent) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(item));
            } catch (error) {
                console.warn('Failed to persist cache item:', error);
            }
        }

        // Cleanup old entries
        this.cleanup(category, config.maxSize);
    }

    get(category: string, key: string): any | null {
        const cacheKey = `${category}:${key}`;

        // Check memory cache first
        let item = this.memoryCache.get(cacheKey);

        // Check persistent cache if not in memory
        if (!item && this.configs[category].persistent) {
            try {
                const stored = localStorage.getItem(cacheKey);
                if (stored) {
                    item = JSON.parse(stored);
                    // Restore to memory cache
                    this.memoryCache.set(cacheKey, item);
                }
            } catch (error) {
                console.warn('Failed to load cached item:', error);
            }
        }

        // Check expiration
        if (item && Date.now() - item.timestamp < item.ttl) {
            return item.data;
        }

        // Cleanup expired item
        if (item) {
            this.memoryCache.delete(cacheKey);
            if (this.configs[category].persistent) {
                localStorage.removeItem(cacheKey);
            }
        }

        return null;
    }
}
```

## Performance Optimization

### Request Batching

```typescript
class BatchedArcExplainerClient {
    private pendingRequests = new Map<string, Promise<any>>();
    private batchQueue: string[] = [];
    private batchTimeout: NodeJS.Timeout | null = null;

    async getPuzzleExplanations(puzzleId: string): Promise<PuzzleExplanation[]> {
        // Check if request is already pending
        if (this.pendingRequests.has(puzzleId)) {
            return this.pendingRequests.get(puzzleId)!;
        }

        // Create batched request
        const requestPromise = new Promise<PuzzleExplanation[]>((resolve, reject) => {
            this.batchQueue.push(puzzleId);

            // Clear existing timeout
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
            }

            // Set new timeout to execute batch
            this.batchTimeout = setTimeout(() => {
                this.executeBatch().then(() => {
                    const result = this.cache.get('puzzleExplanations', puzzleId);
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Batch request failed'));
                    }
                }).catch(reject);
            }, 100); // 100ms batch window
        });

        this.pendingRequests.set(puzzleId, requestPromise);
        return requestPromise;
    }

    private async executeBatch(): Promise<void> {
        const currentBatch = [...this.batchQueue];
        this.batchQueue = [];

        if (currentBatch.length === 0) return;

        try {
            // Execute batch request
            const batchResults = await Promise.allSettled(
                currentBatch.map(puzzleId =>
                    this.singlePuzzleRequest(puzzleId)
                )
            );

            // Process results
            batchResults.forEach((result, index) => {
                const puzzleId = currentBatch[index];
                if (result.status === 'fulfilled') {
                    this.cache.set('puzzleExplanations', puzzleId, result.value);
                }
                // Clear pending request
                this.pendingRequests.delete(puzzleId);
            });

        } catch (error) {
            console.error('Batch execution failed:', error);
            // Clear all pending requests
            currentBatch.forEach(puzzleId => {
                this.pendingRequests.delete(puzzleId);
            });
        }
    }
}
```

## Testing & Debugging

### API Health Monitoring

```typescript
class ArcExplainerHealthMonitor {
    async checkHealth(): Promise<HealthStatus> {
        const checks = await Promise.allSettled([
            this.checkEndpoint('/api/feedback/accuracy-stats'),
            this.checkEndpoint('/api/puzzle/performance-stats'),
            this.checkEndpoint('/api/models')
        ]);

        const results = checks.map((result, index) => ({
            endpoint: ['/api/feedback/accuracy-stats', '/api/puzzle/performance-stats', '/api/models'][index],
            status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
            responseTime: result.status === 'fulfilled' ? result.value.responseTime : null,
            error: result.status === 'rejected' ? result.reason.message : null
        }));

        return {
            overall: results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
            endpoints: results,
            timestamp: new Date().toISOString()
        };
    }

    private async checkEndpoint(endpoint: string): Promise<{ responseTime: number }> {
        const start = Date.now();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'HEAD', // Just check if endpoint responds
            timeout: 5000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return { responseTime: Date.now() - start };
    }
}
```

---

This integration guide provides comprehensive patterns for working with the arc-explainer API while maintaining system reliability and performance. All patterns include error resilience and graceful degradation strategies.