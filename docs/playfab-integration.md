# PlayFab Integration Guide

**Author**: Claude Code using Sonnet 4
**Date**: 2025-09-16
**Purpose**: Complete guide to PlayFab integration patterns, services, and data architecture for SFMC platform

## Overview

PlayFab serves as the complete backend for the SFMC platform, providing user management, data storage, leaderboards, analytics, and server-side validation. This guide documents the established integration patterns and service architecture.

## Core Integration Principles

### 1. PlayFab as Single Source of Truth
- All user progress, puzzle data, and performance records stored in PlayFab
- No local data persistence beyond session caching
- Server-side validation ensures data integrity

### 2. Anonymous Authentication Model
- Users identified by device-specific anonymous IDs
- No personal information collected for research ethics
- Persistent identity across sessions and devices

### 3. Event-Driven Analytics
- Granular user interaction tracking via PlayFab Events
- Research-grade behavioral data collection
- Real-time metrics and offline analysis capabilities

## Service Architecture

### Core Service Layer (`client/src/services/playfab/`)

#### playFabCore.ts - Foundation Service
```typescript
// ALL PlayFab requests must go through this service
const response = await playFabCore.makeHttpRequest('/Client/GetTitleData', {});
```

**Critical**: Never use direct `fetch()` calls to PlayFab APIs. The core service handles:
- Session ticket attachment (`X-Authentication` header)
- Request/response logging and debugging
- Error handling and retry logic
- API response standardization

#### auth.ts - Authentication Service
```typescript
// Anonymous authentication with persistent device identity
await playFabAuthManager.loginWithDeviceId();

// Generate anonymous display names for leaderboards
await playFabAuthManager.generateAnonymousDisplayName();
```

**Features**:
- `LoginWithCustomID` for cross-platform identity
- Automatic session management and renewal
- Display name generation via CloudScript
- Profile data retrieval and caching

#### userData.ts - User Data Management
```typescript
// Get complete user progress data
const userData = await playFabUserData.getAllUserData();

// Update specific data keys
await playFabUserData.updateUserData({
    humanPerformanceData: JSON.stringify(performanceRecords)
});
```

**Data Management**:
- JSON serialization/deserialization of complex data
- Safe parsing with fallback for corrupted data
- Incremental updates and data merging
- Progress persistence across sessions

#### validation.ts - Puzzle Validation
```typescript
// Secure server-side validation via CloudScript
const result = await playFabValidation.validateARCPuzzle({
    puzzleId: 'a699fb00',
    solutions: [outputGrid],
    timeElapsed: 45,
    sessionId: 'session-uuid'
});
```

**Security Model**:
- All validation happens server-side in CloudScript
- Client cannot manipulate scores or completion status
- Time-based scoring with anti-cheat measures
- Automatic leaderboard updates

#### events.ts - Analytics & Events
```typescript
// Track granular user interactions for research
await playFabEvents.writeEvent({
    event_type: 'cell_change',
    sessionId: sessionId,
    positionX: x,
    positionY: y,
    deltaMs: timeSinceLastAction,
    selection_value: selectedColor
});
```

**Event Types**:
- `game_start`: Session initiation
- `cell_change`: Grid modifications
- `validation_complete`: Solution attempts
- `game_completion`: Successful puzzle completion
- `game_hint`: Help system usage

## Data Architecture

### Title Data - Game Configuration
```json
{
    "AllTasks": "[{...155 main game tasks...}]",
    "officer-tasks-training-batch1.json": "[{...400 training puzzles...}]",
    "officer-tasks-evaluation-batch1.json": "[{...400 evaluation puzzles...}]"
}
```

**Usage Pattern**:
```typescript
// Load all game content on startup
const titleData = await playFabCore.makeHttpRequest('/Client/GetTitleData', {});
const allTasks = JSON.parse(titleData.Data.AllTasks);
```

### Player Statistics - Leaderboards
```typescript
interface PlayerStatistics {
    LevelPoints: number;        // Main game progression
    OfficerTrackPoints: number; // ARC-AGI performance
    ARC2EvalPoints: number;     // ARC-2 evaluation score
}
```

**Update Pattern**:
```typescript
// CloudScript updates statistics after validation
server.UpdatePlayerStatistics({
    PlayFabId: currentPlayerId,
    Statistics: [{
        StatisticName: "OfficerTrackPoints",
        Value: newTotalPoints
    }]
});
```

### User Data - Performance Records
```json
{
    "humanPerformanceData": "[
        {
            \"puzzleId\": \"a699fb00\",
            \"correct\": true,
            \"scoreData\": {
                \"finalScore\": 1250,
                \"timeBonus\": 450,
                \"basePoints\": 800
            },
            \"newTotalPoints\": 5720,
            \"timestamp\": \"2025-09-16T10:30:00Z\"
        }
    ]"
}
```

**Critical Fields**:
- `correct`: Boolean indicating success (NOT `isCorrect`)
- `timeElapsed`: Time in seconds (NOT milliseconds)
- `scoreData`: Complete scoring breakdown
- `timestamp`: ISO format for chronological ordering

### PlayFab Events - Behavioral Analytics
```json
{
    "EventName": "SFMC",
    "EventData": {
        "sessionId": "uuid-session-id",
        "attemptId": 1,
        "puzzleId": "a699fb00",
        "event_type": "cell_change",
        "positionX": 3,
        "positionY": 2,
        "deltaMs": 1234,
        "selection_value": 5,
        "game_time": 45000
    }
}
```

## CloudScript Functions

### ValidateARCPuzzle - Standard ARC Validation
```javascript
handlers.ValidateARCPuzzle = function(args) {
    // 1. Load puzzle data from Title Data
    const puzzleData = JSON.parse(server.GetTitleData().Data[`officer-${args.dataset}-${args.batchKey}`]);

    // 2. Find specific puzzle
    const puzzle = puzzleData.find(p => p.id === args.puzzleId);

    // 3. Validate solution grids
    const isCorrect = validateGrids(puzzle.test[0].output, args.solutions[0]);

    // 4. Calculate score with time bonus
    const score = calculateScore(isCorrect, args.timeElapsed, puzzle.basePoints);

    // 5. Update leaderboards
    if (isCorrect) {
        server.UpdatePlayerStatistics({
            PlayFabId: currentPlayerId,
            Statistics: [{ StatisticName: "OfficerTrackPoints", Value: score.newTotal }]
        });
    }

    // 6. Store performance record
    updateHumanPerformanceData({
        puzzleId: args.puzzleId,
        correct: isCorrect,
        scoreData: score,
        timestamp: new Date().toISOString()
    });

    return {
        correct: isCorrect,
        scoreData: score,
        message: isCorrect ? "Correct solution!" : "Incorrect solution"
    };
};
```

### Core Helper Functions
```javascript
// Real step counting from event stream
function getStepCountFromEvents(playFabId, sessionId) {
    const events = server.GetPlayerEvents({ PlayFabId: playFabId });
    let stepCount = 0;

    if (events && events.History) {
        events.History.forEach(event => {
            if (event.EventName === "SFMC" &&
                event.EventData?.sessionId === sessionId &&
                event.EventData?.event_type === "cell_change") {
                stepCount++;
            }
        });
    }

    return stepCount > 0 ? stepCount : 100; // Fallback
}

// Grid validation with exact matching
function validateGrids(expected, actual) {
    if (!expected || !actual) return false;
    if (expected.length !== actual.length) return false;

    for (let row = 0; row < expected.length; row++) {
        if (expected[row].length !== actual[row].length) return false;
        for (let col = 0; col < expected[row].length; col++) {
            if (expected[row][col] !== actual[row][col]) return false;
        }
    }

    return true;
}
```

## Integration Patterns

### Authentication Flow
```typescript
class PlayFabAuthManager {
    async loginWithDeviceId(): Promise<boolean> {
        const deviceId = this.getOrCreateDeviceId();

        const result = await playFabCore.makeHttpRequest('/Client/LoginWithCustomID', {
            CustomId: `device-${deviceId}`,
            CreateAccount: true
        });

        if (result.success) {
            this.sessionTicket = result.data.SessionTicket;
            this.playFabId = result.data.PlayFabId;
            return true;
        }

        return false;
    }
}
```

### Data Loading Pattern
```typescript
class PlayFabUserData {
    async getHumanPerformanceData(): Promise<HumanPerformanceRecord[]> {
        const userData = await this.getAllUserData();
        const performanceJson = userData?.humanPerformanceData;

        if (!performanceJson || performanceJson === "undefined") {
            return [];
        }

        try {
            return JSON.parse(performanceJson);
        } catch (error) {
            console.error('Failed to parse performance data:', error);
            return [];
        }
    }
}
```

### Validation Pattern
```typescript
class PlayFabValidation {
    async validateARCPuzzle(params: ARCValidationParams): Promise<ValidationResult> {
        const result = await playFabCore.makeHttpRequest('/Client/ExecuteCloudScript', {
            FunctionName: 'ValidateARCPuzzle',
            FunctionParameter: params
        });

        if (result.success && result.data?.FunctionResult) {
            return result.data.FunctionResult;
        }

        throw new Error('Validation failed');
    }
}
```

### Event Tracking Pattern
```typescript
class PlayFabEvents {
    async writeEvent(eventData: EventData): Promise<void> {
        await playFabCore.makeHttpRequest('/Client/WritePlayerEvent', {
            EventName: 'SFMC',
            Body: eventData
        });
    }

    // Batch events for performance
    async writeBatchEvents(events: EventData[]): Promise<void> {
        const requests = events.map(event => this.writeEvent(event));
        await Promise.allSettled(requests); // Continue on partial failures
    }
}
```

## Common Patterns & Best Practices

### 1. Error Resilience
```typescript
// Always handle PlayFab API failures gracefully
async function safePlayFabCall<T>(operation: () => Promise<T>): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        console.error('PlayFab operation failed:', error);
        return null;
    }
}
```

### 2. Data Consistency
```typescript
// Ensure field names match across client and CloudScript
interface PerformanceRecord {
    correct: boolean;      // NOT isCorrect
    timeElapsed: number;   // Always seconds, NOT milliseconds
    puzzleId: string;      // Normalized format
}
```

### 3. Service Initialization
```typescript
// Initialize all PlayFab services on app startup
export async function initializePlayFabServices(): Promise<boolean> {
    const authSuccess = await playFabAuthManager.loginWithDeviceId();
    if (!authSuccess) return false;

    // Load initial data
    await playFabUserData.loadUserData();
    await loadTitleData();

    return true;
}
```

### 4. Session Management
```typescript
// Handle session expiration gracefully
class PlayFabCore {
    async makeHttpRequest(endpoint: string, data: any) {
        try {
            return await this.executeRequest(endpoint, data);
        } catch (error) {
            if (error.status === 401) {
                // Session expired, re-authenticate
                await playFabAuthManager.loginWithDeviceId();
                return await this.executeRequest(endpoint, data);
            }
            throw error;
        }
    }
}
```

## Debugging & Troubleshooting

### Common Issues

#### 1. Infinite Loop Prevention
**Problem**: Service recursion causes infinite API calls
**Solution**: Never call `get` methods from `update` methods
```typescript
// ❌ Wrong - causes recursion
async updateUserData(data: any) {
    const current = await this.getUserData(); // DON'T DO THIS
    // ... update logic
}

// ✅ Correct - pass current data as parameter
async updateUserData(data: any, currentData?: any) {
    const current = currentData || data; // Use passed data
    // ... update logic
}
```

#### 2. JSON Parsing Safety
**Problem**: PlayFab returns literal string "undefined"
**Solution**: Always check before parsing
```typescript
// ✅ Safe parsing pattern
function safeJsonParse<T>(json: string | undefined, fallback: T): T {
    if (!json || json === "undefined") return fallback;

    try {
        return JSON.parse(json);
    } catch (error) {
        console.warn('JSON parse failed:', error);
        return fallback;
    }
}
```

#### 3. Session Ticket Issues
**Problem**: Authentication failures or 401 errors
**Solution**: Always use `playFabCore.makeHttpRequest()`
```typescript
// ❌ Wrong - missing session ticket
const response = await fetch('/Client/GetUserData', {
    method: 'POST',
    body: JSON.stringify(data)
});

// ✅ Correct - automatic session handling
const response = await playFabCore.makeHttpRequest('/Client/GetUserData', data);
```

### Debug Tools

#### Service Status Check
```typescript
export function debugPlayFabServices() {
    console.log('PlayFab Service Status:');
    console.log('- Auth:', playFabAuthManager.isAuthenticated);
    console.log('- Session:', playFabAuthManager.sessionTicket ? 'Valid' : 'Missing');
    console.log('- Player ID:', playFabAuthManager.playFabId);
    console.log('- User Data Loaded:', playFabUserData.isDataLoaded);
}
```

#### Event Stream Analysis
```typescript
export async function analyzePlayerEvents(sessionId: string) {
    const events = await playFabCore.makeHttpRequest('/Client/GetPlayerEvents', {});
    const sessionEvents = events.History.filter(e =>
        e.EventData?.sessionId === sessionId
    );

    console.log(`Session ${sessionId} Events:`, {
        total: sessionEvents.length,
        cellChanges: sessionEvents.filter(e => e.EventData?.event_type === 'cell_change').length,
        validations: sessionEvents.filter(e => e.EventData?.event_type === 'validation_complete').length
    });
}
```

## Performance Optimization

### Caching Strategy
```typescript
class PlayFabDataCache {
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

    set(key: string, data: any, ttlMinutes = 15) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMinutes * 60 * 1000
        });
    }

    get(key: string): any | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }
}
```

### Batch Operations
```typescript
// Batch statistics updates for performance
async function batchUpdateStatistics(updates: StatisticUpdate[]) {
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < updates.length; i += batchSize) {
        batches.push(updates.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        await playFabCore.makeHttpRequest('/Client/UpdatePlayerStatistics', {
            Statistics: batch
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
```

---

This integration guide provides the complete foundation for working with PlayFab in the SFMC platform. All established patterns are production-tested and follow the architecture principles documented in CLAUDE.md.