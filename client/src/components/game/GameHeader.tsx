import { RankBadge } from "./RankBadge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { playFabAuth } from "@/services/playfab/auth";
import { Skeleton } from "@/components/ui/skeleton";

export interface GameHeaderProps {
  /** Optional custom content to render in the header */
  children?: React.ReactNode;
  /** Show back button with custom click handler */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Additional class names */
  className?: string;
}

export function GameHeader({ 
  children,
  showBackButton = false,
  onBack,
  className = ''
}: GameHeaderProps) {
  const [, setLocation] = useLocation();
  const authState = playFabAuth.getAuthState();
  const isLoading = !authState.playFabId;

  return (
    <header className={`bg-slate-800 border-b border-cyan-400 shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-4">
            {showBackButton && onBack && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-slate-300 hover:bg-slate-700"
              >
                &larr; Back
              </Button>
            )}
            <div>
              <h1 className="text-xl font-bold text-cyan-400">Mission Control 2050</h1>
              <p className="text-xs text-amber-400 font-mono">OPERATIONS CENTER</p>
            </div>
          </div>
          
          {/* Right side - Game stats and navigation */}
          <div className="flex items-center space-x-4">
            {children || (
              <>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : authState.playFabId ? (
                  <RankBadge player={{
                    id: authState.playFabId,
                    username: authState.displayName || 'Player',
                    rank: 'Cadet',
                    rankLevel: 1,
                    totalPoints: 0,
                    completedMissions: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }} />
                ) : null}
                
                <Button
                  onClick={() => setLocation('/profile')}
                  variant="outline"
                  size="sm"
                  className="border-amber-400 text-amber-400 hover:bg-amber-900/20"
                >
                  👤 Profile
                </Button>
                
                <Button
                  onClick={() => setLocation('/leaderboard')}
                  variant="outline"
                  size="sm"
                  className="border-blue-400 text-blue-400 hover:bg-blue-900/20"
                >
                  🏆 Leaderboard
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
