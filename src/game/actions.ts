/**
 * UNO Arena — Card Play Validation & Action Effects
 */

import { Card, CardColor, GameState, HouseRules, Player, Direction } from '../types/game';
import { CARD_POINTS } from '../types/game';

/** Check if a card can be played on the current discard pile */
export function canPlayCard(
  card: Card, topCard: Card, currentColor: CardColor,
  houseRules: HouseRules, stackCount: number
): boolean {
  if (stackCount > 0 && houseRules.stacking) {
    if (topCard.value === 'draw2') return card.value === 'draw2';
    if (topCard.value === 'wild_draw4') return card.value === 'wild_draw4';
  }
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

/** Check if a player has any playable card */
export function hasPlayableCard(
  hand: Card[], topCard: Card, currentColor: CardColor,
  houseRules: HouseRules, stackCount: number
): boolean {
  return hand.some(c => canPlayCard(c, topCard, currentColor, houseRules, stackCount));
}

/** Get all playable cards from a hand */
export function getPlayableCards(
  hand: Card[], topCard: Card, currentColor: CardColor,
  houseRules: HouseRules, stackCount: number
): Card[] {
  return hand.filter(c => canPlayCard(c, topCard, currentColor, houseRules, stackCount));
}

/** Wild Draw 4 is legit only if player has NO cards matching current color */
export function isWildDraw4Legit(hand: Card[], currentColor: CardColor): boolean {
  return !hand.some(c => c.color !== 'wild' && c.color === currentColor);
}

/** Advance to next player index */
export function getNextPlayerIndex(
  currentIndex: number, direction: Direction, playerCount: number, skip: number = 1
): number {
  const step = direction === 'clockwise' ? skip : -skip;
  return ((currentIndex + step) % playerCount + playerCount) % playerCount;
}

/** Reverse direction */
export function reverseDirection(direction: Direction): Direction {
  return direction === 'clockwise' ? 'counter_clockwise' : 'clockwise';
}

/** Calculate points for remaining cards in hand */
export function calculateHandPoints(hand: Card[]): number {
  return hand.reduce((total, card) => {
    if (typeof card.value === 'number') return total + card.value;
    return total + (CARD_POINTS[card.value] || 0);
  }, 0);
}

/** Calculate round scores — winner gets sum of opponents' hand points */
export function calculateRoundScores(players: Player[], winnerId: string): Record<string, number> {
  const scores: Record<string, number> = {};
  let winnerPoints = 0;
  for (const player of players) {
    if (player.id !== winnerId) {
      winnerPoints += calculateHandPoints(player.hand);
    }
    scores[player.id] = 0;
  }
  scores[winnerId] = winnerPoints;
  return scores;
}

/** Check if a Jump-In is valid (same color AND value) */
export function canJumpIn(card: Card, topCard: Card): boolean {
  return card.color === topCard.color && card.value === topCard.value;
}

/** Apply the effect of an action card — returns partial state updates */
export function getCardEffect(card: Card, state: GameState): Partial<GameState> {
  const updates: Partial<GameState> = {};
  const pc = state.players.length;

  switch (card.value) {
    case 'skip':
      updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc, 2);
      break;
    case 'reverse':
      updates.direction = reverseDirection(state.direction);
      if (pc === 2) {
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, reverseDirection(state.direction), pc, 2);
      } else {
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, reverseDirection(state.direction), pc);
      }
      break;
    case 'draw2':
      if (state.settings.houseRules.stacking) {
        updates.stackCount = state.stackCount + 2;
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc);
      } else {
        updates.stackCount = 0;
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc, 2);
      }
      break;
    case 'wild_draw4':
      if (state.settings.houseRules.stacking) {
        updates.stackCount = state.stackCount + 4;
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc);
      } else {
        updates.stackCount = 0;
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc, 2);
      }
      break;
    case 'wild':
      updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc);
      break;
    case 'flip':
      updates.currentSide = state.currentSide === 'light' ? 'dark' : 'light';
      updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc);
      break;
    case 'skip_everyone':
      break; // Current player goes again
    case 'draw5':
      if (state.settings.houseRules.stacking) {
        updates.stackCount = state.stackCount + 5;
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc);
      } else {
        updates.stackCount = 0;
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc, 2);
      }
      break;
    default:
      if (typeof card.value === 'number') {
        updates.currentPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.direction, pc);
      }
      break;
  }
  return updates;
}
