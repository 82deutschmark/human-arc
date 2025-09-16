# Officer Difficulty Cards – API Exploration & Verification Plan (5 Sept 2030)

This document lays out **the exact steps and artefacts** required to

* discover and verify every arc-explainer endpoint relevant to difficulty statistics,
* capture canonical sample payloads, and
* translate what we learn directly into a fully-dynamic `OfficerDifficultyCards` component.

---

## 1  Catalogue & Prioritise Endpoints

| Goal | Primary Endpoint(s) | Why It Matters |
|------|--------------------|----------------|
| Raw difficulty stats (counts per bucket) | `GET /api/puzzle/performance-stats` | Delivers pre-computed bucket counts – fastest path if available. |
| Worst-performing puzzle list | `GET /api/puzzle/worst-performing` | Fallback source; we can derive bucket counts by grouping the `avgAccuracy` field. Supports filters such as `zeroAccuracyOnly`. |
| On-demand accuracy histogram | `GET /api/puzzle/accuracy-stats` | Cross-check that the buckets computed above match global stats. |

**Action:** Begin with the *performance-stats* endpoint; if absent or incomplete, drop down to *worst-performing*.

---

## 2  Endpoint Exploration Procedure

> Use an isolated Node script (`scripts/explore-endpoints.mjs`) or
> Postman/Thunder Client – whichever is fastest for you.  We only need
> *read-only* requests, so no keys or auth flows are required.

1. **Smoke-test availability**  
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" \
     https://arc-explainer-production.up.railway.app/api/puzzle/performance-stats
   ```
   *Expected:* HTTP 200.  Record failures.

2. **Capture canonical response**  
   ```bash
   curl -s \
     https://arc-explainer-production.up.railway.app/api/puzzle/performance-stats \
     > docs/samples/performance-stats.json
   ```
   *Store every sample under* `docs/samples/` *for future unit tests.*

3. **Parameter sweep** – for each boolean / numeric query param:
   * `zeroAccuracyOnly=true`
   * `minAccuracy=0&maxAccuracy=0.25`
   * `limit=10&sortBy=avgAccuracy` (for *worst-performing* endpoint)

   Collect samples, note edge cases (empty arrays, 404s, etc.).

4. **Schema extraction**  
   For every sample, run:
   ```bash
   npx quicktype --src-lang json --lang ts \
     --just-types docs/samples/performance-stats.json \
     > tmp/generated/performance-stats.d.ts
   ```
   Use output as a reference while writing TypeScript interfaces.

---

## 3  Verification Checklist

| ✓ | Verification Step |
|---|------------------|
|   | Endpoint returns 200 and JSON. |
|   | Response has **total** field or we can derive total from array length. |
|   | Each puzzle object carries `avgAccuracy` (0 – 1 float). |
|   | Buckets compute to *exactly* the counts shown in the API when grouped as:<br>  • 0 → **impossible**<br>  • 0 < x ≤ 0.25 → **extremely_hard**<br>  • 0.25 < x ≤ 0.50 → **very_hard**<br>  • 0.50 < x ≤ 0.75 → **challenging** |
|   | Server caps `limit` at 50 – confirmed by requesting 500. |
|   | `zeroAccuracyOnly=true` always yields `avgAccuracy === 0`. |
|   | Error codes documented (400 for bad params, 500 for server). |

Mark every row during testing and commit the checked version to `docs/test-evidence/`.

---

## 4  Mapping to `OfficerDifficultyCards`

1. **Extend `arcExplainerAPI`**  
   *   `getPerformanceStats()` → returns bucket counts straight from server.  
   *   `getWorstPerformingPuzzles(filters)` → existing method, keep as fallback.

2. **Rewrite React hook**  
   *Create* `usePuzzleDifficultyStats()` that:
   * tries `getPerformanceStats()` first;
   * on failure, fetches worst-performing list, groups by bucket, returns same shape;
   * caches result (5 min) in React query or vanilla state.

3. **Refactor `OfficerDifficultyCards.tsx`**  
   *   Import the new hook.
   *   Show skeleton loaders while fetching.
   *   Render four cards using live counts.
   *   On card click, pass the difficulty filter to Officer Track for puzzle list.

4. **Unit tests**
   * Mock both endpoints and verify that cards display correct numbers.
   * Verify fallback behaviour when primary endpoint 500s.

---

## 5  Deliverables

| File/Folder | Purpose |
|-------------|---------|
| `docs/5Septo3Plan.md` | **This plan** – living document, keep in version control. |
| `docs/samples/*.json` | Raw response snapshots used for schema + tests. |
| `tmp/generated/*.d.ts` | Quicktype-generated TypeScript, used only as reference. |
| `client/src/services/arcExplainerAPI.ts` | New/extended API helper functions. |
| `client/src/hooks/usePuzzleDifficultyStats.ts` | Unified hook for live stats. |
| `client/src/components/game/OfficerDifficultyCards.tsx` | Refactored UI. |
| `tests/difficultyCards.test.tsx` | Jest/RTL coverage for counts + error states. |

---

## 6  Timeline (realistic, hobby-scale)

| When | Task |
|------|------|
| **Day 0** | Endpoint smoke-test & sample capture (30 min). |
| **Day 0** | Generate TypeScript interfaces (15 min). |
| **Day 0–1** | Extend API service & write new hook (1 h). |
| **Day 1** | Refactor component (1 h). |
| **Day 1** | Jest tests (30 min). |
| **Day 2** | Manual browser validation & doc update (30 min). |

Total ≈ **4 hours** spread over two evenings.

---

## 7  Definition of Done

* Cards show live counts that always equal numbers returned by API.
* Clicking a card filters Officer Track list consistently.
* No hard-coded numbers or mock data remain in codebase.
* All tests pass locally.  The user can run `npm test OfficerDifficultyCards` and see green.
* Documentation (this file) updated with any deviations discovered during implementation.
