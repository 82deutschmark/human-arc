/**
 * PlayFab Service Barrel File
 * 
 * This file re-exports all the individual, modular PlayFab services.
 * Instead of using a monolithic facade, components should import the specific
 * services they need.
 * 
 * Example:
 * import { playFabTasks, playFabUserData } from '@/services/playfab';
 */

export { playFabAuthManager } from './authManager';
export { playFabTasks } from './tasks';
export { playFabValidation } from './validation';
export { playFabEvents } from './events';
export { playFabUserData } from './userData';
export { leaderboards as playFabLeaderboards } from './leaderboards';
export { playFabProfiles } from './profiles';
export { playFabOfficerTrack } from './officerTrack';
export { playFabRequestManager } from './requestManager';

// Export all public types
export type * from '@/types/playfab';
export type * from '@/types/arcTypes';