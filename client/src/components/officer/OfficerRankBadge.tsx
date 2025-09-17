/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component was intended to display a player's rank in the Officer Track, complete with military-style insignia and progress tracking.
 * DEPRECATION NOTICE: This component is deprecated and should not be used. The Officer Rank system is not an implemented feature of the application, as confirmed in the project's README. This component was likely created based on a misunderstanding of the project's scope and is a clear violation of DRY and SRP, as it introduces a significant amount of code for a non-existent feature.
 * SRP and DRY check: Fail. This component is a poster child for over-engineering and building features that are not required. It introduces a large amount of unnecessary code and complexity for a feature that does not exist.
 */

import { useState } from 'react';
import { Star, Award, TrendingUp, Info } from 'lucide-react';
import type { OfficerRank, OfficerPlayerData } from '@/types/arcTypes';

interface OfficerRankBadgeProps {
  /** Current officer rank */
  rank: OfficerRank;
  /** Player's officer track data */
  playerData?: OfficerPlayerData;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
}

// Rank configuration with military theming
const RANK_CONFIG: Record<OfficerRank, {
  displayName: string;
  insignia: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  experienceRequired: number;
  description: string;
}> = {
  'LIEUTENANT': {
    displayName: '2nd Lieutenant',
    insignia: '⭐',
    color: 'text-amber-300',
    backgroundColor: 'bg-amber-900/30',
    borderColor: 'border-amber-600',
    experienceRequired: 0,
    description: 'Entry level officer - basic mission access'
  },
  'CAPTAIN': {
    displayName: 'Captain',
    insignia: '⭐⭐',
    color: 'text-amber-200',
    backgroundColor: 'bg-amber-800/40',
    borderColor: 'border-amber-500',
    experienceRequired: 1000,
    description: 'Experienced officer - intermediate missions unlocked'
  },
  'MAJOR': {
    displayName: 'Major',
    insignia: '⭐⭐⭐',
    color: 'text-amber-100',
    backgroundColor: 'bg-amber-700/50',
    borderColor: 'border-amber-400',
    experienceRequired: 2500,
    description: 'Senior officer - advanced tactical missions'
  },
  'COLONEL': {
    displayName: 'Colonel',
    insignia: '⭐⭐⭐⭐',
    color: 'text-yellow-200',
    backgroundColor: 'bg-yellow-800/50',
    borderColor: 'border-yellow-400',
    experienceRequired: 5000,
    description: 'Command level - expert mission access'
  },
  'GENERAL': {
    displayName: 'General',
    insignia: '⭐⭐⭐⭐⭐',
    color: 'text-yellow-100',
    backgroundColor: 'bg-gradient-to-br from-yellow-800/60 to-amber-800/60',
    borderColor: 'border-yellow-300',
    experienceRequired: 10000,
    description: 'Highest rank - all missions and special operations'
  }
};

// Get next rank in progression
function getNextRank(currentRank: OfficerRank): OfficerRank | null {
  const ranks: OfficerRank[] = ['LIEUTENANT', 'CAPTAIN', 'MAJOR', 'COLONEL', 'GENERAL'];
  const currentIndex = ranks.indexOf(currentRank);
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
}

export function OfficerRankBadge({
  rank,
  playerData,
  showDetails = false,
  size = 'medium',
  className = ''
}: OfficerRankBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const config = RANK_CONFIG[rank];
  const nextRank = getNextRank(rank);
  const nextConfig = nextRank ? RANK_CONFIG[nextRank] : null;

  // Calculate progress to next rank
  const currentExperience = playerData?.totalExperience || 0;
  const experienceForCurrentRank = config.experienceRequired;
  const experienceForNextRank = nextConfig?.experienceRequired || currentExperience;
  
  const experienceInCurrentRank = currentExperience - experienceForCurrentRank;
  const experienceNeededForNextRank = experienceForNextRank - experienceForCurrentRank;
  const progressPercent = nextConfig 
    ? Math.min(100, (experienceInCurrentRank / experienceNeededForNextRank) * 100)
    : 100;

  // Size variants
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Badge */}
      <div
        className={`
          ${sizeClasses[size]} ${config.color} ${config.backgroundColor} ${config.borderColor}
          border-2 rounded-lg font-bold flex items-center gap-2
          transition-all duration-200 cursor-pointer
          hover:scale-105 hover:shadow-lg
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Insignia */}
        <span className="select-none">
          {config.insignia}
        </span>
        
        {/* Rank Name */}
        <span className="font-semibold">
          {config.displayName}
        </span>

        {/* Info Icon */}
        {showDetails && (
          <Info className={`${iconSizes[size]} opacity-70`} />
        )}
      </div>

      {/* Progress Bar (if not max rank) */}
      {nextConfig && showDetails && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-amber-300 mb-1">
            <span>Progress to {nextConfig.displayName}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 border border-amber-800">
            <div
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {experienceNeededForNextRank - experienceInCurrentRank} XP to promotion
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      {showDetails && playerData && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/50 rounded p-2 border border-amber-800">
            <div className="text-amber-300 font-semibold mb-1">
              <Award className="w-3 h-3 inline mr-1" />
              Total XP
            </div>
            <div className="text-white font-mono">
              {playerData.totalExperience.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded p-2 border border-amber-800">
            <div className="text-amber-300 font-semibold mb-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Missions
            </div>
            <div className="text-white font-mono">
              {playerData.completedPuzzles} / {playerData.totalAttempts}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-slate-900 border border-amber-400 rounded-lg p-3 text-xs whitespace-nowrap shadow-lg">
            <div className="text-amber-300 font-semibold mb-1">
              {config.displayName}
            </div>
            <div className="text-slate-300 mb-2">
              {config.description}
            </div>
            
            {playerData && (
              <div className="space-y-1 text-slate-400">
                <div>Experience: {currentExperience.toLocaleString()} XP</div>
                <div>Missions: {playerData.completedPuzzles} completed</div>
                {nextConfig && (
                  <div className="pt-1 border-t border-slate-700">
                    <div className="text-amber-400">Next: {nextConfig.displayName}</div>
                    <div>Requires: {nextConfig.experienceRequired.toLocaleString()} XP</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for displaying in lists or small spaces
 */
export function OfficerRankIcon({
  rank,
  size = 'small',
  className = ''
}: {
  rank: OfficerRank;
  size?: 'small' | 'medium';
  className?: string;
}) {
  const config = RANK_CONFIG[rank];
  
  return (
    <div
      className={`
        ${config.color} ${config.backgroundColor} ${config.borderColor}
        border rounded px-2 py-1 text-xs font-bold
        flex items-center gap-1 ${className}
      `}
      title={`${config.displayName} - ${config.description}`}
    >
      <span className={size === 'small' ? 'text-xs' : 'text-sm'}>
        {config.insignia}
      </span>
    </div>
  );
}