export interface ESPNResponse {
  events: ESPNEvent[];
}

export interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  date?: string;
  status: {
    clock?: number;
    displayClock?: string;
    period?: number;
    type: {
      id?: string;
      name?: string;
      state: string; // 'pre' | 'in' | 'post'
      completed?: boolean;
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
  competitions: Array<{
    id?: string;
    date?: string;
    situation?: {
      isRedZone?: boolean;
      downDistanceText?: string;
      possessionText?: string;
    };
    competitors: Array<{
      id?: string;
      homeAway: 'home' | 'away';
      score?: string;
      curatedRank?: {
        current?: number;
      };
      team: {
        id?: string;
        abbreviation?: string;
        displayName?: string;
        shortDisplayName?: string;
        name?: string;
        logo?: string;
        logos?: Array<{ href: string }>;
        color?: string;
        alternateColor?: string;
      };
    }>;
    broadcasts?: Array<{
      names: string[];
    }>;
  }>;
}

export interface TeamInfo {
  abbreviation: string;
  displayName: string;
  logo?: string;
  rank?: number;
  score: string;
}

export interface Game {
  id: string;
  matchup: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamName: string;
  homeTeamName: string;
  awayLogo?: string;
  homeLogo?: string;
  awayRank?: number;
  homeRank?: number;
  awayScore: string;
  homeScore: string;
  timeRemaining: string;
  statusText: string;
  network: string;
  isActive: boolean;
  isScheduled: boolean;
  isFinal: boolean;
  date?: string;
  statusState?: 'pre' | 'in' | 'post';
  startTime?: string;
  statusTypeName?: string;
  displayClock?: string;
  period?: number;
  isRedZone?: boolean;
  streamUrl?: string;
}

export interface Slot {
  id: string;
  game?: Game;
  volume: number;
  muted: boolean;
}

