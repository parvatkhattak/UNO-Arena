/**
 * UNO Arena — AI Bot Logic
 * Three difficulty levels: Easy, Medium, Hard
 */

import {
  Card, CardColor, GameState, BotDifficulty, Player,
} from '../types/game';
import {
  canPlayCard, getPlayableCards, hasPlayableCard,
} from './actions';
import { CARD_COLORS } from '../constants/cards';

interface BotDecision {
  action: 'play' | 'draw';
  cardId?: string;
  chosenColor?: CardColor;
}

/**
 * Bot makes a decision based on difficulty level
 */
export function botDecide(
  state: GameState,
  botPlayer: Player
): BotDecision {
  const difficulty = botPlayer.botDifficulty || 'medium';
  const topCard = state.discardPile[state.discardPile.length - 1];
  const playable = getPlayableCards(
    botPlayer.hand, topCard, state.currentColor,
    state.settings.houseRules, state.stackCount
  );

  if (playable.length === 0) {
    return { action: 'draw' };
  }

  switch (difficulty) {
    case 'easy':
      return easyBot(playable, botPlayer);
    case 'medium':
      return mediumBot(playable, botPlayer, state);
    case 'hard':
      return hardBot(playable, botPlayer, state);
    default:
      return easyBot(playable, botPlayer);
  }
}

/**
 * EASY: Plays the first valid card found, random color for wilds
 */
function easyBot(playable: Card[], botPlayer: Player): BotDecision {
  const card = playable[0];
  return {
    action: 'play',
    cardId: card.id,
    chosenColor: card.color === 'wild' ? randomColor() : undefined,
  };
}

/**
 * MEDIUM: Prefers action cards, picks strategic wild colors
 */
function mediumBot(playable: Card[], botPlayer: Player, state: GameState): BotDecision {
  // Prioritize: action cards > number cards > wilds (save wilds)
  const actions = playable.filter(c => typeof c.value !== 'number' && c.color !== 'wild');
  const numbers = playable.filter(c => typeof c.value === 'number');
  const wilds = playable.filter(c => c.color === 'wild');

  let card: Card;
  if (numbers.length > 0) {
    // Play highest number first
    card = numbers.sort((a, b) => {
      const av = typeof a.value === 'number' ? a.value : 0;
      const bv = typeof b.value === 'number' ? b.value : 0;
      return bv - av;
    })[0];
  } else if (actions.length > 0) {
    card = actions[0];
  } else {
    card = wilds[0];
  }

  return {
    action: 'play',
    cardId: card.id,
    chosenColor: card.color === 'wild' ? bestColor(botPlayer.hand) : undefined,
  };
}

/**
 * HARD: Tracks played cards, saves action cards for critical moments,
 * targets the player closest to winning
 */
function hardBot(playable: Card[], botPlayer: Player, state: GameState): BotDecision {
  // If bot has exactly 1 card left, just play it — no strategy needed
  if (botPlayer.hand.length === 1) {
    const card = playable[0];
    const isWildType = card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw4';
    return {
      action: 'play',
      cardId: card.id,
      chosenColor: isWildType ? bestColor(botPlayer.hand) : undefined,
    };
  }

  // Find the player closest to winning (fewest cards, not self)
  const opponents = state.players.filter(p => p.id !== botPlayer.id);
  const dangerPlayer = opponents.reduce((min, p) =>
    p.hand.length < min.hand.length ? p : min, opponents[0]);

  const dangerIndex = state.players.findIndex(p => p.id === dangerPlayer?.id);
  const isNextPlayer = dangerIndex !== -1 &&
    ((state.direction === 'clockwise' &&
      (state.currentPlayerIndex + 1) % state.players.length === dangerIndex) ||
    (state.direction === 'counter_clockwise' &&
      (state.currentPlayerIndex - 1 + state.players.length) % state.players.length === dangerIndex));

  // If danger player is next and has few cards, use action cards
  if (dangerPlayer && dangerPlayer.hand.length <= 2 && isNextPlayer) {
    const skipCards = playable.filter(c => c.value === 'skip' || c.value === 'draw2' || c.value === 'wild_draw4');
    if (skipCards.length > 0) {
      const card = skipCards[0];
      const isWildType = card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw4';
      return {
        action: 'play',
        cardId: card.id,
        chosenColor: isWildType ? bestColor(botPlayer.hand) : undefined,
      };
    }
  }

  // If bot has 2 cards, play the non-wild one first (to save wild as last)
  if (botPlayer.hand.length === 2) {
    const nonWild = playable.filter(c => c.color !== 'wild');
    if (nonWild.length > 0) {
      return {
        action: 'play',
        cardId: nonWild[0].id,
      };
    }
  }

  // Otherwise: play highest-value card to maximize dump, save wilds
  const sorted = playable
    .filter(c => c.color !== 'wild')
    .sort((a, b) => cardScore(b) - cardScore(a));

  if (sorted.length > 0) {
    return {
      action: 'play',
      cardId: sorted[0].id,
    };
  }

  // Fall back to the first available card, and if it's a wild type, ensure we pass a chosenColor
  const card = playable[0];
  const isWildType = card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw4';
  return {
    action: 'play',
    cardId: card.id,
    chosenColor: isWildType ? bestColor(botPlayer.hand) : undefined,
  };
}

/** Pick random color */
function randomColor(): CardColor {
  return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
}

/** Pick the color the bot has most of */
function bestColor(hand: Card[]): CardColor {
  const counts: Record<CardColor, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const card of hand) {
    if (card.color !== 'wild') {
      counts[card.color as CardColor]++;
    }
  }
  // If bot has no non-wild cards, pick a random color
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return randomColor();
  return (Object.entries(counts) as [CardColor, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

/** Score a card for sorting (higher = play first) */
function cardScore(card: Card): number {
  if (typeof card.value === 'number') return card.value;
  switch (card.value) {
    case 'draw2': return 25;
    case 'skip': return 22;
    case 'reverse': return 20;
    case 'wild_draw4': return 50;
    case 'wild': return 45;
    case 'draw5': return 40;
    case 'skip_everyone': return 35;
    default: return 15;
  }
}

/**
 * Determine if bot should call UNO
 * Hard bots always remember. Easy bots forget sometimes.
 */
export function shouldBotCallUno(difficulty: BotDifficulty): boolean {
  switch (difficulty) {
    case 'easy': return Math.random() > 0.4;    // 60% chance to remember
    case 'medium': return Math.random() > 0.15; // 85% chance
    case 'hard': return true;                    // Always calls
    default: return true;
  }
}

/**
 * Get random thinking delay (ms) for natural feel
 */
export function getBotDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'easy': return 1000 + Math.random() * 1500;   // 1-2.5s
    case 'medium': return 600 + Math.random() * 1000;  // 0.6-1.6s
    case 'hard': return 400 + Math.random() * 600;     // 0.4-1s
    default: return 1000;
  }
}
