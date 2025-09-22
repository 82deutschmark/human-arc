/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-22T16:03:17-04:00
 * PURPOSE: This document outlines the plan to refactor the HARC puzzle solver UI, addressing responsiveness issues and custom component violations.
 * SRP and DRY check: Pass. This document serves a single purpose: to define the refactoring plan for the HARC UI.
 */

# HARC Responsive Solver UI Refactoring Plan

**Date:** 2025-09-22

**Author:** Cascade

## 1. Overview

The current implementation of the `HARCResponsiveSolverUI` suffers from significant responsiveness issues, leading to poor layout scaling and wasted screen real estate, particularly on larger displays. This is primarily due to a widespread violation of the project's core architectural principle: "Use shadcn/ui for EVERYTHING." Instead of leveraging the standard, theme-aware `shadcn/ui` component library, the UI has been built with a complex hierarchy of custom components that rely on a flawed, JavaScript-driven, pixel-based layout system.

This document outlines a high-level strategic plan to refactor the UI, bringing it in line with project standards and implementing a modern, responsive design.

## 2. The Core Problem: Custom Components and Flawed Responsiveness

The root of the issue lies in a collection of custom-built components that manually calculate element sizes in pixels. This is an anti-pattern that prevents the UI from adapting fluidly to different screen sizes.

The key offenders are:

*   **`useResponsiveGridSize.ts`**: This hook is the architectural heart of the problem. It uses hardcoded breakpoints and imperative logic to calculate cell sizes, leading to a rigid and inflexible layout.
*   **`ResponsiveOfficerGrid.tsx`**: This component uses the flawed `useResponsiveGridSize` hook and a `fixedCellSize` prop to render the puzzle grids. This is the primary source of the scaling issues.
*   **`SizeSlider.tsx`**: A blatant violation of project rules, this is a completely custom slider component instead of the standard `shadcn/ui` `Slider`.
*   **Other Custom Components**: A cascade of other custom components for navigation, modals, and layout further exacerbates the problem.

## 3. Affected Files

The following is a comprehensive list of the files that are part of the custom UI component tree and will need to be refactored or replaced:

*   **Primary Container:**
    *   `client/src/components/layout/HARCResponsiveSolverUI.tsx`

*   **Custom `harc-solver` Components:**
    *   `client/src/components/harc-solver/PuzzleHeader.tsx`
    *   `client/src/components/harc-solver/TestCasesView.tsx`
    *   `client/src/components/harc-solver/SolutionWorkspace.tsx`
    *   `client/src/components/harc-solver/ValidationStatus.tsx`

*   **Custom `officer` Components (High-Impact):**
    *   `client/src/components/officer/ResponsiveOfficerGrid.tsx` (and its dependency `EnhancedGridCell.tsx`)
    *   `client/src/components/officer/TrainingExamplesSection.tsx`
    *   `client/src/components/officer/TestCaseNavigation.tsx`
    *   `client/src/components/officer/GridWithDimensions.tsx`
    *   `client/src/components/officer/PuzzleSolverControls.tsx`
    *   `client/src/components/officer/PuzzleTools.tsx`
    *   `client/src/components/officer/PermanentHintSystem.tsx`
    *   `client/src/components/officer/DisplayModeToolbar.tsx`

*   **Custom `ui` Components (Violations):**
    *   `client/src/components/ui/SizeSlider.tsx`
    *   `client/src/components/ui/SuccessModal.tsx`
    *   `client/src/components/ui/FailureModal.tsx`
    *   `client/src/components/ui/PuzzleNotification.tsx`
    *   `client/src/components/ui/AttemptCounter.tsx`

*   **Custom `layout` Components:**
    *   `client/src/components/layout/Navbar.tsx`

*   **Hooks:**
    *   `client/src/hooks/useResponsiveGridSize.ts`

## 4. Strategic Refactoring Plan

The goal is to replace the custom UI components with their `shadcn/ui` equivalents and adopt a modern, CSS-first approach to responsiveness. This will be a multi-step process:

### Step 1: Replace Low-Level Custom Components

*   **`SizeSlider.tsx`**: Replace with the standard `shadcn/ui` `Slider` component.
*   **`SuccessModal.tsx` / `FailureModal.tsx`**: Replace with the `shadcn/ui` `AlertDialog` or `Dialog` component.
*   **`PuzzleNotification.tsx`**: Replace with the `shadcn/ui` `Toast` component (or `Alert` if more appropriate).
*   **`TestCaseNavigation.tsx`**: Replace the custom grid of buttons with the `shadcn/ui` `Tabs` component for a more standard and accessible navigation experience.

### Step 2: Eliminate the `useResponsiveGridSize` Hook

*   The core of the refactor is to remove the `useResponsiveGridSize.ts` hook entirely. Instead of calculating sizes in JavaScript, we will use Tailwind CSS's responsive utilities and CSS Grid/Flexbox to create a fluid layout.

### Step 3: Refactor the Grid Components

*   **`ResponsiveOfficerGrid.tsx`**: This component needs a complete rewrite. The new grid should be built with CSS Grid and use fractional units (`fr`) instead of fixed pixel sizes. This will allow the grid to naturally fill the available space.
*   **`EnhancedGridCell.tsx`**: Simplify this component by using Tailwind variants for its different states (selected, hovered, etc.) instead of complex inline style calculations.

### Step 4: Refactor the Layout Containers

*   **`TrainingExamplesSection.tsx` / `SolutionWorkspace.tsx`**: Rebuild these containers using `shadcn/ui` `Card` components and Flexbox/Grid layouts. The goal is to create a flexible structure that adapts to the screen size, similar to the official ARC Prize website.

### Step 5: Standardize the `Navbar`

*   **`Navbar.tsx`**: Refactor the `Navbar` to use `shadcn/ui` components and theme variables exclusively. Replace the custom `NavButton` and `NavLink` with standard `Button` components and appropriate variants.

## 5. Learning from the Official ARC Prize Website

The official ARC Prize website, while built with older technology (HTML, jQuery), provides a valuable lesson in simplicity. Its layout is based on simple, flexible containers that allow the browser to manage the layout. By adopting a similar, CSS-first approach with modern tools like Tailwind CSS and `shadcn/ui`, we can achieve a far more robust and maintainable solution.

By following this plan, we will not only fix the immediate responsiveness issues but also bring the project back into alignment with its core architectural principles, resulting in a more scalable, maintainable, and visually consistent application.
