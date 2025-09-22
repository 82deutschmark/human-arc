*
* Author: Cascade using GPT-4o
* Date: 2025-09-18T22:20:49-04:00
* PURPOSE: Consolidated September 2025 development lessons – what we tried, what failed, key take-aways, and critical pitfalls to avoid.  A concise historical reference for future developers so we do not repeat past mistakes while continuing to harden the platform.
* SRP and DRY check: Pass – this document is documentation-only and introduces no executable logic.

# September 2025 – Development Lessons Timeline

> NOTE: Entries are in forward-chronological order (earliest ➡ latest) even though the original `CHANGELOG.md` is reverse-ordered. Skip detailed test instructions, UI copy, and minor cosmetic notes; only durable architectural wisdom is captured.

| Date | Milestone / Change | Key Lessons | Pitfalls to Avoid |
|------|-------------------|-------------|-------------------|
| 2025-09-13 | **Minimal Working Prototype (v0.1.0)** – Unified PlayFab + arc-explainer APIs | • Ground truth data flow established.<br>• Early, small prototype > speculative big design.<br>• Strict field-name consistency (`correct`, not `isCorrect`). | • API mismatches silently break UI – validate all client↔server contracts. |
| 2025-09-13 | **Service Architecture Refactor** – Core service layer & cache | • Centralised services (`arcExplainerClient`, `puzzleRepository`) eliminate 3 000+ duplicate LOC.<br>• DRY & SRP boost maintainability and testability. | • Never mix caching, ID conversion, and HTTP logic in UI components again. |
| 2025-09-13 | **Hotfixes & Data Loading Fixes** (AI comparison, assessment loading, ID mismatches) | • ID conversion is a **first-class concern** – built one bullet-proof `idConverter` and reuse it everywhere.<br>• Comprehensive runtime logging accelerates debugging dramatically. | • Copy-pasting ID handling logic fragments leads to endless edge-case bugs. |
| 2025-09-14 | **CloudScript Refactor & Fallback Validation** | • 60 % server code reduction possible with focused helpers.<br>• Automatic client-side fallback kept users unblocked during server outage. | • Fallback is a *temporary hack* – schedule permanent server fix; remove UI “fallback” indicator once done. |
| 2025-09-14 | **App Re-Theming to HARC** | • A coherent brand journey matters more than old “Space Force” gimmicks.<br>• Route redesign (`/puzzles`, `/dashboard`) removed dead-ends in user flow. | • Large route pivots require exhaustive QA—broken deep links lurk everywhere. |
| 2025-09-14 | **Validation Message & SuccessModal Overhauls** | • Context-aware messaging (single vs multi-test) prevents user confusion.<br>• Keep UI logic decoupled from puzzle data shape. | • Hard-coding strings == easy future localisation debt. |
| 2025-09-15 | **LLM Winner Detection – Simple over Complex** | • “On-demand, per-puzzle” processing beat the original 102 000-call mega-sync plan.<br>• Deliver thin, vertical slices first; scale later. | • Beware sunk-cost fallacy—kill over-engineered plans early. |
| 2025-09-15 | **Bulk LLM Scoring Migration Tools** | • Rate-limiting, resume-from-checkpoint & dry-run flags are mandatory for long jobs.<br>• Treat script resiliency as product quality, not afterthought. | • Running huge migrations without progress persistence risks night-long reruns. |
| 2025-09-17 | **HARC Solver Refactor – Phases 1-3** | • Break 1000-line god component into container + dumb presentational comps.<br>• Typed hooks (`usePuzzleState`) compressed 20+ `useState`s to 5.<br>• Delete obsolete monolith once new path is battle-tested. | • Large-scale refactors demand an *implementation plan* doc – write it first! |
| 2025-09-18 | **Phase 4 Performance & Error Boundaries** | • `React.memo`, `useMemo`, `useCallback` – measured ~30 % render reduction.<br>• Global `PuzzleErrorBoundary` prevents white-screen cascade and gives UX recovery options. | • Missing error boundaries turn minor component bugs into total-app failures. |
| 2025-09-17 | **ARC-AGI Prize Two-Attempt Limit** | • Business rules (2 attempts) belong in CloudScript, not client.<br>• Migration scripts are part of the feature – ship them together. | • Forgetting data migration = instant player lockouts; always test legacy accounts. |
| 2025-09-10 | **Dataset Detection & Validation Flow Clarity** | • Automatically compute dataset prefix (`ARC-E2-`, `ARC-TR-`, …) rather than trusting PlayFab.<br>• UI now differentiates “Frontend check” vs “Official validation” – transparency reduces support tickets. | • Duplicate puzzle IDs across datasets cause silent validation mismatches. Detect & log! |
| 2025-09-10 | **Dynamic Emoji Dropdown** | • Treat `spaceEmojis.ts` as single source of truth; generate UI from data.<br>• Future emoji sets require **zero** component edits. | • UI lists that diverge from constants rot quickly. |
| 2025-09-09 | **Puzzle Solver UI Redesign** |Hybrid display (`1⚡`) 

## Cross-Cutting Wisdom

1. **Start Simple, Iterate Quickly** – The winning LLM leaderboard solution shipped in a day by scrapping the over-ambitious multi-phase plan.
2. **One Source of Truth** – Whether for emoji sets, ID formats, or API clients, duplication invites desynchronisation.
3. **Comprehensive Logging Saves Days** – Harden every new service with debug logs & error context.
4. **Defensive Coding Around External APIs** – NOT NEEDED!  They are reliable and always available.
5. **Migrations Are Features** – Attempt limits, new statistics, or refactors all need plans.
6. **Performance Budgets** – Memoization & container/presentational separation yielded measurable gains; profile before and after every major change.  NOT A PRIORITY!
7. **Guardrails Beat Hotfixes** – Error boundaries and robust validators prevent emergency late-night patches.

---

### Action Items for Future Devs
1. Replace temporary **fallback validation** with permanent CloudScript fix; remove UI indicator.
2. Delete deprecated `ResponsivePuzzleSolver.tsx` once 100 % feature parity confirmed.
3. Plan **Phase 5 Testing Strategy** (see `HARCResponsiveRefactorImplementationPlan.md`).
4. Execute remaining **Phase 2-4** tasks for LLM player data sync (see `15SeptLLMplayers.md`).
5. Audit routes & deep links post-HARC re-theme; add 301 redirects where needed.

Stay DRY, stay SRP, and ship small, valuable slices.
