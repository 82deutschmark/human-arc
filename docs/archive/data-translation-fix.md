# Data Translation Logic Fix - Technical Specification

## Problem Statement

The current data translation between PlayFab batch storage and ARC-Explainer API metadata is broken due to architectural mismatch:
- **PlayFab Reality**: Puzzles stored in batches (`officer-tasks-training-batch1.json`)  
- **Current Logic**: Tries to find individual puzzle keys (`ARC-TR-007bbfb7`)
- **Result**: Falls back to loading entire datasets to find single puzzles (inefficient)

## Core Architecture Changes

### 1. Batch-to-Puzzle Resolution Logic

**File**: `client/src/services/arcDataService.ts`

**Replace**: `findPlayFabIdForArcId()` method (lines 685-707)
**With**: New batch resolution system:

```typescript
/**
 * Determine which batch contains a specific puzzle ID
 */
private determinePuzzleBatch(arcId: string, dataset: ARCDatasetType): { batchNum: number; titleDataKey: string } | null {
  // Logic based on known puzzle distribution in batches
  // Use DATASET_DEFINITIONS for batch counts
  // Return batch number and corresponding PlayFab Title Data key
}

/**
 * Load single puzzle from determined batch
 */
public async loadPuzzleFromBatch(arcId: string): Promise<OfficerTrackPuzzle | null> {
  // 1. Try each dataset to find which one contains the puzzle
  // 2. Use determinePuzzleBatch() to find correct batch
  // 3. Load only that batch from PlayFab Title Data
  // 4. Extract the specific puzzle from batch array
  // 5. Return formatted puzzle data
}
```

### 2. puzzlePerformanceService Simplification

**File**: `client/src/services/puzzlePerformanceService.ts`

**Replace**: `findPuzzleById()` method (lines 205-255)
**With**: Simplified direct approach:

```typescript
async findPuzzleById(puzzleId: string): Promise<MergedPuzzleData | null> {
  // 1. Get metadata from ARC-Explainer API (fast)
  const rawArcId = arcExplainerAPI.convertPlayFabIdToArcId(puzzleId);
  const performance = await arcExplainerAPI.getPuzzlePerformance(rawArcId);
  
  // 2. Get puzzle data using new efficient batch loading (fast)
  const puzzleData = await arcDataService.loadPuzzleFromBatch(rawArcId);
  
  // 3. Merge and return
  return { ...puzzleData, aiPerformance: performance, ... };
}
```

### 3. shared/datasets.ts Integration

**File**: `shared/datasets.ts`

**Add**: Batch resolution utilities:

```typescript
/**
 * Map puzzle ID patterns to datasets
 */
export function inferDatasetFromPuzzleId(arcId: string): ARCDatasetType | null {
  // Logic to determine dataset based on puzzle ID patterns
  // Use known ID ranges/patterns for each dataset
}

/**
 * Calculate which batch number contains a puzzle (if deterministic)
 */
export function calculateBatchForPuzzle(arcId: string, dataset: ARCDatasetType): number | null {
  // If puzzle distribution follows pattern, calculate batch number
  // Otherwise return null (requires search)
}

/**
 * Get all possible batch keys for searching
 */
export function getBatchKeysForDataset(dataset: ARCDatasetType): string[] {
  // Return array of batch keys for a dataset
  // Example: ['officer-tasks-training-batch1.json', 'officer-tasks-training-batch2.json', ...]
}
```

## Implementation Tasks

### Task 1: Fix arcDataService.ts
- [ ] Remove `findPlayFabIdForArcId()` method  
- [ ] Add `determinePuzzleBatch()` private method
- [ ] Add `loadPuzzleFromBatch()` public method
- [ ] Update `searchPuzzleById()` to use new batch loading
- [ ] Update any other methods that call the old `findPlayFabIdForArcId()`

### Task 2: Simplify puzzlePerformanceService.ts
- [ ] Replace `findPuzzleById()` with simplified version
- [ ] Remove circular dependency on dataset loading
- [ ] Use new `arcDataService.loadPuzzleFromBatch()` method
- [ ] Remove unnecessary complexity in batch operations

### Task 3: Enhance shared/datasets.ts
- [ ] Add `inferDatasetFromPuzzleId()` function
- [ ] Add `calculateBatchForPuzzle()` function  
- [ ] Add `getBatchKeysForDataset()` function
- [ ] Update existing functions to support new batch logic

### Task 4: Clean Up server/services/taskLoader.ts
- [ ] Remove confused PlayFab task loading (method marked as "WRONG!!!!")
- [ ] Focus only on regular SFMC tasks (not ARC puzzles)
- [ ] Clear separation between task types

### Task 5: Update ID Conversion Methods
- [ ] Ensure `arcExplainerAPI.ts` ID conversion uses shared logic
- [ ] Verify prefix mapping consistency across services
- [ ] Test round-trip ID conversions

## Expected Performance Improvement

**Before**: Load 400-1000 puzzles to find 1 puzzle
**After**: Load 1 batch (~100 puzzles) to find 1 puzzle

**Before**: Multiple circular service calls
**After**: Direct batch lookup → single puzzle extraction

## Key Files Modified

1. `client/src/services/arcDataService.ts` - Core batch resolution logic
2. `client/src/services/puzzlePerformanceService.ts` - Simplified merging
3. `shared/datasets.ts` - Enhanced with batch utilities  
4. `server/services/taskLoader.ts` - Cleanup and separation

## Success Criteria

- Single puzzle loading works without loading entire datasets
- ARC-Explainer metadata merges correctly with PlayFab puzzle data
- No circular dependencies between services
- All ID conversions use shared logic from `datasets.ts`
- Clear separation between SFMC tasks and ARC officer track puzzles