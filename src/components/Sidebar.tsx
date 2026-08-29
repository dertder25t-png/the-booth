import React, { useState } from 'react';
import { Game } from '../types';
import { GameCard } from './GameCard';
import { Search, Flame, Radio, X, CalendarDays, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  games: Game[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  highlightedGameId?: string | null;
}

export function Sidebar({
  games,
  loading,
  isOpen,
  onClose,
  highlightedGameId,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'ranked'>('all');

  // If a specific game was selected from ticker, reset filters if needed and auto-scroll to it
  React.useEffect(() => {
    if (highlightedGameId && isOpen) {
      setFilter('all');
      setSearch('');
      const timer = setTimeout(() => {
        const targetEl = document.getElementById(`game-card-${highlightedGameId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [highlightedGameId, isOpen]);

  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.matchup.toLowerCase().includes(search.toLowerCase()) ||
      (game.awayTeamName && game.awayTeamName.toLowerCase().includes(search.toLowerCase())) ||
      (game.homeTeamName && game.homeTeamName.toLowerCase().includes(search.toLowerCase())) ||
      game.network.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'live') return game.isActive;
    if (filter === 'ranked') return Boolean(game.awayRank || game.homeRank);
    return true;
  });

  const liveCount = games.filter((g) => g.isActive).length;

  return (
    <>
      {/* Backdrop with slight blur */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-[360px] max-w-[85vw] bg-[#0E0E10] border-r border-[#27272A] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Game Schedule Drawer"
      >
        {/* Header with Title and Close Button */}
        <div className="p-4 border-b border-[#27272A] shrink-0 bg-[#0A0A0B]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#E4E4E7]">
                Game Schedule
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#18181B] text-blue-400 border border-[#27272A]">
                {liveCount} LIVE
              </span>
            </div>

            <button
              onClick={onClose}
              className="flex items-center gap-1 p-1.5 rounded-md text-[#71717A] hover:text-white hover:bg-[#1C1C1E] border border-transparent hover:border-[#27272A] transition-colors"
              title="Close Drawer (Esc)"
            >
              <span className="text-[10px] font-mono text-[#52525B] mr-0.5">ESC</span>
              <X size={14} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2.5">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, rankings, networks..."
              className="w-full bg-[#161618] border border-[#27272A] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#E4E4E7] placeholder-[#52525B] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-0.5 rounded-full font-medium transition-colors',
                filter === 'all'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#18181B]'
              )}
            >
              All ({games.length})
            </button>
            <button
              onClick={() => setFilter('live')}
              className={cn(
                'px-2.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1',
                filter === 'live'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                  : 'text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#18181B]'
              )}
            >
              <Radio size={10} /> Live ({liveCount})
            </button>
            <button
              onClick={() => setFilter('ranked')}
              className={cn(
                'px-2.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1',
                filter === 'ranked'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                  : 'text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#18181B]'
              )}
            >
              <Flame size={10} /> Top 25
            </button>
          </div>
        </div>

        {/* Drag Instruction Banner */}
        <div className="px-4 py-2 bg-[#121214] border-b border-[#222225] flex items-center justify-between text-[10px] text-[#A1A1AA] font-mono">
          <span>DRAG CARDS ONTO CANVAS</span>
          <span className="text-blue-400">AUTO-CLOSES ON DROP</span>
        </div>

        {/* Games List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
          {loading ? (
            <div className="text-[#71717A] text-xs text-center py-12 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching live scoreboard...</span>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-[#71717A] text-xs text-center py-12">
              No games found matching criteria.
            </div>
          ) : (
            filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isHighlighted={game.id === highlightedGameId}
              />
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-[#0A0A0B] border-t border-[#27272A] shrink-0">
          <div className="flex items-center justify-between text-[10px] text-[#A1A1AA]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-mono uppercase tracking-wider">Playwright Gateway</span>
            </div>
            <span className="text-[#52525B] font-mono">1080p Grid Mode</span>
          </div>
        </div>
      </aside>
    </>
  );
}
