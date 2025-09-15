# Profile Functionality Investigation & Fix Plan
**Date**: September 14, 2025
**Author**: Claude Code using Sonnet 4
**Purpose**: Deep dive investigation to fix broken profile functionality

## Current Problem Analysis

### Error Symptoms
- `POST /Client/GetPlayerProfile` returns 400 Bad Request
- Profile saving fails silently despite success messages
- UserProfile component fails to load current profile data
- Display name updates appear to work but don't persist

### Root Cause Hypotheses
1. **API Permissions**: GetPlayerProfile may require different permissions than we have
2. **Wrong API Endpoint**: We might be using client API when we need server API
3. **Authentication Issues**: Session token might not have correct permissions
4. **Data Model Mismatch**: Our profile structure might not match PlayFab's expectations
5. **Service Architecture**: Complex layered services may have circular dependencies

## Investigation Tasks

### Phase 1: PlayFab API Documentation Review
1. **Read PlayFab Profile APIs documentation**
   - Client vs Server API differences for profiles
   - Required permissions for GetPlayerProfile
   - Proper authentication scopes needed
   - Rate limits and usage patterns

2. **Compare with working PlayFab calls**
   - Analyze successful APIs (like userData.getHumanPerformanceData)
   - Check authentication patterns that work
   - Identify why some calls succeed and others fail

3. **Review PlayFab title configuration**
   - Check what permissions our title has
   - Verify API access levels in PlayFab dashboard
   - Confirm client vs server API availability

### Phase 2: Service Architecture Analysis
1. **Map current service dependencies**
   - `UserProfile.tsx` → `playFabProfiles` → `playFabRequestManager`
   - Identify circular dependencies and conflicts
   - Check if multiple auth systems are conflicting

2. **Analyze authentication flow**
   - How `playFabAuthManager` handles sessions
   - When/how session tokens are refreshed
   - Verify token permissions for profile operations

3. **Compare with working functionality**
   - How other profile-related features work (display names in leaderboards)
   - What APIs successfully update player data
   - Pattern differences between working and broken code

### Phase 3: Alternative Approaches Research
1. **PlayFab User Data vs Profiles**
   - Can we store profile info in User Data instead of Profiles API?
   - What's the difference between display name storage options?
   - Which approach matches our current working patterns?

2. **CloudScript profile management**
   - Can we handle profile updates via CloudScript?
   - Would server-side profile management solve permission issues?
   - How do other parts of the app update display names?

3. **Minimal viable profile solution**
   - What's the simplest way to show/edit display name?
   - Can we leverage existing working authentication patterns?
   - How to avoid over-engineering the solution?

## Technical Investigation Steps

### Step 1: API Documentation Deep Dive
- Read complete PlayFab GetPlayerProfile documentation
- Understand Client vs Admin vs Server API differences
- Identify correct authentication requirements
- Document required permissions and setup

### Step 2: Working Code Analysis
- Find where display names successfully work in the app
- Trace the data flow for working profile displays
- Identify why leaderboards show names but profile edit fails
- Document the working pattern

### Step 3: Service Simplification Assessment
- Evaluate if the current profile service architecture is necessary
- Consider removing complex caching and layered abstractions
- Assess if direct API calls would be more reliable
- Plan service refactoring to match working patterns

### Step 4: Alternative Implementation Planning
- Design profile management using User Data API (if that works)
- Plan CloudScript-based profile updates (if needed)
- Design minimal UI that matches working data patterns
- Create fallback plan if Profile API remains broken

## Expected Deliverables

1. **Root cause identification**: Exact reason why GetPlayerProfile fails
2. **Working solution design**: Technical approach that will actually work
3. **Implementation plan**: Step-by-step code changes needed
4. **Service cleanup**: Simplified architecture that follows working patterns

## Success Criteria

- Profile page loads without 400 errors
- Display name changes persist correctly
- User can see current profile information
- Solution follows patterns from working parts of the app
- No overengineered abstractions that obscure simple operations

## Anti-Patterns to Avoid

- Don't add more layers of abstraction
- Don't assume PlayFab Profile API is the right approach
- Don't replicate complex caching if simple calls work
- Don't ignore working patterns already in the codebase
- Don't over-design when simple solutions exist