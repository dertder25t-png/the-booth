import React, { useState } from 'react';
import { Game } from '../types';
import { cn } from '../lib/utils';
import { Radio, Clock } from 'lucide-react';

interface GameCardProps {
  key?: string | number;
  game: Game;
  className?: string;
  isHighlighted?: boolean;
}

export function GameCard({ game, className, isHighlighted = false }: GameCardProps) {
  const [awayImgError, setAwayImgError] = useState(false);
  const [homeImgError, setHomeImgError] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(game));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      id={`game-card-${game.id}`}
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'group p-3 bg-[#1C1C1E] border rounded-lg cursor-grab active:cursor-grabbing transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-blue-500/5',
        isHighlighted
          ? 'border-blue-400 bg-blue-950/40 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0E0E10] shadow-lg shadow-blue-500/25 scale-[1.01]'
          : 'border-[#3F3F46] hover:border-blue-500/80',
        !game.isActive && !game.isScheduled && !isHighlighted && 'opacity-70',
        className
      )}
    >
      {/* Header Row: Status & Network */}
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {game.isActive ? (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              {game.timeRemaining}
            </span>
          ) : game.isScheduled ? (
            <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46]">
              <Clock size={10} className="text-blue-400" />
              {game.startTime || game.timeRemaining || 'Upcoming'}
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#27272A] text-[#71717A]">
              {game.timeRemaining || 'FINAL'}
            </span>
          )}

          {game.isRedZone && (
            <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-red-600/90 text-white animate-pulse">
              RZ
            </span>
          )}
        </div>

        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46]/60">
          {game.network || 'ESPN'}
        </span>
      </div>

      {/* Teams Row with Logos and Ranks */}
      <div className="space-y-1.5 mb-2.5">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {game.awayLogo && !awayImgError ? (
              <img
                src={game.awayLogo}
                alt={game.awayTeam}
                onError={() => setAwayImgError(true)}
                className="w-5 h-5 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#27272A] text-[9px] font-bold flex items-center justify-center text-white shrink-0 border border-[#3F3F46]">
                {game.awayTeam.slice(0, 2)}
              </div>
            )}
            <div className="flex items-center gap-1.5 truncate">
              {game.awayRank && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/20">
                  #{game.awayRank}
                </span>
              )}
              <span className="text-xs font-semibold text-white truncate">
                {game.awayTeamName || game.awayTeam}
              </span>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-white ml-2">
            {game.isScheduled ? '-' : game.awayScore}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {game.homeLogo && !homeImgError ? (
              <img
                src={game.homeLogo}
                alt={game.homeTeam}
                onError={() => setHomeImgError(true)}
                className="w-5 h-5 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#27272A] text-[9px] font-bold flex items-center justify-center text-white shrink-0 border border-[#3F3F46]">
                {game.homeTeam.slice(0, 2)}
              </div>
            )}
            <div className="flex items-center gap-1.5 truncate">
              {game.homeRank && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/20">
                  #{game.homeRank}
                </span>
              )}
              <span className="text-xs font-semibold text-white truncate">
                {game.homeTeamName || game.homeTeam}
              </span>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-white ml-2">
            {game.isScheduled ? '-' : game.homeScore}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[10px] text-[#71717A] pt-1.5 border-t border-[#27272A]">
        <span className="truncate font-mono">
          {game.isScheduled ? `Kickoff: ${game.startTime || game.timeRemaining}` : game.matchup}
        </span>
        <span className="px-1.5 py-0.5 bg-[#27272A] rounded text-[#A1A1AA] text-[9px] shrink-0 font-mono">
          DRAG ⇳
        </span>
      </div>
    </div>
  );
}

