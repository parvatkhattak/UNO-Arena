/**
 * UNO Arena — Deck Builder
 * Creates, shuffles, and manages UNO card decks
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  CardColor,
  NumberValue,
  ActionValue,
  CardSide,
  GameMode,
} from '../types/game';
import {
  CARD_COLORS,
  NUMBER_VALUES,
  ACTION_VALUES,
  CARD_COUNTS,
} from '../constants/cards';

/**
 * Fisher-Yates shuffle — O(n) in-place shuffle
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create a single card
 */
function createCard(
  color: Card['color'],
  value: Card['value'],
  side?: CardSide,
  darkColor?: CardColor,
  darkValue?: Card['value']
): Card {
  return {
    id: uuidv4(),
    color,
    value,
    ...(side && { side }),
    ...(darkColor && { darkColor }),
    ...(darkValue && { darkValue }),
  };
}

/**
 * Generate a standard 108-card UNO deck
 */
export function createClassicDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of CARD_COLORS) {
    // One 0 per color
    deck.push(createCard(color, 0 as NumberValue));

    // Two of each 1-9 per color
    for (const num of NUMBER_VALUES) {
      if (num === 0) continue; // Already added
      for (let i = 0; i < CARD_COUNTS.numbers; i++) {
        deck.push(createCard(color, num));
      }
    }

    // Two of each action card per color
    for (const action of ACTION_VALUES) {
      for (let i = 0; i < CARD_COUNTS.actions; i++) {
        deck.push(createCard(color, action));
      }
    }
  }

  // Wild cards
  for (let i = 0; i < CARD_COUNTS.wild; i++) {
    deck.push(createCard('wild', 'wild'));
  }

  // Wild Draw 4 cards
  for (let i = 0; i < CARD_COUNTS.wildDraw4; i++) {
    deck.push(createCard('wild', 'wild_draw4'));
  }

  return deck;
}

/**
 * Generate an UNO Flip deck (double-sided cards)
 * Light side has standard colors; dark side has different colors and harsher actions
 */
export function createFlipDeck(): Card[] {
  const deck: Card[] = [];
  const darkColors: CardColor[] = ['red', 'blue', 'green', 'yellow'];

  for (let colorIdx = 0; colorIdx < CARD_COLORS.length; colorIdx++) {
    const lightColor = CARD_COLORS[colorIdx];
    // Dark side uses a shifted color for visual distinction
    const darkColor = darkColors[(colorIdx + 2) % 4];

    // One 0 per color
    deck.push(createCard(lightColor, 0 as NumberValue, 'light', darkColor, 0 as NumberValue));

    // Two of each 1-9
    for (const num of NUMBER_VALUES) {
      if (num === 0) continue;
      for (let i = 0; i < 2; i++) {
        deck.push(createCard(lightColor, num, 'light', darkColor, num));
      }
    }

    // Light side actions: skip, reverse, draw2
    // Dark side actions: skip_everyone, reverse, draw5
    for (let i = 0; i < 2; i++) {
      deck.push(createCard(lightColor, 'skip', 'light', darkColor, 'skip_everyone'));
      deck.push(createCard(lightColor, 'reverse', 'light', darkColor, 'reverse'));
      deck.push(createCard(lightColor, 'draw2', 'light', darkColor, 'draw5'));
    }

    // Flip cards (2 per color)
    for (let i = 0; i < 2; i++) {
      deck.push(createCard(lightColor, 'flip', 'light', darkColor, 'flip'));
    }
  }

  // Wild cards (light) / Wild Draw Color (dark)
  for (let i = 0; i < 4; i++) {
    deck.push(createCard('wild', 'wild', 'light', undefined, 'wild'));
  }

  // Wild Draw 2 (light) / Wild Draw 4 (dark... even harsher!)
  for (let i = 0; i < 4; i++) {
    deck.push(createCard('wild', 'wild_draw4', 'light', undefined, 'wild_draw4'));
  }

  return deck;
}

/**
 * Create deck based on game mode
 */
export function createDeck(mode: GameMode): Card[] {
  switch (mode) {
    case 'flip':
      return shuffle(createFlipDeck());
    case 'classic':
    case 'blitz':
    case 'custom':
    default:
      return shuffle(createClassicDeck());
  }
}

/**
 * Deal cards to players
 * Returns: [playerHands, remainingDeck]
 */
export function dealCards(
  deck: Card[],
  playerCount: number,
  cardsPerPlayer: number = 7
): [Card[][], Card[]] {
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let deckIndex = 0;

  for (let card = 0; card < cardsPerPlayer; card++) {
    for (let player = 0; player < playerCount; player++) {
      if (deckIndex < deck.length) {
        hands[player].push(deck[deckIndex]);
        deckIndex++;
      }
    }
  }

  const remainingDeck = deck.slice(deckIndex);
  return [hands, remainingDeck];
}

/**
 * Find first valid starting card from deck
 * The starting card cannot be a Wild Draw 4
 */
export function findStartingCard(deck: Card[]): [Card, Card[]] {
  const deckCopy = [...deck];

  for (let i = 0; i < deckCopy.length; i++) {
    const card = deckCopy[i];
    if (card.value !== 'wild_draw4') {
      deckCopy.splice(i, 1);
      return [card, deckCopy];
    }
  }

  // Extremely unlikely, but if all cards are Wild Draw 4, just use the first
  const card = deckCopy.shift()!;
  return [card, deckCopy];
}

/**
 * Recycle discard pile into draw pile when draw pile is empty
 * Keeps the top card of discard pile
 */
export function recycleDiscardPile(discardPile: Card[]): [Card[], Card[]] {
  if (discardPile.length <= 1) {
    return [[], discardPile];
  }

  const topCard = discardPile[discardPile.length - 1];
  const recycled = shuffle(discardPile.slice(0, -1));
  return [recycled, [topCard]];
}
