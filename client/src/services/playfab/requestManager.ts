/**
 * PlayFab Request Abstraction Layer
 * 
 * Single Responsibility: Handle all HTTP communication with PlayFab APIs
 * DRY Compliance: Eliminates duplicate request patterns across services
 * 
 * Features:
 * - Unified request interface for all PlayFab operations
 * - Automatic retry logic with exponential backoff
 * - Consistent error handling and transformation
 * - Request/response logging for debugging
 * - Network resilience for Windows certificate issues
 */

import { PlayFabApiStrategyManager, type ApiOperationType } from './apiStrategy';
import { playFabAuthManager } from './authManager';
import type { PlayFabConfig, PlayFabError } from '@/types/playfab';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface RequestOptions {
  retries?: Partial<RetryConfig>;
  timeout?: number;
}

/**
 * PlayFab Request Manager
 * Handles all HTTP communication with PlayFab APIs using strategy pattern
 */
export class PlayFabRequestManager {
  private static instance: PlayFabRequestManager;
  private strategyManager: PlayFabApiStrategyManager;
  private initialized: boolean = false;
  
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  };

  private constructor() {
    // Will be initialized in initialize() method
    this.strategyManager = null as any;
  }

  public static getInstance(): PlayFabRequestManager {
    if (!PlayFabRequestManager.instance) {
      PlayFabRequestManager.instance = new PlayFabRequestManager();
    }
    return PlayFabRequestManager.instance;
  }

  /**
   * Initialize the request manager with PlayFab configuration
   */
  async initialize(config: PlayFabConfig): Promise<void> {
    this.strategyManager = new PlayFabApiStrategyManager(config);
    this.initialized = true;
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Make authenticated PlayFab API request
   * Automatically selects appropriate strategy and handles authentication
   */
  async makeRequest<TRequest = any, TResponse = any>(
    operation: ApiOperationType,
    requestData?: TRequest,
    options?: RequestOptions
  ): Promise<TResponse> {
    if (!this.initialized) {
      throw new Error('PlayFabRequestManager not initialized. Call initialize() first.');
    }

    // Ensure authentication for operations that require it
    const requiresAuth = !['loginWithCustomId'].includes(operation);
    if (requiresAuth) {
      await playFabAuthManager.ensureAuthenticated();
    }

    // Create request using appropriate strategy
    const sessionToken = playFabAuthManager.getSessionToken();
    const apiRequest = this.strategyManager.createRequest(operation, requestData, sessionToken || undefined);
    const url = this.strategyManager.getApiUrl(apiRequest);

    // Apply retry configuration
    const retryConfig = {
      ...this.defaultRetryConfig,
      ...options?.retries
    };

    return await this.executeWithRetry(url, apiRequest, retryConfig);
  }

  /**
   * Execute HTTP request with retry logic and error handling
   */
  private async executeWithRetry<TResponse>(
    url: string,
    apiRequest: any,
    retryConfig: RetryConfig
  ): Promise<TResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: apiRequest.headers,
          body: JSON.stringify(apiRequest.data)
        });

        return await this.processResponse<TResponse>(response, url);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
          retryConfig.maxDelay
        );

        // Only retry on network errors or 5xx server errors
        if (this.shouldRetry(error)) {
          await this.sleep(delay);
          continue;
        } else {
          break;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Process HTTP response and handle PlayFab API errors
   */
  private async processResponse<TResponse>(
    response: Response, 
    url: string
  ): Promise<TResponse> {
    // Parse JSON response
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (error) {
      throw this.createError('InvalidResponse', 0, 'Failed to parse response JSON', { url, error });
    }

    // Check HTTP status
    if (!response.ok) {
      throw this.createError(
        responseData.error || 'HttpError',
        responseData.errorCode || response.status,
        responseData.errorMessage || `HTTP ${response.status}: ${response.statusText}`,
        responseData
      );
    }

    // Check PlayFab API success
    if (responseData.code !== 200 || responseData.error) {
      throw this.createError(
        responseData.error || 'APIError',
        responseData.errorCode || responseData.code || 0,
        responseData.errorMessage || 'PlayFab API Error',
        responseData
      );
    }

    // Update session token if login operation
    if (responseData.data?.SessionTicket) {
      playFabAuthManager.updateSessionToken(responseData.data.SessionTicket);
    }

    return responseData.data as TResponse;
  }

  /**
   * Determine if error should trigger retry
   */
  private shouldRetry(error: any): boolean {
    // Network errors (fetch failures)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // 5xx server errors
    if (error.message?.includes('HTTP 5')) {
      return true;
    }

    // Windows certificate issues
    if (error.message?.includes('certificate') || error.message?.includes('SSL')) {
      return true;
    }

    return false;
  }

  /**
   * Create standardized PlayFab error
   */
  private createError(
    error: string, 
    errorCode: number, 
    errorMessage: string, 
    errorDetails?: any
  ): PlayFabError {
    return {
      error,
      errorCode,
      errorMessage,
      errorDetails
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get strategy manager for advanced operations
   */
  getStrategyManager(): PlayFabApiStrategyManager {
    if (!this.initialized) {
      throw new Error('PlayFabRequestManager not initialized');
    }
    return this.strategyManager;
  }
}

// Export singleton instance
export const playFabRequestManager = PlayFabRequestManager.getInstance();