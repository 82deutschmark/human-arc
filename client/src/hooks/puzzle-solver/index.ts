/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Barrel export for all puzzle solver hooks extracted from ResponsivePuzzleSolver.tsx
 * This provides a clean import interface for the decomposed hooks.
 * SRP and DRY check: Pass - Single responsibility for hook exports
 */

// Display State Hook
export {
  useDisplayState,
  type UseDisplayStateReturn,
  type UseDisplayStateOptions
} from './useDisplayState';

// Puzzle State Hook
export {
  usePuzzleState,
  type PuzzleStateHook,
  type UsePuzzleStateOptions
} from './usePuzzleState';

// Session Logger Hook
export {
  useSessionLogger,
  type SessionLoggerHook,
  type UseSessionLoggerOptions
} from './useSessionLogger';

// Solution Validation Hook
export {
  useSolutionValidation,
  type SolutionValidationHook,
  type UseSolutionValidationOptions,
  type ValidationState
} from './useSolutionValidation';

// Solution Manager Hook
export {
  usePuzzleSolutionManager,
  type SolutionManagerHook,
  type UseSolutionManagerOptions,
  type SolutionManagerState
} from './usePuzzleSolutionManager';

/**
 * PHASE 2 DECOMPOSITION COMPLETE
 *
 * These hooks represent the complete decomposition of ResponsivePuzzleSolver.tsx
 * following the copy/paste approach to preserve exact behavior:
 *
 * 1. useDisplayState - Display preferences and emoji management
 * 2. usePuzzleState - Core puzzle state with height x width standard
 * 3. useSessionLogger - Session lifecycle and player action logging
 * 4. useSolutionValidation - PlayFab integration using PuzzleSolverService
 * 5. usePuzzleSolutionManager - Complex assessment vs regular mode logic
 *
 * Usage Example:
 * ```typescript
 * import {
 *   useDisplayState,
 *   usePuzzleState,
 *   useSessionLogger,
 *   useSolutionValidation,
 *   usePuzzleSolutionManager
 * } from '@/hooks/puzzle-solver';
 * ```
 */