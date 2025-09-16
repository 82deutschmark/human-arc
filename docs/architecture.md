# System Architecture - SFMC Platform

**Author**: Claude Code using Sonnet 4
**Date**: 2025-09-16
**Purpose**: Complete system architecture documentation for the SFMC ARC-AGI platform

## Architecture Overview

The SFMC platform is a **Human-AI Reasoning Comparison (HARC) platform** built on a Backend-as-a-Service (BaaS) architecture with PlayFab providing backend services and arc-explainer API providing AI performance data.

### Core Architecture Principle
**Source of Truth**: All game data, puzzle data, and user behavior resides in PlayFab. The arc-explainer API provides AI performance metadata for comparison purposes.

```
Frontend (React + Vite) ←→ PlayFab (BaaS) ←→ CloudScript (Server Logic)
        ↓
Arc-Explainer API (AI Performance Data)
```

## Data Architecture

### PlayFab Data Layers

#### Layer 1: Title Data (Game Content)
- **Purpose**: Static configuration and puzzle definitions
- **Keys**:
  - `AllTasks`: 155 main game tasks
  - `officer-tasks-*-batch*.json`: ARC-AGI puzzle collections
- **Access**: `GetTitleData()` on client startup

#### Layer 2: Player Statistics (Leaderboards)
- **Purpose**: Indexed numerical values for competitive ranking
- **Statistics**:
  - `LevelPoints`: Main game progression
  - `OfficerTrackPoints`: ARC-AGI performance
- **Access**: `UpdatePlayerStatistics`, `GetLeaderboard`

#### Layer 3: Player User Data (Performance Records)
- **Purpose**: Detailed performance tracking per player
- **Key**: `humanPerformanceData`
- **Value**: JSON array of completed puzzle records
- **Schema**:
  ```json
  {
    "puzzleId": "string",
    "correct": true,
    "scoreData": {
      "finalScore": "number",
      "timeBonus": "number",
      "basePoints": "number"
    },
    "newTotalPoints": "number",
    "timestamp": "ISO_string"
  }
  ```

#### Layer 4: PlayFab Events (Granular Analytics)
- **Purpose**: Complete user interaction replay for research
- **Events**: `game_start`, `cell_change`, `validation_complete`, `game_completion`
- **Analysis**: Aggregated offline for metrics like total actions, time-to-solution

## Service Architecture

### Core Services (`client/src/services/playfab/`)

#### Authentication (`auth.ts`)
- `LoginWithCustomID` for anonymous authentication
- Session management and persistence
- Display name generation via CloudScript

#### User Data (`userData.ts`)
- `GetUserData` / `UpdateUserData` operations
- Progress persistence across sessions
- Performance data management

#### Validation (`validation.ts`)
- Secure server-side puzzle validation via CloudScript
- Scoring calculations with time bonuses
- Leaderboard updates

#### Events (`events.ts`)
- Granular user interaction tracking
- Research-grade behavioral data collection
- Real-time analytics capabilities

### CloudScript Functions (Server-side Logic)

#### `ValidateARCPuzzle`
- **Purpose**: Standard ARC puzzle validation for Officer Track
- **Logic**: Grid comparison, scoring, leaderboard updates
- **Security**: Server-authoritative validation prevents tampering

#### `ValidateARC2EvalPuzzle`
- **Purpose**: ARC-2 Evaluation dataset with different scoring
- **Logic**: First-try bonus scoring model
- **Statistics**: Updates `ARC2EvalPoints`

#### `ValidateTaskSolution`
- **Purpose**: Main game (Enlisted Track) validation
- **Logic**: Time bonus, hint penalties, rank progression
- **Statistics**: Updates `LevelPoints`

#### `GenerateAnonymousName`
- **Purpose**: Anonymous display names for research ethics
- **Logic**: Randomized adjective + noun + number combinations

### Arc-Explainer Integration

#### Purpose
Provides AI model performance data for human-AI comparison analysis.

#### Key Endpoints
- `/api/feedback/accuracy-stats`: Pure puzzle-solving accuracy
- `/api/puzzle/performance-stats`: AI confidence reliability
- `/api/puzzle/worst-performing`: AI failure identification
- `/api/puzzle/:puzzleId/explanations`: Model prediction details

#### Integration Pattern
```typescript
// Batch processing with error resilience
const requests = puzzleIds.map(async (puzzleId) => {
    try {
        const stats = await arcExplainerClient.getPuzzleStats(puzzleId);
        results.set(puzzleId, stats);
    } catch (error) {
        // Graceful degradation - continue processing
        console.warn(`Failed to load AI stats for ${puzzleId}:`, error);
    }
});

await Promise.allSettled(requests); // No cascade failures
```

## Platform Components

### Assessment Interface (`/assessment`)
- **Purpose**: Human performance data collection
- **Features**: Curated puzzle selection, real-time scoring, performance tracking
- **Data Flow**: User actions → PlayFab events → Performance records → Comparison analysis

### HARC Platform (`/harc`)
- **Purpose**: Research-grade human vs AI comparison dashboard
- **Features**: Performance analytics, AI overconfidence detection, puzzle difficulty analysis
- **Data Sources**: PlayFab (human) + arc-explainer (AI)

### Officer Track (`/officer`)
- **Purpose**: ARC-AGI puzzle implementation
- **Features**: Training/evaluation datasets, batch processing, detailed analytics
- **Integration**: PlayFab Title Data + validation services

### Dashboard (`/dashboard`)
- **Purpose**: Personal performance tracking and progress visualization
- **Features**: Individual statistics, historical performance, achievement tracking

## Data Flow Patterns

### User Session Flow
```
1. Anonymous Authentication → PlayFab session established
2. Fetch Puzzles → Title Data retrieved and cached
3. User Interaction → Events tracked in real-time
4. Solution Submission → CloudScript validation
5. Score Update → Statistics and User Data updated
6. Comparison Analysis → Arc-explainer data merged
```

### Research Data Pipeline
```
PlayFab Events → Behavioral Analytics
PlayFab User Data → Performance Metrics
Arc-explainer API → AI Benchmarks
Combined Analysis → Research Insights
```

## Critical Architecture Patterns

### 1. Defensive Programming
**ID Normalization**: Different APIs use different ID formats
```typescript
export const idConverter = {
    normalizeToArcId(id: string): string | null {
        if (!id) return null;
        if (/^[a-f0-9]{8}$/.test(id)) return id;
        const match = id.match(/ARC-[A-Z0-9]+-([a-f0-9]{8})/);
        return match ? match[1] : null;
    }
};
```

### 2. Error Resilience
**Graceful Degradation**: API failures don't break user experience
```typescript
// Service failures return null/empty rather than throwing
try {
    return await apiCall();
} catch (error) {
    console.warn('API failed, using fallback:', error);
    return null;
}
```

### 3. Data Consistency
**Field Standardization**: Consistent naming across all boundaries
```typescript
// CloudScript saves 'correct', UI expects 'correct'
humanPerformanceData.push({
    correct: true,  // NOT 'isCorrect'
    timeElapsed: 45 // Always in seconds, NOT milliseconds
});
```

### 4. Event-Driven Analytics
**Real Metrics**: Step counts from actual user interactions
```javascript
// CloudScript analyzes event stream for accurate step counts
function getStepCountFromEvents(playFabId, sessionId) {
    const events = server.GetPlayerEvents({ PlayFabId: playFabId });
    return events.History
        .filter(e => e.EventName === "SFMC" &&
                    e.EventData?.sessionId === sessionId &&
                    e.EventData?.event_type === "cell_change")
        .length;
}
```

## Performance Considerations

### Caching Strategy
- **Title Data**: Cached on client startup, rarely changes
- **User Data**: Cached per session, updated on actions
- **Arc-explainer**: 15-minute TTL for expensive analytics calls
- **Leaderboards**: 5-minute refresh for competitive data

### API Optimization
- **Batch Processing**: Group related API calls together
- **Parallel Requests**: Use `Promise.allSettled()` for independent operations
- **Circuit Breakers**: Automatic fallback when external APIs fail

### Error Handling
- **Progressive Enhancement**: Core functionality works without external APIs
- **Fallback Data**: Static/cached data when live data unavailable
- **User Feedback**: Clear loading states and error messages

## Development Guidelines

### Service Layer Rules
1. **Authentication Required**: Never use direct `fetch()` - always use `playFabCore.makeHttpRequest()`
2. **No Service Recursion**: Don't call `get` functions from `update` functions
3. **Safe JSON Parsing**: Check for literal `"undefined"` strings before `JSON.parse()`

### Component Patterns
1. **Prop State Management**: Use `useEffect` to sync prop changes to internal state
2. **Error Boundaries**: Comprehensive error handling for all async operations
3. **Loading States**: Progressive UI rendering (loading → error → empty → data)

### Data Integration
1. **Type Safety**: Strict TypeScript interfaces for all API responses
2. **ID Conversion**: Always normalize IDs when crossing API boundaries
3. **Null Handling**: Graceful degradation for missing data

## Security Model

### Authentication
- **Anonymous by Design**: No PII collected for research ethics
- **Device-Based**: Persistent anonymous identity across sessions
- **Session Management**: Automatic token refresh and validation

### Validation
- **Server Authoritative**: All scoring and validation happens in CloudScript
- **Anti-Tampering**: Client cannot manipulate scores or progress
- **Data Integrity**: Append-only performance records

### Privacy
- **Anonymous Display Names**: Generated server-side, no correlation to identity
- **Behavioral Data**: Research-grade but anonymized
- **GDPR Compliant**: No personal identification possible

---

## Next Architecture Evolution

### Planned Enhancements
1. **Advanced Analytics**: Machine learning on behavioral patterns
2. **Collaborative Features**: Team-based puzzle solving
3. **Adaptive Difficulty**: Dynamic puzzle selection based on performance
4. **Real-time Collaboration**: Multi-user puzzle solving sessions

This architecture provides a scalable, research-grade platform for human-AI comparison while maintaining ethical data practices and robust error handling.