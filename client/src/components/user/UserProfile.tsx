/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-14
 * PURPOSE: Fixed user profile component using working authManager APIs instead of broken Profile API
 * SRP and DRY check: Pass - Single responsibility (profile management), uses working authentication patterns
 *
 * FIXED ISSUES:
 * - Removed broken playFabProfiles.getCurrentPlayerProfile() calls (caused 400 errors)
 * - Uses working authManager.getDisplayName() and authManager.setDisplayName()
 * - Simplified to use proven working APIs instead of complex Profile service
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Save, RefreshCw } from 'lucide-react';
import { playFabAuthManager } from '@/services/playfab/authManager';

interface UserProfileProps {
  className?: string;
  onProfileUpdate?: (profile: { PlayFabId: string; DisplayName: string }) => void;
}

export function UserProfile({ className, onProfileUpdate }: UserProfileProps) {
  const [displayName, setDisplayName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current display name on mount
  useEffect(() => {
    loadCurrentDisplayName();
  }, []);

  const loadCurrentDisplayName = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure authenticated first
      if (!playFabAuthManager.isAuthenticated()) {
        await playFabAuthManager.ensureAuthenticated();
      }

      // Get current display name using working authManager API
      const currentDisplayName = playFabAuthManager.getDisplayName() || 'Anonymous Player';
      setDisplayName(currentDisplayName);
      setNewDisplayName(currentDisplayName);
    } catch (err) {
      setError('Failed to load display name');
      console.error('Display name load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Use working authManager.setDisplayName API (this uses updateUserTitleDisplayName)
      await playFabAuthManager.setDisplayName(newDisplayName.trim());

      // Update local state
      setDisplayName(newDisplayName.trim());
      setSuccess('Display name updated successfully!');

      // Notify parent about profile update
      if (onProfileUpdate) {
        onProfileUpdate({
          PlayFabId: playFabAuthManager.getPlayFabId() || '',
          DisplayName: newDisplayName.trim()
        });
      }
    } catch (error) {
      setError('Failed to update display name');
      console.error('Display name update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateNewName = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Trigger name generation (will try CloudScript, fallback to Anonymous_Number)
      const generatedName = await playFabAuthManager.generateAnonymousName();
      await playFabAuthManager.setDisplayName(generatedName);

      // Update local state
      setDisplayName(generatedName);
      setNewDisplayName(generatedName);
      setSuccess('New display name generated successfully!');

      // Notify parent
      if (onProfileUpdate) {
        onProfileUpdate({
          PlayFabId: playFabAuthManager.getPlayFabId() || '',
          DisplayName: generatedName
        });
      }
    } catch (error) {
      setError('Failed to generate new name');
      console.error('Name generation error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear success/error messages after delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading profile...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Display Name Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Display Name
          </CardTitle>
          <CardDescription>
            Your display name appears on leaderboards and in competitions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-name">Current Display Name</Label>
            <div className="p-3 bg-gray-100 rounded-md font-mono">
              {displayName}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-name">New Display Name</Label>
            <Input
              id="new-name"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Enter new display name"
              disabled={isSaving}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpdateDisplayName}
              disabled={isSaving || newDisplayName.trim() === displayName}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Update Name
            </Button>

            <Button
              variant="outline"
              onClick={handleGenerateNewName}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Generate Random Name
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">PlayFab ID:</span>
            <span className="font-mono">{playFabAuthManager.getPlayFabId() || 'Not loaded'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Authenticated:</span>
            <span>{playFabAuthManager.isAuthenticated() ? 'Yes' : 'No'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}