# General Performance Comparison Page Implementation Plan
**Date**: September 14, 2025
**Author**: Claude Code using Sonnet 4
**Purpose**: Create accessible performance comparison page for experienced players

## Current State Analysis

### What's Good About HumanVsAiComparison.tsx
- Excellent detailed comparison with PuzzleComparisonCard
- Rich data fetching from PlayFab and arc-explainer
- Proper error handling and loading states
- Debug capabilities and detailed score breakdowns
- Perfect for assessment/tutorial flow

### Existing Reusable Components Analysis

1. **ParticipantDashboard.tsx** ⭐ **THIS IS ALMOST WHAT WE WANT**
   - ✅ Fetches ALL completed puzzles (not just assessment)
   - ✅ Summary stats (puzzles completed, total score, average time)
   - ✅ Uses ComparisonCard component (cleaner than PuzzleComparisonCard)
   - ✅ Grid layout for easy scanning
   - ❌ Missing proper header/navigation
   - ❌ Not accessible as standalone page

2. **ComparisonCard.tsx** ⭐ **PERFECT FOR GENERAL USE**
   - ✅ Compact, scannable format
   - ✅ Clear win/loss indication
   - ✅ Essential AI stats in grid format
   - ✅ Focused on key metrics only

3. **PuzzleComparisonCard.tsx**
   - ✅ Very detailed with score breakdown
   - ✅ Links to puzzle review
   - ✅ Debug capabilities
   - ❌ Too verbose for general scanning
   - ✅ Good for detailed assessment analysis (keep for assessment)

4. **LLMComparisonSelector.tsx**
   - ❌ Bloated puzzle selector (not relevant)
   - ✅ Has filtering/sorting patterns (could extract if needed)

## Implementation Strategy

### Approach: Enhance ParticipantDashboard Pattern
**Rationale**: ParticipantDashboard already does 90% of what we want. DRY principle says reuse, don't rebuild.

### Step 1: Create GeneralPerformanceComparison.tsx
- Copy ParticipantDashboard logic as starting point
- Add proper Navbar header
- Rename and adjust styling/text for general use
- Remove HARC-specific branding

### Step 2: Component Reuse Strategy
```
GeneralPerformanceComparison.tsx
├── Navbar (add header)
├── Summary stats section (from ParticipantDashboard)
├── ComparisonCard[] (reuse existing)
└── Data fetching logic (from ParticipantDashboard)
```

### Step 3: Data Layer (REUSE EXISTING)
- ✅ `playFabUserData.getHumanPerformanceData()` - gets ALL puzzles
- ✅ `arcExplainerClient.getPuzzlePerformance()` - gets AI data
- ✅ `idConverter.normalizeToArcId()` - handles ID conversion
- ✅ Latest record per puzzle logic

### Step 4: Minimal Enhancements
- Add link to puzzle from ComparisonCard (like PuzzleComparisonCard has)
- Add sorting options (by score, time, date)
- Add simple filtering (correct/incorrect, recent/all)

### Step 5: Navigation Integration
- Add route `/performance` or `/stats`
- Add link from main navigation/profile area
- Remove hardcoded buttons (they belong in main nav)

## File Structure

```
NEW FILE: /pages/GeneralPerformanceComparison.tsx
├── Based on ParticipantDashboard.tsx
├── Uses existing ComparisonCard.tsx
├── Uses existing data services
└── Add Navbar header

MODIFY: App routing to include new page
MODIFY: Main navigation to link to new page
```

## Implementation Steps

### Phase 1: Core Page Creation
1. Create `GeneralPerformanceComparison.tsx` based on `ParticipantDashboard.tsx`
2. Add `Navbar` header component
3. Adjust branding from "HARC Participant" to "Performance Overview"
4. Test with existing data

### Phase 2: Minor Enhancements
1. Add puzzle links to ComparisonCard (like PuzzleComparisonCard has)
2. Add basic sorting dropdown (score, time, date)
3. Add simple correct/incorrect filter toggle

### Phase 3: Integration
1. Add route to App.tsx
2. Add navigation link from appropriate places
3. Test full flow

## Why This Approach Works

1. **DRY**: Reuses 90% existing code from ParticipantDashboard
2. **SRP**: ComparisonCard handles comparison display, page handles layout
3. **Practical**: Builds on proven working components
4. **Minimal**: Only adds what's missing (header, route, navigation)
5. **Extensible**: Easy to enhance later without breaking existing patterns

## What NOT to Do

- ❌ Don't rebuild data fetching (ParticipantDashboard pattern works)
- ❌ Don't create new comparison card variants (ComparisonCard is perfect)
- ❌ Don't add complex filtering/sorting initially (keep it simple)
- ❌ Don't modify existing assessment flow (leave HumanVsAiComparison.tsx alone)
- ❌ Don't copy LLMComparisonSelector patterns (it's overcomplicated)

## Success Metrics

- Uses existing ComparisonCard component (no new card types)
- Shows ALL user puzzles (not just assessment)
- Has proper header with navigation
- Accessible from main site navigation
- Maintains existing component patterns
- Total new code < 150 lines (mostly page wrapper around existing components)