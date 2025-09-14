# arc-explainer API Integration Patterns
## Production Implementation Guide - Version 0.1.0

**Author**: Claude Code using Sonnet 4
**Date**: 2025-09-13
**Purpose**: Comprehensive technical documentation of arc-explainer API integration patterns, endpoint usage, and data processing strategies established during v0.1.0 development

---

## **API Overview**

The arc-explainer API provides AI performance statistics and explanation quality metrics for ARC puzzles. The v0.1.0 implementation successfully established reliable patterns for integrating this data with PlayFab human performance records.

**Base URL**: `https://arc-explainer-production.up.railway.app`

---

## **Primary Integration Endpoint**

### **Explanations Endpoint (Most Reliable)**

#### **Endpoint Pattern**
```typescript
const response = await fetch(
    `${baseUrl}/api/puzzle/${puzzleId}/explanations`
);
```

#### **Why This Endpoint**
1. **Highest Data Availability**: Most puzzles have explanation records
2. **Rich Detail**: Individual model performance, confidence scores, explanation quality
3. **Consistent Format**: Reliable JSON structure across all puzzle types
4. **Real Performance Data**: Based on actual AI model attempts, not synthetic benchmarks

#### **Response Structure**
```typescript
interface ExplanationRecord {
    id: number;
    puzzleId: string;           // ARC format (e.g., "e7dd8335")
    modelName: string;          // "gpt-4", "claude-3-sonnet", etc.
    isPredictionCorrect: boolean; // Critical for accuracy calculation
    confidence: number;         // 0-100, model's confidence in answer
    explanation: string;
    trustworthinessScore?: number;
    createdAt: string;
    updatedAt: string;
}
```

---

## **Data Processing Architecture**

### **Aggregation Strategy**

#### **Individual Puzzle Processing**
```typescript
// arcExplainerClient.ts - Core aggregation logic
private processExplanations(explanations: ExplanationRecord[]): AggregatedAIStats {
    // Group by model for detailed breakdown
    const modelMap = new Map<string, {
        attempts: number;
        correct: number;
        confidences: number[];
    }>();

    explanations.forEach(exp => {
        if (!modelMap.has(exp.modelName)) {
            modelMap.set(exp.modelName, {
                attempts: 0,
                correct: 0,
                confidences: []
            });
        }

        const modelData = modelMap.get(exp.modelName)!;
        modelData.attempts++;

        // Track correct predictions
        if (exp.isPredictionCorrect) {
            modelData.correct++;
        }

        // Collect confidence scores for averaging
        if (typeof exp.confidence === 'number' && !isNaN(exp.confidence)) {
            modelData.confidences.push(exp.confidence);
        }
    });

    // Calculate aggregate statistics
    const totalAttempts = Array.from(modelMap.values())
        .reduce((sum, model) => sum + model.attempts, 0);
    const correctAttempts = Array.from(modelMap.values())
        .reduce((sum, model) => sum + model.correct, 0);

    // Weighted average confidence calculation
    let totalConfidenceWeight = 0;
    let weightedConfidenceSum = 0;
    modelMap.forEach(modelData => {
        if (modelData.confidences.length > 0) {
            const avgConfidence = modelData.confidences.reduce((sum, conf) => sum + conf, 0) / modelData.confidences.length;
            weightedConfidenceSum += avgConfidence * modelData.attempts;
            totalConfidenceWeight += modelData.attempts;
        }
    });

    return {
        hasData: totalAttempts > 0,
        accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
        totalAttempts,
        correctAttempts,
        averageConfidence: totalConfidenceWeight > 0 ? weightedConfidenceSum / totalConfidenceWeight : 0,
        modelBreakdown: Array.from(modelMap.entries()).map(([modelName, data]) => ({
            modelName,
            attempts: data.attempts,
            correct: data.correct,
            accuracy: (data.correct / data.attempts) * 100,
            avgConfidence: data.confidences.length > 0
                ? data.confidences.reduce((sum, conf) => sum + conf, 0) / data.confidences.length
                : 0
        }))
    };
}
```

#### **Batch Processing Implementation**
```typescript
// HumanVsAiComparison.tsx - Efficient batch loading
async getBatchExplanationsStats(puzzleIds: string[]): Promise<Map<string, AggregatedAIStats>> {
    const results = new Map<string, AggregatedAIStats>();

    // Process puzzles in parallel with individual error handling
    const requests = puzzleIds.map(async (puzzleId) => {
        try {
            const stats = await this.getPuzzleExplanationsStats(puzzleId);
            results.set(puzzleId, stats);
            console.log(`✅ Loaded AI stats for ${puzzleId}: ${stats.correctAttempts}/${stats.totalAttempts} (${stats.accuracy.toFixed(1)}%)`);
        } catch (error) {
            console.warn(`⚠️ Failed to load AI stats for ${puzzleId}:`, error);
            // Don't add to results map - will be handled as missing data
        }
    });

    // Wait for all requests to complete (don't fail on individual errors)
    await Promise.allSettled(requests);

    console.log(`📊 Batch processing complete: ${results.size}/${puzzleIds.length} puzzles loaded`);
    return results;
}
```

---

## **Data Integration Patterns**

### **Human-AI Data Merging**

#### **ID Normalization Critical Path**
```typescript
// HumanVsAiComparison.tsx - Robust data merging
const mergedData = humanData.map(humanRecord => {
    // Convert PlayFab ID format to ARC format
    const arcId = idConverter.normalizeToArcId(humanRecord.puzzleId);

    // Lookup AI data using normalized ID
    const aiData = arcId ? aiDataMap.get(arcId) : null;

    // Debug logging for verification
    console.log(`🔗 Merging: ${humanRecord.puzzleId} -> ${arcId} -> ${
        aiData?.hasData
            ? `${aiData.correctAttempts}/${aiData.totalAttempts} (${aiData.accuracy.toFixed(1)}%)`
            : 'NO AI DATA'
    }`);

    return {
        puzzleId: humanRecord.puzzleId,  // Keep original ID for UI
        human: humanRecord,
        ai: aiData || null,
    };
});
```

### **Error-Resilient UI Patterns**

#### **Graceful Degradation**
```typescript
// PuzzleComparisonCard.tsx - Handle missing AI data gracefully
{aiResult && aiResult.hasData ? (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <span className="text-slate-300">Success Rate:</span>
            <span className={`font-bold text-xl ${aiResult.accuracy > 50 ? 'text-green-400' : 'text-red-400'}`}>
                {`${aiResult.accuracy.toFixed(1)}%`}
            </span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-slate-300">Correct/Total:</span>
            <span className="font-bold text-xl text-amber-300">
                {aiResult.correctAttempts}/{aiResult.totalAttempts}
            </span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-slate-300">Avg. Confidence:</span>
            <span className="font-bold text-xl text-cyan-300">
                {aiResult.averageConfidence > 0 ? `${aiResult.averageConfidence.toFixed(0)}%` : 'N/A'}
            </span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-slate-300">AI Models:</span>
            <span className="font-bold text-xl text-orange-300">
                {aiResult.modelBreakdown.length}
            </span>
        </div>
    </div>
) : (
    <div className="text-slate-400 text-center">No AI data available</div>
)}
```

#### **Loading States and Error Boundaries**
```typescript
// HumanVsAiComparison.tsx - Comprehensive loading and error states
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Loading state
if (isLoading) {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
                <div>Loading Comparison Data...</div>
            </div>
        </div>
    );
}

// Error state
if (error) {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <div className="text-red-400 font-semibold mb-2">Failed to Load Comparison</div>
                <div className="text-slate-400 mb-4">{error}</div>
            </div>
        </div>
    );
}
```

---

## **Performance Optimization Strategies**

### **Parallel Request Processing**
```typescript
// Optimal concurrent request handling
const CONCURRENT_LIMIT = 10; // Prevent overwhelming the API

async function processConcurrentRequests<T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    limit: number = CONCURRENT_LIMIT
): Promise<void> {
    for (let i = 0; i < items.length; i += limit) {
        const batch = items.slice(i, i + limit);
        const batchPromises = batch.map(processor);
        await Promise.allSettled(batchPromises);
    }
}
```

### **Response Caching Strategy**
```typescript
// Simple in-memory cache for API responses
class ArcExplainerCache {
    private cache = new Map<string, { data: AggregatedAIStats; expires: number }>();
    private CACHE_TTL = 15 * 60 * 1000; // 15 minutes

    get(puzzleId: string): AggregatedAIStats | null {
        const cached = this.cache.get(puzzleId);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(puzzleId); // Clean expired entries
        }
        return null;
    }

    set(puzzleId: string, data: AggregatedAIStats): void {
        this.cache.set(puzzleId, {
            data,
            expires: Date.now() + this.CACHE_TTL
        });
    }
}
```

---

## **Quality Metrics & Analysis**

### **Explanation Quality Assessment**
```typescript
// PuzzleComparisonCard.tsx - Quality tier calculation
const getExplanationQualityTier = (aiResult: AggregatedAIStats) => {
    const { totalAttempts, accuracy } = aiResult;

    if (totalAttempts > 20 && accuracy > 60) {
        return { label: 'High', color: 'text-green-400' };
    }
    if (totalAttempts > 10 && accuracy > 40) {
        return { label: 'Medium', color: 'text-yellow-400' };
    }
    return { label: 'Low', color: 'text-red-400' };
};
```

### **Overconfidence Detection**
```typescript
// Identify dangerous AI overconfidence patterns
const isOverconfident = (aiResult: AggregatedAIStats): boolean => {
    const accuracyDecimal = aiResult.accuracy / 100;
    const avgConfidence = aiResult.averageConfidence;

    // AI is overconfident if accuracy < 50% but confidence > 80%
    return accuracyDecimal < 0.5 && avgConfidence > 80;
};

// UI warning display
{isOverconfident(aiResult) && (
    <div className="pt-2 text-center bg-red-900/50 rounded-md p-1 mt-2">
        <p className="text-red-300 font-bold text-sm">🚨 Dangerous Overconfidence Detected</p>
    </div>
)}
```

---

## **Alternative Endpoints (Secondary)**

### **Accuracy Stats Endpoint**
```typescript
// Fallback endpoint for basic performance metrics
const response = await fetch(
    `${baseUrl}/api/feedback/accuracy-stats?${puzzleIds.map(id => `puzzleId=${id}`).join('&')}`
);
```

**Use Cases**:
- Bulk statistics without detailed explanations
- Faster response times for large datasets
- Simplified accuracy-only comparisons

### **Individual Puzzle Endpoints**
```typescript
// Direct puzzle data access (limited availability)
const puzzleResponse = await fetch(`${baseUrl}/api/puzzle/${puzzleId}`);
const performanceResponse = await fetch(`${baseUrl}/api/puzzle/performance/${puzzleId}`);
```

**Limitations**:
- Inconsistent data availability
- Varying response formats
- Not recommended for production use in v0.1.0

---

## **Error Handling Patterns**

### **API Request Resilience**
```typescript
async function makeResilientRequest<T>(
    url: string,
    retries: number = 2
): Promise<T | null> {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            if (attempt <= retries) {
                console.warn(`API request attempt ${attempt} failed, retrying...`, error);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
            console.error(`API request failed after ${retries + 1} attempts:`, error);
            return null;
        }
    }
}
```

### **Data Validation**
```typescript
function validateExplanationRecord(record: any): record is ExplanationRecord {
    return (
        typeof record.id === 'number' &&
        typeof record.puzzleId === 'string' &&
        typeof record.modelName === 'string' &&
        typeof record.isPredictionCorrect === 'boolean' &&
        (typeof record.confidence === 'number' || record.confidence === undefined)
    );
}

function processExplanations(rawData: any[]): ExplanationRecord[] {
    return rawData
        .filter(validateExplanationRecord)
        .filter(record => record.puzzleId && record.modelName); // Additional safety
}
```

---

## **Integration Testing Strategies**

### **Development Verification**
```typescript
// Console logging for development verification
console.log('🚀 Using explanations endpoint for real AI stats');
console.log(`📊 AI data map contains:`, Array.from(aiDataMap.keys()));
console.log(`👤 Human data contains ${humanData.length} records`);

// Per-puzzle verification
humanData.forEach(record => {
    const arcId = idConverter.normalizeToArcId(record.puzzleId);
    const aiData = arcId ? aiDataMap.get(arcId) : null;
    console.log(`🔗 ${record.puzzleId} -> ${arcId} -> ${aiData ? 'HAS AI DATA' : 'NO AI DATA'}`);
});
```

### **Production Monitoring**
```typescript
// Track API success rates and performance
const apiMetrics = {
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    averageResponseTime: 0
};

function trackAPICall(success: boolean, responseTime: number) {
    if (success) {
        apiMetrics.successfulRequests++;
    } else {
        apiMetrics.failedRequests++;
    }

    apiMetrics.totalResponseTime += responseTime;
    const totalRequests = apiMetrics.successfulRequests + apiMetrics.failedRequests;
    apiMetrics.averageResponseTime = apiMetrics.totalResponseTime / totalRequests;
}
```

---

## **Summary of Production Patterns**

1. **Primary Data Source**: Use `/api/puzzle/{id}/explanations` endpoint
2. **Batch Processing**: Parallel requests with individual error handling
3. **Data Aggregation**: Group by model, calculate weighted averages
4. **Error Resilience**: Graceful degradation, never fail entire UI
5. **Performance**: Caching, concurrent limits, Promise.allSettled()
6. **Quality Metrics**: Overconfidence detection, explanation quality tiers
7. **Integration**: Robust ID normalization and data merging

These patterns have been proven reliable in the v0.1.0 production environment and form the foundation for future HARC Platform development.

