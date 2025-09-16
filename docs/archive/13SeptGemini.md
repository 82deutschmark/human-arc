# Assessment Success Modal - Technical Plan (Gemini)

**Author**: Gemini 2.5 Pro
**Date**: 2025-09-13
**Status**: Proposed Plan

## 1. Objective

To replace the generic success modal in the assessment flow with a data-rich, DESIGNER-CURATED modal for onboarding. This new component will display a combination of static, designer-crafted explanations and dynamic, real-time AI performance statistics.

## 2. Core Principles (SRP & DRY)

This plan is designed with the Single Responsibility Principle (SRP) and Don't Repeat Yourself (DRY) principles at its core.

*   **SRP**: Each new file/component will have one specific job (e.g., storing content, fetching data, displaying UI).
*   **DRY**: We will centralize data fetching and content to avoid duplication and ensure maintainability.

## 3. Proposed Architecture

The implementation will be broken down into three new, distinct parts and one modification to an existing component.

| File/Component                                       | Responsibility                                                                                                 | Principle      |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------- |
| `client/src/content/assessmentNotes.ts`              | **(Content)** A centralized TypeScript file to store all static designer notes for each assessment puzzle.     | DRY            |
| `client/src/services/assessment/AssessmentContentService.ts` | **(Data Logic)** A service to fetch and merge the static notes with dynamic puzzle & AI performance data.    | SRP            |
| `client/src/components/assessment/AssessmentStepSuccessModal.tsx` | **(UI/Presentation)** A "dumb" component that only displays the content provided to it.                       | SRP            |
| `client/src/components/officer/ResponsivePuzzleSolver.tsx` | **(Integration)** The existing component will be modified to conditionally render the new modal.             | Integration    |

### Data Flow Diagram

```
[ResponsivePuzzleSolver.tsx]
        |
        | 1. User solves puzzle
        v
[AssessmentStepSuccessModal.tsx] (is rendered)
        |
        | 2. useEffect triggers data fetch for puzzleId
        v
[AssessmentContentService.ts]
        |
        | 3. Calls getAssessmentNote() from assessmentNotes.ts (static)
        | 4. Calls puzzleRepository.findById() (dynamic)
        |
        | 5. Merges data
        v
[AssessmentStepSuccessModal.tsx] (receives merged content)
        |
        | 6. Renders UI with final content
        v
[User]
```

## 4. Implementation Steps

I will proceed with the following steps, awaiting your approval after each code-writing step.

1.  **Create Content Store**: Create `client/src/content/assessmentNotes.ts`. This file will export a `Map` of puzzle IDs to their corresponding designer notes (title, explanation, AI context). This ensures content is decoupled from UI and is easily updatable.

2.  **Create Data Service**: Create `client/src/services/assessment/AssessmentContentService.ts`. This service will have a single method, `getAssessmentContent(puzzleId)`, which will:
    *   Fetch the static `DesignerNote` from `assessmentNotes.ts`.
    *   Fetch the `EnhancedPuzzle` data (including AI performance stats) using the existing `puzzleRepository`.
    *   Combine them into a single `AssessmentContent` object.
    *   This service will be the single source of truth for the modal's content, adhering to SRP.

3.  **Create UI Component**: Create `client/src/components/assessment/AssessmentStepSuccessModal.tsx`. This component will:
    *   Accept `puzzleId`, `open`, `onClose`, and `onAssessmentAdvance` as props.
    *   Use a `useEffect` hook to call `assessmentContentService.getAssessmentContent()` when it becomes visible.
    *   Display loading and error states.
    *   Render the title, explanations, and AI performance data from the fetched content.
    *   The 'OK' button will trigger the `onAssessmentAdvance` callback to proceed to the next puzzle.

4.  **Integrate into `ResponsivePuzzleSolver`**: Modify `client/src/components/officer/ResponsivePuzzleSolver.tsx` to:
    *   Add an import for the new `AssessmentStepSuccessModal`.
    *   Replace the existing `<SuccessModal>` with a conditional block:
        *   If `isAssessmentMode` is `true`, render `<AssessmentStepSuccessModal />`.
        *   Otherwise, render the original `<SuccessModal />`.
    *   Pass the required props (`puzzle.id`, `showSuccessModal`, etc.) to the new modal.

## 5. Error Handling

*   **Loading State**: The modal will display a spinner while content is being fetched.
*   **Error State**: If `AssessmentContentService` fails to fetch either the notes or the puzzle data, the modal will display a clear error message. The user can still close the modal and proceed.

This structured approach ensures a clean, maintainable, and robust implementation. I will now await your review of this plan.
