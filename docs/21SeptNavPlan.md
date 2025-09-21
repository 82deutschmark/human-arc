# Navbar and Header Consolidation Plan

**Prepared by:** Cascade
**Date:** 2025-09-21

## 1. The Problem

The project currently suffers from a proliferation of navigation and header components, leading to an inconsistent user experience and a maintenance burden. Multiple components (`Navbar.tsx`, `PageHeader.tsx`, `PuzzleHeader.tsx`, etc.) are used across different pages, and there is no single, global navigation structure.

`AssessmentInterface.tsx`,  requires a special header and the way it does things now is fine.

- **Action:** Go through the pages that were using their own headers (`LeaderboardLanding.tsx`, etc.) and remove the old header components, use Navbar.tsx instead.



- **Details:** This is a critical cleanup step. The `PuzzleHeader` might need to be refactored to remove any navigation-like elements, while `PageHeader` can likely be removed entirely from the pages that use it.

