# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-07

- Author: Codex. Support hosting under `/human-arc/` with configurable Vite/Wouter base, prefixed assets and raw navigation, and relative manifest URLs. Root hosting remains supported.
- Library solving now uses the same ARC Explainer puzzle source as the library and assessment, with existing PlayFab fallback, so listed puzzles missing from PlayFab can open.
- Add ARC Explainer and public GitHub source links; move canonical URLs to ARC Explainer.
- ARC Explainer builds a pinned revision with its public PlayFab title ID and model-data API URL. Never pass a PlayFab secret key into the browser build.

## [1.0.2] - 2025-11-11

### Fixed

#### Modal Information Density and Layout Improvements

**Modal Sizing and Horizontal Space Utilization**
- Increased modal widths across all modal components to better utilize horizontal screen space
- AssessmentModal: max-w-2xl → max-w-5xl
- AssessmentStepSuccessModal: size="2xl" → size="5xl"
- SuccessModal: max-w-lg → max-w-4xl
- FailureModal: max-w-lg → max-w-3xl
- Dramatically reduced padding and margins throughout (p-6→p-3→p-2, mb-4→mb-2→mb-1.5, gap-3→gap-2→gap-1)
- **Impact**: Modals now use screen space efficiently without wasted horizontal space

**Font Size Reduction for Information Density**
- Systematically reduced all font sizes across assessment UI components:
  - Titles: text-3xl/2xl → text-xl/lg
  - Headings: text-lg/base → text-sm/xs
  - Body text: text-base/sm → text-xs
  - Emojis: text-5xl/4xl/3xl → text-2xl/lg/base
  - Button text: text-base/sm → text-xs
  - Leading: leading-relaxed/snug → leading-tight
- **Impact**: Creates information-dense layouts that show more useful content without scrolling

**Content Cleanup**
- Removed all "validated using backup system" debug messages from modals
- Removed verbose "Assessment Type/Duration" info boxes that hid useful content
- Streamlined intro text while preserving valuable explanatory content
- Changed labels: "Designer's Explanation" → "Solution", "What makes this hard for AI?" → "Why AI Struggles"
- Made design notes placeholders more compact with 50% opacity and minimal spacing
- Corrected placeholder text: "DESIGNER NOTES" → "DESIGN NOTES"
- **Impact**: Users see relevant information immediately without scrolling through fluff

**FailureModal Bug Fix (Critical)**
- Fixed hardcoded "1" for attempts remaining display (line 129)
- Now correctly uses `attemptsRemaining` and `totalAttempts` props
- Made "final attempt" warning conditional (only shows when attemptsRemaining === 1)
- **Impact**: Users see accurate attempt information, preventing confusion
- **Technical**: Props were defined but hardcoded display value ignored them

**Grid Optimization**
- Changed AssessmentStepSuccessModal model breakdown from 2 to 3 columns
- More compact information display for AI model performance comparison
- **Impact**: More AI model data visible without scrolling

### Changed

**Button and Control Sizing**
- Reduced button heights: default → h-8 (text-xs)
- More compact control bars with reduced padding (py-3→py-2)
- **Impact**: Controls take less vertical space, leaving more room for content

### Technical Details

**Files Modified:**
- `client/src/components/ui/FailureModal.tsx` - Sizing, fonts, content, bug fix
- `client/src/components/ui/SuccessModal.tsx` - Sizing, fonts, content
- `client/src/components/assessment/AssessmentModal.tsx` - Sizing, fonts, content
- `client/src/components/assessment/AssessmentStepSuccessModal.tsx` - Sizing, fonts, content, grid
- `client/src/components/assessment/AssessmentInterface.tsx` - Sizing, fonts, controls

**Design Philosophy:**
- Information density over whitespace
- Horizontal space utilization maximized
- Remove fluff, preserve value
- Smaller fonts with tight leading for more visible content
- Compact but not cramped

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
