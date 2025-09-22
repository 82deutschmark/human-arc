/**
 * Author: Cascade using Gemini 2.5 Pro
 * Date: 2025-09-22T16:03:17-04:00
 * PURPOSE: This document outlines the plan to refactor the HARC puzzle solver UI, addressing responsiveness issues and custom component violations.
 * SRP and DRY check: Pass. This document serves a single purpose: to define the refactoring plan for the HARC UI.
 */

# HARC Responsive Solver UI Refactoring Plan

**Date:** 2025-09-22

**Author:** Cascade

## 1. Overview

The current implementation of the `HARCResponsiveSolverUI` suffers from significant responsiveness issues, leading to poor layout scaling and wasted screen real estate, particularly on larger displays. This is primarily due to a widespread violation of the project's core architectural principle: "Use shadcn/ui for EVERYTHING." Instead of leveraging the standard, theme-aware `shadcn/ui` component library, the UI has been built BY CLAUDE with a complex hierarchy of custom components that rely on a flawed, JavaScript-driven, pixel-based layout system.  This is wrong and represents a huge breach of project standards and best practices.  Claude threw files into seemingly random folders and used poor naming conventions.  

This document outlines a high-level strategic plan to FIX the UI, bringing it in line with project standards and implementing a modern, responsive design.  It is clear that Claude 4 Sonnet is not capable of maintaining sight of the big picture or following even the most basic of instructions and has lost the trust of the project leadership.  

## 2. The Core Problem: Custom Components and Flawed Responsiveness

The root of the issue lies in a collection of custom-built components that manually calculate element sizes in pixels. This is an anti-pattern that prevents the UI from adapting fluidly to different screen sizes.

The key offenders are:

*   **`useResponsiveGridSize.ts`**: This hook is the architectural heart of the problem. It uses hardcoded breakpoints and imperative logic to calculate cell sizes, leading to a rigid and inflexible layout.
*   **`ResponsiveOfficerGrid.tsx`**: This component uses the flawed `useResponsiveGridSize` hook and a `fixedCellSize` prop to render the puzzle grids. This is the primary source of the scaling issues.
*   **`SizeSlider.tsx`**: A blatant violation of project rules, this is a completely custom slider component instead of the standard `shadcn/ui` `Slider`.
*   **Other Custom Components**: A cascade of other custom components for navigation, modals, and layout further exacerbates the problem.

## 3. Affected Files

The following is a comprehensive list of the files that are part of the custom UI component tree and will need to be refactored or replaced:

*   **Primary Container:**  Refactor as needed.  LAST STEP IN THE PROCESS!!
    *   `client/src/components/layout/HARCResponsiveSolverUI.tsx`

*   **Custom `harc-solver` Components:** NEW FILES BASED ON THESE SHOULD BE PLACED IN THE src/components/ui folder
    *   `client/src/components/harc-solver/PuzzleHeader.tsx`
    *   `client/src/components/harc-solver/TestCasesView.tsx`
    *   `client/src/components/harc-solver/SolutionWorkspace.tsx`
    *   `client/src/components/harc-solver/ValidationStatus.tsx`

*   **Custom `officer` Components (High-Impact):**  NEW FILES BASED ON THESE SHOULD BE PLACED IN THE src/components/ui folder
    *   `client/src/components/officer/ResponsiveOfficerGrid.tsx` (and its dependency `EnhancedGridCell.tsx`)
    *   `client/src/components/officer/TrainingExamplesSection.tsx`
    *   `client/src/components/officer/TestCaseNavigation.tsx`
    *   `client/src/components/officer/GridWithDimensions.tsx`
    *   `client/src/components/officer/PuzzleSolverControls.tsx`
    *   `client/src/components/officer/PuzzleTools.tsx`
    *   `client/src/components/officer/PermanentHintSystem.tsx`
    *   `client/src/components/officer/DisplayModeToolbar.tsx`

*   **Custom `ui` Components (Violations):**  REFACTOR THESE AS NEEDED
    *   `client/src/components/ui/SizeSlider.tsx`  
    *   `client/src/components/ui/SuccessModal.tsx`
    *   `client/src/components/ui/FailureModal.tsx`
    *   `client/src/components/ui/PuzzleNotification.tsx`  Not even sure what this is
    *   `client/src/components/ui/AttemptCounter.tsx` 

*   **Custom `layout` Components:**
    *   `client/src/components/layout/Navbar.tsx`  90% correct, only missing correct shadcn/ui component usage in a few spots.

*   **Hooks:**
    *   `client/src/hooks/useResponsiveGridSize.ts`  

## 4. Strategic Refactoring Plan

The goal is to replace the custom UI components with their `shadcn/ui` equivalents and adopt a modern, CSS-first approach to responsiveness. This will be a multi-step process:

### Step 5: Replace Low-Level Custom Components

*   **`SizeSlider.tsx`**: Replace with the standard `shadcn/ui` `Slider` component.
*   **`PuzzleNotification.tsx`**: Replace with the `shadcn/ui` `Toast` component (or `Alert` if more appropriate).  No idea how this is even used in the project...
*   **`TestCaseNavigation.tsx`**: Replace the custom grid of buttons with the `shadcn/ui` `Tabs` component for a more standard and accessible navigation experience.  MUST HAVE!  

### Step 2: Eliminate the `useResponsiveGridSize` Hook

*   The core of the refactor is to remove the `useResponsiveGridSize.ts` hook entirely. Instead of calculating sizes in JavaScript, we will use Tailwind CSS's responsive utilities and CSS Grid/Flexbox to create a fluid layout.

### Step 3: Refactor the Grid Components

*   **`ResponsiveOfficerGrid.tsx`**: This component needs to be deprecated for a totally new version. The new grid should be built with CSS Grid and use fractional units (`fr`) instead of fixed pixel sizes. This will allow the grid to naturally fill the available space.  The new component should be placed in a more logical location and NOT in the officer folder and have no theme-specific logic. 
*   **`EnhancedGridCell.tsx`**: Simplify this component by using Tailwind variants for its different states (selected, hovered, etc.) instead of complex inline style calculations.

### Step 4: Refactor the Layout Containers  (Or just build new ones that are correct?)

*   **`TrainingExamplesSection.tsx` New file in src/components/ui needed for this!!  / `SolutionWorkspace.tsx` Already in correct location?? **: Rebuild or write new versions of these containers using `shadcn/ui` `Card` components and Flexbox/Grid layouts. The goal is to create a flexible structure that adapts to the screen size, similar to the official ARC Prize website.

### Step 1: Standardize the `Navbar`

*   **`Navbar.tsx`**: Refactor the `Navbar` to use `shadcn/ui` components and theme variables exclusively. Replace the custom `NavButton` and `NavLink` with standard `Button` components and appropriate variants.

## 5. Learning from the Official ARC Prize Website

The official ARC Prize website, while built with older technology (HTML, jQuery), provides a valuable lesson in simplicity. Its layout is based on simple, flexible containers that allow the browser to manage the layout. By adopting a similar, CSS-first approach with modern tools like Tailwind CSS and `shadcn/ui`, we can achieve a far more robust and maintainable solution.

Refactoring and editing the worst offenders and anything in the officer folder will not be the best way forward!!!  We want to write totally new and correct versions of them and place them in a more logical location, such as the src/components/ui or src/components/layout folder. 

TASK LIST:

### Phase 1: Foundational Component Refactoring

**Task 1.1: Standardize the Navbar**
-   **Action:** Fix the existing `client/src/components/layout/Navbar.tsx` to fully use `shadcn/ui` components and theme variables exclusively. Replace the custom `NavButton` and `NavLink` with standard `Button` components and appropriate variants.
    1.  Ensure all styles are derived from the theme and Tailwind CSS. Do not use hardcoded colors or styles.

**Task 1.2: Refactor the Custom Slider**  
-   
    1.  **CRITICAL:** Read the **entire** content of the  `client/src/components/ui/SizeSlider.tsx` to understand its props and purpose.
    2.  correctly implement the slider using the standard `shadcn/ui` `Slider` component. It must accept the same props (`value`, `onChange`, `min`, `max`, `label`).
    3.  **DO NOT** write custom HTML/CSS for this. Use the `shadcn/ui` component as intended.

**Task 1.3: Replace the Test Case Navigation**
-   **Action:** Create a new file `client/src/components/ui/MultiTestTabs.tsx`.
-   **Instruction:**
    1.  **CRITICAL:** Read the **entire** content of `client/src/components/officer/TestCaseNavigation.tsx` to understand its logic for displaying multiple test cases and their completion status.
    2.  In the new `MultiTestTabs.tsx`, use the `shadcn/ui` `Tabs` component (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) to replace the custom button grid.
    3.  The `TabsTrigger` for each tab should visually indicate its status (active, completed, pending) using `lucide-react` icons and `shadcn/ui` variants.

### Phase 2: De-Risking the Grid System

**Task 2.1: Deprecate the Responsive Sizing Hook**
-   **Action:** Deprecate the file `client/src/hooks/useResponsiveGridSize.ts` and rename it to `client/src/hooks/useResponsiveGridSize.md`.
-   **Instruction:** This file is the root cause of the layout issues. It must be removed. All responsive logic will be handled by Tailwind CSS in the new grid component.  Add this note to its header so we know!!!

**Task 2.2: Create a New, Truly Responsive Grid Component**
-   **Action:** Create a new file `client/src/components/ui/ResponsiveGrid.tsx`.
-   **Instruction:**
    1.  **CRITICAL:** Read the **entire** content of the old `client/src/components/officer/ResponsiveOfficerGrid.tsx` and its dependency `client/src/components/officer/EnhancedGridCell.tsx`. This is essential to understand all interaction logic (clicking, dragging, painting, right-click clearing).
    2.  In the new `ResponsiveGrid.tsx`, build the grid using CSS Grid and **fractional units (`fr`)**, not fixed pixels. The grid should be wrapped in a container that allows it to fluidly expand and contract.
    3.  Re-implement the cell as a sub-component within `ResponsiveGrid.tsx`. Use Tailwind CSS variants for all states (hover, selected, etc.) instead of inline styles or complex JavaScript logic.
    4.  This new component must be theme-agnostic and contain no logic specific to the `officer` track.

### Phase 3: Rebuilding the Main UI with Standard Components

**Task 3.1: Create New Layout Containers**
-   **Action:** Create new files `client/src/components/ui/TrainingExamples.tsx` and `client/src/components/ui/SolverWorkspace.tsx`.
-   **Instruction:**
    1.  **CRITICAL:** Read the **entire** content of `client/src/components/officer/TrainingExamplesSection.tsx` and `client/src/components/harc-solver/SolutionWorkspace.tsx`.
    2.  Rebuild these components from scratch in their new files. Use `shadcn/ui` `Card` components for the main containers and use CSS Flexbox/Grid for layout.
    3.  These new components will now import and use the new, corrected components you created in Phase 1 & 2 (e.g., `GridSizeSlider`, `ResponsiveGrid`).

    **Task 3.2: Create Replacements for Remaining `officer` Components**
-   **Action:** Create new, standardized replacements for the remaining high-impact `officer` components in the `client/src/components/ui/` directory.
-   **Instruction:**
    1.  **CRITICAL:** For each of the files below, read the original file in the `officer` directory to fully understand its props and functionality before creating its replacement in the `ui` directory.
    2.  **`PuzzleSolverControls.tsx`**: Create a new `client/src/components/ui/PuzzleSolverControls.tsx`. Re-implement the controls using `shadcn/ui` `Button` components with appropriate variants.
    3.  **`PuzzleTools.tsx`**: Create a new `client/src/components/ui/PuzzleTools.tsx`. Rebuild the tool selection functionality using `shadcn/ui` `ToggleGroup` or `RadioGroup` for a better user experience.
    4.  **`PermanentHintSystem.tsx`**: Create a new `client/src/components/ui/PermanentHintSystem.tsx`. Use `shadcn/ui` `Card` and `Alert` components to display hints.
    5.  **`DisplayModeToolbar.tsx`**: Create a new `client/src/components/ui/DisplayModeToolbar.tsx`. Use `shadcn/ui` `ToggleGroup` to manage display states.

### Phase 4: Final Integration

**Task 4.1: Assemble the New Solver UI**
-   **Action:** Refactor the primary container file, `client/src/components/layout/HARCResponsiveSolverUI.tsx`.
-   **Instruction:**
    1.  This is the final step. Update this file to remove all references to the old, deprecated components from the `officer` folder.
    2.  Compose the new, fully responsive UI by importing and arranging the new components created in the previous phases (`TrainingExamples`, `SolverWorkspace`, etc.).

### Phase 5: Component Cleanup and Finalization

**Task 5.1: Refactor UI Violation Components**
-   **Action:** Refactor the remaining custom `ui` components to use `shadcn/ui` equivalents.
-   **Instruction:**
    1.  **`client/src/components/ui/SuccessModal.tsx` & `FailureModal.tsx`**: Read their contents and replace them with a single, reusable modal component built from `shadcn/ui`'s `AlertDialog` or `Dialog`.
    2.  **`client/src/components/ui/PuzzleNotification.tsx`**: Read its content to understand its purpose. Replace its functionality using `shadcn/ui`'s `Toast` component.
    3.  **`client/src/components/ui/AttemptCounter.tsx`**: Read its content. Refactor it to use standard `shadcn/ui` components and Tailwind CSS for styling, removing any custom logic where possible.

**Task 5.2: Create Replacements for `harc-solver` Components**
-   **Action:** Create new, standardized replacements for the custom `harc-solver` components in the `client/src/components/ui/` directory.
-   **Instruction:**
    1.  **`client/src/components/harc-solver/PuzzleHeader.tsx`**: Read its content. Create a new `client/src/components/ui/PuzzleHeader.tsx` that replicates the necessary functionality using `shadcn/ui` components.
    2.  **`client/src/components/harc-solver/ValidationStatus.tsx`**: Read its content. Create a new `client/src/components/ui/ValidationStatus.tsx` using `shadcn/ui` `Alert` or other appropriate components to display validation feedback.

**Task 5.3: Create Replacements for Remaining `officer` Components**
-   **Action:** Create new, standardized replacements for the remaining high-impact `officer` components in the `client/src/components/ui/` directory.
-   **Instruction:**
    1.  **CRITICAL:** For each of the files below, read the original file in the `officer` directory to fully understand its props and functionality before creating its replacement in the `ui` directory.
    2.  **`PuzzleSolverControls.tsx`**: Create a new `client/src/components/ui/PuzzleSolverControls.tsx`. Re-implement the controls using `shadcn/ui` `Button` components with appropriate variants.
    3.  **`PuzzleTools.tsx`**: Create a new `client/src/components/ui/PuzzleTools.tsx`. Rebuild the tool selection functionality using `shadcn/ui` `ToggleGroup` or `RadioGroup` for a better user experience.
    4.  **`PermanentHintSystem.tsx`**: Create a new `client/src/components/ui/PermanentHintSystem.tsx`. Use `shadcn/ui` `Card` and `Alert` components to display hints.
    5.  **`DisplayModeToolbar.tsx`**: Create a new `client/src/components/ui/DisplayModeToolbar.tsx`. Use `shadcn/ui` `ToggleGroup` to manage display states.

**Task 5.4: Deprecate Old Components**
-   **Action:** Once all replacement components have been created and integrated in Task 4.1, rename the old, now-unused component files in the `harc-solver` and `officer` directories to have a `.md` extension (e.g., `ResponsiveOfficerGrid.tsx` -> `ResponsiveOfficerGrid.md`).
-   **Instruction:** Add a note to the top of each deprecated file explaining that it has been replaced by a new component in the `client/src/components/ui/` directory and should not be used.
