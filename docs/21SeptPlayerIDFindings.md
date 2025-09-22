# Findings & Implementation Plan: PlayFab `currentPlayerId` Authentication Failure

/**
 * Author: Cascade using Gemini 2.5 Pro
 * Date: 2025-09-21
 * PURPOSE: To document the root cause of the persistent `context.currentPlayerId is undefined` error in PlayFab CloudScript and to provide a detailed, actionable plan for another developer to implement a permanent architectural fix.
 * SRP and DRY check: Pass - This document has the single responsibility of outlining the findings and implementation plan for the authentication flaw.
 */

---

## 1. Executive Summary

The platform is experiencing a critical authentication failure where server-side CloudScript functions are unable to identify the calling user. This manifests as the `context.currentPlayerId` being `undefined`, causing all server-side validation to fail and forcing the system to rely on a client-side fallback mechanism. This is a significant security and data integrity risk.

My investigation has revealed that this is not a simple bug but a fundamental architectural flaw in how the client-side API services handle the PlayFab session token. The token is not being correctly passed down through the service layers on each request, leading to the use of stale or non-existent tokens.

This document provides a detailed root cause analysis and a precise, step-by-step implementation plan to refactor the authentication flow. The proposed solution will ensure every authenticated API call to PlayFab includes a fresh, valid session token, thereby resolving the issue at its source.

---

## 2. Root Cause Analysis

The core problem lies in a stateful, rather than stateless, handling of the session token within the API strategy layer.

**The Symptom:**
- All calls to `ExecuteCloudScript` result in an error within the script because `context.currentPlayerId` is `undefined`.
- The client-side application then correctly falls back to its own validation logic, masking the server-side failure from the end-user but defeating the purpose of server-authoritative logic.

**The Architectural Flaw:**

1.  **`PlayFabAuthManager`**: Correctly logs the user in and obtains a valid `sessionToken`.
2.  **`PlayFabRequestManager`**: When `makeRequest` is called, it correctly retrieves the *fresh* `sessionToken` from the `PlayFabAuthManager`.
3.  **The Point of Failure**: The `PlayFabRequestManager` then calls the `PlayFabApiStrategyManager`. However, it **fails to pass the fresh `sessionToken`** into the strategy manager's `createRequest` method.
4.  **`PlayFabApiStrategyManager`**: This manager selects the `ClientApiStrategy` but, having not received the fresh token, it calls the strategy's `createRequest` method without it.
5.  **`ClientApiStrategy`**: This strategy was designed to hold its own internal `sessionToken` property. Because this property is not updated on each request, it is either `null` or contains a stale token from a previous operation. It uses this incorrect token to build the API request headers.
6.  **The Result**: The final `fetch` call to the PlayFab API either has a missing or invalid `X-Authorization` header. The PlayFab backend cannot authenticate the user, hence `context.currentPlayerId` is `undefined`.

In short, the session token is not flowing correctly through the layers on a per-request basis. The system relies on a stateful token within a strategy object, which is the wrong pattern for this kind of authentication.

---

## 3. Implementation Plan for Claude

This is a step-by-step task list to fix the authentication issue. Follow these instructions exactly. Do not use code snippets; read the files and apply the changes as described.

### **Task 1: Refactor `apiStrategy.ts`**

**File to Edit**: `client/src/services/playfab/apiStrategy.ts`

Your goal is to make the API strategies stateless by passing the session token on every request.

1.  **Modify `PlayFabApiStrategy` Interface**:
    - Find the `createRequest` method within the `PlayFabApiStrategy` interface.
    - Add a new optional parameter to it: `sessionToken?: string`.

2.  **Modify `AdminApiStrategy` Class**:
    - Find the `createRequest` method within the `AdminApiStrategy` class.
    - Add the `sessionToken?: string` parameter to its signature to match the interface. This class will not use the token, but it must match the interface definition.

3.  **Modify `ClientApiStrategy` Class**:
    - Find the `constructor` and remove its `sessionToken` parameter and property. The constructor should be empty.
    - Find the `createRequest` method and add the `sessionToken?: string` parameter to its signature.
    - Inside `createRequest`, find the logic that adds the `X-Authorization` header. Change it to use the `sessionToken` variable passed into the method, NOT `this.sessionToken`.
    - Delete the entire `updateSessionToken` method from this class. It is no longer needed.

4.  **Modify `PlayFabApiStrategyManager` Class**:
    - Find the `createRequest` method. In its final `return` statement, you will see a call to `strategy.createRequest`. You must pass the `sessionToken` from the manager's `createRequest` method into this call.
    - Delete the entire `setSessionToken` method from this class. It is no longer needed.

### **Task 2: Verify `requestManager.ts`**

**File to Edit**: `client/src/services/playfab/requestManager.ts`

1.  **Verify `makeRequest` Method**:
    - Find the `makeRequest` method.
    - Confirm that it retrieves the `sessionToken` from `playFabAuthManager.getSessionToken()`.
    - Confirm that this `sessionToken` is then passed as the third argument to the `this.strategyManager.createRequest()` call.
    - No changes should be needed here, but verification is critical.

### **Task 3: Final Verification**

After completing the refactoring, the authentication flow should be fixed. The system should now correctly use the server-side CloudScript for validation without falling back to the client-side mechanism due to authentication errors.

---

## 4. Expected Outcome

Once these refactoring steps are complete:

- The `sessionToken` will be fetched fresh from the `PlayFabAuthManager` for every single API call.
- This fresh token will be passed down through each layer of the service architecture (`RequestManager` -> `StrategyManager` -> `ApiStrategy`).
- The `X-Authorization` header will always be correct.
- PlayFab will successfully authenticate the user, and `context.currentPlayerId` will be correctly populated in all CloudScript functions.
- The client-side validation fallback will no longer be triggered by authentication failures, and the system will operate as architecturally intended, with the server as the source of truth.
