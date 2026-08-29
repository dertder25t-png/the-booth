import React, { useState } from 'react';
import GridLayout, { Layout, LayoutItem, noCompactor } from 'react-grid-layout';
import useMeasure from 'react-use-measure';
import { Game, Slot } from '../types';
import { GridSlot } from './GridSlot';
import {
  Menu,
  Activity,
  Flame,
  Maximize2,
  Minimize2,
  Plus,
  Grid2X2,
  Grid3X3,
  Columns2,
  PanelsTopLeft,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const COLS = 24;
const ROWS = 24;

export type PresetKey = 'classicQuad' | 'showcase' | 'commandCenter' | 'dualFocus' | 'gridironWall';

interface CanvasProps {
  slots: Slot[];
  layouts: LayoutItem[];
  redZoneMode: boolean;
  redZoneAnnouncement?: string | null;
  activePreset?: PresetKey | null;
  isZenMode: boolean;
  showTicker: boolean;
  liveCount: number;
  onToggleRedZone: () => void;
  onTriggerRedZoneTest?: () => void;
  onApplyPreset: (preset: PresetKey) => void;
  onAddSlot: () => void;
  onRemoveSlot: (id: string) => void;
  onLayoutChange: (layout: Layout) => void;
  onAssignGame: (slotId: string, game: Game, currentLayout: LayoutItem) => void;
  onVolumeChange: (slotId: string, volume: number, muted: boolean) => void;
  onAutoSolo: (slotId: string) => void;
  onSwapWithPrimary?: (slotId: string) => void;
  onToggleZenMode: () => void;
  onToggleTicker: () => void;
  onOpenSidebar: () => void;
  onGameDay: () => void;
  onTestMode: () => void;
}

export function Canvas({
  slots,
  layouts,
  redZoneMode,
  redZoneAnnouncement,
  activePreset,
  isZenMode,
  showTicker,
  liveCount,
  onToggleRedZone,
  onTriggerRedZoneTest,
  onApplyPreset,
  onAddSlot,
  onRemoveSlot,
  onLayoutChange,
  onAssignGame,
  onVolumeChange,
  onAutoSolo,
  onSwapWithPrimary,
  onToggleZenMode,
  onToggleTicker,
  onOpenSidebar,
  onGameDay,
  onTestMode,
}: CanvasProps) {
  const [containerRef, bounds] = useMeasure();
  const [showZenHint, setShowZenHint] = useState(false);

  // Calculate max width/height to fit a 16:9 box inside bounds
  let tvWidth = bounds.width;
  let tvHeight = bounds.width * (9 / 16);

  if (tvHeight > bounds.height && bounds.height > 0) {
    tvHeight = bounds.height;
    tvWidth = bounds.height * (16 / 9);
  }

  const rowHeight = tvHeight > 0 ? tvHeight / ROWS : 30;

  // Find the primary (largest area) slot
  let primarySlotId: string | null = null;
  if (layouts.length > 0) {
    let maxArea = -1;
    layouts.forEach((l) => {
      const area = l.w * l.h;
      if (area > maxArea) {
        maxArea = area;
        primarySlotId = l.i;
      }
    });
  }

  const presets: Array<{
    id: PresetKey;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: 'classicQuad', label: 'Classic Quad (2x2)', icon: Grid2X2 },
    { id: 'showcase', label: 'The Showcase (1 Big + 3 Side)', icon: PanelsTopLeft },
    { id: 'commandCenter', label: 'Command Center (1 Big + 6 Surround)', icon: LayoutDashboard },
    { id: 'dualFocus', label: 'Dual Focus (2 Columns)', icon: Columns2 },
    { id: 'gridironWall', label: 'Gridiron Wall (3x3 Matrix)', icon: Grid3X3 },
  ];

  return (
    <div
      className={cn(
        'flex-1 flex flex-col overflow-hidden relative select-none transition-colors duration-300',
        isZenMode
          ? 'bg-black w-full'
          : 'bg-[radial-gradient(circle_at_center,_#18181b_0%,_#09090b_100%)]'
      )}
    >
      {/* Top Navigation Bar with Iconified Controls (Hidden in Zen Mode) */}
      {!isZenMode && (
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[#27272A] bg-[#0A0A0B]/95 backdrop-blur-md shrink-0 z-30">
          {/* Left Cluster: Schedule Drawer & Layout Presets */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Schedule Drawer Button (Iconified) */}
            <button
              onClick={onOpenSidebar}
              className="relative p-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] hover:border-blue-500/60 shadow-md transition-all group active:scale-95 flex items-center justify-center"
              title="Open Schedule & Live Scoreboard"
            >
              <Menu size={17} className="text-[#A1A1AA] group-hover:text-blue-400 transition-colors" />
              {liveCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#0A0A0B] animate-pulse" />
              )}
            </button>

            {/* Presets Cluster (Clean Layout Grid Icons) */}
            <div className="flex items-center bg-[#111112] border border-[#27272A] p-1 rounded-lg gap-1">
              {presets.map((preset) => {
                const IconComponent = preset.icon;
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onApplyPreset(preset.id)}
                    className={cn(
                      'p-1.5 rounded-md transition-all flex items-center justify-center',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400/50'
                        : 'text-[#71717A] hover:text-white hover:bg-[#1C1C1E]'
                    )}
                    title={preset.label}
                  >
                    <IconComponent size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Cluster: Feature Toggles & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onGameDay}
              className="px-2.5 py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 border border-amber-300 font-bold text-xs transition-colors active:scale-95"
              title="Load College GameDay"
            >
              🏈 GameDay
            </button>
            <button
              onClick={onTestMode}
              className="px-2.5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-400 font-bold text-xs transition-colors active:scale-95"
              title="Launch four test streams"
            >
              🧪 Test Mode
            </button>
            {/* ESPN BottomLine Ticker Toggle (Iconified) */}
            <button
              onClick={onToggleTicker}
              className={cn(
                'p-2 rounded-lg border transition-all flex items-center justify-center',
                showTicker
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm shadow-blue-500/20'
                  : 'bg-[#111112] text-[#71717A] border-[#27272A] hover:text-white hover:bg-[#18181B]'
              )}
              title={showTicker ? 'Ticker: Active (Click to Hide)' : 'Ticker: Hidden (Click to Show)'}
            >
              <Activity size={16} className={showTicker ? 'animate-pulse' : ''} />
            </button>

            {/* RedZone Mode Toggle (Iconified) */}
            <div className="flex items-center bg-[#111112] border border-[#27272A] rounded-lg p-0.5">
              <button
                onClick={onToggleRedZone}
                className={cn(
                  'p-1.5 rounded-md transition-all flex items-center justify-center',
                  redZoneMode
                    ? 'text-red-400 bg-red-950/60 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                    : 'text-[#71717A] hover:text-white hover:bg-[#18181B]'
                )}
                title={redZoneMode ? 'RedZone Mode: Active' : 'RedZone Mode: Inactive'}
              >
                <Flame size={16} className={redZoneMode ? 'animate-pulse' : ''} />
              </button>
              {redZoneMode && onTriggerRedZoneTest && (
                <button
                  onClick={onTriggerRedZoneTest}
                  className="text-[9px] bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 px-1.5 py-0.5 rounded font-mono uppercase mr-1 transition-colors"
                  title="Simulate RedZone switch commentary"
                >
                  Test
                </button>
              )}
            </div>

            {/* Zen Mode Button with subtle [F] badge */}
            <button
              onClick={onToggleZenMode}
              className="bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] hover:border-blue-500/60 p-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              title="Zen Mode: Hide all UI chrome (Hotkey: F)"
            >
              <Maximize2 size={15} />
              <span className="text-[9px] font-mono text-[#71717A] bg-[#27272A] px-1 py-0.2 rounded">
                F
              </span>
            </button>

            {/* Add Slot Button (Iconified) */}
            <button
              onClick={onAddSlot}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg shadow-md shadow-blue-900/25 flex items-center justify-center transition-colors active:scale-95"
              title="Add Screen Slot"
            >
              <Plus size={16} />
            </button>
          </div>
        </header>
      )}

      {/* RedZone Active Banner Toast */}
      {redZoneAnnouncement && !isZenMode && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 border border-red-500/80 backdrop-blur-md px-5 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-red-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <Flame className="w-4 h-4 text-red-400 animate-bounce" />
          <div className="text-xs font-mono font-medium tracking-wide">{redZoneAnnouncement}</div>
        </div>
      )}

      {/* Zen Mode Floating Exit Tooltip & Button */}
      {isZenMode && (
        <div
          onMouseEnter={() => setShowZenHint(true)}
          onMouseLeave={() => setShowZenHint(false)}
          className="fixed top-0 left-0 right-0 h-12 z-50 flex items-start justify-center pt-2 group"
        >
          <div
            className={cn(
              'bg-[#09090B]/90 border border-[#27272A] backdrop-blur-md px-3.5 py-1 rounded-full flex items-center gap-2.5 shadow-2xl transition-all duration-300 cursor-pointer text-xs font-mono',
              showZenHint
                ? 'opacity-100 translate-y-0'
                : 'opacity-20 hover:opacity-100 -translate-y-1 hover:translate-y-0'
            )}
            onClick={onToggleZenMode}
            title="Exit Zen Mode (Esc or F)"
          >
            <span className="text-[#A1A1AA] flex items-center gap-1.5 text-[11px]">
              <Minimize2 size={12} className="text-blue-400" />
              <span>Zen Mode • Press</span>
              <kbd className="px-1 py-0.2 bg-[#18181B] text-white rounded border border-[#3F3F46] font-bold">
                ESC
              </kbd>
              <span>or</span>
              <kbd className="px-1 py-0.2 bg-[#18181B] text-white rounded border border-[#3F3F46] font-bold">
                F
              </kbd>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleZenMode();
              }}
              className="p-0.5 rounded-full hover:bg-[#27272A] text-[#71717A] hover:text-white transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Workspace */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center relative overflow-hidden transition-all',
          isZenMode ? 'p-0 bg-black' : 'p-3 sm:p-5'
        )}
      >
        <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
          {bounds.width > 0 && (
            <div
              style={{ width: tvWidth, height: tvHeight }}
              className={cn(
                'bg-black relative overflow-hidden transition-all',
                isZenMode
                  ? 'border-0 rounded-none shadow-none'
                  : 'border border-[#27272A] rounded-lg shadow-2xl shadow-black/90'
              )}
            >
              {/* Grid Background lines (only in normal mode) */}
              {!isZenMode && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#27272a 1px, transparent 1px)`,
                    backgroundSize: `${tvWidth / COLS}px ${rowHeight}px`,
                  }}
                />
              )}

              <GridLayout
                className="layout w-full h-full absolute inset-0"
                layout={layouts}
                width={tvWidth}
                gridConfig={{
                  cols: COLS,
                  rowHeight: rowHeight,
                  margin: [0, 0],
                  maxRows: ROWS,
                }}
                dragConfig={{
                  handle: '.drag-handle',
                }}
                compactor={{ ...noCompactor, preventCollision: true }}
                onLayoutChange={onLayoutChange}
              >
                {slots.map((slot) => (
                  <div key={slot.id}>
                    <GridSlot
                      id={slot.id}
                      game={slot.game}
                      volume={slot.volume}
                      muted={slot.muted}
                      isPrimary={slot.id === primarySlotId}
                      isZenMode={isZenMode}
                      onRemove={() => onRemoveSlot(slot.id)}
                      onVolumeChange={(vol, mute) => onVolumeChange(slot.id, vol, mute)}
                      onAutoSolo={() => onAutoSolo(slot.id)}
                      onSwapWithPrimary={
                        slot.id !== primarySlotId && onSwapWithPrimary
                          ? () => onSwapWithPrimary(slot.id)
                          : undefined
                      }
                      onAssignGame={(game) => {
                        const currentLayout = layouts.find((l) => l.i === slot.id);
                        if (currentLayout) {
                          onAssignGame(slot.id, game, currentLayout);
                        }
                      }}
                    />
                  </div>
                ))}
              </GridLayout>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
