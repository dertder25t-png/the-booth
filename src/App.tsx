/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas, PresetKey } from './components/Canvas';
import { BottomLineTicker } from './components/BottomLineTicker';
import { Game, Slot, ESPNResponse } from './types';
import { Layout, LayoutItem } from 'react-grid-layout';

const COLS = 24;
const ROWS = 24;

const scaleTo1080p = (x: number, y: number, w: number, h: number) => {
  return {
    x: Math.round((x / COLS) * 1920),
    y: Math.round((y / ROWS) * 1080),
    width: Math.round((w / COLS) * 1920),
    height: Math.round((h / ROWS) * 1080),
  };
};

const PRESETS: Record<PresetKey, Array<{ x: number; y: number; w: number; h: number }>> = {
  classicQuad: [
    { x: 0, y: 0, w: 12, h: 12 },
    { x: 12, y: 0, w: 12, h: 12 },
    { x: 0, y: 12, w: 12, h: 12 },
    { x: 12, y: 12, w: 12, h: 12 },
  ],
  showcase: [
    { x: 0, y: 0, w: 16, h: 24 },
    { x: 16, y: 0, w: 8, h: 8 },
    { x: 16, y: 8, w: 8, h: 8 },
    { x: 16, y: 16, w: 8, h: 8 },
  ],
  commandCenter: [
    { x: 0, y: 0, w: 16, h: 16 },
    { x: 16, y: 0, w: 8, h: 8 },
    { x: 16, y: 8, w: 8, h: 8 },
    { x: 16, y: 16, w: 8, h: 8 },
    { x: 0, y: 16, w: 8, h: 8 },
    { x: 8, y: 16, w: 8, h: 8 },
  ],
  dualFocus: [
    { x: 0, y: 0, w: 12, h: 24 },
    { x: 12, y: 0, w: 12, h: 24 },
  ],
  gridironWall: [
    { x: 0, y: 0, w: 8, h: 8 },
    { x: 8, y: 0, w: 8, h: 8 },
    { x: 16, y: 0, w: 8, h: 8 },
    { x: 0, y: 8, w: 8, h: 8 },
    { x: 8, y: 8, w: 8, h: 8 },
    { x: 16, y: 8, w: 8, h: 8 },
    { x: 0, y: 16, w: 8, h: 8 },
    { x: 8, y: 16, w: 8, h: 8 },
    { x: 16, y: 16, w: 8, h: 8 },
  ],
};

// Fallback high-profile games if live ESPN endpoint has 0 active events
const FALLBACK_GAMES: Game[] = [
  {
    id: 'cfb-101',
    matchup: 'UGA vs ALA',
    awayTeam: 'UGA',
    homeTeam: 'ALA',
    awayTeamName: 'Georgia Bulldogs',
    homeTeamName: 'Alabama Crimson Tide',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png',
    awayRank: 1,
    homeRank: 4,
    awayScore: '24',
    homeScore: '27',
    timeRemaining: 'Q4 02:15',
    statusText: 'Q4 02:15',
    network: 'ABC',
    isActive: true,
    isScheduled: false,
    isFinal: false,
    date: new Date().toISOString(),
    statusState: 'in',
    period: 4,
    displayClock: '02:15',
    isRedZone: true,
  },
  {
    id: 'cfb-102',
    matchup: 'OSU vs MICH',
    awayTeam: 'OSU',
    homeTeam: 'MICH',
    awayTeamName: 'Ohio State Buckeyes',
    homeTeamName: 'Michigan Wolverines',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png',
    awayRank: 2,
    homeRank: 3,
    awayScore: '21',
    homeScore: '17',
    timeRemaining: 'Q3 06:40',
    statusText: 'Q3 06:40',
    network: 'FOX',
    isActive: true,
    isScheduled: false,
    isFinal: false,
    date: new Date().toISOString(),
    statusState: 'in',
    period: 3,
    displayClock: '06:40',
    isRedZone: false,
  },
  {
    id: 'cfb-103',
    matchup: 'TEX vs OU',
    awayTeam: 'TEX',
    homeTeam: 'OU',
    awayTeamName: 'Texas Longhorns',
    homeTeamName: 'Oklahoma Sooners',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/201.png',
    awayRank: 5,
    homeRank: 16,
    awayScore: '31',
    homeScore: '30',
    timeRemaining: 'HALFTIME',
    statusText: 'HALFTIME',
    network: 'ESPN',
    isActive: true,
    isScheduled: false,
    isFinal: false,
    date: new Date().toISOString(),
    statusState: 'in',
    period: 2,
    displayClock: '00:00',
    statusTypeName: 'STATUS_HALFTIME',
    isRedZone: false,
  },
  {
    id: 'cfb-104',
    matchup: 'ORE vs WASH',
    awayTeam: 'ORE',
    homeTeam: 'WASH',
    awayTeamName: 'Oregon Ducks',
    homeTeamName: 'Washington Huskies',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/264.png',
    awayRank: 6,
    homeRank: 22,
    awayScore: '14',
    homeScore: '10',
    timeRemaining: 'Q2 11:20',
    statusText: 'Q2 11:20',
    network: 'CBS',
    isActive: true,
    isScheduled: false,
    isFinal: false,
    date: new Date().toISOString(),
    statusState: 'in',
    period: 2,
    displayClock: '11:20',
    isRedZone: true,
  },
  {
    id: 'cfb-105',
    matchup: 'FSU vs CLEM',
    awayTeam: 'FSU',
    homeTeam: 'CLEM',
    awayTeamName: 'Florida State Seminoles',
    homeTeamName: 'Clemson Tigers',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/52.png',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png',
    awayRank: 8,
    homeRank: 14,
    awayScore: '0',
    homeScore: '0',
    timeRemaining: '7:30 PM ET',
    statusText: '7:30 PM ET',
    network: 'ESPN',
    isActive: false,
    isScheduled: true,
    isFinal: false,
    date: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    statusState: 'pre',
    startTime: '7:30 PM ET',
    statusTypeName: 'STATUS_SCHEDULED',
  },
  {
    id: 'cfb-106',
    matchup: 'ND vs USC',
    awayTeam: 'ND',
    homeTeam: 'USC',
    awayTeamName: 'Notre Dame Fighting Irish',
    homeTeamName: 'USC Trojans',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png',
    awayRank: 9,
    homeRank: 18,
    awayScore: '0',
    homeScore: '0',
    timeRemaining: '8:00 PM ET',
    statusText: '8:00 PM ET',
    network: 'NBC',
    isActive: false,
    isScheduled: true,
    isFinal: false,
    date: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    statusState: 'pre',
    startTime: '8:00 PM ET',
    statusTypeName: 'STATUS_SCHEDULED',
  },
  {
    id: 'cfb-107',
    matchup: 'PSU vs WIS',
    awayTeam: 'PSU',
    homeTeam: 'WIS',
    awayTeamName: 'Penn State Nittany Lions',
    homeTeamName: 'Wisconsin Badgers',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/213.png',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/275.png',
    awayRank: 10,
    awayScore: '35',
    homeScore: '24',
    timeRemaining: 'FINAL',
    statusText: 'FINAL',
    network: 'FS1',
    isActive: false,
    isScheduled: false,
    isFinal: true,
    date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    statusState: 'post',
  },
];

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [layouts, setLayouts] = useState<LayoutItem[]>([]);
  const [activePreset, setActivePreset] = useState<PresetKey | null>('showcase');
  const [redZoneMode, setRedZoneMode] = useState(false);
  const [redZoneAnnouncement, setRedZoneAnnouncement] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showTicker, setShowTicker] = useState(true);
  const [highlightedGameId, setHighlightedGameId] = useState<string | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      socket = new WebSocket('ws://localhost:8000/ws/status');
      socket.onclose = () => {
        if (!disposed) retryTimer = window.setTimeout(connect, 3000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  // Keyboard Shortcuts: 'F' for Zen Mode, 'Escape' to close drawer or exit Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isInput) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const primaryDisplayClockLastChange = useRef<{ time: number; clock: string; gameId: string }>({
    time: Date.now(),
    clock: '',
    gameId: '',
  });
  const redZoneCooldown = useRef<number>(0);

  // Send volume request to backend
  const sendVolumeRequest = useCallback(async (matchup: string, volume: number, muted: boolean) => {
    try {
      await fetch('http://localhost:8000/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchup, volume, muted }),
      });
    } catch (err) {
      console.warn('Backend volume endpoint unreachable (normal in preview environment):', err);
    }
  }, []);

  const sendCloseRequest = useCallback(async (slotId: string, matchup?: string) => {
    try {
      await fetch('http://localhost:8000/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, matchup }),
      });
    } catch (err) {
      console.warn('Backend close endpoint unreachable (normal in preview environment):', err);
    }
  }, []);

  // Send launch coordinate request to backend
  const sendLaunchRequest = useCallback(async (game: Game, layout: LayoutItem) => {
    const coords = scaleTo1080p(layout.x, layout.y, layout.w, layout.h);
    const payload = {
      matchup: game.matchup,
      network: game.network,
      slot_id: layout.i,
      coordinates: coords,
      ...(game.streamUrl ? { url: game.streamUrl } : {}),
    };
    try {
      await fetch('http://localhost:8000/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Backend launch endpoint unreachable (normal in preview environment):', err);
    }
  }, []);

  // Fetch ESPN Live Scoreboard
  useEffect(() => {
    const isWithinScheduledWindow = (date?: string) => {
      if (!date) return false;
      const diffHours = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60);
      return diffHours >= -4 && diffHours <= 48;
    };

    let mounted = true;
    const fetchGames = async () => {
      try {
        const res = await fetch(
          'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'
        );
        const data: ESPNResponse = await res.json();
        if (!mounted) return;

        if (!data.events || data.events.length === 0) {
          setGames(FALLBACK_GAMES);
          setLoading(false);
          return;
        }

        const filteredEvents = (data.events || []).filter((event) => {
          const state = event.status?.type?.state;
          if (state === 'in' || state === 'post') return true;
          if (state !== 'pre' || !event.date) return false;
          return isWithinScheduledWindow(event.date);
        });

        const parsedGames: Game[] = filteredEvents
          .map((event) => {
            const comp = event.competitions?.[0];
            const away = comp?.competitors?.find((c) => c.homeAway === 'away');
            const home = comp?.competitors?.find((c) => c.homeAway === 'home');
            const network = comp?.broadcasts?.[0]?.names?.[0] || 'ESPN';

            const awayTeamAbbr =
              away?.team?.abbreviation || away?.team?.shortDisplayName || away?.team?.name || 'AWAY';
            const homeTeamAbbr =
              home?.team?.abbreviation || home?.team?.shortDisplayName || home?.team?.name || 'HOME';

            const awayTeamName = away?.team?.displayName || away?.team?.name || awayTeamAbbr;
            const homeTeamName = home?.team?.displayName || home?.team?.name || homeTeamAbbr;

            const awayLogo = away?.team?.logo || away?.team?.logos?.[0]?.href || '';
            const homeLogo = home?.team?.logo || home?.team?.logos?.[0]?.href || '';

            const awayRank =
              away?.curatedRank?.current &&
              away.curatedRank.current > 0 &&
              away.curatedRank.current <= 25
                ? away.curatedRank.current
                : undefined;
            const homeRank =
              home?.curatedRank?.current &&
              home.curatedRank.current > 0 &&
              home.curatedRank.current <= 25
                ? home.curatedRank.current
                : undefined;

            const state = event.status?.type?.state || 'pre';
            const statusTypeName = event.status?.type?.name || '';
            const isActive = state === 'in';
            const isScheduled = state === 'pre' || statusTypeName === 'STATUS_SCHEDULED';
            const isFinal = state === 'post' || statusTypeName.includes('FINAL');

            // Format Kickoff Time for Scheduled Games
            let startTime = '';
            if (event.status?.type?.shortDetail && isScheduled) {
              startTime = event.status.type.shortDetail;
            } else if (event.date) {
              try {
                startTime = new Date(event.date).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                });
              } catch {
                startTime = 'Scheduled';
              }
            } else {
              startTime = 'Scheduled';
            }

            // Format Time Remaining / Live Status Badge
            let timeRemaining = 'Scheduled';
            if (isActive) {
              if (statusTypeName === 'STATUS_HALFTIME') {
                timeRemaining = 'HALFTIME';
              } else if (statusTypeName === 'STATUS_END_PERIOD') {
                timeRemaining = `END Q${event.status?.period || ''}`;
              } else {
                timeRemaining = `Q${event.status?.period || 1} ${event.status?.displayClock || ''}`.trim();
              }
            } else if (isScheduled) {
              timeRemaining = startTime;
            } else if (isFinal) {
              timeRemaining = event.status?.period && event.status.period > 4 ? 'FINAL/OT' : 'FINAL';
            }

            // RedZone Situation
            const isRedZone = comp?.situation?.isRedZone || false;

            return {
              id: event.id,
              matchup: `${awayTeamAbbr} vs ${homeTeamAbbr}`,
              awayTeam: awayTeamAbbr,
              homeTeam: homeTeamAbbr,
              awayTeamName,
              homeTeamName,
              awayLogo,
              homeLogo,
              awayRank,
              homeRank,
              awayScore: away?.score || '0',
              homeScore: home?.score || '0',
              timeRemaining,
              statusText: timeRemaining,
              network,
              isActive,
              isScheduled,
              isFinal,
              date: event.date,
              statusState: state as 'pre' | 'in' | 'post',
              startTime,
              statusTypeName,
              displayClock: event.status?.displayClock,
              period: event.status?.period,
              isRedZone,
            };
          })
          .filter((g) => Boolean(g.id && (g.awayTeam !== 'AWAY' || g.homeTeam !== 'HOME')));

        if (parsedGames.length === 0) {
          setGames(FALLBACK_GAMES);
        } else {
          // Sort: Active first, then Ranked games, then scheduled
          parsedGames.sort((a, b) => {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            const aHasRank = (a.awayRank || 99) < 26 || (a.homeRank || 99) < 26;
            const bHasRank = (b.awayRank || 99) < 26 || (b.homeRank || 99) < 26;
            if (aHasRank && !bHasRank) return -1;
            if (!aHasRank && bHasRank) return 1;
            return 0;
          });
          setGames(parsedGames);
        }
        setLoading(false);
      } catch (err) {
        console.warn('Failed to fetch ESPN data, applying high-profile live feed fallback', err);
        setGames(FALLBACK_GAMES);
        setLoading(false);
      }
    };

    fetchGames();
    const interval = setInterval(fetchGames, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const lastLaunchKeyRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (slots.length === 0 || layouts.length === 0) return;

    slots.forEach((slot) => {
      const layout = layouts.find((item) => item.i === slot.id);
      if (!slot.game || !layout) return;

      const launchKey = `${slot.id}:${slot.game.id}:${layout.x}:${layout.y}:${layout.w}:${layout.h}`;
      const previousLaunchKey = lastLaunchKeyRef.current.get(slot.id);
      if (previousLaunchKey === launchKey) return;

      lastLaunchKeyRef.current.set(slot.id, launchKey);
      sendLaunchRequest(slot.game, layout);
    });
  }, [slots, layouts, sendLaunchRequest]);

  // Initialize with Default Preset once games are available
  useEffect(() => {
    if (slots.length === 0 && layouts.length === 0) {
      applyPreset('showcase');
    }
  }, []);

  // Auto-populate empty slots when games arrive if slots are unassigned
  useEffect(() => {
    if (games.length > 0 && slots.length > 0) {
      setSlots((prev) => {
        return prev.map((s, idx) => {
          if (!s.game && games[idx]) {
            return { ...s, game: games[idx] };
          }
          if (s.game) {
            const updated = games.find((g) => g.id === s.game!.id);
            if (updated) return { ...s, game: updated };
          }
          return s;
        });
      });
    }
  }, [games]);

  // Apply Layout Presets
  const applyPreset = (presetName: PresetKey) => {
    setActivePreset(presetName);
    const layoutConfig = PRESETS[presetName];
    const newSlots: Slot[] = [];
    const newLayouts: LayoutItem[] = [];

    layoutConfig.forEach((pos, index) => {
      const existingSlot = slots[index];
      const slotId = existingSlot ? existingSlot.id : `slot-${index + 1}`;
      const slotGame = existingSlot?.game || games[index] || undefined;
      const volume = existingSlot ? existingSlot.volume : index === 0 ? 1.0 : 0.5;
      const muted = existingSlot ? existingSlot.muted : index !== 0;

      newSlots.push({
        id: slotId,
        game: slotGame,
        volume,
        muted,
      });

      newLayouts.push({
        i: slotId,
        x: pos.x,
        y: pos.y,
        w: pos.w,
        h: pos.h,
      });

      // Notify backend if slot has game
      if (slotGame) {
        sendLaunchRequest(slotGame, { i: slotId, x: pos.x, y: pos.y, w: pos.w, h: pos.h });
      }
    });

    setSlots(newSlots);
    setLayouts(newLayouts);
  };

  const handleGameDay = useCallback(async () => {
    const showcaseLayout = PRESETS.showcase;
    const upcomingNoonGames = games
      .filter((game) => {
        if (!game.isScheduled || !game.date || new Date(game.date).getTime() <= Date.now()) return false;
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          hour12: false,
        }).format(new Date(game.date))
      );
      return hour === 12;
      })
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 3);
    const gameDay: Game = {
      id: 'college-gameday',
      matchup: 'College GameDay',
      awayTeam: 'COLLEGE',
      homeTeam: 'GAMEDAY',
      awayTeamName: 'College',
      homeTeamName: 'GameDay',
      awayScore: '0',
      homeScore: '0',
      timeRemaining: 'LIVE',
      statusText: 'LIVE',
      network: 'ESPN',
      isActive: true,
      isScheduled: false,
      isFinal: false,
      statusState: 'in',
    };
    const selectedGames = [gameDay, ...upcomingNoonGames];
    const newSlots = showcaseLayout.map((_, index) => ({
      id: slots[index]?.id || `slot-${index + 1}`,
      game: selectedGames[index],
      volume: index === 0 ? 1 : 0.5,
      muted: index !== 0,
    }));
    const newLayouts = showcaseLayout.map((position, index) => ({
      i: newSlots[index].id,
      ...position,
    }));

    setActivePreset('showcase');
    setSlots(newSlots);
    setLayouts(newLayouts);
    await Promise.all(
      newSlots.map((slot, index) =>
        slot.game
          ? sendLaunchRequest(slot.game, { i: slot.id, ...showcaseLayout[index] })
          : Promise.resolve()
      )
    );
  }, [games, sendLaunchRequest, slots]);

  const handleTestMode = useCallback(async () => {
    const testLaunchConfigs = [
      {
        slot_id: 'slot-1',
        matchup: 'Lofi Girl',
        network: 'TEST',
        url: 'https://www.youtube.com/embed/jfKfPfyJRdk',
        coordinates: { x: 0, y: 0, width: 960, height: 540 },
      },
      {
        slot_id: 'slot-2',
        matchup: 'Sky News',
        network: 'TEST',
        url: 'https://www.youtube.com/embed/5qap5aO4i9A',
        coordinates: { x: 960, y: 0, width: 960, height: 540 },
      },
      {
        slot_id: 'slot-3',
        matchup: 'Study Mix',
        network: 'TEST',
        url: 'https://www.youtube.com/embed/DWcJFNfaw9c',
        coordinates: { x: 0, y: 540, width: 960, height: 540 },
      },
      {
        slot_id: 'slot-4',
        matchup: 'Deep Focus',
        network: 'TEST',
        url: 'https://www.youtube.com/embed/21X5lGlDOfg',
        coordinates: { x: 960, y: 540, width: 960, height: 540 },
      },
    ];

    const quadLayout = PRESETS.classicQuad;
    const newSlots = quadLayout.map((_, index) => ({
      id: testLaunchConfigs[index].slot_id,
      game: {
        id: `test-rig-${index + 1}`,
        matchup: testLaunchConfigs[index].matchup,
        awayTeam: 'TEST',
        homeTeam: `RIG ${index + 1}`,
        awayTeamName: 'Test Stream',
        homeTeamName: `Quadrant ${index + 1}`,
        awayScore: '0',
        homeScore: '0',
        timeRemaining: 'TEST',
        statusText: 'TEST STREAM',
        network: 'TEST',
        isActive: true,
        isScheduled: false,
        isFinal: false,
        statusState: 'in',
        streamUrl: testLaunchConfigs[index].url,
      },
      volume: index === 0 ? 1 : 0.5,
      muted: index !== 0,
    }));
    const newLayouts = quadLayout.map((position, index) => ({
      i: newSlots[index].id,
      ...position,
    }));

    setActivePreset('classicQuad');
    setSlots(newSlots);
    setLayouts(newLayouts);

    await Promise.all(
      testLaunchConfigs.map((stream) =>
        fetch('http://localhost:8000/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchup: stream.matchup,
            network: stream.network,
            slot_id: stream.slot_id,
            coordinates: stream.coordinates,
            url: stream.url,
          }),
        })
      )
    );
  }, []);

  // Swap Secondary Slot with Primary Display Slot
  const handleSwapWithPrimary = useCallback(
    (secondarySlotId: string) => {
      if (slots.length === 0 || layouts.length === 0) return;

      // Find primary layout (largest area)
      let primaryLayout = layouts[0];
      let maxArea = 0;
      layouts.forEach((l) => {
        const area = l.w * l.h;
        if (area > maxArea) {
          maxArea = area;
          primaryLayout = l;
        }
      });

      const primarySlot = slots.find((s) => s.id === primaryLayout.i);
      const secondarySlot = slots.find((s) => s.id === secondarySlotId);
      const secondaryLayout = layouts.find((l) => l.i === secondarySlotId);

      if (!primarySlot || !secondarySlot || primarySlot.id === secondarySlot.id) return;

      const primaryGame = primarySlot.game;
      const secondaryGame = secondarySlot.game;

      setSlots((prev) =>
        prev.map((s) => {
          if (s.id === primarySlot.id) {
            return { ...s, game: secondaryGame, volume: 1.0, muted: false };
          }
          if (s.id === secondarySlot.id) {
            return { ...s, game: primaryGame, volume: 0.5, muted: true };
          }
          return s;
        })
      );

      // Notify backend coordinates & volume updates
      if (secondaryGame) {
        sendLaunchRequest(secondaryGame, primaryLayout);
        sendVolumeRequest(secondaryGame.matchup, 1.0, false);
      }
      if (primaryGame && secondaryLayout) {
        sendLaunchRequest(primaryGame, secondaryLayout);
        sendVolumeRequest(primaryGame.matchup, 0.5, true);
      }

      // Reset RedZone clock tracking
      if (secondaryGame) {
        primaryDisplayClockLastChange.current = {
          time: Date.now(),
          clock: secondaryGame.displayClock || '',
          gameId: secondaryGame.id,
        };
      }
    },
    [slots, layouts, sendLaunchRequest, sendVolumeRequest]
  );

  // Perform RedZone Switch
  const triggerRedZoneSwitch = useCallback(
    (forced: boolean = false) => {
      if (slots.length === 0 || layouts.length === 0) return;

      // Identify primary slot (largest area)
      let primaryLayout = layouts[0];
      let maxArea = 0;
      layouts.forEach((l) => {
        const area = l.w * l.h;
        if (area > maxArea) {
          maxArea = area;
          primaryLayout = l;
        }
      });

      const primarySlot = slots.find((s) => s.id === primaryLayout.i);
      const currentPrimaryGame = primarySlot?.game;

      // Score candidates from remaining games or active slots
      let bestGame: Game | null = null;
      let bestScore = -Infinity;

      games.forEach((g) => {
        if (currentPrimaryGame && g.id === currentPrimaryGame.id) return;
        let score = 0;
        if (g.isActive) score += 30;
        if (g.isRedZone) score += 100;
        if (g.period === 4) score += 50;

        const scoreDiff = Math.abs(parseInt(g.awayScore || '0', 10) - parseInt(g.homeScore || '0', 10));
        if (scoreDiff <= 7) score += 20; // 1-possession game
        if (scoreDiff <= 3) score += 15; // field goal game

        if (score > bestScore) {
          bestScore = score;
          bestGame = g;
        }
      });

      // Fallback candidate if none found
      if (!bestGame && games.length > 1) {
        bestGame = games.find((g) => g.id !== currentPrimaryGame?.id) || games[0];
      }

      if (bestGame && primarySlot) {
        const isRedZoneTarget = bestGame.isRedZone;
        const reasons = [
          isRedZoneTarget
            ? `Action inside the 20-yard line! Directing live coverage to ${bestGame.matchup}.`
            : `Stoppage in primary broadcast. Switching live feed to high-action clash: ${bestGame.matchup}!`,
          `RedZone Alert! ${bestGame.matchup} is in a tight battle. Tuning in now!`,
          `Live cut-in: Key possession underway in ${bestGame.matchup}. Bringing to main screen.`,
        ];
        const selectedPhrase = reasons[Math.floor(Math.random() * reasons.length)];

        // Set visual announcement
        setRedZoneAnnouncement(selectedPhrase);
        setTimeout(() => setRedZoneAnnouncement(null), 6000);

        // Read out loud with Web Speech API
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(selectedPhrase);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        } catch (e) {
          console.warn('Speech synthesis error:', e);
        }

        // Check if target game was already in another slot -> swap them
        const existingSlotOfTarget = slots.find((s) => s.game?.id === (bestGame as Game).id);

        setSlots((prev) =>
          prev.map((s) => {
            if (s.id === primarySlot.id) {
              return { ...s, game: bestGame as Game, volume: 1.0, muted: false };
            }
            if (existingSlotOfTarget && s.id === existingSlotOfTarget.id) {
              return { ...s, game: currentPrimaryGame, volume: 0.5, muted: true };
            }
            return { ...s, muted: true };
          })
        );

        // Send updated launch coordinates & volume to backend
        sendLaunchRequest(bestGame, primaryLayout);
        sendVolumeRequest(bestGame.matchup, 1.0, false);
        if (currentPrimaryGame && existingSlotOfTarget) {
          const targetLayout = layouts.find((l) => l.i === existingSlotOfTarget.id);
          if (targetLayout) {
            sendLaunchRequest(currentPrimaryGame, targetLayout);
            sendVolumeRequest(currentPrimaryGame.matchup, 0.5, true);
          }
        }

        // Reset clock monitor
        primaryDisplayClockLastChange.current = {
          time: Date.now(),
          clock: (bestGame as Game).displayClock || '',
          gameId: (bestGame as Game).id,
        };
        redZoneCooldown.current = Date.now() + 15000; // 15s cooldown
      }
    },
    [slots, layouts, games, sendLaunchRequest, sendVolumeRequest]
  );

  // RedZone Auto-Switcher Monitor Loop
  useEffect(() => {
    if (!redZoneMode || slots.length === 0 || layouts.length === 0) return;

    let primaryLayout = layouts[0];
    let maxArea = 0;
    layouts.forEach((l) => {
      const area = l.w * l.h;
      if (area > maxArea) {
        maxArea = area;
        primaryLayout = l;
      }
    });

    const primarySlot = slots.find((s) => s.id === primaryLayout.i);
    if (!primarySlot || !primarySlot.game) return;

    const game = primarySlot.game;
    let shouldSwitch = false;

    // Condition 1: Halftime or End of Period
    if (game.statusTypeName === 'STATUS_HALFTIME' || game.statusTypeName === 'STATUS_END_PERIOD') {
      shouldSwitch = true;
    } else {
      // Condition 2: Stalled clock for 90 seconds
      const lastClock = primaryDisplayClockLastChange.current;
      if (lastClock.gameId !== game.id || lastClock.clock !== game.displayClock) {
        primaryDisplayClockLastChange.current = {
          time: Date.now(),
          clock: game.displayClock || '',
          gameId: game.id,
        };
      } else {
        if (Date.now() - lastClock.time > 90000) {
          shouldSwitch = true;
        }
      }
    }

    if (shouldSwitch && Date.now() > redZoneCooldown.current) {
      triggerRedZoneSwitch();
    }
  }, [games, redZoneMode, slots, layouts, triggerRedZoneSwitch]);

  const handleAddSlot = () => {
    const id = `slot-${Date.now()}`;
    const nextGame = games.find((g) => !slots.some((s) => s.game?.id === g.id));
    setSlots((prev) => [...prev, { id, game: nextGame, volume: 0.5, muted: true }]);
    setLayouts((prev) => [...prev, { i: id, x: 0, y: 0, w: 8, h: 8 }]);
    setActivePreset(null);
  };

  const handleRemoveSlot = (id: string) => {
    const removedSlot = slots.find((slot) => slot.id === id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setLayouts((prev) => prev.filter((l) => l.i !== id));
    setActivePreset(null);

    if (removedSlot?.game) {
      sendCloseRequest(id, removedSlot.game.matchup);
    }
  };

  const handleLayoutChange = (newLayouts: Layout) => {
    setLayouts([...newLayouts]);

    newLayouts.forEach((layout) => {
      const slot = slots.find((entry) => entry.id === layout.i);
      if (slot?.game) {
        sendLaunchRequest(slot.game, layout as LayoutItem);
      }
    });
  };

  const handleAssignGame = async (slotId: string, game: Game, currentLayout: LayoutItem) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, game } : s)));
    setIsSidebarOpen(false);
    sendLaunchRequest(game, currentLayout);
    lastLaunchKeyRef.current.set(slotId, `${slotId}:${game.id}:${currentLayout.x}:${currentLayout.y}:${currentLayout.w}:${currentLayout.h}`);
  };

  const handleVolumeChange = (slotId: string, volume: number, muted: boolean) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          if (s.game) sendVolumeRequest(s.game.matchup, volume, muted);
          return { ...s, volume, muted };
        }
        return s;
      })
    );
  };

  // Auto-Solo handler
  const handleAutoSolo = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          if (s.game) sendVolumeRequest(s.game.matchup, 1.0, false);
          return { ...s, volume: 1.0, muted: false };
        } else {
          if (s.game) sendVolumeRequest(s.game.matchup, s.volume, true);
          return { ...s, muted: true };
        }
      })
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0A0A0B] text-[#E4E4E7] font-sans overflow-hidden selection:bg-blue-500/30 relative">
      <Sidebar
        games={games}
        loading={loading}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setHighlightedGameId(null);
        }}
        highlightedGameId={highlightedGameId}
      />
      <Canvas
        slots={slots}
        layouts={layouts}
        activePreset={activePreset}
        redZoneMode={redZoneMode}
        redZoneAnnouncement={redZoneAnnouncement}
        isZenMode={isZenMode}
        showTicker={showTicker}
        liveCount={games.filter((g) => g.isActive).length}
        onToggleRedZone={() => setRedZoneMode((prev) => !prev)}
        onTriggerRedZoneTest={() => triggerRedZoneSwitch(true)}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
        onLayoutChange={handleLayoutChange}
        onAssignGame={handleAssignGame}
        onApplyPreset={applyPreset}
        onVolumeChange={handleVolumeChange}
        onAutoSolo={handleAutoSolo}
        onSwapWithPrimary={handleSwapWithPrimary}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        onToggleTicker={() => setShowTicker((prev) => !prev)}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onGameDay={handleGameDay}
        onTestMode={handleTestMode}
      />
      {showTicker && (
        <BottomLineTicker
          games={games}
          onSelectGame={(gameId) => {
            setHighlightedGameId(gameId);
            setIsSidebarOpen(true);
          }}
        />
      )}
    </div>
  );
}


