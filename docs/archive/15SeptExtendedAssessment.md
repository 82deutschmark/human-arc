# Extended Assessment Implementation Plan
**Date**: September 15, 2025
**Author**: Claude Code using Sonnet 4
**Purpose**: Scaffolding plan for optional Part 2 Assessment using hardest puzzles

## Overview
Add an optional "Part 2" to the existing assessment that includes the most challenging puzzles from the commented section in `assessmentPuzzles.ts`. This maintains the current assessment flow while offering advanced users additional challenges.

## Current Assessment Structure Analysis
- **Part 1**: 5 puzzles (`ASSESSMENT_PUZZLE_IDS`)
- **Flow**: Linear progression → completion redirect to `/assessment/comparison`
- **Components**: `AssessmentInterface`, `AssessmentStepSuccessModal`, content from `assessmentNotes.ts`
- **Data**: Stored in PlayFab `humanPerformanceData` with 2-attempt system

## Part 2 Requirements

### 1. Data Structure Changes
**File**: `client/src/constants/assessmentPuzzles.ts`
- Export new constant `PART2_ASSESSMENT_PUZZLE_IDS` using commented hardest puzzles
- Keep existing `ASSESSMENT_PUZZLE_IDS` unchanged for backward compatibility

### 2. State Management Updates
**File**: `client/src/components/assessment/AssessmentInterface.tsx`
- Add state for tracking current assessment part (1 or 2)
- Modify completion logic to handle two-part flow
- Update navigation between parts

### 3. Content Extension
**File**: `client/src/content/assessmentNotes.ts`
- Add designer notes for Part 2 puzzles
- Maintain existing map structure for Part 1 compatibility

### 4. UI Flow Changes
**Component**: `AssessmentStepSuccessModal`
- Add Part 2 invitation logic after Part 1 completion
- Modify "Continue" button behavior based on current part
- Handle transition messaging between parts

### 5. PlayFab Data Structure
- Extend completion tracking to distinguish Part 1 vs Part 2 puzzles
- Maintain backward compatibility with existing performance data
- Add metadata to track which assessment part puzzles belong to

## Implementation Steps

### Phase 1: Data Foundation
1. Extract hard puzzles from comments to `PART2_ASSESSMENT_PUZZLE_IDS`
2. Add Part 2 puzzle content to `assessmentNotes.ts`
3. Update ID conversion services if needed

### Phase 2: Core Logic Extension
1. Modify `AssessmentInterface` state to track assessment parts
2. Update puzzle loading logic to handle both parts
3. Extend completion checking for two-part system

### Phase 3: UI Integration
1. Update success modal with Part 2 invitation
2. Add part indicator to navigation header
3. Modify completion messaging and flow

### Phase 4: Navigation & Persistence
1. Update routing to support `/assessment` and `/assessment/part2`
2. Add resume capability for users returning to incomplete Part 2
3. Update comparison page to show both parts if completed

## Key Design Principles
- **Optional**: Part 2 is never required, always presented as optional challenge
- **Compatible**: Part 1 flow remains identical for existing users
- **Resumable**: Users can return to Part 2 later without losing progress
- **Distinct**: Clear separation between Part 1 (foundational) and Part 2 (advanced)

## Files Requiring Changes
1. `client/src/constants/assessmentPuzzles.ts` - New puzzle ID constant
2. `client/src/content/assessmentNotes.ts` - Part 2 content
3. `client/src/components/assessment/AssessmentInterface.tsx` - Core flow logic
4. `client/src/components/assessment/AssessmentStepSuccessModal.tsx` - Transition UI
5. Assessment route handling (if separate URLs desired)

## Success Criteria
- Part 1 behavior remains unchanged
- Part 2 appears as optional after Part 1 completion
- Both parts tracked independently in PlayFab
- Users can resume Part 2 across sessions
- Comparison page reflects completed parts

## Out of Scope
- New puzzle validation logic (reuse existing CloudScript)
- New scoring systems (use existing points system)
- Advanced analytics dashboard
- Part 2 specific leaderboards (use existing OfficerTrackPoints)

---
*Note: This plan focuses on scaffolding infrastructure. Specific puzzle content and difficulty balancing to be provided separately.*