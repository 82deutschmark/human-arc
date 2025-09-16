# Puzzle Search Architecture Plan - Eliminate Hardcoding

## Current Problems (Violations of DRY/SRP)

### 🚫 Hardcoded Dataset Definitions
- Frontend: Hardcoded dataset names and batch counts in multiple places
- CloudScript: Duplicate hardcoded batch key arrays
- No single source of truth for what datasets exist

### 🚫 Duplicate Search Logic
- Frontend `loadPuzzleFromPlayFab()` has one search implementation
- CloudScript `findPuzzleInBatches()` has nearly identical but different implementation
- ID format conversion logic duplicated across files

### 🚫 Assumption-Based Priority Systems
- Hardcoded "priority" rankings instead of actual data discovery
- Assumes dataset relationships that may not reflect reality
- No intelligent fallback when assumptions are wrong

## Architectural Solution (DRY/SRP Compliant)

### 1. Single Source of Truth: Dataset Discovery Service

**Principle**: Instead of hardcoding, dynamically discover what datasets exist in PlayFab

```typescript
// client/src/services/datasetDiscovery.ts
export interface DatasetInfo {
  name: string;
  batches: number;
  prefix: string;
  lastUpdated?: Date;
}

export class DatasetDiscoveryService {
  private static discoveredDatasets: DatasetInfo[] | null = null;
  
  /**
   * Dynamically discover all available datasets by querying PlayFab Title Data
   * No hardcoded assumptions - pure discovery
   */
  static async discoverAvailableDatasets(): Promise<DatasetInfo[]> {
    // Query PlayFab for all officer-tasks-* keys
    // Parse key names to extract dataset names and batch counts
    // Return actual available data, not assumptions
  }
}
```

### 2. DRY Search Engine: Unified Search Logic

**Principle**: One search implementation used by both frontend and CloudScript

```typescript
// shared/puzzleSearchEngine.ts (works in both browser and CloudScript)
export interface SearchResult {
  puzzleData: any;
  foundInDataset: string;
  foundInBatch: string;
  actualId: string;
}

export class PuzzleSearchEngine {
  /**
   * Universal search function that works in frontend and CloudScript
   * Uses discovered datasets, not hardcoded lists
   */
  static async findPuzzle(arcId: string, availableDatasets: DatasetInfo[]): Promise<SearchResult | null> {
    // Single implementation used everywhere
    // Handles ID format conversion consistently
    // Returns detailed metadata about where puzzle was found
  }
}
```

### 3. SRP Compliance: Separate Concerns

**ID Conversion Service** (Single Responsibility)
```typescript
// shared/idConversionService.ts
export class IdConversionService {
  static arcIdToPlayFabId(arcId: string, dataset: string): string
  static playFabIdToArcId(playFabId: string): string
  static detectDatasetFromPlayFabId(playFabId: string): string | null
}
```

**Cache Management Service** (Single Responsibility)
```typescript
// shared/puzzleCacheService.ts
export class PuzzleCacheService {
  static getBatch(batchKey: string): any[] | null
  static setBatch(batchKey: string, data: any[]): void
  static clearCache(): void
}
```

**Search Strategy Service** (Single Responsibility)
```typescript
// shared/searchStrategyService.ts
export class SearchStrategyService {
  static getSearchOrder(availableDatasets: DatasetInfo[]): DatasetInfo[]
  static shouldUseCache(batchKey: string): boolean
}
```

### 4. Self-Discovering System

**No Hardcoded Assumptions**:
- System queries PlayFab on startup to discover available datasets
- Automatically adapts when new datasets are added
- Handles missing or renamed batches gracefully

**Discovery Process**:
1. Query PlayFab Title Data for all keys matching `officer-tasks-*`
2. Parse key names to extract dataset names and batch numbers
3. Cache discovery results for session
4. Use discovered data for all subsequent searches

### 5. CloudScript Integration

**Shared Logic**: CloudScript uses same search engine as frontend
```javascript
// cloudscript.js
// Import shared search logic (when CloudScript supports modules)
// For now, copy the core search algorithm with consistent behavior

handlers.ValidateARCPuzzle = function(args, context) {
    // Use same search logic as frontend
    // Use same ID conversion logic as frontend
    // Return consistent results
}
```

## Implementation Plan

### Phase 1: Dataset Discovery Service ✅
- [ ] Create `DatasetDiscoveryService` that queries PlayFab for available datasets
- [ ] Replace all hardcoded dataset definitions with discovered data
- [ ] Add caching for discovery results

### Phase 2: Unified Search Engine ✅
- [ ] Create `PuzzleSearchEngine` with single search implementation
- [ ] Replace frontend `loadPuzzleFromPlayFab` with unified engine
- [ ] Replace CloudScript `findPuzzleInBatches` with unified engine

### Phase 3: Service Separation ✅ 
- [ ] Extract ID conversion logic into dedicated service
- [ ] Extract caching logic into dedicated service
- [ ] Extract search strategy logic into dedicated service

### Phase 4: Integration & Testing ✅
- [ ] Update all callers to use new services
- [ ] Verify frontend and CloudScript produce identical results
- [ ] Test with edge cases (missing puzzles, malformed data)

## Expected Benefits

### 🎯 DRY Compliance
- Single search implementation used everywhere
- No duplicate ID conversion logic
- Unified caching strategy

### 🎯 SRP Compliance  
- Each service has one clear responsibility
- Easy to test and maintain individual components
- Clear separation of concerns

### 🎯 Self-Adapting System
- No hardcoded assumptions about data structure
- Automatically handles new datasets
- Graceful degradation when data changes

### 🎯 Consistency
- Frontend and CloudScript always produce same results
- ID format conversion handled identically everywhere
- Search strategy consistent across all components

## Success Criteria

1. ✅ No hardcoded dataset names or batch counts anywhere
2. ✅ Search logic exists in exactly one place (DRY)
3. ✅ Each service has single, clear responsibility (SRP)  
4. ✅ System adapts automatically to PlayFab data changes
5. ✅ Frontend and CloudScript validation results are identical
6. ✅ Puzzle `a68b268e` validates successfully with correct dataset detection

This architecture eliminates all hardcoding while ensuring the system is maintainable, testable, and automatically adapts to data changes.