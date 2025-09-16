# Hint System Implementation Plan

## Current State Analysis (September 12, 2025)

**Problem Identified:** 
- PermanentHintSystem.tsx was cleared out due to architectural mess
- Mixed game hints with UI tooltips inappropriately
- AssessmentInterface has no hint integration
- PlayFab backend hint scoring exists but unused by frontend

**Root Cause:**
Previous implementation violated SRP and didn't align with clean HARC assessment architecture.

## Strategic Implementation Approach

### Phase 1: Build for HARC Assessment First
**Primary Target:** `client/src/components/assessment/AssessmentInterface.tsx`
- Clean wrapper architecture already exists
- Focus on this as the primary implementation
- Build reusable components that can be retrofitted elsewhere

### Phase 2: Core Hint System Architecture

**PermanentHintSystem.tsx Rebuild:**
- Single Responsibility: Provide progressive hints only
- DRY Principle: Reusable across assessment and officer track
- Position: Adjacent to puzzle grids (not in overcrowded control panel)

**Three-Tier Progressive Hint System:**
1. **Level 1 - Grid Size Hint:** Use existing puzzle data to show correct solution dimensions
2. **Level 2 - Transformation Types:** Display 40 ARC-AGI transformation categories via TypesModal
3. **Level 3 - Solution Explanation:** Arc-explainer API integration for human-readable explanations

### Phase 3: Backend Integration
**PlayFab Hint Scoring (Already Exists):**
- CloudScript `ValidateTaskSolution` function accepts `hintsUsed` parameter
- Scoring penalty: 5 points per hint used
- Integrate with existing session tracking and event logging

**Arc-Explainer API Integration:**
- Endpoint: `/api/puzzle/:puzzleId/explanations`
- Documentation: `docs/arc-explainer-api-investigation.md`
- Fallback handling for puzzles without explanations

### Phase 4: Cross-Platform Reuse
**Officer Track Integration:**
- Reuse same PermanentHintSystem component in ResponsivePuzzleSolver
- Maintain behavioral consistency across platforms
- No code duplication

## Key Architectural Constraints

1. **No Simulated Content:** Real API integration only
2. **SRP Compliance:** Each component has single, clear responsibility  
3. **DRY Implementation:** Single hint system used everywhere
4. **Assessment Flow Compatibility:** Must not disrupt auto-progression
5. **Control Panel Space:** Position hints near grids, not in packed controls
6. **PlayFab Integration:** Use existing hint scoring system

## Files to Implement/Modify

**New Components:**
- `client/src/components/hints/TypesModal.tsx` (40 ARC-AGI transformations)

**Rebuild:**
- `client/src/components/officer/PermanentHintSystem.tsx` (clean implementation)

**Integrate:**
- `client/src/components/assessment/AssessmentInterface.tsx` (primary target)
- `client/src/components/officer/ResponsivePuzzleSolver.tsx` (secondary reuse)

**Services:**
- Extend existing arc-explainer integration for hint explanations

## Implementation Status
- [x] Architecture planning complete
- [x] File structure defined  
- [ ] PermanentHintSystem rebuild
- [ ] HARC assessment integration
- [ ] Arc-explainer API wiring
- [ ] Officer track reuse
- [ ] Testing and validation