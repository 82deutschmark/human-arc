# PlayFab Validation Debugging Investigation

**Date**: September 14, 2025
**Issue**: Correct puzzle solutions being rejected with "DEBUG: undefined" error
**Status**: UNRESOLVED - Data structure mismatch suspected

---

## Issue Summary

### Original Problem
- User submits correct solutions to assessment puzzles (`a699fb00`, `66e6c45b`)
- PlayFab CloudScript validation returns: `{success: false, error: 'DEBUG: undefined | Args: {...}'}`
- All validation parameters appear correctly populated
- Client-side validation suggests solutions are correct

### Timeline of Investigation

#### Phase 1: CloudScript Deployment Issues
**Problem**: Suspected CloudScript wasn't deployed with fixes
**Actions**:
- Fixed `stepCount` undefined issue by ensuring `Math.max(stepIndex, 1)`
- Fixed CloudScript logic bug: `correct: true` when validation failed (should be `false`)
- Forced manual CloudScript deployment via modified sync-cloudscript.cjs
**Result**: CloudScript deployed successfully, but "DEBUG: undefined" persisted

#### Phase 2: Event Logging Fixes
**Problem**: Excessive `game_start`/`game_completion` event spam
**Actions**:
- Removed `stepIndex` from useEffect dependency array in ResponsivePuzzleSolver
- Fixed event logging to only trigger on puzzle/session changes
**Result**: Clean event logging, but validation still failed

#### Phase 3: Puzzle ID Conversion Issues
**Problem**: Puzzle IDs sent in arc-explainer format (`66e6c45b`) instead of PlayFab format
**Actions**:
- Implemented proper ID conversion using `idConverter.getAllPlayFabVariants()`
- Confirmed puzzles exist in PlayFab:
  - `a699fb00` → `ARC-TR-a699fb00` (training-batch3.json)
  - `66e6c45b` → `ARC-EV-66e6c45b` (evaluation-batch2.json)
- Updated client to send correct PlayFab format IDs
**Result**: Correct IDs sent, but "DEBUG: undefined" still occurs

---

## Technical Investigation Results

### CloudScript Deployment Process
- **Tool**: `scripts/sync-cloudscript.cjs`
- **Issue**: Sometimes reports "up to date" when changes exist
- **Solution**: Force deployment by modifying file content temporarily
- **Current Status**: Working correctly

### ID Conversion System
- **Service**: `client/src/services/idConverter.ts`
- **Purpose**: Convert between arc-explainer format (`a699fb00`) and PlayFab format (`ARC-TR-a699fb00`)
- **Implementation**: `idConverter.getAllPlayFabVariants()` tries all dataset combinations
- **Status**: Working correctly - proper IDs being sent to CloudScript

### Puzzle Existence Verification
**Confirmed Locations**:
```
a699fb00 → ARC-TR-a699fb00 (officer-tasks-training-batch3.json)
66e6c45b → ARC-EV-66e6c45b (officer-tasks-evaluation-batch2.json)
```
**Verification Method**: Direct PlayFab API queries
**Status**: Both puzzles exist and are accessible

### Current Validation Flow
```
1. Client: Convert puzzle ID (a699fb00 → ARC-TR-a699fb00)
2. Client: Send validation request with all parameters
3. CloudScript: Utils.assertArgs() - PASSES (all params present)
4. CloudScript: PlayFabService.getPuzzleById() - SUCCESS (puzzle found)
5. CloudScript: ValidationService.compareSolutions() - FAILS with undefined error
```

---

## Debug Data Analysis

### Last Known Debug Output
```json
{
  "success": false,
  "error": "DEBUG: undefined | PuzzleId: ARC-TR-a699fb00 | Solutions: 1 items | TimeElapsed: 17 | AttemptNumber: 1 | StepCount: 10 | SessionId: 09419fa0-a3fb-4d73-b5a9-543489a894a5"
}
```

### Parameter Analysis
- **PuzzleId**: `ARC-TR-a699fb00` ✅ (confirmed exists in PlayFab)
- **Solutions**: `1 items` ✅ (correct count for single test case)
- **TimeElapsed**: `17` ✅ (valid number)
- **AttemptNumber**: `1` ✅ (valid number)
- **StepCount**: `10` ✅ (valid number > 0)
- **SessionId**: Valid UUID ✅

### Error Analysis
- **Error Message**: `"undefined"`
- **Source**: `error.message` property is undefined in CloudScript catch block
- **Implication**: JavaScript runtime error without proper error message

---

## Current Hypothesis: Data Structure Mismatch

### Theory
The puzzle exists in PlayFab and all parameters are valid, but there's a **structural difference** between:
1. **Client expectations** (based on arc-explainer API format)
2. **PlayFab data format** (as stored in Title Data)

### Potential Mismatches

#### 1. Test Case Structure
**Client expects**:
```json
{
  "test": {
    "input": [[0,1],[2,3]],
    "output": [[4,5],[6,7]]
  }
}
```
**PlayFab might have**:
```json
{
  "test": [{
    "input": [[0,1],[2,3]],
    "output": [[4,5],[6,7]]
  }]
}
```

#### 2. Solutions Array Format
**Client sends**:
```json
"solutions": [
  [
    [[2,0,0,3],
     [0,0,0,0],
     [0,0,0,0],
     [4,0,0,9]]
  ]
]
```
**CloudScript might expect**:
```json
"solutions": [
  [[2,0,0,3],
   [0,0,0,0],
   [0,0,0,0],
   [4,0,0,9]]
]
```

#### 3. Data Types
- **Numbers vs Strings**: `[0,1,2]` vs `["0","1","2"]`
- **Grid cell values**: Client uses numbers, PlayFab might store strings

#### 4. Missing Properties
- PlayFab puzzle might lack expected properties (`test`, `input`, `output`)
- Import process might have altered structure

---

## CloudScript Code Analysis

### Failure Point Isolation
The error occurs in `ValidationService.compareSolutions()`:

```javascript
function _validateAndScoreArcPuzzle(args, context, config) {
    try {
        Utils.assertArgs(args, ['puzzleId', 'solutions', 'timeElapsed', 'attemptNumber', 'stepCount']); // ✅ PASSES
        const puzzleData = PlayFabService.getPuzzleById(puzzleId); // ✅ FINDS PUZZLE
        const validationResult = ValidationService.compareSolutions(puzzle, solutions); // ❌ FAILS HERE

    } catch (error) {
        return { error: `DEBUG: ${error.message}` }; // error.message is undefined
    }
}
```

### ValidationService.compareSolutions Analysis
**Likely failure points**:
1. `puzzle.test` is undefined/null
2. `solutions[i]` array access out of bounds
3. `testCases[i].output` property doesn't exist
4. Array comparison logic fails on data type mismatch

---

## Next Steps for Resolution

### 1. Data Structure Investigation
**Priority: HIGH**
- [ ] Export actual puzzle data from PlayFab for `ARC-TR-a699fb00`
- [ ] Compare structure with arc-explainer API format
- [ ] Identify specific structural differences

### 2. CloudScript Debugging Enhancement
**Priority: HIGH**
- [ ] Add try-catch around each operation in `compareSolutions`
- [ ] Log puzzle structure before validation
- [ ] Log solutions array structure and types
- [ ] Add detailed error context for each failure point

### 3. Client-Side Data Validation
**Priority: MEDIUM**
- [ ] Validate solutions array structure before sending
- [ ] Log exact data being sent to CloudScript
- [ ] Add data type verification

### 4. Isolation Testing
**Priority: MEDIUM**
- [ ] Test with minimal puzzle (1x1 grid)
- [ ] Test with known-good puzzle structure
- [ ] Test with hardcoded solutions array

---

## Code Files Modified

### Client-Side Changes
- `client/src/components/officer/ResponsivePuzzleSolver.tsx`
  - Added ID conversion using `idConverter.getAllPlayFabVariants()`
  - Fixed event logging dependencies
  - Added validation parameter debugging

### CloudScript Changes
- `cloudscript.js`
  - Fixed `correct: false` logic for failed validations
  - Enhanced error messaging with parameter details
  - Added puzzle lookup logging

### Configuration Changes
- `scripts/sync-cloudscript.cjs`
  - Temporarily modified for forced deployment
  - Reverted to original state

---

## Development Environment Notes

### Testing Procedure
1. Navigate to `http://localhost:5173/assessment`
2. Solve puzzle correctly
3. Click validate
4. Check browser console for debug output
5. Verify CloudScript error in network tab

### Key Log Messages to Monitor
- `🔄 Using PlayFab ID: ARC-TR-a699fb00 (converted from a699fb00)`
- `🚀 DEBUG - Sending to CloudScript: {...}`
- `DEBUG: undefined | PuzzleId: ... | Solutions: ...`

### Tools for Investigation
- `scripts/check-playfab-data.cjs` - Inspect PlayFab Title Data
- Browser DevTools Network tab - View CloudScript responses
- PlayFab Dashboard - Monitor CloudScript execution logs

---

## Critical Questions Remaining

1. **What is the exact structure of puzzle data in PlayFab Title Data?**
2. **How does it differ from arc-explainer API format?**
3. **Are solutions arrays in the expected 3D format?**
4. **Are grid values stored as numbers or strings in PlayFab?**
5. **Is the test case structure an array or object?**

---

## Conclusion

We have systematically eliminated most potential causes:
- ✅ CloudScript deployment works
- ✅ Puzzle IDs are correctly converted and sent
- ✅ All validation parameters are present and valid
- ✅ Puzzles exist in PlayFab Title Data
- ✅ Event logging is clean

**The remaining issue is almost certainly a data structure mismatch** between what the client sends and what the CloudScript expects to receive, or between what the CloudScript expects from puzzle data and what's actually stored in PlayFab.

The next developer should focus on **data structure analysis** rather than parameter validation or deployment issues.