import React from 'react';
import Marquee from 'react-fast-marquee';
import { Game } from '../types';
import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomLineTickerProps {
  games: Game[];
  className?: string;
  onSelectGame?: (gameId: string) => void;
}

export function BottomLineTicker({ games, className, onSelectGame }: BottomLineTickerProps) {
  if (!games || games.length === 0) return null;

  // Filter games for the ticker with rules:
  // 1. Always include games where status.type.state is 'in' (Live) or 'post' (Final).
  // 2. For games where status.type.state is 'pre' (Scheduled), keep those within a -4 to +48 hour window.
  // 3. Drop all other future games so the ticker only shows immediate, relevant action.
  const filtered = games.filter((game) => {
    const state = game.statusState || (game.isActive ? 'in' : game.isFinal ? 'post' : 'pre');

    // Rule 1: Always include Live and Final games
    if (state === 'in' || state === 'post' || game.isActive || game.isFinal) {
      return true;
    }

    // Rule 2: Scheduled games within a reasonable weekend window
    if (state === 'pre' || game.isScheduled) {
      if (!game.date) {
        return true;
      }
      const diffHours = (new Date(game.date).getTime() - Date.now()) / (1000 * 60 * 60);
      return diffHours >= -4 && diffHours <= 48;
    }

    // Rule 3: Drop all other future games
    return false;
  });

  // If filtered immediate games exist, display them.
  // Otherwise, fallback to all available games so the ticker is always active and visible.
  const tickerGames = filtered.length > 0 ? filtered : games;

  return (
    <div
      className={cn(
        'w-full h-10 bg-[#09090B] border-t border-[#27272A] text-white flex items-center z-30 select-none overflow-hidden shrink-0 shadow-lg',
        className
      )}
    >
      {/* Marquee Feed (Lead text removed as requested) */}
      <div className="flex-1 overflow-hidden h-full flex items-center">
        <Marquee
          speed={45}
          pauseOnHover={true}
          gradient={false}
          className="h-full flex items-center"
        >
          {tickerGames.map((game, index) => {
            return (
              <button
                type="button"
                key={`${game.id}-${index}`}
                onClick={() => onSelectGame?.(game.id)}
                className="inline-flex items-center gap-3 px-5 py-2 border-r border-[#27272A]/80 text-xs font-mono whitespace-nowrap cursor-pointer hover:bg-white/[0.08] active:bg-blue-600/20 transition-all group focus:outline-none focus:bg-white/10"
                title={`Click to view ${game.matchup} in schedule`}
              >
                {/* Status Indicator */}
                {game.isActive ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded-full border border-red-800/60 group-hover:border-red-500/80 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {game.timeRemaining || 'LIVE'}
                  </span>
                ) : game.isScheduled ? (
                  <span className="flex items-center gap-1 text-[10px] text-[#A1A1AA] bg-[#18181B] px-1.5 py-0.5 rounded-full border border-[#27272A] group-hover:border-blue-500/50 transition-colors">
                    <Clock size={10} className="text-blue-400" />
                    {game.startTime || 'UPCOMING'}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#71717A] bg-[#18181B] px-1.5 py-0.5 rounded-full group-hover:text-[#A1A1AA]">
                    FINAL
                  </span>
                )}

                {/* Away Team */}
                <div className="inline-flex items-center gap-1.5">
                  {game.awayLogo && (
                    <img
                      src={game.awayLogo}
                      alt={game.awayTeam}
                      className="w-4 h-4 object-contain inline-block"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {game.awayRank && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">
                      #{game.awayRank}
                    </span>
                  )}
                  <span className="font-bold text-[#F4F4F5] group-hover:text-blue-400 transition-colors">
                    {game.awayTeam}
                  </span>
                  {!game.isScheduled && (
                    <span className="font-bold text-white ml-0.5">{game.awayScore}</span>
                  )}
                </div>

                <span className="text-[#52525B] font-bold">•</span>

                {/* Home Team */}
                <div className="inline-flex items-center gap-1.5">
                  {game.homeLogo && (
                    <img
                      src={game.homeLogo}
                      alt={game.homeTeam}
                      className="w-4 h-4 object-contain inline-block"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {game.homeRank && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1 rounded">
                      #{game.homeRank}
                    </span>
                  )}
                  <span className="font-bold text-[#F4F4F5] group-hover:text-blue-400 transition-colors">
                    {game.homeTeam}
                  </span>
                  {!game.isScheduled && (
                    <span className="font-bold text-white ml-0.5">{game.homeScore}</span>
                  )}
                </div>

                {/* RedZone Badge */}
                {game.isRedZone && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                    REDZONE
                  </span>
                )}

                {/* Network */}
                <span className="text-[10px] text-[#71717A] uppercase bg-white/5 px-2 py-0.5 rounded-full group-hover:text-[#A1A1AA]">
                  {game.network || 'ESPN'}
                </span>
              </button>
            );
          })}
        </Marquee>
      </div>
    </div>
  );
}
