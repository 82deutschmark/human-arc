# Officer Track Onboarding Modal - Technical Architecture Plan

## Core Architecture Principles

### 1. Component Composition Over Inheritance
- Reuse existing `ResponsivePuzzleSolver` as-is via composition
- Create thin wrapper components that configure existing functionality
- Avoid duplicating puzzle-solving logic

### 2. Configuration-Driven Approach
```typescript
interface OnboardingStep {
  id: string;
  puzzleId: string;
  title: string;
  description: string;
  enabledFeatures: string[]; // ['displayControls', 'validation', 'hints']
}

const ONBOARDING_CONFIG: OnboardingStep[] = [
  // Load from external config, not hardcoded
];
```

### 3. Single Responsibility Components

**OfficerOnboardingModal**: Modal container + step navigation
**OnboardingPuzzleWrapper**: Configures ResponsivePuzzleSolver for tutorial mode
**OnboardingProgress**: Step indicator and navigation controls
**OnboardingInstructions**: Contextual guidance panel

## Technical Implementation

### 1. Modal Container Architecture
```typescript
// Follows existing OnboardingModal pattern
interface OfficerOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  config?: OnboardingStep[]; // Injectable configuration
}
```

### 2. Component Reuse Strategy
- **ResponsivePuzzleSolver**: Add optional `tutorialMode` prop to disable/modify features
- **Existing UI components**: Button, Badge, Dialog from shadcn
- **Officer components**: Import and compose, don't modify internals

### 3. State Management
```typescript
// Custom hook following existing patterns
const useOfficerOnboarding = () => ({
  currentStep: number;
  progress: OnboardingProgress;
  nextStep: () => void;
  previousStep: () => void;
  completeStep: (stepId: string) => void;
});
```

### 4. Data Layer
- Extend existing PlayFab user data schema
- Use existing `playFabUserData` service
- Follow established patterns for persistence

## File Structure

### New Files (Minimal Addition)
1. `client/src/components/officer/OfficerOnboardingModal.tsx`
2. `client/src/hooks/useOfficerOnboarding.ts`
3. `client/src/config/onboardingSteps.ts` (configuration)

### Modified Files (Minimal Changes)
1. `OfficerTrackSimple.tsx`: Add modal trigger logic
2. `ResponsivePuzzleSolver.tsx`: Add optional `tutorialMode?: boolean` prop

## Key Technical Decisions

### 1. Prop Drilling vs Context
Use props for modal state (following existing OnboardingModal pattern)
Use context only if state becomes complex across multiple components

### 2. Configuration Management
External configuration file for step definitions
Runtime validation of puzzle availability
Graceful degradation if puzzles unavailable

### 3. Component Modification Strategy
**Extend, don't modify**: Add optional props to existing components
**Composition over inheritance**: Wrap components rather than subclass
**Feature flags**: Use props to enable/disable features rather than separate components

### 4. Testing Strategy
Unit tests for configuration validation
Integration tests for step progression
Mock PlayFab responses for reliable testing

## Implementation Approach

### Phase 1: Core Modal Structure
- Create basic modal container
- Implement step navigation logic
- Add configuration loading

### Phase 2: Component Integration  
- Integrate ResponsivePuzzleSolver
- Add tutorial mode handling
- Implement progress tracking

### Phase 3: Polish & Integration
- Add to OfficerTrackSimple trigger
- PlayFab persistence
- Error handling

## Benefits of This Architecture

1. **Maintainability**: Changes to puzzle solving don't affect onboarding
2. **Testability**: Each component has single responsibility
3. **Extensibility**: Easy to add/remove steps via configuration  
4. **Reusability**: Components can be reused for other tutorial flows
5. **Performance**: Lazy loading of puzzle data, minimal bundle impact