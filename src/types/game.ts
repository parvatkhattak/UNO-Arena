/**
 * UNO Arena — Core Game Type Definitions
 */

// ─── Card Types ──────────────────────────────────────────

export type CardColor = 'red' | 'blue' | 'green' | 'yellow';
export type WildColor = 'wild';
export type AnyCardColor = CardColor | WildColor;

export type NumberValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ActionValue = 'skip' | 'reverse' | 'draw2';
export type WildValue = 'wild' | 'wild_draw4';

// UNO Flip specific
export type FlipActionValue = 'flip' | 'skip_everyone' | 'draw5' | 'reverse' | 'draw1';
export type CardSide = 'light' | 'dark';

export type CardValue = NumberValue | ActionValue | WildValue | FlipActionValue;

export interface Card {
  id: string;
  color: AnyCardColor;
  value: CardValue;
  side?: CardSide; // Only for UNO Flip
  darkColor?: CardColor; // The color on the dark side (Flip mode)
  darkValue?: CardValue; // The value on the dark side (Flip mode)
}

// ─── Player Types ────────────────────────────────────────

export type PlayerType = 'human' | 'bot';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  type: PlayerType;
  botDifficulty?: BotDifficulty;
  hand: Card[];
  score: number;
  isReady: boolean;
  isConnected: boolean;
  hasCalledUno: boolean;
}

// ─── Game Types ──────────────────────────────────────────

export type GameMode = 'classic' | 'flip' | 'blitz' | 'custom';
export type GamePhase = 'waiting' | 'dealing' | 'playing' | 'round_end' | 'game_over';
export type Direction = 'clockwise' | 'counter_clockwise';

export interface HouseRules {
  stacking: boolean;          // Chain Draw 2 / Draw 4
  jumpIn: boolean;            // Play identical card out of turn
  sevenZeroRule: boolean;     // 7 = swap, 0 = rotate
  forcePlay: boolean;         // Must play if you can
  drawUntilPlay: boolean;     // Keep drawing until playable card
  noBluffing: boolean;        // Wild Draw 4 can be challenged
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  stacking: false,
  jumpIn: false,
  sevenZeroRule: false,
  forcePlay: true,
  drawUntilPlay: false,
  noBluffing: false,
};

export interface GameSettings {
  mode: GameMode;
  maxPlayers: number;
  targetScore: number;        // Default 500
  blitzTimerSeconds: number;  // Default 10 (for Blitz mode)
  houseRules: HouseRules;
  initialCards: number;       // Default 7
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: 'classic',
  maxPlayers: 4,
  targetScore: 500,
  blitzTimerSeconds: 10,
  houseRules: DEFAULT_HOUSE_RULES,
  initialCards: 7,
};

export interface GameState {
  id: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Player[];
  currentPlayerIndex: number;
  direction: Direction;
  drawPile: Card[];
  discardPile: Card[];
  currentColor: CardColor;   // Active color (may differ from top card if Wild played)
  turnTimer?: number;         // Remaining seconds (Blitz mode)
  stackCount: number;         // Accumulated draw count when stacking
  currentSide: CardSide;      // Current side for Flip mode
  winner?: string;            // Player ID of round winner
  roundNumber: number;
  lastAction?: GameAction;
}

// ─── Action Types ────────────────────────────────────────

export type GameActionType =
  | 'PLAY_CARD'
  | 'DRAW_CARD'
  | 'CALL_UNO'
  | 'CHALLENGE_UNO'     // Catch someone who forgot to call UNO
  | 'CHALLENGE_WILD4'   // Challenge Wild Draw 4 (no bluffing rule)
  | 'CHOOSE_COLOR'
  | 'SWAP_HANDS'        // 7-0 rule: swap with chosen player
  | 'PASS'              // Pass turn after drawing (if not drawUntilPlay)
  | 'FLIP';             // UNO Flip: flip all cards

export interface GameAction {
  type: GameActionType;
  playerId: string;
  timestamp: number;
  payload?: {
    cardId?: string;
    targetPlayerId?: string;
    chosenColor?: CardColor;
  };
}

// ─── Lobby Types ─────────────────────────────────────────

export type ConnectionMethod = 'wifi_hotspot' | 'wifi_direct' | 'bluetooth';
export type LobbyRole = 'host' | 'client';

export interface LobbyState {
  roomCode: string;
  hostId: string;
  players: LobbyPlayer[];
  settings: GameSettings;
  connectionMethod: ConnectionMethod;
  isStarting: boolean;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
}

// ─── Score Types ─────────────────────────────────────────

export interface RoundResult {
  roundNumber: number;
  winnerId: string;
  scores: Record<string, number>; // playerId → points earned this round
  totalScores: Record<string, number>; // cumulative
}

export interface MatchResult {
  winnerId: string;
  rounds: RoundResult[];
  totalScores: Record<string, number>;
  duration: number; // seconds
  mode: GameMode;
  timestamp: number;
}

// ─── Card Point Values ───────────────────────────────────

export const CARD_POINTS: Record<string, number> = {
  // Number cards = face value (handled programmatically)
  skip: 20,
  reverse: 20,
  draw2: 20,
  wild: 50,
  wild_draw4: 50,
  // Flip-specific
  flip: 20,
  skip_everyone: 30,
  draw5: 40,
  draw1: 10,
};
