# HARC 2-Attempt Limit Implementation Plan

/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Implementation plan to enforce ARC-AGI Prize standard 2-attempt limit per puzzle for human players
 * SRP and DRY check: Pass - Single responsibility document for planning attempt limitation feature
 */

## Problem Statement

The current HARC system allows unlimited attempts per puzzle, which doesn't align with ARC-AGI Prize standards where test-takers get exactly 2 attempts per puzzle. Once a player fails twice, they cannot earn points for that puzzle.

## Current State Analysis

### Data Storage Issues
- `humanPerformanceData` only tracks successful completions
- Failed attempts are not stored anywhere
- No mechanism to track attempt count per puzzle
- No lockout mechanism after 2 failed attempts

### Validation Flow Issues
- CloudScript functions return failure but don't persist attempt data
- Players can retry indefinitely
- No UI indication of remaining attempts

## Solution Architecture

### 1. New Data Model: `puzzleAttempts`

**Storage Location**: Player User Data key `puzzleAttempts`

**Structure**:
```json
{
  "puzzleId1": {
    "attempts": [
      {
        "timestamp": "2025-09-17T10:30:00Z",
        "result": "incorrect",
        "solutions": [...],
        "timeElapsed": 45.2,
        "stepCount": 12
      },
      {
        "timestamp": "2025-09-17T10:35:00Z",
        "result": "correct",
        "solutions": [...],
        "timeElapsed": 62.1,
        "stepCount": 18,
        "scoreData": {...}
      }
    ],
    "status": "completed", // "available", "locked", "completed"
    "attemptsRemaining": 0,
    "lockedAt": null // timestamp when locked due to 2 failures
  }
}
```

**Status Values**:
- `available`: 0-1 attempts used, can still attempt
- `locked`: 2 failed attempts, cannot attempt again, no points possible
- `completed`: Successfully solved (regardless of attempt count)

### 2. CloudScript Changes

#### New Helper Function: `_trackPuzzleAttempt`
```javascript
function _trackPuzzleAttempt(playerId, puzzleId, attemptData, isCorrect) {
  // Get current attempts data
  const attemptsData = getPlayerAttemptsData(playerId);

  // Initialize puzzle entry if doesn't exist
  if (!attemptsData[puzzleId]) {
    attemptsData[puzzleId] = {
      attempts: [],
      status: "available",
      attemptsRemaining: 2,
      lockedAt: null
    };
  }

  const puzzleState = attemptsData[puzzleId];

  // Check if puzzle is locked
  if (puzzleState.status === "locked") {
    return { success: false, error: "Puzzle locked: Maximum attempts exceeded" };
  }

  // Check if puzzle already completed
  if (puzzleState.status === "completed") {
    return { success: false, error: "Puzzle already completed" };
  }

  // Add attempt record
  puzzleState.attempts.push({
    timestamp: new Date().toISOString(),
    result: isCorrect ? "correct" : "incorrect",
    ...attemptData
  });

  // Update status based on result
  if (isCorrect) {
    puzzleState.status = "completed";
    puzzleState.attemptsRemaining = 0;
  } else {
    puzzleState.attemptsRemaining--;
    if (puzzleState.attemptsRemaining <= 0) {
      puzzleState.status = "locked";
      puzzleState.lockedAt = new Date().toISOString();
    }
  }

  // Save updated attempts data
  savePlayerAttemptsData(playerId, attemptsData);

  return { success: true, puzzleState };
}
```

#### Modified Validation Functions
Update `ValidateARCPuzzle` and `ValidateARC2EvalPuzzle` to:
1. Check attempt status BEFORE validation
2. Track all attempts (success and failure)
3. Return attempt status information

### 3. UI Changes

#### Attempt Counter Display
- Show "Attempts: 1/2" or "Attempts: 2/2" on puzzle interface
- Color coding: Green (0-1 attempts), Red (2 attempts)

#### Lockout State
- Gray out submit button when locked
- Show "Puzzle Locked: Maximum attempts exceeded" message
- Disable puzzle interaction

#### Puzzle Browser Changes
- Show attempt status badges on puzzle cards
- Filter options: Available, Completed, Locked

### 4. Client-Side Service Changes

#### New Service: `attemptTracker.ts`
```typescript
export class AttemptTracker {
  async getPuzzleAttemptStatus(puzzleId: string): Promise<PuzzleAttemptStatus> {
    // Get attempts data from PlayFab User Data
  }

  async canAttemptPuzzle(puzzleId: string): Promise<boolean> {
    // Check if puzzle is available for attempts
  }

  async getRemainingAttempts(puzzleId: string): Promise<number> {
    // Return 0, 1, or 2 attempts remaining
  }
}
```

#### Modified Validation Service
Update `playFabValidation.validateARCPuzzle()` to:
- Check attempt status before submitting
- Handle lockout responses from CloudScript
- Update local attempt tracking

### 5. Implementation Phases

#### Phase 1: Data Model & CloudScript (Backend)
1. Add `puzzleAttempts` tracking to CloudScript
2. Modify validation functions to track attempts
3. Test with existing puzzle data

#### Phase 2: Client Services (API Layer)
1. Create `attemptTracker.ts` service
2. Modify validation service
3. Add attempt status API calls

#### Phase 3: UI Components (Frontend)
1. Add attempt counter to puzzle interface
2. Implement lockout state UI
3. Update puzzle browser with attempt status

#### Phase 4: Testing & Migration
1. Test with real puzzle data
2. Migrate existing user data
3. Verify attempt counting accuracy

### 6. Data Migration Strategy

For existing players with completed puzzles:
- Mark all completed puzzles as `status: "completed"`
- Set `attemptsRemaining: 0`
- Add single "correct" attempt record with historical data

### 7. Edge Cases & Considerations

#### Multiple Test Cases Per Puzzle
- Each puzzle validation is atomic (all test cases must pass)
- One "attempt" = one complete puzzle validation regardless of test case count

#### Network/System Failures
- Failed API calls don't count as attempts
- Only successful CloudScript execution counts as attempt
- Retry logic for network issues

#### Partial Solutions
- Incomplete submissions don't count as attempts
- Only final "Submit Solution" action counts

### 8. Success Metrics

- 100% of puzzles respect 2-attempt limit
- No players can score on locked puzzles
- Attempt counts are accurate and persistent
- UI clearly communicates attempt status

### 9. Testing Plan

#### Unit Tests
- CloudScript attempt tracking logic
- Client-side attempt status calculations
- UI component states

#### Integration Tests
- Full puzzle attempt workflow
- Data persistence across sessions
- Edge case handling

#### User Acceptance Tests
- Puzzle attempt flow matches ARC-AGI standards
- Clear feedback on attempt status
- Appropriate lockout behavior

---

## Implementation Priority: HIGH

This change is critical for HARC platform credibility and alignment with ARC-AGI Prize standards. All existing research comparing human vs AI performance assumes the 2-attempt limit constraint.