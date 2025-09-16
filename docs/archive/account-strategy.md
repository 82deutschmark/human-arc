# Account Persistence Strategy: A Privacy-First Approach

**Date**: 2025-09-12
**Author**: Cascade Gemini 2.5 Pro (as Senior Software Architect)

## 1. Objective & Guiding Principles

This document outlines a strategy to allow users to save and recover their progress across multiple devices without requiring the project to store or manage any Personally Identifiable Information (PII) like passwords. 

**Guiding Principles:**
- **Minimize Data Liability**: Avoid handling, storing, or processing sensitive user credentials (passwords, etc.).
- **Preserve Simplicity**: Retain the current seamless, anonymous, device-ID-based login as the default experience.
- **User Choice**: Make account linking an optional, user-initiated action.
- **Leverage Trusted Providers**: Offload the complexities of credential management to established third-party identity providers.

## 2. Proposed Solution: Third-Party Authentication via PlayFab

Instead of building our own email/password system, we will leverage PlayFab's built-in support for third-party identity providers (e.g., Google).

**Why this is the right approach:**
- **No Password Handling**: The user authenticates directly with the third party (e.g., Google). Our application only receives a temporary, secure token. We never see or handle the user's password.
- **Reduced Liability**: PlayFab and the identity provider manage the security and recovery of the user's credentials.
- **Increased Trust**: Users are more likely to trust a "Sign in with Google" button than a custom login form for an unknown application.
- **We already have Google OAuth Credentials**: We can use them to authenticate users with Google.

## 3. The User Flow

This strategy creates a two-tiered user experience:

**Tier 1: Anonymous User (Default)**
1. A new user arrives. The app generates a unique `deviceId` and saves it to the browser's `localStorage`.
2. The app logs into PlayFab using `LoginWithCustomID`, creating an anonymous player account tied to that `deviceId`.
3. All progress is saved to this account. This is the current system and it will remain unchanged.

**Tier 2: Registered User (Optional)**
1. The anonymous user decides to save their progress permanently. They click a "Save Progress" button in the UI after the /assessment page.
2. The app presents options to link with a third-party provider (e.g., "Sign in with Google").
3. The user clicks the button, and our app uses the provider's official SDK (e.g., Google Identity Services library) to initiate their sign-in flow.
4. Upon successful sign-in with the provider, their SDK returns an authentication token to our app.
5. Our app immediately calls the appropriate PlayFab API (e.g., `LinkGoogleAccount`), passing the token. **Crucially, our app is already authenticated with the user's anonymous `deviceId` at this time.**
6. PlayFab validates the token with the provider and, upon success, **links the Google identity to the existing anonymous PlayFab account.**

**Result**: The user's progress is now tied to their Google account. They can log in from a new device using the "Sign in with Google" option, and PlayFab will automatically retrieve their existing account and all its associated data.

## 4. Implementation Plan

**Phase 1: Backend & Service Layer**
1.  **Choose Provider(s)**: Start with one simple, common provider. **Recommendation: Google**, as it has a modern and well-documented JavaScript library.
2.  **Update `authManager.ts`**: Add a new method, `linkGoogleAccount(googleAuthToken)`, which will call the `LinkGoogleAccount` PlayFab Client API.
3.  **Update `authManager.ts`**: Add a new method, `loginWithGoogle(googleAuthToken)`, which will call the `LoginWithGoogleAccount` PlayFab Client API for returning users on new devices.

**Phase 2: Frontend & UI**
1.  **Integrate Provider SDK**: Add the chosen provider's JavaScript SDK to our `index.html` or package dependencies.
2.  **Create UI Elements**: 
    - Add a "Save Progress" button to the main header or user profile area, visible only to anonymous users.
    - Create a simple modal or view that explains the benefit of linking an account and displays the "Sign in with..." button(s).
    - Add "Sign in with..." buttons to the initial login/loading screen for returning users.
3.  **Wire up Logic**: Connect the UI buttons to trigger the provider's SDK login flow and then call the new methods in `authManager.ts` with the resulting token.

## 5. Next Steps

- **Decision**: Confirm this strategic direction and select the initial third-party provider(s) to implement.
- **Execution**: Proceed with the implementation plan outlined above, starting with Phase 1.
