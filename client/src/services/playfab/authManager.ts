/**
 * Unified PlayFab Authentication Manager
 * 
 * Single Responsibility: Manage all PlayFab authentication states and tokens
 * DRY Compliance: Eliminates duplicate authentication logic across services
 * 
 * Handles:
 * - Anonymous login with device ID generation
 * - Session token management
 * - Display name generation via CloudScript
 * - Authentication state validation
 */

import { PLAYFAB_CONSTANTS } from '@/types/playfab';
import type { AuthenticationResult, AnonymousNameResponse } from '@/types/playfab';
import { playFabRequestManager } from './requestManager';

interface LoginResponse {
  PlayFabId: string;
  SessionTicket: string;
  NewlyCreated: boolean;
  InfoResultPayload?: {
    PlayerProfile?: {
      DisplayName?: string;
      PlayerId: string;
    };
  };
}

interface CloudScriptResponse {
  FunctionName: string;
  FunctionResult?: any;
  Error?: {
    Error: string;
    Message: string;
  };
}

interface DisplayNameResponse {
  DisplayName: string;
}

/**
 * Authentication state container
 */
interface AuthState {
  isAuthenticated: boolean;
  playFabId: string | null;
  displayName: string | null;
  sessionToken: string | null;
  deviceId: string | null;
}

/**
 * Unified Authentication Manager
 * Centralizes all authentication logic that was scattered across multiple services
 */
export class PlayFabAuthManager {
  private static instance: PlayFabAuthManager;
  private authState: AuthState;
  private loginPromise: Promise<AuthenticationResult> | null = null;

  private constructor() {
    this.authState = {
      isAuthenticated: false,
      playFabId: null,
      displayName: null,
      sessionToken: null,
      deviceId: this.loadDeviceId()
    };
  }

  public static getInstance(): PlayFabAuthManager {
    if (!PlayFabAuthManager.instance) {
      PlayFabAuthManager.instance = new PlayFabAuthManager();
    }
    return PlayFabAuthManager.instance;
  }

  /**
   * Get current authentication state
   */
  getAuthState(): Readonly<AuthState> {
    return { ...this.authState };
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && 
           this.authState.playFabId !== null && 
           this.authState.sessionToken !== null;
  }

  /**
   * Get current PlayFab ID
   */
  getPlayFabId(): string | null {
    return this.authState.playFabId;
  }

  /**
   * Get current display name
   */
  getDisplayName(): string | null {
    return this.authState.displayName;
  }

  /**
   * Get current session token for API requests
   */
  getSessionToken(): string | null {
    return this.authState.sessionToken;
  }

  /**
   * Anonymous login with automatic device ID management
   * Prevents concurrent login attempts and handles display name generation
   */
  async loginAnonymously(): Promise<AuthenticationResult> {
    // Prevent concurrent login attempts
    if (this.loginPromise) {
      return await this.loginPromise;
    }

    if (this.isAuthenticated()) {
      return {
        PlayFabId: this.authState.playFabId!,
        DisplayName: this.authState.displayName || undefined,
        NewlyCreated: false
      };
    }

    const deviceId = this.getOrCreateDeviceId();
    const request = {
      CustomId: deviceId,
      CreateAccount: true
    };

    console.log('[PlayFabAuth] Attempting login with deviceId:', deviceId);

    this.loginPromise = (async () => {
      try {
        const result = await playFabRequestManager.makeRequest<typeof request, LoginResponse>(
          'loginWithCustomId',
          request
        );

        console.log('[PlayFabAuth] Login successful:', {
          PlayFabId: result.PlayFabId,
          NewlyCreated: result.NewlyCreated,
          deviceId: deviceId,
          hasDisplayName: !!result.InfoResultPayload?.PlayerProfile?.DisplayName
        });

        this.authState = {
          isAuthenticated: true,
          playFabId: result.PlayFabId,
          displayName: result.InfoResultPayload?.PlayerProfile?.DisplayName || null,
          sessionToken: result.SessionTicket,
          deviceId: this.authState.deviceId
        };

        // Store mapping for debugging and recovery
        const debugMapping = {
          deviceId,
          playFabId: result.PlayFabId,
          timestamp: Date.now(),
          newlyCreated: result.NewlyCreated
        };
        localStorage.setItem('debug_playfab_mapping', JSON.stringify(debugMapping));
        console.log('[PlayFabAuth] Stored debug mapping:', debugMapping);

        // Handle display name generation for new users
        if (!this.authState.displayName) {
          await this.generateDisplayName();
        }

        return {
          PlayFabId: result.PlayFabId,
          DisplayName: this.authState.displayName || undefined,
          NewlyCreated: result.NewlyCreated
        };
      } catch (error) {
        console.error('[PlayFabAuth] Login failed:', {
          error: error,
          deviceId: deviceId,
          request: request
        });
        throw error;
      } finally {
        this.loginPromise = null;
      }
    })();

    return await this.loginPromise;
  }

  /**
   * Generate anonymous display name via CloudScript
   */
  async generateAnonymousName(): Promise<string> {
    const request = {
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.GENERATE_ANONYMOUS_NAME,
      GeneratePlayStreamEvent: false
    };

    const result = await playFabRequestManager.makeRequest<typeof request, CloudScriptResponse>(
      'executeCloudScript',
      request
    );

    if (result.Error) {
      throw new Error(`CloudScript error: ${result.Error.Error} - ${result.Error.Message}`);
    }

    const response = result.FunctionResult as AnonymousNameResponse;
    if (!response?.newName) {
      throw new Error('No name returned from CloudScript');
    }

    return response.newName;
  }

  /**
   * Update user display name
   */
  async setDisplayName(displayName: string): Promise<void> {
    const request = { DisplayName: displayName };

    const result = await playFabRequestManager.makeRequest<typeof request, DisplayNameResponse>(
      'updateUserTitleDisplayName',
      request
    );

    this.authState.displayName = result.DisplayName;
  }

  /**
   * Ensure user is authenticated, login if necessary
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.loginAnonymously();
    }
  }

  /**
   * Attempt to recover player identity when device ID is lost
   * This checks for any stored mappings and tries to find existing player data
   */
  public async attemptPlayerRecovery(): Promise<boolean> {
    console.log('[PlayFabAuth] Attempting player recovery...');

    try {
      // Check for stored debug mapping
      const debugMappingStr = localStorage.getItem('debug_playfab_mapping');
      if (debugMappingStr) {
        const debugMapping = JSON.parse(debugMappingStr);
        const { deviceId, playFabId } = debugMapping;

        if (deviceId && playFabId) {
          console.log('[PlayFabAuth] Found debug mapping:', debugMapping);

          // Try to authenticate with this device ID
          try {
            this.persistDeviceId(deviceId);
            const result = await this.loginAnonymously();

            if (result.PlayFabId === playFabId) {
              console.log('[PlayFabAuth] Successfully recovered player identity:', playFabId);
              return true;
            } else {
              console.warn('[PlayFabAuth] Device ID mapped to different PlayFab ID:', {
                expected: playFabId,
                actual: result.PlayFabId
              });
            }
          } catch (error) {
            console.error('[PlayFabAuth] Failed to login with recovered device ID:', error);
          }
        }
      }

      console.log('[PlayFabAuth] Player recovery failed - no valid mappings found');
      return false;
    } catch (error) {
      console.error('[PlayFabAuth] Player recovery error:', error);
      return false;
    }
  }

  /**
   * Check if a PlayFab ID has completion data (used for recovery validation)
   */
  private async hasCompletionData(playFabId: string): Promise<boolean> {
    try {
      // This is a basic check - in a full implementation we'd check humanPerformanceData
      // For now, we'll rely on the PlayFab ID matching logic
      return true;
    } catch (error) {
      console.error('[PlayFabAuth] Failed to check completion data:', error);
      return false;
    }
  }

  /**
   * Clear authentication state (logout)
   */
  logout(): void {
    this.authState = {
      isAuthenticated: false,
      playFabId: null,
      displayName: null,
      sessionToken: null,
      deviceId: this.authState.deviceId // Preserve device ID
    };
  }

  /**
   * Update session token (used by strategy manager)
   */
  updateSessionToken(sessionToken: string): void {
    this.authState.sessionToken = sessionToken;
    this.authState.isAuthenticated = true;
  }

  /**
   * Device ID management for anonymous login with multi-layer persistence
   */
  private loadDeviceId(): string | null {
    // Try multiple storage methods in order of preference
    let deviceId = localStorage.getItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID);
    if (deviceId) {
      return deviceId;
    }

    // Fallback to sessionStorage
    deviceId = sessionStorage.getItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID);
    if (deviceId) {
      console.log('[PlayFabAuth] Recovered device ID from sessionStorage:', deviceId);
      // Restore to localStorage
      localStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);
      return deviceId;
    }

    // Fallback to cookies
    deviceId = this.getDeviceIdFromCookie();
    if (deviceId) {
      console.log('[PlayFabAuth] Recovered device ID from cookie:', deviceId);
      // Restore to primary storage locations
      localStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);
      sessionStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);
      return deviceId;
    }

    return null;
  }

  /**
   * Persist device ID across multiple storage mechanisms for redundancy
   */
  private persistDeviceId(deviceId: string): void {
    try {
      // Primary storage
      localStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);

      // Backup storage
      sessionStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);

      // Cookie fallback (persistent for 1 year)
      document.cookie = `playfab_device_id=${deviceId}; max-age=31536000; path=/; SameSite=Strict`;

      console.log('[PlayFabAuth] Device ID persisted to all storage layers:', deviceId);
    } catch (error) {
      console.error('[PlayFabAuth] Failed to persist device ID:', error);
      // At minimum, try localStorage
      localStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);
    }
  }

  /**
   * Get device ID from cookie as fallback
   */
  private getDeviceIdFromCookie(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'playfab_device_id') {
          return value;
        }
      }
    } catch (error) {
      console.warn('[PlayFabAuth] Failed to read device ID from cookie:', error);
    }
    return null;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = this.loadDeviceId();
    if (!deviceId) {
      // Use crypto.randomUUID() for collision-resistant device IDs
      // Fallback to timestamp-based ID if crypto.randomUUID() is not available
      try {
        deviceId = 'web_' + crypto.randomUUID().replace(/-/g, '');
      } catch (error) {
        console.warn('[PlayFabAuth] crypto.randomUUID() not available, using fallback method');
        deviceId = 'web_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
      }
      this.persistDeviceId(deviceId);
      console.log('[PlayFabAuth] Generated new device ID:', deviceId);
    } else {
      console.log('[PlayFabAuth] Using existing device ID:', deviceId);
    }
    this.authState.deviceId = deviceId;
    return deviceId;
  }

  /**
   * Handle display name generation for new users
   */
  private async generateDisplayName(): Promise<void> {
    try {
      const generatedName = await this.generateAnonymousName();
      await this.setDisplayName(generatedName);
    } catch (error) {
      // Fallback to simple anonymous name if CloudScript fails
      const fallbackName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
      await this.setDisplayName(fallbackName);
    }
  }
}

// Export singleton instance
export const playFabAuthManager = PlayFabAuthManager.getInstance();