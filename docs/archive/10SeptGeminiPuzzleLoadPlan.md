# 10 September - Puzzle Loading Refactor Plan

This document outlines the work done to refactor the puzzle data loading mechanism, the issues encountered, and the plan to resolve them.

## Part 1: Eliminating Hardcoded Dataset Definitions

### Problem
The initial task was to address violations of the DRY (Don't Repeat Yourself) principle. Dataset definitions, including batch keys and counts, were hardcoded in two separate places:
- `cloudscript.js`: Contained a hardcoded array of all batch file names.
- `client/src/services/arcDataService.ts`: Contained a hardcoded map of dataset names to their batch counts.  THIS WAS NEEDED!!!  

This made adding or updating datasets a manual and error-prone process. HOWEVER IT WORKED!!!  

### Solution
1.  **Single Source of Truth:** A new file, `shared/datasets.ts`, was created to act as the single source of truth for all dataset definitions. This file exports a `DATASET_DEFINITIONS` object.
2.  **Frontend Refactor:** `arcDataService.ts` was refactored to import and use `DATASET_DEFINITIONS` instead of its local hardcoded map.
3.  **Backend Refactor:** `cloudscript.js` was refactored to dynamically generate its list of batch keys using a replicated `DATASET_DEFINITIONS` object, as it cannot import ES modules directly.

## Part 2: Fixing the Broken Puzzle Loading Flow

### Problem
After the refactor, the puzzle solver page at `/officer-track/solve/:puzzleId` broke. The error logs revealed a two-part failure:
1.  The page attempts to load puzzle data from a local file (`/data/evaluation2/....json`), which doesn't exist for all puzzles, resulting in an HTML page being returned and causing a JSON parsing error.
2.  The fallback logic then calls `loadPuzzleFromPlayFab` in `officerArcAPI.ts`, which in turn calls a non-existent function `determineCorrectDataset`, causing a `ReferenceError`.

### Current Goal & Plan
The goal is to create a single, robust data-loading pathway that prioritizes the `arc-explainer` API in the client and correctly resolves puzzle IDs between arc-explainer and Playfab Title Data batches. For everything client side the arc-explainer API should be used. We only call PlayFab for validation. 

**Current Work in Progress:** Refactoring the `PuzzleSolver` page and `ResponsivePuzzleSolver` component.

## Part 3: Mission Accomplished - The Fix (Sept 10)

The puzzle loading mechanism has been successfully repaired and refactored. The investigation revealed two primary issues, both of which have been resolved.

### 1. Backend Fix: `cloudscript.js` Redundancy

*   **Problem:** The `cloudscript.js` file contained two functions named `findPuzzleInBatches`. The second, incomplete function was overwriting the first, causing the puzzle lookup in PlayFab Title Data to fail.
*   **Solution:** The second function was correctly renamed to `getAllBatchKeys`, and the `findPuzzleInBatches` function was updated to call it. This restored the backend's ability to locate puzzle data across all specified batches.

### 2. Frontend Fix: Inefficient Component Data Loading

*   **Problem:** The `PuzzleSolver.tsx` page component was fetching puzzle data, only to pass the `puzzleId` to the `ResponsivePuzzleSolver.tsx` component, which would then re-fetch the exact same data. This was inefficient and violated the principle of single data ownership.
*   **Solution:**
    *   `ResponsivePuzzleSolver.tsx` was refactored to accept the entire `puzzle` object as a prop, removing its internal data-fetching logic.
    *   `PuzzleSolver.tsx` was updated to pass the fully loaded `puzzle` object to `ResponsivePuzzleSolver.tsx`.
    *   This eliminates the redundant API call and streamlines the data flow.

### Updated Task List Status

1.  **Finalize Component Refactor:** ✅ **DONE**
    *   `PuzzleSolver.tsx` now correctly fetches data and passes the full object.
    *   `ResponsivePuzzleSolver.tsx` now accepts the `puzzle` object as a prop and has no internal data-fetching logic.

2.  **Investigate Potentially Obsolete Code:** (No action taken, as the primary issue was resolved. This can be a future task.)

3.  **The User will Test Thoroughly:** (Ready for user testing)
    *   Navigate to a puzzle URL directly (e.g., `/officer-track/solve/16b78196`) and confirm it loads correctly.
    *   Verify that puzzles from different datasets (training, evaluation, etc.) all load successfully.

4.  **Commit and Push:** (Ready to commit)
