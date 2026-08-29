import React, { useState } from 'react';
import { Game } from '../types';
import { cn } from '../lib/utils';
import { X, Volume2, VolumeX, Radio, ArrowUpRight, Star, Clock, Tv } from 'lucide-react';

interface GridSlotProps {
  id: string;
  game?: Game;
  volume: number;
  muted: boolean;
  isPrimary?: boolean;
  isZenMode?: boolean;
  onAssignGame: (game: Game) => void;
  onRemove: () => void;
  onVolumeChange: (volume: number, muted: boolean) => void;
  onAutoSolo: () => void;
  onSwapWithPrimary?: () => void;
}

export function GridSlot({
  id,
  game,
  volume,
  muted,
  isPrimary,
  isZenMode = false,
  onAssignGame,
  onRemove,
  onVolumeChange,
  onAutoSolo,
  onSwapWithPrimary,
}: GridSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [awayImgError, setAwayImgError] = useState(false);
  const [homeImgError, setHomeImgError] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const droppedGame: Game = JSON.parse(data);
        onAssignGame(droppedGame);
      }
    } catch (err) {
      console.error('Failed to parse dropped game', err);
    }
  };

  const handleCardClick = () => {
    if (game && !isZenMode) {
      onAutoSolo();
    }
  };

  // In Zen Mode: render pure seamless broadcast tile without controls or status placeholders
  if (isZenMode) {
    return (
      <div
        className="w-full h-full bg-black relative flex flex-col overflow-hidden select-none"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {game ? (
          <div className="w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#111114] via-[#09090B] to-[#040405] p-2.5 sm:p-3.5 relative overflow-hidden border border-[#1C1C1F]/40">
            {/* Corner Badges */}
            <div className="flex items-center justify-between w-full z-10">
              <div className="flex items-center gap-1.5">
                {game.isActive ? (
                  <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {game.timeRemaining}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-[#A1A1AA] bg-[#18181B]/80 px-1.5 py-0.5 rounded-full border border-[#27272A]">
                    {game.statusText || game.timeRemaining}
                  </span>
                )}
                {game.isRedZone && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold uppercase animate-pulse">
                    REDZONE
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono text-[#71717A] uppercase bg-white/5 px-2 py-0.5 rounded-full">
                {game.network || 'ESPN'}
              </span>
            </div>

            {/* Video Stream Presentation */}
            <div className="flex-1 flex flex-col items-center justify-center my-auto">
              <div className="w-full max-w-sm grid grid-cols-5 items-center justify-items-center gap-2">
                {/* Away */}
                <div className="col-span-2 flex flex-col items-center text-center">
                  {game.awayLogo && !awayImgError ? (
                    <img
                      src={game.awayLogo}
                      alt={game.awayTeam}
                      onError={() => setAwayImgError(true)}
                      className={cn(
                        'object-contain mb-1 drop-shadow-lg',
                        isPrimary ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-8 h-8 sm:w-10 sm:h-10'
                      )}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#1C1C1E] border border-[#3F3F46] font-bold text-white flex items-center justify-center mb-1 text-xs">
                      {game.awayTeam.slice(0, 3)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {game.awayRank && (
                      <span className="text-[9px] font-mono font-bold text-amber-400">
                        #{game.awayRank}
                      </span>
                    )}
                    <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                      {game.awayTeam}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  {game.isScheduled ? (
                    <span className="text-xs font-mono font-semibold text-[#71717A]">VS</span>
                  ) : (
                    <div className="flex items-center gap-1 font-mono font-black text-white">
                      <span className={isPrimary ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}>
                        {game.awayScore}
                      </span>
                      <span className="text-[#52525B]">-</span>
                      <span className={isPrimary ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}>
                        {game.homeScore}
                      </span>
                    </div>
                  )}
                </div>

                {/* Home */}
                <div className="col-span-2 flex flex-col items-center text-center">
                  {game.homeLogo && !homeImgError ? (
                    <img
                      src={game.homeLogo}
                      alt={game.homeTeam}
                      onError={() => setHomeImgError(true)}
                      className={cn(
                        'object-contain mb-1 drop-shadow-lg',
                        isPrimary ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-8 h-8 sm:w-10 sm:h-10'
                      )}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#1C1C1E] border border-[#3F3F46] font-bold text-white flex items-center justify-center mb-1 text-xs">
                      {game.homeTeam.slice(0, 3)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {game.homeRank && (
                      <span className="text-[9px] font-mono font-bold text-amber-400">
                        #{game.homeRank}
                      </span>
                    )}
                    <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                      {game.homeTeam}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center border border-[#18181B]" />
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'w-full h-full flex flex-col overflow-hidden transition-all duration-200 group relative select-none rounded-lg',
        isDragOver
          ? 'border-2 border-blue-500 bg-blue-500/10'
          : game
          ? isPrimary
            ? 'bg-[#09090B] border-2 border-blue-500 shadow-xl shadow-blue-500/20 ring-1 ring-blue-500/50'
            : 'bg-[#0E0E10] border border-[#27272A] hover:border-blue-500/60'
          : 'bg-[#111112]/90 border border-dashed border-[#3F3F46] hover:border-[#71717A]'
      )}
    >
      {/* Top Right Action Controls Cluster (Promote & Close) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-30">
        {/* Promote / Make Primary Button */}
        {!isPrimary && onSwapWithPrimary && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onSwapWithPrimary();
            }}
            className="p-1.5 rounded-md bg-[#18181B]/90 border border-[#3F3F46] text-[#A1A1AA] hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-md backdrop-blur-sm group/btn"
            title="Make Primary Display (Promote)"
          >
            <ArrowUpRight size={13} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        )}

        {/* Close / Remove Slot Button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 rounded-md bg-[#18181B]/90 border border-[#3F3F46] text-[#71717A] hover:text-white hover:bg-red-600 hover:border-red-500 transition-all shadow-md backdrop-blur-sm"
          title="Remove Screen Slot"
        >
          <X size={13} />
        </button>
      </div>

      {game ? (
        <div
          onClick={handleCardClick}
          className="flex-1 flex flex-col relative drag-handle cursor-pointer justify-between"
        >
          {/* Status Badges Header */}
          <div className="p-3 pb-0 flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isPrimary && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm flex items-center gap-1">
                  <Star size={9} className="fill-white" /> Primary
                </span>
              )}

              {game.isActive ? (
                <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-950/90 text-red-400 border border-red-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  {game.timeRemaining}
                </span>
              ) : game.isScheduled ? (
                <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46]">
                  <Clock size={10} className="text-blue-400" />
                  {game.startTime || game.timeRemaining}
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#27272A] text-[#71717A]">
                  FINAL
                </span>
              )}

              {game.isRedZone && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold uppercase flex items-center gap-1 animate-pulse">
                  <Radio size={9} /> RedZone
                </span>
              )}
            </div>
          </div>

          {/* Central Live Score & Team Visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 my-auto">
            {/* Matchup Teams Row */}
            <div className="w-full max-w-md mx-auto grid grid-cols-5 items-center justify-items-center gap-2 mb-2">
              {/* Away Team */}
              <div className="col-span-2 flex flex-col items-center text-center">
                {game.awayLogo && !awayImgError ? (
                  <img
                    src={game.awayLogo}
                    alt={game.awayTeam}
                    onError={() => setAwayImgError(true)}
                    className={cn(
                      'object-contain mb-1.5 drop-shadow-md',
                      isPrimary ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-8 h-8 sm:w-10 sm:h-10'
                    )}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={cn(
                      'rounded-full bg-[#1C1C1E] border border-[#3F3F46] font-bold text-white flex items-center justify-center mb-1.5',
                      isPrimary ? 'w-12 h-12 sm:w-16 sm:h-16 text-lg' : 'w-8 h-8 sm:w-10 sm:h-10 text-xs'
                    )}
                  >
                    {game.awayTeam.slice(0, 3)}
                  </div>
                )}
                <div className="flex items-center gap-1 justify-center max-w-full">
                  {game.awayRank && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/20">
                      #{game.awayRank}
                    </span>
                  )}
                  <span
                    className={cn(
                      'font-bold text-white tracking-tight truncate',
                      isPrimary ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                    )}
                  >
                    {game.awayTeam}
                  </span>
                </div>
              </div>

              {/* Center VS / Score */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                {game.isScheduled ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono font-semibold text-[#71717A] uppercase">VS</span>
                    <span className="text-[10px] font-mono text-blue-400 mt-1 whitespace-nowrap">
                      {game.startTime || 'Pre-game'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2 font-mono">
                    <span
                      className={cn(
                        'font-bold text-white',
                        isPrimary ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-2xl'
                      )}
                    >
                      {game.awayScore}
                    </span>
                    <span className="text-[#52525B] font-bold">-</span>
                    <span
                      className={cn(
                        'font-bold text-white',
                        isPrimary ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-2xl'
                      )}
                    >
                      {game.homeScore}
                    </span>
                  </div>
                )}
              </div>

              {/* Home Team */}
              <div className="col-span-2 flex flex-col items-center text-center">
                {game.homeLogo && !homeImgError ? (
                  <img
                    src={game.homeLogo}
                    alt={game.homeTeam}
                    onError={() => setHomeImgError(true)}
                    className={cn(
                      'object-contain mb-1.5 drop-shadow-md',
                      isPrimary ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-8 h-8 sm:w-10 sm:h-10'
                    )}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={cn(
                      'rounded-full bg-[#1C1C1E] border border-[#3F3F46] font-bold text-white flex items-center justify-center mb-1.5',
                      isPrimary ? 'w-12 h-12 sm:w-16 sm:h-16 text-lg' : 'w-8 h-8 sm:w-10 sm:h-10 text-xs'
                    )}
                  >
                    {game.homeTeam.slice(0, 3)}
                  </div>
                )}
                <div className="flex items-center gap-1 justify-center max-w-full">
                  {game.homeRank && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/20">
                      #{game.homeRank}
                    </span>
                  )}
                  <span
                    className={cn(
                      'font-bold text-white tracking-tight truncate',
                      isPrimary ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                    )}
                  >
                    {game.homeTeam}
                  </span>
                </div>
              </div>
            </div>

            {/* Network Badge (Minimal borderless pill) */}
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider">
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[#A1A1AA] uppercase">
                {game.network || 'ESPN'}
              </span>
              {game.isActive && game.period && (
                <span className="text-[#71717A]">Q{game.period}</span>
              )}
            </div>
          </div>

          {/* Bottom Glassmorphic Audio Controls Bar with Ultra-thin Slider */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-9 bg-[#0A0A0B]/95 border-t border-[#27272A] px-3 flex items-center justify-between text-xs text-neutral-300 z-20 backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onVolumeChange(volume, !muted)}
                className={cn(
                  'p-1 rounded-md transition-all',
                  muted
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                )}
                title={muted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <span className="font-mono text-[9px] text-[#71717A] w-6">
                {muted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-[130px] mx-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onVolumeChange(val, val === 0);
                }}
                className="w-full h-1 bg-[#27272A] rounded-full appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                title="Adjust Slot Volume"
              />
            </div>

            <button
              type="button"
              onClick={onAutoSolo}
              className={cn(
                'text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider transition-all',
                !muted && volume === 1.0
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30'
                  : 'text-[#71717A] hover:text-white bg-[#18181B] hover:bg-[#27272A]'
              )}
              title="Auto-Solo: Focus audio on this slot"
            >
              Solo
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[#52525B] drag-handle cursor-move p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center mb-2 text-[#71717A]">
            <Tv size={18} />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#71717A] pointer-events-none mb-0.5">
            Drop Game Card Here
          </span>
          <span className="text-[9px] font-mono text-[#52525B] pointer-events-none">
            Drag from Live Scoreboard
          </span>
        </div>
      )}
    </div>
  );
}

