# PlayFab Scoring System Documentation
## Space Force Mission Control 2050

**Author**: Cascade (System Analysis)  
**Date**: 2025-09-07  
**Status**: ⚠️ **CRITICAL ISSUES IDENTIFIED**

---

## Overview

This document details how puzzle event data is processed and translated into PlayFab leaderboard scores. **CRITICAL GAPS have been identified in the ARC puzzle scoring system.**

---

## Two-Track Scoring System

### 1. Regular Missions (`ValidateTaskSolution`)

**CloudScript Function**: `ValidateTaskSolution`  
**Statistic Updated**: `LevelPoints`  
**Status**: ✅ **WORKING**

#### Scoring Formula:
```
Base Points = task.basePoints (default: 100)
Time Bonus = Math.floor((30 - timeElapsed) / 5) * 10  (if < 30 seconds)
Hint Penalty = hintsUsed * 5
Final Score = Base Points + Time Bonus - Hint Penalty
```

#### PlayFab Updates:
- Updates `LevelPoints` statistic for Global leaderboard
- Updates user data: `totalPoints`, `completedMissions`, `rank`, `rankLevel`
- Logs events for analytics

#### Event Data Flow:
1. Client submits solution via `playFabValidation.validateSolution()`
2. CloudScript validates against `tasks.json` from Title Data
3. Score calculated server-side (unhackable)
4. Statistics updated atomically
5. Events logged with full attempt details

---

### 2. ARC Puzzles (`ValidateARCPuzzle`) 

**CloudScript Function**: `ValidateARCPuzzle`  
**Statistic Updated**: ❌ **NONE - CRITICAL GAP**  
**Status**: 🚨 **BROKEN - NO LEADERBOARD INTEGRATION**

#### Current Behavior:
- Validates puzzle solutions correctly ✅
- Records attempt events ✅  
- Updates `completedARCPuzzles` user data ✅
- **DOES NOT update any leaderboard statistics** ❌

#### Missing Implementation:
```javascript
// MISSING FROM ValidateARCPuzzle CloudScript:
server.UpdatePlayerStatistics({
    PlayFabId: context.currentPlayerId,
    Statistics: [
        { StatisticName: "OfficerTrackPoints", Value: newOfficerPoints }
    ]
});
```

#### Impact:
- Officer Track leaderboards will be empty or outdated
- ARC puzzle performance not reflected in rankings
- Rich event data collected but not translated to competitive scores

---

## Event Data Collection

### Rich Event Logging (Both Systems)

The application collects comprehensive event data through `playFabEvents.logPuzzleEvent()`:

**16-Parameter Event Structure**:
- `sessionId` - Unique game session
- `attemptId` - Attempt number for current puzzle  
- `game_id` - Puzzle/task identifier
- `stepIndex` - Current step in puzzle
- `positionX/Y` - Grid coordinates of actions
- `payloadSummary` - Action details object
- `deltaMs` - Time since session start
- `status` - "won", "fail", "stop", "start" 
- `category` - "game_flow", "player_interaction", etc.
- `event_type` - "game_start", "player_action", "game_completion"
- `selection_value` - Selected grid value
- `game_time` - ISO timestamp
- `display_name` - Player display name

### Event Types Logged:
- **Game Start**: Session initialization
- **Player Actions**: Every grid cell interaction
- **Hint Usage**: When hints are accessed
- **Game Completion**: Success/failure with full metrics

---

## Required Fixes

### 1. **CRITICAL**: Fix ARC Puzzle Scoring

The `ValidateARCPuzzle` CloudScript function must be updated to:

```javascript
// Add to ValidateARCPuzzle after successful validation
if (allCorrect) {
    // Calculate officer points (example formula)
    const basePoints = 50; // ARC puzzles worth 50 points
    const timeBonus = timeElapsed < 120 ? Math.floor((120 - timeElapsed) / 10) * 5 : 0;
    const newOfficerPoints = currentOfficerPoints + basePoints + timeBonus;
    
    // Update Officer Track leaderboard statistic
    server.UpdatePlayerStatistics({
        PlayFabId: context.currentPlayerId,
        Statistics: [
            { StatisticName: "OfficerTrackPoints", Value: newOfficerPoints }
        ]
    });
    
    // Update officer user data with new points
    server.UpdateUserData({
        PlayFabId: context.currentPlayerId,
        Data: {
            officerTrackPoints: newOfficerPoints.toString()
        }
    });
}
```

### 2. Default to Officer Track Leaderboards

Update leaderboard configuration to prioritize ARC puzzle performance:
- Make `LeaderboardType.OFFICER_TRACK` the default selection
- Rename "Officer Track" to "ARC Specialists" for clarity
- Ensure proper leaderboard type configuration

---

## Current Leaderboard Statistics

### Available Statistics in PlayFab:
1. **LevelPoints** - Regular mission scores ✅
2. **OfficerTrackPoints** - ARC puzzle scores ❌ (not populated)

### Current Issues:
- Officer Track leaderboards show no data because `OfficerTrackPoints` is never updated
- ARC puzzle validation exists but doesn't contribute to competitive rankings
- Rich event data exists but isn't aggregated into meaningful scores

---

## Testing Recommendations

### Before Fix:
1. Check Officer Track leaderboard → Should be empty
2. Complete ARC puzzle → Validation works but no score update
3. Check `OfficerTrackPoints` statistic → Should be 0 or undefined

### After Fix:
1. Officer Track leaderboards should populate with scores
2. ARC puzzle completion should increment `OfficerTrackPoints`
3. Leaderboard rankings should reflect ARC performance

---

## Technical Architecture

### Service Layer:
- `playFabValidation.validateSolution()` → Regular missions
- `playFabOfficerTrack.validateARCSolution()` → ARC puzzles  
- Both use CloudScript for server-side validation (unhackable)

### Data Flow:
1. **Client**: Puzzle completion triggers validation
2. **CloudScript**: Server-side validation and scoring
3. **PlayFab Statistics**: Leaderboard data storage
4. **Client**: Leaderboard display via `leaderboards.getLeaderboard()`

### Security:
- All validation happens server-side in CloudScript
- Client cannot manipulate scores or validation results
- Event data integrity maintained through PlayFab infrastructure

---

## Conclusion

**The core scoring infrastructure works correctly for regular missions but has a critical gap for ARC puzzles.** The rich event data collection system is comprehensive, but ARC puzzle performance doesn't translate to leaderboard scores due to missing CloudScript implementation.

**Priority**: Fix `ValidateARCPuzzle` CloudScript function to update `OfficerTrackPoints` statistic.
