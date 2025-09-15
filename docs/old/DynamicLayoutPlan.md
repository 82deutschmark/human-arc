# Dynamic Layout Plan for Responsive Puzzle Solver

**Objective:** To refactor the `ResponsivePuzzleSolver` and its child components to create a more robust and dynamically scaling layout that adapts gracefully to a wide range of screen sizes, from mobile to large desktops.

---

## 1. Current Layout Analysis

The current layout is functional but has some limitations:

-   **Main Container (`ResponsivePuzzleSolver.tsx`):** Uses a three-column flexbox layout for the core solving interface: `[Test Input Grid] - [Controls] - [Solution Grid]`.
-   **Control Panel:** The central control column is composed of `PuzzleSolverControls` and `PuzzleTools`. It has a relatively fixed width, which can cause layout issues on smaller screens where horizontal space is limited.
-   **Grid Sizing:** The input and output grids calculate their cell sizes based on a fixed percentage of the viewport width. This is not ideal as the available space for the grids changes significantly when the layout shifts.
-   **Mobile Experience:** The side-by-side layout does not adapt well to narrow, single-column mobile viewports.

---

## 2. Proposed Refactoring Plan

I will use Tailwind CSS's responsive breakpoints (`sm`, `md`, `lg`, `xl`) to apply different layout styles at different screen sizes.

### Step 1: Responsive Main Layout (`ResponsivePuzzleSolver.tsx`)

The core of the plan is to make the main solving area layout adapt using flexbox and responsive prefixes.

-   **Large Screens (`lg` and up):** Maintain the current three-column layout: `[Input] | [Controls] | [Output]`.
-   **Medium Screens (`md`):** Transition to a two-column layout where the controls are grouped and centered, and the grids are on either side.
-   **Small Screens (below `md`):** Stack all components vertically. This will be the default mobile-friendly layout:
    -   Training Examples
    -   Test Input
    -   Controls
    -   Your Solution

### Step 2: Create a Flexible Central Controls Wrapper

Instead of having two separate components (`PuzzleSolverControls` and `PuzzleTools`) placed directly in the main flex container, I will wrap them in a single parent `div`. This makes it easier to manage their collective layout.

-   This new wrapper will be a flex item in the main layout.
-   On large screens, it will have a `max-width` to prevent it from growing too wide.
-   On smaller screens, it will naturally expand to the full width when the layout becomes vertical.

### Step 3: Refine Internal Component Layouts

-   **`PuzzleTools.tsx`:** The internal elements (Display toggles, Actions, Palette) will use `flex-wrap` to ensure they stack neatly when the container width is reduced.
-   **`PuzzleSolverControls.tsx`:** The size selectors and buttons will also be configured to wrap on smaller screens.
-   **`EmojiPaletteDivider.tsx`:** This component is well-contained. I will ensure its parent container within `PuzzleTools` allows it to be centered and have sufficient space.

### Step 4: Improve Grid Sizing Logic

The `calculateCellSize` function will be updated to be more context-aware.

-   Instead of relying on `window.innerWidth`, the function should calculate the available space based on the dimensions of its immediate parent container.
-   This will make the grid cell sizes automatically adjust correctly as the layout shifts between 1, 2, or 3 columns, as the parent container's size will change accordingly.

---

## 3. Implementation Strategy

1.  **Modify `ResponsivePuzzleSolver.tsx`:**
    -   Apply responsive `flex` utility classes (`flex-col`, `lg:flex-row`, etc.) to the main layout containers.
    -   Create the wrapper `div` around `PuzzleSolverControls` and `PuzzleTools`.
2.  **Adjust Child Components:**
    -   Update `PuzzleTools.tsx` and `PuzzleSolverControls.tsx` to use `flex-wrap` for their internal elements.
3.  **Refactor `calculateCellSize`:**
    -   Pass a reference to the grid container element or use a resize observer to get the parent dimensions.
    -   Update the calculation to use the parent's width instead of the window's width.

This plan will result in a more professional, adaptable, and user-friendly interface across all devices.

---

## 4. Additional Minor Optimizations

After implementing the core responsive architecture above, consider these refinements:

### Enhanced Readability (EmojiPaletteDivider)
- Increase button size from `h-14 w-12` to `h-20 w-16` for better touch targets
- Bump text size from `text-lg` to `text-xl` for improved visibility
- Increase spacing from `gap-1` to `gap-2` for easier interaction

### Space Efficiency (TrainingExamplesSection)
- Use tighter gaps (`gap-2` instead of `gap-4`) for more examples on screen
- Reduce card padding (`p-2` instead of `p-3`) for small grids
- Consider dynamic cell sizing based on example count for optimal space usage

### TestCaseNavigation Compactification
- Reduce button height from `h-10` to `h-8` to save vertical space
- Use inline header layout instead of stacked elements for efficiency
- Show detailed progress only for complex puzzles (4+ test cases)

These optimizations work best on top of the solid responsive foundation outlined above.