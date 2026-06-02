/**
 * UNO Arena — Card Definitions & Constants
 */

import { CardColor, AnyCardColor, CardValue, NumberValue, ActionValue } from '../types/game';

// Standard UNO deck composition:
// - 4 colors × (1 zero + 2 each of 1-9 + 2 skip + 2 reverse + 2 draw2) = 100 colored cards
// - 4 Wild + 4 Wild Draw 4 = 8 wild cards
// Total: 108 cards

export const CARD_COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
export const NUMBER_VALUES: NumberValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const ACTION_VALUES: ActionValue[] = ['skip', 'reverse', 'draw2'];

export const COLOR_LABELS: Record<AnyCardColor, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  wild: 'Wild',
};

export const VALUE_LABELS: Record<string, string> = {
  skip: '⊘',
  reverse: '⇄',
  draw2: '+2',
  wild: '★',
  wild_draw4: '+4',
  flip: '⟲',
  skip_everyone: '⊘⊘',
  draw5: '+5',
  draw1: '+1',
};

export const VALUE_DISPLAY: Record<string, string> = {
  skip: 'SKIP',
  reverse: 'REV',
  draw2: 'DRAW 2',
  wild: 'WILD',
  wild_draw4: 'WILD +4',
  flip: 'FLIP',
  skip_everyone: 'SKIP ALL',
  draw5: 'DRAW 5',
  draw1: 'DRAW 1',
};

// How many of each card in a standard deck
export const CARD_COUNTS = {
  zero: 1,        // 1 zero per color
  numbers: 2,     // 2 of each 1-9 per color
  actions: 2,     // 2 of each action per color
  wild: 4,        // 4 wild cards total
  wildDraw4: 4,   // 4 wild draw 4 total
} as const;

// Maximum players
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
export const DEFAULT_HAND_SIZE = 7;
export const TARGET_SCORE = 500;

// Blitz mode
export const BLITZ_TURN_TIME = 10; // seconds

// Avatars available for players
export const AVATARS = [
  '🦊', '🐼', '🦁', '🐯', '🦄',
  '🐲', '🦅', '🐺', '🦈', '🐙',
  '🦋', '🌟', '🔥', '⚡', '🎮',
  '🎯', '💎', '🏆', '🎪', '🎭',
] as const;

// Bot names
export const BOT_NAMES = [
  'Nova', 'Blaze', 'Storm', 'Shadow',
  'Phoenix', 'Viper', 'Titan', 'Luna',
  'Ace', 'Spark', 'Raven', 'Frost',
] as const;
