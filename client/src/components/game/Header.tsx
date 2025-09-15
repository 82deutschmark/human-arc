/**
 * Header Component  THIS SHOULD BE DEPRECATED!!!
 * --------------------------------------------------------
 * Author: Cascade AI
 * Description:
 *   Displays the main game header with player rank, branding, and mission completion stats.
 *   Updated to accept a dynamic `totalTasks` prop so the completed missions count reflects
 *   real data rather than a hard-coded value.
 */
import { RankBadge } from "./RankBadge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { PlayFabPlayer } from "@/services/playfab";

interface HeaderProps {
  player: PlayFabPlayer;
  /** Total number of tasks available in the game */
  totalTasks: number;
}

export function Header({ player, totalTasks }: HeaderProps) {
  const [, setLocation] = useLocation();
  return (
    <header className="bg-slate-800 border-b border-cyan-400 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="text-cyan-400 text-2xl">🚀</div>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">Mission Control 2050</h1>
              <p className="text-xs text-amber-400 font-mono">OPERATIONS CENTER</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <RankBadge player={player} />
            
            <div className="bg-slate-900 border border-amber-400 rounded px-3 py-1">
              <div className="text-xs">
                <div className="text-amber-400 font-semibold">Completed Tasks</div>
                <div className="text-slate-400 font-mono">{player.completedMissions}/{totalTasks}</div>
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <Button
              onClick={() => setLocation('/profile')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 border border-green-400"
              size="sm"
            >
              👤 Profile
            </Button>
            
            <Button
              onClick={() => setLocation('/leaderboards')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 border border-blue-400"
              size="sm"
            >
              🏆 Rankings
            </Button>
            
            <Button
              onClick={() => setLocation('/officer-track')}
              className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-semibold px-3 py-2 border border-amber-400"
              size="sm"
            >
              🎖️ Officer Academy
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
