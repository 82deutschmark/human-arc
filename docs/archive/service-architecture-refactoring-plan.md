# Service Architecture Refactoring Plan

**Author**: Claude Code using Sonnet 4
**Date**: 2025-09-13
**Priority**: CRITICAL - Severe DRY and SRP violations impacting maintainability

## Executive Summary

The current service layer has evolved into a tangled mess with 7+ overlapping services, massive code duplication, and severe violations of DRY (Don't Repeat Yourself) and SRP (Single Responsibility Principle). This refactoring will consolidate ~3000 lines of duplicated code into ~800 lines of clean, single-responsibility services.

## Current State Analysis

### Service Inventory

| Service | Lines | Primary Issues |
|---------|-------|----------------|
| `arcDataService.ts` | 803 | Mixes 10+ responsibilities: loading, caching, ID conversion, API calls, data transformation |
| `arcExplainerAPI.ts` | 560 | Duplicates HTTP logic, ID conversion, caching |
| `arcExplainerService.ts` | 115 | Almost entirely duplicates arcExplainerAPI |
| `officerArcAPI.ts` | 667 | Duplicates PlayFab loading, caching, ID conversion |
| `puzzlePerformanceService.ts` | 294 | Merges data from multiple services, adds another caching layer |
| `idConverter.ts` | 246 | Good - single responsibility, but underutilized |
| `harcPuzzleService.ts` | Deleted | Was duplicate functionality |

### Critical DRY Violations

1. **ID Conversion** - Implemented separately in:
   - `arcExplainerAPI.ts` (lines 219-254)
   - `arcExplainerService.ts` (lines 27-43)
   - `officerArcAPI.ts` (lines 150-161)
   - Should ONLY be in `idConverter.ts`

2. **Caching Logic** - Identical implementations in:
   - `arcDataService.ts` (custom Map cache)
   - `arcExplainerAPI.ts` (5-minute TTL cache)
   - `officerArcAPI.ts` (two separate caches!)
   - `puzzlePerformanceService.ts` (another cache layer)

3. **PlayFab Puzzle Loading** - Multiple implementations:
   - `arcDataService.loadDatasetFromPlayFab()`
   - `officerArcAPI.loadPuzzleFromPlayFab()`
   - `arcDataService.searchPuzzleById()`
   - `officerArcAPI.searchPuzzleById()`

4. **Arc-Explainer API Calls** - Duplicated in:
   - `arcExplainerAPI.makeRequest()`
   - `officerArcAPI.makeAPICall()`
   - `arcExplainerService.getPuzzlePerformanceStats()`

### SRP Violations

**arcDataService.ts** has 15+ responsibilities:
- Loading puzzles from PlayFab
- Caching
- ID generation and conversion
- Grid dimension analysis
- Complexity analysis
- Difficulty estimation
- Emoji transformation
- File loading (unused)
- Searching
- Filtering
- Sorting
- Batch operations
- Dataset management
- Cache management
- Configuration management

## Target Architecture

### Core Service Layer (New)

```
client/src/services/core/
├── puzzleRepository.ts       # Single source for all puzzle data
├── arcExplainerClient.ts     # HTTP client for arc-explainer API
├── playfabPuzzleClient.ts    # PlayFab puzzle operations
└── cacheManager.ts           # Unified caching strategy
```

### Service Responsibilities (Clean)

1. **puzzleRepository.ts** (~300 lines)
   - Single entry point for all puzzle operations
   - Orchestrates between PlayFab and arc-explainer
   - Returns unified puzzle data model

2. **arcExplainerClient.ts** (~150 lines)
   - ONLY handles HTTP communication with arc-explainer
   - No business logic, just API calls
   - Uses idConverter for ID transformations

3. **playfabPuzzleClient.ts** (~200 lines)
   - ONLY handles PlayFab Title Data operations
   - Batch loading with proper error handling
   - Uses idConverter for ID transformations

4. **cacheManager.ts** (~100 lines)
   - Generic caching solution
   - Configurable TTL
   - Memory management

5. **idConverter.ts** (existing, enhanced)
   - Already good! Just needs to be used everywhere

## Implementation Plan

### Phase 1: Core Infrastructure (Day 1)

1. **Create cacheManager.ts**
   ```typescript
   export class CacheManager<T> {
     constructor(private ttl: number) {}
     get(key: string): T | null
     set(key: string, value: T): void
     clear(): void
   }
   ```

2. **Create arcExplainerClient.ts**
   - Move HTTP logic from arcExplainerAPI
   - Use idConverter for all ID operations
   - Simple request/response pattern

3. **Create playfabPuzzleClient.ts**
   - Extract PlayFab operations from arcDataService
   - Use shared batch definitions
   - Clean error handling

### Phase 2: Repository Pattern (Day 1)

4. **Create puzzleRepository.ts**
   ```typescript
   export class PuzzleRepository {
     async findById(id: string): Promise<Puzzle>
     async findByIds(ids: string[]): Promise<Puzzle[]>
     async search(criteria: SearchCriteria): Promise<SearchResult>
     async getByDifficulty(level: Difficulty): Promise<Puzzle[]>
   }
   ```

### Phase 3: Migration (Day 2)

5. **Update AssessmentInterface.tsx**
   - Change: `puzzlePerformanceService.findPuzzleById()`
   - To: `puzzleRepository.findById()`

6. **Update ResponsivePuzzleSolver.tsx**
   - Change: `arcExplainerService.getPuzzlePerformanceStats()`
   - To: `arcExplainerClient.getPerformanceStats()`

7. **Update other components systematically**

### Phase 4: Cleanup (Day 2)

8. **Mark services as deprecated**
   - Add deprecation warnings
   - Update imports
   - Test thoroughly

9. **Remove deprecated services** (after verification)
   - Delete old service files
   - Update documentation
   - Final testing

## Migration Strategy

### For HARC/Assessment Critical Path

1. **Minimal Breaking Changes**
   - Keep existing function signatures where possible
   - Add adapter functions temporarily
   - Gradual migration

2. **Testing Strategy**
   - Test Assessment flow with each change
   - Verify puzzle loading
   - Check performance metrics
   - Validate caching behavior

### Rollback Plan

- Git commits after each phase
- Feature flags for new services
- Parallel operation during migration

## Success Metrics

- **Code Reduction**: ~3000 lines → ~800 lines (73% reduction)
- **Service Count**: 7 services → 4 services (43% reduction)
- **Duplicate Code**: Eliminate 100% of ID conversion duplication
- **Cache Instances**: 4 separate caches → 1 unified cache
- **API Call Sites**: Consolidate to 2 (PlayFab + arc-explainer)

## Risk Mitigation

1. **Breaking Changes**: Use adapter pattern for gradual migration
2. **Performance**: Profile before/after to ensure no regression
3. **Data Integrity**: Comprehensive testing of puzzle loading
4. **Dependencies**: Update systematically with clear commit messages

## Timeline

- **Day 1**: Core infrastructure + Repository pattern
- **Day 2**: Component migration + Cleanup
- **Day 3**: Testing + Documentation
- **Day 4**: Monitoring + Optimization

## Notes for Developer

### DO NOT:
- Create new services without checking if functionality exists
- Implement ID conversion outside of idConverter
- Add business logic to HTTP clients
- Create service-specific caches

### ALWAYS:
- Check idConverter first for ID operations
- Use puzzleRepository for all puzzle data needs
- Keep services under 300 lines
- Follow Single Responsibility Principle

## Verification Checklist

- [ ] All tests pass
- [ ] Assessment flow works end-to-end
- [ ] HARC platform loads puzzles correctly
- [ ] Performance metrics displayed accurately
- [ ] No console errors
- [ ] Cache behavior verified
- [ ] ID conversions working correctly
- [ ] Error handling tested