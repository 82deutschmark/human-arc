# PlayFab Data Architecture & Best Practices
## Version 0.1.0 - Production Patterns

**Author**: Claude Code using Sonnet 4
**Date**: 2025-09-13
**Purpose**: Comprehensive documentation of PlayFab data structures, CloudScript patterns, and production-ready implementation guidelines established during v0.1.0 development

---

## **PlayFab Data Storage Strategy**

### **Multi-Layer Architecture**

PlayFab integration uses four distinct layers for optimal performance and flexibility:

1. **Title Data**: Static puzzle/task definitions (game content)
2. **Player Statistics**: Indexed numerical values for leaderboards
3. **Player User Data**: Flexible JSON storage for detailed records
4. **Player Events**: Granular action tracking for research/analytics

---

## **Layer 1: Title Data (Game Content)**

### **Purpose**: Static configuration for puzzle definitions

#### **Storage Keys**
```typescript
// Core puzzle datasets
const TITLE_DATA_KEYS = {
    MAIN_TASKS: 'AllTasks',                              // 155 themed tasks
    TRAINING_BATCHES: [
        'officer-tasks-training-batch1.json',           // 400 puzzles
        'officer-tasks-training-batch2.json',
        'officer-tasks-training-batch3.json',
        'officer-tasks-training-batch4.json'
    ],
    TRAINING2_BATCHES: [
        'officer-tasks-training2-batch1.json',          // 1000 puzzles
        'officer-tasks-training2-batch2.json',          // (split across 10 batches)
        // ... through batch10
    ],
    EVALUATION_BATCHES: [
        'officer-tasks-evaluation-batch1.json',         // 400 puzzles
        'officer-tasks-evaluation-batch2.json',
        'officer-tasks-evaluation-batch3.json',
        'officer-tasks-evaluation-batch4.json'
    ],
    EVALUATION2_BATCHES: [
        'officer-tasks-evaluation2-batch1.json',        // 120 puzzles
        'officer-tasks-evaluation2-batch2.json'
    ]
};
```

#### **Access Pattern**
```javascript
// CloudScript - Efficient puzzle lookup
function getPuzzleById(puzzleId) {
    // Search across all batch files for the puzzle
    for (const batchKey of BATCH_KEYS) {
        const batch = Utils.safeParseJSON(server.GetTitleData({Keys: [batchKey]}).Data[batchKey], []);
        const puzzle = batch.find(p => p.id === puzzleId);
        if (puzzle) return puzzle;
    }
    return null;
}
```

---

## **Layer 2: Player Statistics (Leaderboards)**

### **Purpose**: Indexed numerical values for competitive ranking

#### **Statistic Names**
```typescript
const PLAYER_STATISTICS = {
    LEVEL_POINTS: 'LevelPoints',           // Main game (155 tasks)
    OFFICER_TRACK_POINTS: 'OfficerTrackPoints', // ARC puzzles
    ARC2_EVAL_POINTS: 'ARC2EvalPoints'    // Special evaluation dataset
};
```

#### **Update Pattern**
```javascript
// CloudScript - Atomic leaderboard updates
PlayFabService.updatePlayerStats(playerId, [
    { StatisticName: 'OfficerTrackPoints', Value: newTotalPoints }
]);
```

**Critical Requirements**:
- Statistics are **publicly visible** on leaderboards
- Values are **integers only** (no decimals)
- Updates are **atomic** and **immediately indexed**
- Used for **ranking and competition** features

---

## **Layer 3: Player User Data (Detailed Records)**

### **Purpose**: Flexible JSON storage for comprehensive player data

#### **Key Data Structures**

##### **humanPerformanceData** (Critical for v0.1.0)
```typescript
// Stored as JSON string, parsed to array of records
interface HumanPerformanceRecord {
    puzzleId: string;
    correct: boolean;           // MUST be "correct" (not "isCorrect")
    timestamp: string;          // ISO format
    basePoints: number;         // Score breakdown
    speedBonus: number;
    efficiencyBonus: number;
    finalScore: number;
    timeElapsed: number;        // ALWAYS in seconds
    stepCount: number;          // From event stream analysis
    attemptNumber: number;
}

// Example stored value
{
    "humanPerformanceData": "[{\"puzzleId\":\"ARC-TR-e7dd8335\",\"correct\":true,\"timestamp\":\"2025-01-13T10:30:00.000Z\",\"basePoints\":10000,\"speedBonus\":500,\"efficiencyBonus\":200,\"finalScore\":10700,\"timeElapsed\":196.5,\"stepCount\":45,\"attemptNumber\":1}]"
}
```

##### **Standard Player Profile Data**
```typescript
interface PlayerProfileData {
    username: string;
    rank: string;              // "Specialist 1", "Corporal", etc.
    rankLevel: string;         // "1", "2", "3", etc. (stored as string)
    totalPoints: string;       // Stored as string, parsed to number
    completedMissions: string;
    currentTask?: string;
    hasCompletedTutorial: string; // "true" or "false"
    createdAt: string;         // ISO timestamp
    updatedAt: string;         // ISO timestamp
}
```

#### **Data Management Patterns**

##### **Append-Only Performance Data**
```javascript
// CloudScript - Safe append pattern for humanPerformanceData
function appendPerformanceRecord(playerId, newRecord) {
    const playerData = PlayFabService.getPlayerData(playerId, ['humanPerformanceData']);
    const existingData = Utils.safeParseJSON(playerData.Data.humanPerformanceData?.Value, []);

    // Append new record
    existingData.push(newRecord);

    // Save back to PlayFab
    PlayFabService.updatePlayerData(playerId, {
        'humanPerformanceData': JSON.stringify(existingData)
    });
}
```

##### **Safe JSON Parsing**
```typescript
// TypeScript - Robust JSON handling
function getHumanPerformanceData(): Promise<HumanPerformanceRecord[]> {
    const result = await playFabRequestManager.makeRequest<{ Keys: string[] }, GetUserDataResponse>(
        'getUserData',
        { Keys: ['humanPerformanceData'] }
    );

    const performanceDataString = result?.Data?.humanPerformanceData?.Value;
    if (performanceDataString && performanceDataString !== 'undefined') {
        try {
            return JSON.parse(performanceDataString);
        } catch (error) {
            console.error('Failed to parse humanPerformanceData:', error);
            return [];
        }
    }
    return [];
}
```

---

## **Layer 4: Player Events (Granular Tracking)**

### **Purpose**: Detailed action logging for research and step counting

#### **Event Structure**
```typescript
interface PlayerEventData {
    eventName: "SFMC";
    sessionId: string;          // UUID for session grouping
    attemptId: number;
    game_id: string;           // Puzzle ID
    stepIndex: number;         // Sequential action number
    deltaMs: number;           // Time since last action
    status: "won" | "fail" | "stop" | "start";
    category: string;
    event_type: "game_completion" | "game_start" | "player_action" | "cell_change";
    selection_value: number;
    game_time: string;
    display_name: string;
    position: { x: number; y: number };
}
```

#### **Step Counting Implementation**
```javascript
// CloudScript - Event-based step counting
function getStepCountFromEvents(playFabId, sessionId) {
    try {
        const events = server.GetPlayerEvents({ PlayFabId: playFabId });
        let stepCount = 0;

        if (events && events.History) {
            for (let event of events.History) {
                // Filter for cell_change events in this session
                if (event.EventName === "SFMC" &&
                    event.EventData &&
                    event.EventData.sessionId === sessionId &&
                    event.EventData.event_type === "cell_change") {
                    stepCount++;
                }
            }
        }

        log.info(`Found ${stepCount} cell_change events for session ${sessionId}`);
        return stepCount > 0 ? stepCount : 100; // Fallback
    } catch (error) {
        log.error(`Error retrieving events: ${error}`);
        return 100; // Safe fallback
    }
}
```

---

## **CloudScript Validation Architecture**

### **Core Validation Function Pattern**

#### **Input Validation**
```javascript
function _validateAndScoreArcPuzzle(args, context, config) {
    try {
        // 1. Validate required arguments
        Utils.assertArgs(args, ['puzzleId', 'solutions', 'timeElapsed', 'attemptNumber']);
        const { puzzleId, solutions, timeElapsed, attemptNumber, sessionId } = args;

        // 2. timeElapsed MUST be in seconds (not milliseconds)
        // 3. solutions array must match test case count
        // 4. sessionId required for step counting
    }
}
```

#### **Scoring Calculation**
```javascript
// Modular scoring functions
const ScoringService = {
    calculateOfficerTrackScore({ timeElapsed, stepCount }) {
        const params = CONSTANTS.SCORING.OFFICER_TRACK;
        const speedBonus = this.speedBonusFor({ time: timeElapsed, ...params.SPEED_BONUS });
        const efficiencyBonus = this.efficiencyBonusFor({ steps: stepCount, ...params.EFFICIENCY_BONUS });
        const finalScore = params.BASE_POINTS + speedBonus + efficiencyBonus;
        return { basePoints: params.BASE_POINTS, speedBonus, efficiencyBonus, finalScore };
    },

    speedBonusFor({ time, perMinute, underMinutes }) {
        const timeInMinutes = Math.ceil((time || 0) / 60);
        return timeInMinutes < underMinutes ? (underMinutes - timeInMinutes) * perMinute : 0;
    },

    efficiencyBonusFor({ steps, perAction, underActions }) {
        return steps < underActions ? (underActions - steps) * perAction : 0;
    }
};
```

#### **Data Update Pattern**
```javascript
// Atomic data updates
function updatePlayerPerformance(playerId, puzzleId, scoreData, timeElapsed, stepCount, attemptNumber) {
    // 1. Fetch current data
    const playerData = PlayFabService.getPlayerData(playerId, [
        'officerCompletedPuzzles',
        'officerPoints',
        'humanPerformanceData'
    ]);

    // 2. Update all related data atomically
    const updates = {
        'officerCompletedPuzzles': JSON.stringify(updatedCompletedList),
        'officerPoints': newTotalPoints.toString(),
        'humanPerformanceData': JSON.stringify(updatedPerformanceArray)
    };

    // 3. Single atomic update
    PlayFabService.updatePlayerData(playerId, updates);

    // 4. Update leaderboard statistics
    PlayFabService.updatePlayerStats(playerId, [
        { StatisticName: 'OfficerTrackPoints', Value: newTotalPoints }
    ]);
}
```

---

## **Best Practices & Patterns**

### **1. Field Naming Consistency**
- Use `correct` (not `isCorrect`) for boolean success fields
- Store numbers as strings in User Data, parse on retrieval
- Use camelCase for all custom field names

### **2. Time Handling Standards**
- **Always store time in seconds**
- Convert milliseconds to seconds at earliest point (client validation call)
- Display with `.toFixed(1)` for consistent formatting

### **3. Error Handling**
```javascript
// Robust JSON parsing
function safeParseJSON(str, fallback = null) {
    try {
        if (!str || str === 'undefined') return fallback;
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
}

// Graceful degradation
function getStepCountFromEvents(playerId, sessionId) {
    try {
        // ... attempt to get real step count
        return actualCount;
    } catch (error) {
        log.error(`Step count retrieval failed: ${error}`);
        return 100; // Reasonable default
    }
}
```

### **4. Data Validation**
```typescript
// Client-side validation before CloudScript calls
interface ValidationRequest {
    puzzleId: string;           // Required, non-empty
    solutions: number[][][];    // Required, matches test count
    timeElapsed: number;        // Required, positive, in seconds
    attemptNumber: number;      // Required, positive integer
    sessionId: string;          // Required for step counting
}

function validateRequest(request: ValidationRequest): string[] {
    const errors: string[] = [];
    if (!request.puzzleId) errors.push('puzzleId is required');
    if (!request.solutions?.length) errors.push('solutions array is required');
    if (request.timeElapsed <= 0) errors.push('timeElapsed must be positive');
    if (request.attemptNumber <= 0) errors.push('attemptNumber must be positive');
    if (!request.sessionId) errors.push('sessionId is required');
    return errors;
}
```

### **5. Performance Optimization**
- Batch User Data updates where possible
- Use specific key requests: `{ Keys: ['specificKey'] }`
- Implement caching for frequently accessed Title Data
- Use `Promise.allSettled()` for parallel operations

---

## **Common Pitfalls & Solutions**

### **1. String vs Number Confusion**
**Problem**: PlayFab User Data stores everything as strings
```typescript
// Wrong
const points = userData.totalPoints; // This is a string!

// Right
const points = parseInt(userData.totalPoints?.Value || '0');
```

### **2. Time Unit Mismatches**
**Problem**: Mixing milliseconds and seconds
```typescript
// Wrong - sending milliseconds to CloudScript
timeElapsed: Date.now() - startTime

// Right - convert to seconds first
timeElapsed: Math.floor((Date.now() - startTime) / 1000)
```

### **3. JSON Parsing Failures**
**Problem**: PlayFab can return literal "undefined" strings
```typescript
// Wrong - will crash on JSON.parse("undefined")
const data = JSON.parse(userData.someKey?.Value);

// Right - safe parsing with fallback
const data = Utils.safeParseJSON(userData.someKey?.Value, []);
```

### **4. Field Name Inconsistencies**
**Problem**: Different components using different field names
```typescript
// CloudScript saves
humanPerformanceData.push({ correct: true });

// UI expects (must match exactly)
const success = humanResult.correct; // Not isCorrect!
```

---

This architecture has been proven in production and forms the foundation for reliable PlayFab integration in the SFMC platform.