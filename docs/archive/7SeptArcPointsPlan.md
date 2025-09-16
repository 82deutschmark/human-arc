# ARC Puzzle High-Score Scoring System Plan
**Date**: September 7, 2025  
**Author**: System Analysis & Planning  
**Status**: Ready for Implementation

## Overview

This plan implements a rewarding high-score system for ARC puzzles with generous time limits and simple scoring formulas. The focus is on making players feel accomplished with large point values while encouraging both speed and efficiency through bonuses, not penalties.

## Current State Analysis

### ✅ Working Systems:
- **Regular Mission Scoring**: Complete with time bonuses, hint penalties, and leaderboard integration
- **ARC Puzzle Validation**: Server-side validation works correctly via `ValidateARCPuzzle` CloudScript
- **Rich Event Logging**: Comprehensive 16-parameter event system captures all user interactions
- **Event Data Collection**: Step counts, timing data, and user behavior analytics are recorded

### 🚨 Critical Issues:
1. **ARC Scoring Gap**: `ValidateARCPuzzle` validates but never calls `UpdatePlayerStatistics`
2. **Missing ARC-2 Scoring**: No dedicated scoring for evaluation2 dataset puzzles
3. **No High-Score Feel**: Current scoring feels low and unrewarding
4. **Complex Formulas**: Existing plans use confusing mathematical calculations

## High-Score System Design

### Philosophy: Rewarding & Simple
- **High Base Scores**: Start at 10,000+ points (feels immediately rewarding)
- **Generous Time Limits**: 20-30 minutes (stress-free experience)
- **Bonuses Only**: No penalties for taking time, only bonuses for efficiency
- **Simple Math**: Easy multiplication, no complex calculations

### Task 1: Standard ARC Puzzle High-Score System

**Objective**: Make players feel accomplished with meaningful high scores

**CloudScript Changes** (`cloudscript.js`):
```javascript
// Add to ValidateARCPuzzle function after successful validation:
if (allCorrect) {
    // Get current officer points
    const currentUserData = server.GetUserData({
        PlayFabId: context.currentPlayerId,
        Keys: ["officerTrackPoints"]
    });
    
    let currentOfficerPoints = 0;
    if (currentUserData.Data && currentUserData.Data.officerTrackPoints) {
        currentOfficerPoints = parseInt(currentUserData.Data.officerTrackPoints.Value) || 0;
    }
    
    // HIGH-SCORE FORMULA (Simple & Rewarding)
    const basePoints = 10000; // High base - everyone wins big!
    
    // Speed Bonus: 100 points per minute under 20 minutes
    const timeInMinutes = Math.ceil((timeElapsed || 0) / 60);
    const speedBonus = timeInMinutes < 20 ? (20 - timeInMinutes) * 100 : 0;
    
    // Efficiency Bonus: Extract step count from events, 50 points per action under 100
    const stepCount = getStepCountFromEvents(context.currentPlayerId, sessionId) || 100;
    const efficiencyBonus = stepCount < 100 ? (100 - stepCount) * 50 : 0;
    
    const finalScore = basePoints + speedBonus + efficiencyBonus;
    const newOfficerPoints = currentOfficerPoints + finalScore;
    
    // Update Officer Track leaderboard statistic
    server.UpdatePlayerStatistics({
        PlayFabId: context.currentPlayerId,
        Statistics: [
            { StatisticName: "OfficerTrackPoints", Value: newOfficerPoints }
        ]
    });
    
    // Update user data with new points
    server.UpdateUserData({
        PlayFabId: context.currentPlayerId,
        Data: {
            officerTrackPoints: newOfficerPoints.toString()
        }
    });
}
```

**Standard ARC Scoring Formula (Simple)**:
```
Final Score = 10,000 + Speed Bonus + Efficiency Bonus

Speed Bonus = (Minutes under 20) × 100
Efficiency Bonus = (Actions under 100) × 50

Maximum Score = 10,000 + 2,000 + 2,500 = 14,500 points
Typical Score = 10,000 + 500 + 1,250 = 11,750 points
```

**Examples**:
- Solve in 15 minutes with 75 actions = 10,000 + 500 + 1,250 = **11,750 points**
- Solve in 25 minutes with 120 actions = 10,000 + 0 + 0 = **10,000 points** (still feels good!)
- Perfect speed run (5 minutes, 30 actions) = 10,000 + 1,500 + 3,500 = **15,000 points**

### Task 2: ARC-2 Evaluation Premium High-Score System

**Objective**: Create premium scoring for the hardest puzzles with massive rewards

**New CloudScript Function** (`cloudscript.js`):
```javascript
handlers.ValidateARC2EvalPuzzle = function(args, context) {
    // Similar validation logic to ValidateARCPuzzle
    // PREMIUM HIGH-SCORE FORMULA for evaluation puzzles:
    
    if (allCorrect) {
        // Get current ARC-2 points
        const currentUserData = server.GetUserData({
            PlayFabId: context.currentPlayerId,
            Keys: ["arc2EvalPoints"]
        });
        
        let currentARC2Points = 0;
        if (currentUserData.Data && currentUserData.Data.arc2EvalPoints) {
            currentARC2Points = parseInt(currentUserData.Data.arc2EvalPoints.Value) || 0;
        }
        
        // PREMIUM HIGH-SCORE FORMULA
        const basePoints = 25000; // Massive base for hardest puzzles!
        
        // Premium Speed Bonus: 200 points per minute under 30 minutes
        const timeInMinutes = Math.ceil((timeElapsed || 0) / 60);
        const speedBonus = timeInMinutes < 30 ? (30 - timeInMinutes) * 200 : 0;
        
        // Premium Efficiency Bonus: 100 points per action under 150
        const stepCount = getStepCountFromEvents(context.currentPlayerId, sessionId) || 150;
        const efficiencyBonus = stepCount < 150 ? (150 - stepCount) * 100 : 0;
        
        // First Try Bonus: Huge reward for getting it right immediately
        const firstTryBonus = (attemptNumber === 1) ? 5000 : 0;
        
        const finalScore = basePoints + speedBonus + efficiencyBonus + firstTryBonus;
        const newARC2Points = currentARC2Points + finalScore;
        
        // Update separate ARC2EvalPoints statistic
        server.UpdatePlayerStatistics({
            PlayFabId: context.currentPlayerId,
            Statistics: [
                { StatisticName: "ARC2EvalPoints", Value: newARC2Points }
            ]
        });
        
        // Update user data
        server.UpdateUserData({
            PlayFabId: context.currentPlayerId,
            Data: {
                arc2EvalPoints: newARC2Points.toString()
            }
        });
    }
};
```

**ARC-2 Evaluation Premium Formula (Simple)**:
```
Final Score = 25,000 + Speed Bonus + Efficiency Bonus + First Try Bonus

Speed Bonus = (Minutes under 30) × 200
Efficiency Bonus = (Actions under 150) × 100  
First Try Bonus = 5,000 (only on first attempt)

Maximum Score = 25,000 + 6,000 + 5,000 + 5,000 = 41,000 points
Typical Score = 25,000 + 2,000 + 2,500 + 0 = 29,500 points
```

**Examples**:
- First try, 20 minutes, 100 actions = 25,000 + 2,000 + 5,000 + 5,000 = **37,000 points**
- Second try, 35 minutes, 200 actions = 25,000 + 0 + 0 + 0 = **25,000 points** (still huge!)
- Perfect run (10 minutes, 50 actions, first try) = **41,000 points maximum**

### Task 3: Simple Event Data Integration

**Objective**: Use rich event data to calculate bonuses simply

**Event Data Helper Function** (add to CloudScript):
```javascript
function getStepCountFromEvents(playFabId, sessionId) {
    // Query recent events for this session
    const events = server.GetPlayerEvents({
        PlayFabId: playFabId,
        EventNamespace: "custom.SFMC"
    });
    
    // Count cell_change events in this session
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
    
    return stepCount || 100; // Default to 100 if no data
}
```

**Multi-Test Puzzle Handling**:
- **Simple Approach**: Each test case completion adds to the action count
- **No Complexity Penalties**: More tests = more opportunities for bonuses
- **Session Continuity**: All test cases in one session count as single attempt

**Attempt Tracking**:
- Use existing `attemptNumber` parameter in validation calls
- First Try Bonus only applies to `attemptNumber === 1`
- No penalties for multiple attempts, just no first-try bonus

### Task 4: Simple Session Validation (Light Touch)

**Objective**: Basic fraud detection without being heavy-handed

**Simple Validation Checks** (add to CloudScript):
```javascript
function validateSession(timeElapsed, stepCount, sessionId) {
    const flags = [];
    
    // Suspiciously fast (under 30 seconds)
    if (timeElapsed && timeElapsed < 30) {
        flags.push("FAST_SOLVE");
    }
    
    // Too few actions for complex puzzle (under 5 actions)
    if (stepCount && stepCount < 5) {
        flags.push("LOW_ACTION_COUNT");
    }
    
    // Log flags for analysis, don't block scoring
    if (flags.length > 0) {
        server.WritePlayerEvent({
            PlayFabId: context.currentPlayerId,
            EventName: "SuspiciousSolve",
            Body: {
                flags: flags,
                timeElapsed: timeElapsed,
                stepCount: stepCount,
                sessionId: sessionId
            }
        });
    }
    
    // Always return true - we don't block, just flag
    return true;
}
```

**Validation Philosophy**:
- **No Blocking**: Suspicious solves still get points
- **Data Collection**: Flag unusual patterns for review
- **Simple Thresholds**: 30 seconds minimum, 5 actions minimum
- **Manual Review**: Admin can review flagged sessions later

### Task 5: Leaderboard Updates

**Objective**: Make high scores visible and exciting

**Updates Required**:
1. **PlayFab Statistics**: Ensure `OfficerTrackPoints` and `ARC2EvalPoints` exist
2. **Display Format**: Show scores with commas ("15,000 points" not "15000")
3. **Dual Leaderboards**: Separate rankings for Standard ARC and ARC-2 Evaluation
4. **Score Ranges**: Celebrate when players break 20,000, 50,000, 100,000+ point milestones

## Implementation Notes

### Keep It Simple Philosophy:
- **High Numbers Feel Good**: 10,000+ base points make every win feel significant
- **No Penalties**: Only bonuses for doing well, never punishment for taking time
- **Easy Math**: Simple multiplication anyone can understand
- **Generous Limits**: 20-30 minute time limits reduce stress

### Security Considerations:
- All scoring calculations remain server-side in CloudScript
- Light session validation flags suspicious activity but doesn't block
- Event data provides audit trail for manual review if needed

### Performance Considerations:
- Event data extraction optimized to avoid impacting validation speed
- Simple formulas calculate quickly
- Minimal database queries for scoring

### Testing Strategy:
1. **Verify Empty State**: Confirm Officer Track leaderboards currently show no data
2. **Test Standard Scoring**: Complete ARC puzzle, verify 10,000+ points awarded
3. **Test Premium Scoring**: Complete ARC-2 puzzle, verify 25,000+ points awarded
4. **Test Bonuses**: Solve quickly/efficiently to confirm bonus calculations
5. **Test Session Flags**: Verify suspicious solves are flagged but not blocked

## Expected Player Experience

### Immediate Results:
- **Every Win Feels Big**: Minimum 10,000 points per puzzle completion
- **Leaderboards Populate**: Officer Track rankings show meaningful competition
- **Clear Progression**: Easy to understand how to earn more points
- **Stress-Free**: Generous time limits encourage exploration over speed

### Long-term Benefits:
- **High Score Chase**: Players compete for 40,000+ point perfect runs
- **Multiple Paths**: Win through speed, efficiency, or first-try precision
- **Premium Recognition**: ARC-2 evaluation puzzles offer massive rewards
- **Analytics Insights**: Rich event data enables product improvements

## Files to Modify

1. **`cloudscript.js`**: 
   - Add high-score logic to `ValidateARCPuzzle`
   - Create `ValidateARC2EvalPuzzle` function
   - Add `getStepCountFromEvents` helper
   - Add `validateSession` flagging function

2. **PlayFab Game Manager**: 
   - Configure `OfficerTrackPoints` statistic
   - Configure `ARC2EvalPoints` statistic

3. **`client/src/components/game/Leaderboards.tsx`**: 
   - Display scores with proper formatting (commas)
   - Add celebration messages for milestone scores

---

## Implementation Priority

1. **Critical**: Add high-score system to `ValidateARCPuzzle` (10,000+ base points)
2. **High**: Create `ValidateARC2EvalPuzzle` premium scoring (25,000+ base points)
3. **Medium**: Add simple session validation flags
4. **Enhancement**: Improve leaderboard display formatting

**Result**: Officer Track transforms from empty leaderboards to an exciting high-score chase where every puzzle completion feels rewarding and competitive rankings drive engagement.