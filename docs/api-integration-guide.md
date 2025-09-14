# API Integration Guide - PlayFab & arc-explainer
## Version 0.1.0 Technical Documentation

**Author**: Claude Code using Sonnet 4
**Date**: 2025-01-13
**Purpose**: Comprehensive technical guide for integrating PlayFab and arc-explainer APIs based on lessons learned during v0.1.0 development

---

## **Overview**

This guide documents the successful integration patterns established in v0.1.0 for connecting PlayFab (human performance data) with arc-explainer (AI performance data) to create meaningful performance comparisons. These patterns form the technical foundation for the HARC Platform.

---

## **PlayFab Integration**

### **CloudScript Validation Architecture**

#### **Core Validation Function**
```javascript
// ValidateARCPuzzle - Primary CloudScript function
function ValidateARCPuzzle(args, context) {
    const { puzzleId, solutions, timeElapsed, attemptNumber, sessionId } = args;

    // timeElapsed MUST be in seconds (not milliseconds)
    // sessionId used for event-based step counting
    // solutions array matches test case count
}
```

#### **Critical Data Structure Requirements**

**Human Performance Record Schema**:
```typescript
interface HumanPerformanceRecord {
  puzzleId: string;
  correct: boolean;        // Field name MUST be "correct" (not "isCorrect")
  timestamp: string;       // ISO string format
  basePoints: number;      // Score breakdown
  speedBonus: number;
  efficiencyBonus: number;
  finalScore: number;
  timeElapsed: number;     // Always in SECONDS
  stepCount: number;       // From event stream analysis
  attemptNumber: number;
}
```

#### **Event-Based Step Counting**

**Implementation Pattern**:
```javascript
function getStepCountFromEvents(playFabId, sessionId) {
    try {
        const events = server.GetPlayerEvents({ PlayFabId: playFabId });
        let stepCount = 0;

        if (events && events.History) {
            for (let event of events.History) {
                if (event.EventName === "SFMC" &&
                    event.EventData &&
                    event.EventData.sessionId === sessionId &&
                    event.EventData.event_type === "cell_change") {
                    stepCount++;
                }
            }
        }

        return stepCount > 0 ? stepCount : 100; // Fallback
    } catch (error) {
        return 100; // Default fallback
    }
}
```

**Key Requirements**:
- Events must use `EventName: "SFMC"`
- Filter by `event_type: "cell_change"` for step counting
- Always include sessionId for proper filtering
- Implement fallback for cases where events aren't available

#### **Time Handling Standards**

**Critical Rule**: All time values MUST be in seconds throughout the system.

**Client-Side Conversion**:
```typescript
// ResponsivePuzzleSolver.tsx - Convert milliseconds to seconds
const result = await playFabValidation.validateARCPuzzle({
    puzzleId: puzzle.id,
    solutions: solutions,
    timeElapsed: Math.floor((Date.now() - sessionStartTime) / 1000), // Convert to seconds
    attemptNumber: attemptNumber,
    sessionId: sessionId
});
```

**UI Display**:
```typescript
// PuzzleComparisonCard.tsx - No conversion needed (already in seconds)
<span>{humanResult.timeElapsed ? humanResult.timeElapsed.toFixed(1) : 'N/A'}s</span>
```

---

## **arc-explainer Integration**

### **API Endpoint Strategy**

#### **Explanations Endpoint (Primary)**
```typescript
// Reliable endpoint for AI performance data
const response = await fetch(
    `${this.baseUrl}/api/puzzle/${puzzleId}/explanations`
);
```

**Advantages**:
- Most reliable data source for AI performance metrics
- Includes individual model performance breakdown
- Provides confidence scores and explanation quality metrics
- Available for most puzzles in the assessment set

#### **Data Aggregation Pattern**

```typescript
// arcExplainerClient.ts - Process explanation records into performance stats
private processExplanations(explanations: any[]): AggregatedAIStats {
    const modelMap = new Map<string, {
        attempts: number;
        correct: number;
        confidences: number[];
    }>();

    // Aggregate by model
    explanations.forEach(exp => {
        if (!modelMap.has(exp.modelName)) {
            modelMap.set(exp.modelName, { attempts: 0, correct: 0, confidences: [] });
        }
        const modelData = modelMap.get(exp.modelName)!;
        modelData.attempts++;
        if (exp.isPredictionCorrect) modelData.correct++;
        if (typeof exp.confidence === 'number' && !isNaN(exp.confidence)) {
            modelData.confidences.push(exp.confidence);
        }
    });

    // Calculate aggregate statistics
    const totalAttempts = Array.from(modelMap.values())
        .reduce((sum, model) => sum + model.attempts, 0);
    const correctAttempts = Array.from(modelMap.values())
        .reduce((sum, model) => sum + model.correct, 0);

    return {
        hasData: totalAttempts > 0,
        accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
        totalAttempts,
        correctAttempts,
        averageConfidence: /* calculate weighted average */,
        modelBreakdown: Array.from(modelMap.entries()).map(/* format model stats */)
    };
}
```

#### **Batch Processing Strategy**

```typescript
// HumanVsAiComparison.tsx - Efficient batch loading
const aiDataMap = await arcExplainerClient.getBatchExplanationsStats(ASSESSMENT_PUZZLE_IDS);

// Process results
const mergedData = humanData.map(humanRecord => {
    const arcId = idConverter.normalizeToArcId(humanRecord.puzzleId);
    const aiData = arcId ? aiDataMap.get(arcId) : null;

    return {
        puzzleId: humanRecord.puzzleId,
        human: humanRecord,
        ai: aiData || null,
    };
});
```

---

## **ID Normalization System**

### **The ID Format Problem**

Different systems use different ID formats:
- **ARC Format**: `e7dd8335` (raw puzzle ID)
- **PlayFab Format**: `ARC-TR-e7dd8335` (prefixed)
- **Assessment List**: Uses ARC format

### **Solution: idConverter Service**

```typescript
// idConverter.ts - Reliable ID normalization
export const idConverter = {
    normalizeToArcId(id: string): string | null {
        if (!id) return null;

        // Already ARC format (8 hex chars)
        if (/^[a-f0-9]{8}$/.test(id)) return id;

        // Extract from PlayFab format
        const match = id.match(/ARC-[A-Z0-9]+-([a-f0-9]{8})/);
        return match ? match[1] : null;
    },

    normalizeToPlayFabId(arcId: string, prefix: string = 'ARC-TR'): string {
        return `${prefix}-${arcId}`;
    }
};
```

---

## **Error Handling Patterns**

### **Graceful Degradation**

```typescript
// Always provide fallback UI states
{aiResult && aiResult.hasData ? (
    <div>{/* Rich AI statistics */}</div>
) : (
    <div className="text-slate-400">No AI data available</div>
)}
```

### **API Request Resilience**

```typescript
// arcExplainerClient.ts - Robust error handling
async getBatchExplanationsStats(puzzleIds: string[]): Promise<Map<string, AggregatedAIStats>> {
    const results = new Map<string, AggregatedAIStats>();

    const requests = puzzleIds.map(async (puzzleId) => {
        try {
            const stats = await this.getPuzzleExplanationsStats(puzzleId);
            results.set(puzzleId, stats);
        } catch (error) {
            console.warn(`Failed to load AI stats for ${puzzleId}:`, error);
            // Continue processing other puzzles
        }
    });

    await Promise.allSettled(requests); // Don't fail entire batch
    return results;
}
```

---

## **Performance Optimization**

### **Batch API Calls**

- Use `Promise.allSettled()` for parallel requests
- Process failures individually, don't fail entire batches
- Cache results where appropriate

### **Data Structure Optimization**

- Use `Map<string, T>` for fast puzzle ID lookups
- Minimize data transformation steps
- Precompute aggregated statistics

---

## **Testing Strategies**

### **Development Testing**

1. **Console Logging**: Comprehensive debug output for data flow verification
2. **API Response Inspection**: Log raw API responses to verify data structure
3. **ID Mapping Verification**: Confirm ID conversions work correctly
4. **Edge Case Testing**: Test with missing data, API failures, malformed responses

### **Integration Testing**

1. Complete puzzle in assessment mode
2. Verify data appears in PlayFab (check CloudScript logs)
3. Visit comparison page and verify data display
4. Check browser console for any API errors or data mismatches

---

## **Common Pitfalls & Solutions**

### **1. Field Name Inconsistencies**
- **Problem**: CloudScript saves `isCorrect`, UI expects `correct`
- **Solution**: Standardize on `correct` throughout the system

### **2. Time Unit Mismatches**
- **Problem**: Mixing milliseconds and seconds across components
- **Solution**: Always use seconds, convert at the earliest point (client validation call)

### **3. Step Count Hardcoding**
- **Problem**: Default return values not based on real user actions
- **Solution**: Implement proper event stream querying with fallbacks

### **4. ID Format Confusion**
- **Problem**: Different ID formats across APIs cause lookup failures
- **Solution**: Consistent use of idConverter throughout the application

### **5. API Failure Cascades**
- **Problem**: Single API failure breaks entire comparison view
- **Solution**: Graceful degradation, individual request error handling

---

This guide establishes the proven patterns for reliable PlayFab and arc-explainer integration that formed the foundation of the v0.1.0 minimal working prototype.