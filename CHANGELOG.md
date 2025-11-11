# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2025-11-11

### Fixed

#### Assessment Modal Close/Advance Issues (Critical)

**Fix #1: Consolidate Modal Closing**
- Removed duplicate `clearValidationState()` call from `handleAssessmentAdvance` in `HARCResponsiveSolverUI.tsx`
- State clearing now happens solely when `puzzle.id` changes via `useEffect`
- **Impact**: Prevents race conditions that caused modal to freeze or not close properly
- **Technical**: Single source of truth for state management eliminates competing `setState` calls

**Fix #2: Abort Pending Async Operations**
- Added `AbortController` to cancel pending data fetches in `AssessmentStepSuccessModal.tsx`
- Prevents state updates on unmounted components
- Properly handles `AbortError` exceptions without logging them as errors
- **Impact**: Fixes memory leaks from stale async operations completing after modal closes
- **Technical**: Modal content loads are cancelled when modal closes or puzzle changes

**Fix #3: Sync Modal Close with Puzzle Change**
- Added explicit `setShowSuccessModal(false)` in `useEffect` when `puzzle.id` changes in `HARCResponsiveSolverUI.tsx`
- Ensures modal closes immediately when advancing to next puzzle
- **Impact**: Eliminates window where modal renders with mixed old/new state
- **Technical**: Guarantees modal closes before new puzzle content loads

**Fix #4: Standardize Advancement Flow**
- Documented consistent advancement path in `AssessmentInterface.tsx`
- Both auto-advance (2nd attempt) and user-click paths now work through same state cascade
- **Impact**: No race conditions between different advancement paths
- **Technical**: Auto-advance → handleNextPuzzle() → puzzle.id change → modal closes (same as user-click)

**Fix #5: Comprehensive Puzzle State Reset**
- Documented complete state reset cascade when advancing puzzles
- All puzzle-related state resets automatically: solutions, test index, dimensions
- **Impact**: No state pollution between puzzles
- **Technical**: Component `key={puzzle.id}` ensures remount, validation state cleared via Fix #3

### Added

- **ASSESSMENT_MODAL_DEEP_DIVE.md**: Comprehensive technical analysis document
  - Detailed lifecycle diagrams of modal behavior
  - Complete data flow visualization
  - Root cause analysis of all 5 issues
  - Code examples for each fix
  - Testing scenarios for verification
- **Documentation**: Added comments in fixed components referencing deep dive analysis

### Technical Details

**Files Modified:**
- `client/src/components/layout/HARCResponsiveSolverUI.tsx` - Fixes #1, #3
- `client/src/components/assessment/AssessmentStepSuccessModal.tsx` - Fix #2
- `client/src/components/assessment/AssessmentInterface.tsx` - Fixes #4, #5

**Root Cause:**
- Asynchronous race conditions between multiple `setState` calls
- Pending async operations trying to update unmounted components
- State not synchronized across callback chains
- Inconsistent advancement flows causing modal to persist

**Testing Scenarios:**
1. ✅ First attempt success → Click Continue → Modal closes and advances
2. ✅ Two-attempt sequence → Auto-advance after 2nd attempt works smoothly
3. ✅ Multiple puzzle progression → Modal never persists between puzzles
4. ✅ Slow network → Modal closes even if content loading is slow
5. ✅ Quick succession clicks → Multiple clicks don't cause issues

---

## [1.0.0] - 2025-09-17

### Added

- Initial release
- Core ARC puzzle solving interface
- Assessment mode support
- PlayFab integration
- AI performance comparison
- Strategy submission system
- Multiple display modes and emoji sets
- Hint system
- Success and failure modals
- Responsive design with modern UI

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards-compatible manner
- **PATCH** version when making backwards-compatible bug fixes

Examples:
- Bug fixes → PATCH (1.0.0 → 1.0.1)
- New features → MINOR (1.0.1 → 1.1.0)
- Breaking changes → MAJOR (1.1.0 → 2.0.0)
