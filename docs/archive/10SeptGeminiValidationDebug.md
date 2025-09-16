# 10SeptGeminiValidationDebug

Short summary of the persistent ARC validation problem and what we found while debugging. Author: Gemini 2.5 Pro.

## Symptom
- __Server validation rejects correct solutions__ with log:
  - `Puzzle ARC-EV-be03b35f not found in Title Data`
  - Client logs show `PlayFabValidation] ARC puzzle validation result: Incorrect` and repeated `game_start` / `game_completion` events.

## What we were testing
- Puzzle ID: `ARC-EV-be03b35f` (exists locally at `data/evaluation/be03b35f.json`).
- Officer Track / Evaluation flow using CloudScript handler `ValidateARCPuzzle` in `cloudscript.js`.

## Findings
- __CloudScript Title Data access bug__ in `cloudscript.js` → `findPuzzleInBatches()`:
  - Problem: Used `server.GetTitleData({Keys:[key]}).Data[key].Value`.
  - Reality: In CloudScript, `GetTitleData` returns `Data[key]` as a plain string (no `.Value`).
  - Effect: JSON parse never happened, batches appeared "empty", lookup returned "not found" even when data was present.
  - Fix applied: Replace `Data[key].Value` with `Data[key]` and `JSON.parse` that string.

- __Potential Title ID mismatch across scripts/env__:
  - `scripts/migrate-tasks-to-playfab.ts` and `scripts/sync-cloudscript.cjs` use `PLAYFAB_TITLE_ID`.
  - `scripts/check-playfab-data.cjs` uses `VITE_PLAYFAB_TITLE_ID || '19FACB'`.
  - Client code typically uses `VITE_PLAYFAB_TITLE_ID`.
  - Risk: Data may be uploaded to one Title (via `PLAYFAB_TITLE_ID`) while checks/reads target a different Title (via `VITE_PLAYFAB_TITLE_ID` default). This produces false "not found" even though data exists in the other Title.

- __Batch keys searched__ (`cloudscript.js` → `getAllBatchKeys()`):
  - Training: `officer-tasks-training-batch[1..4].json`.
  - Training2: `officer-tasks-training2-batch[1..10].json`.
  - Evaluation: `officer-tasks-evaluation-batch[1..4].json`.
  - Evaluation2: `officer-tasks-evaluation2-batch[1..2].json`.
  - The lookup also performs a "clean ID" match (strips `ARC-(TR|T2|EV|E2)-`) so `be03b35f` should be found if the batch actually contains it.

- __Client/server event noise__:
  - We observed alternating `game_start` and `game_completion` events and `player_action` fail events around validation attempts. Not the root cause, but worth de-noising once validation is stable.

## Why correct solutions were rejected
1. CloudScript was reading Title Data incorrectly, causing puzzle batches to parse as undefined and the puzzle to be "not found".
2. Additionally, a Title ID mismatch can make reads hit a different PlayFab Title than the one where we uploaded data.

## Actions taken
- Fixed `cloudscript.js` Title Data access in `findPuzzleInBatches()` to parse `Data[key]` directly.
- Left extensive logging in place to verify batch counts and which batch contains the puzzle.

## Next steps (do these in order)
1. __Ensure Title IDs are consistent__ in `.env`:
   - Set both `PLAYFAB_TITLE_ID` and `VITE_PLAYFAB_TITLE_ID` to the same value.
   - Avoid defaults like `'19FACB'` unless that's really the intended Title.
2. __Resync CloudScript__:
   - `node scripts/sync-cloudscript.cjs`
3. __Re-verify Title Data__ (against the exact Title ID above):
   - Update `scripts/check-playfab-data.cjs` to use the same Title variable, then run it to list keys and sizes.
4. __Retry the solve__ for `ARC-EV-be03b35f` and watch CloudScript logs:
   - Expect: batch logs show counts, and `Found puzzle in Title Data` before validation.

## Validation expectations
- `ValidateARCPuzzle` requires the number of submitted `solutions` to equal the number of test cases in the puzzle (`puzzle.test.length`) and each solution grid must `arraysEqual` the corresponding `output`.
- If the puzzle is present and the solution is correct, `success: true, correct: true` and Officer Track scoring updates should be written.

## Open items to monitor
- If still seeing "not found": double-check batch content really includes `be03b35f` in one of the evaluation batches uploaded.
- Consider adding a temporary diagnostic endpoint to list which batch currently contains a given ID.
