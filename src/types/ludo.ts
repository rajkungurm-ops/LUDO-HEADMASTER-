export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type GameMode = 'local' | 'online'; // local = Pass & Play (Offline), online = Real-time Multiplayer
export type MatchRule = 'classic' | 'quick'; // classic: all 4 home, quick: 1 token home wins

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  step: number; // -1: in base yard, 0..50: on main path, 51..55: home stretch, 56: finished/home
  position: { row: number; col: number };
  isHome: boolean;
  inBase: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isBot?: boolean;
  isConnected: boolean;
  tokens: Token[];
  rank?: number; // 1 = 1st place, 2 = 2nd, etc.
  coins: number;
  level?: number;
  vipLevel?: number;
  isOut?: boolean; // Automatically eliminated / out from the game
  diceSkin?: string;
  tokenSkin?: string;
  boardSkin?: string;
  stats: {
    kills: number;
    sixes: number;
    tokensHome: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColor;
  senderAvatar: string;
  text: string;
  type: 'text' | 'quick' | 'emoji';
  timestamp: number;
}

export interface GameState {
  roomId: string;
  mode: GameMode;
  matchRule: MatchRule;
  players: Player[];
  playerOrder: PlayerColor[];
  currentTurnIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  hasRolled: boolean;
  consecutiveSixes: number;
  validTokenMoves: number[]; // token IDs that can legally move
  winners: PlayerColor[];
  gameStatus: 'lobby' | 'playing' | 'paused' | 'finished';
  turnTimer: number;
  turnTimeLimit: number;
  lastActionNotification?: string;
  activeHopToken?: {
    color: PlayerColor;
    tokenId: number;
    fromStep: number;
    toStep: number;
    currentStep: number;
  } | null;
  capturedToken?: {
    color: PlayerColor;
    tokenId: number;
  } | null;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  level: number;
  trophies: number;
  coins: number;
  wins: number;
  totalGames: number;
  winRate: number;
  isUser?: boolean;
}


