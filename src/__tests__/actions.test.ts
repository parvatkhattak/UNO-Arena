/**
 * UNO Arena — Actions Unit Tests
 * Tests card play validation, effects, scoring, and house rules
 */

import {
  canPlayCard,
  hasPlayableCard,
  getPlayableCards,
  isWildDraw4Legit,
  getNextPlayerIndex,
  reverseDirection,
  calculateHandPoints,
  calculateRoundScores,
  canJumpIn,
  getCardEffect,
} from '../game/actions';
import { Card, HouseRules, DEFAULT_HOUSE_RULES, GameState, DEFAULT_GAME_SETTINGS, Player } from '../types/game';

// ── Helpers ──────────────────────────────────────────────

function makeCard(color: Card['color'], value: Card['value'], id?: string): Card {
  return { id: id || `${color}-${value}`, color, value };
}

function makePlayer(id: string, hand: Card[], score = 0): Player {
  return {
    id, name: id, avatar: '🦊', type: 'human',
    hand, score, isReady: true, isConnected: true, hasCalledUno: false,
  };
}

const noStack: HouseRules = { ...DEFAULT_HOUSE_RULES, stacking: false };
const withStack: HouseRules = { ...DEFAULT_HOUSE_RULES, stacking: true };

// ── canPlayCard ──────────────────────────────────────────

describe('canPlayCard', () => {
  const topRed5 = makeCard('red', 5);

  test('matching color is playable', () => {
    expect(canPlayCard(makeCard('red', 3), topRed5, 'red', noStack, 0)).toBe(true);
  });

  test('matching number is playable', () => {
    expect(canPlayCard(makeCard('blue', 5), topRed5, 'red', noStack, 0)).toBe(true);
  });

  test('different color and number is not playable', () => {
    expect(canPlayCard(makeCard('blue', 3), topRed5, 'red', noStack, 0)).toBe(false);
  });

  test('wild card is always playable', () => {
    expect(canPlayCard(makeCard('wild', 'wild'), topRed5, 'red', noStack, 0)).toBe(true);
  });

  test('wild draw 4 is always playable', () => {
    expect(canPlayCard(makeCard('wild', 'wild_draw4'), topRed5, 'red', noStack, 0)).toBe(true);
  });

  test('matches current color (not top card color)', () => {
    // Top card is red 5, but current color changed to blue (via wild)
    expect(canPlayCard(makeCard('blue', 9), topRed5, 'blue', noStack, 0)).toBe(true);
    expect(canPlayCard(makeCard('red', 9), topRed5, 'blue', noStack, 0)).toBe(false);
  });
});

describe('canPlayCard with stacking', () => {
  test('only draw2 can be played on draw2 during stack', () => {
    const topDraw2 = makeCard('red', 'draw2');
    expect(canPlayCard(makeCard('blue', 'draw2'), topDraw2, 'red', withStack, 2)).toBe(true);
    expect(canPlayCard(makeCard('red', 5), topDraw2, 'red', withStack, 2)).toBe(false);
    expect(canPlayCard(makeCard('wild', 'wild'), topDraw2, 'red', withStack, 2)).toBe(false);
  });

  test('only wild_draw4 can be played on wild_draw4 during stack', () => {
    const topWD4 = makeCard('wild', 'wild_draw4');
    expect(canPlayCard(makeCard('wild', 'wild_draw4'), topWD4, 'red', withStack, 4)).toBe(true);
    expect(canPlayCard(makeCard('red', 5), topWD4, 'red', withStack, 4)).toBe(false);
  });

  test('normal play when stack is 0 even with stacking enabled', () => {
    const topDraw2 = makeCard('red', 'draw2');
    expect(canPlayCard(makeCard('red', 5), topDraw2, 'red', withStack, 0)).toBe(true);
  });
});

// ── hasPlayableCard / getPlayableCards ────────────────────

describe('hasPlayableCard', () => {
  test('returns true if any card matches', () => {
    const hand = [makeCard('blue', 3), makeCard('red', 7)];
    const top = makeCard('red', 5);
    expect(hasPlayableCard(hand, top, 'red', noStack, 0)).toBe(true);
  });

  test('returns false if no card matches', () => {
    const hand = [makeCard('blue', 3), makeCard('green', 7)];
    const top = makeCard('red', 5);
    expect(hasPlayableCard(hand, top, 'red', noStack, 0)).toBe(false);
  });
});

describe('getPlayableCards', () => {
  test('filters to only playable cards', () => {
    const hand = [
      makeCard('red', 3),
      makeCard('blue', 5),
      makeCard('green', 8),
      makeCard('wild', 'wild'),
    ];
    const top = makeCard('red', 5);
    const playable = getPlayableCards(hand, top, 'red', noStack, 0);
    expect(playable).toHaveLength(3); // red-3, blue-5, wild
  });
});

// ── isWildDraw4Legit ─────────────────────────────────────

describe('isWildDraw4Legit', () => {
  test('legit when no cards match current color', () => {
    const hand = [makeCard('blue', 3), makeCard('wild', 'wild_draw4')];
    expect(isWildDraw4Legit(hand, 'red')).toBe(true);
  });

  test('not legit when player has matching color', () => {
    const hand = [makeCard('red', 3), makeCard('wild', 'wild_draw4')];
    expect(isWildDraw4Legit(hand, 'red')).toBe(false);
  });
});

// ── getNextPlayerIndex ───────────────────────────────────

describe('getNextPlayerIndex', () => {
  test('clockwise advances by 1', () => {
    expect(getNextPlayerIndex(0, 'clockwise', 4)).toBe(1);
    expect(getNextPlayerIndex(3, 'clockwise', 4)).toBe(0); // wraps
  });

  test('counter-clockwise goes back by 1', () => {
    expect(getNextPlayerIndex(1, 'counter_clockwise', 4)).toBe(0);
    expect(getNextPlayerIndex(0, 'counter_clockwise', 4)).toBe(3); // wraps
  });

  test('skip=2 skips a player', () => {
    expect(getNextPlayerIndex(0, 'clockwise', 4, 2)).toBe(2);
  });
});

// ── reverseDirection ─────────────────────────────────────

describe('reverseDirection', () => {
  test('clockwise becomes counter_clockwise', () => {
    expect(reverseDirection('clockwise')).toBe('counter_clockwise');
  });

  test('counter_clockwise becomes clockwise', () => {
    expect(reverseDirection('counter_clockwise')).toBe('clockwise');
  });
});

// ── Scoring ──────────────────────────────────────────────

describe('calculateHandPoints', () => {
  test('sums number card values', () => {
    const hand = [makeCard('red', 5), makeCard('blue', 3)];
    expect(calculateHandPoints(hand)).toBe(8);
  });

  test('action cards are 20 points', () => {
    const hand = [makeCard('red', 'skip'), makeCard('blue', 'reverse')];
    expect(calculateHandPoints(hand)).toBe(40);
  });

  test('wild cards are 50 points', () => {
    const hand = [makeCard('wild', 'wild'), makeCard('wild', 'wild_draw4')];
    expect(calculateHandPoints(hand)).toBe(100);
  });

  test('mixed hand sums correctly', () => {
    const hand = [
      makeCard('red', 7),          // 7
      makeCard('blue', 'draw2'),   // 20
      makeCard('wild', 'wild'),    // 50
    ];
    expect(calculateHandPoints(hand)).toBe(77);
  });
});

describe('calculateRoundScores', () => {
  test('winner gets sum of all opponents hand points', () => {
    const players: Player[] = [
      makePlayer('p1', []),                                        // winner, empty hand
      makePlayer('p2', [makeCard('red', 5), makeCard('blue', 3)]),  // 8 pts
      makePlayer('p3', [makeCard('wild', 'wild')]),                 // 50 pts
    ];
    const scores = calculateRoundScores(players, 'p1');
    expect(scores['p1']).toBe(58);
    expect(scores['p2']).toBe(0);
    expect(scores['p3']).toBe(0);
  });
});

// ── canJumpIn ────────────────────────────────────────────

describe('canJumpIn', () => {
  test('same color AND value is valid jump-in', () => {
    expect(canJumpIn(makeCard('red', 5), makeCard('red', 5))).toBe(true);
  });

  test('same color different value is NOT valid', () => {
    expect(canJumpIn(makeCard('red', 3), makeCard('red', 5))).toBe(false);
  });

  test('same value different color is NOT valid', () => {
    expect(canJumpIn(makeCard('blue', 5), makeCard('red', 5))).toBe(false);
  });
});

// ── getCardEffect ────────────────────────────────────────

describe('getCardEffect', () => {
  const baseState: GameState = {
    id: 'test', phase: 'playing', settings: DEFAULT_GAME_SETTINGS,
    players: [
      makePlayer('p0', []), makePlayer('p1', []),
      makePlayer('p2', []), makePlayer('p3', []),
    ],
    currentPlayerIndex: 0, direction: 'clockwise',
    drawPile: [], discardPile: [], currentColor: 'red',
    stackCount: 0, currentSide: 'light', roundNumber: 1,
  };

  test('skip card skips next player', () => {
    const effect = getCardEffect(makeCard('red', 'skip'), baseState);
    expect(effect.currentPlayerIndex).toBe(2);
  });

  test('reverse card changes direction', () => {
    const effect = getCardEffect(makeCard('red', 'reverse'), baseState);
    expect(effect.direction).toBe('counter_clockwise');
  });

  test('draw2 without stacking skips next player', () => {
    const effect = getCardEffect(makeCard('red', 'draw2'), baseState);
    expect(effect.currentPlayerIndex).toBe(1); // next player must act (draw)
  });

  test('draw2 with stacking accumulates stack', () => {
    const stackState = {
      ...baseState,
      settings: { ...DEFAULT_GAME_SETTINGS, houseRules: withStack },
    };
    const effect = getCardEffect(makeCard('red', 'draw2'), stackState);
    expect(effect.stackCount).toBe(2);
    expect(effect.currentPlayerIndex).toBe(1); // doesn't skip — next player must respond
  });

  test('number card advances to next player', () => {
    const effect = getCardEffect(makeCard('red', 5), baseState);
    expect(effect.currentPlayerIndex).toBe(1);
  });

  test('flip card toggles currentSide', () => {
    const effect = getCardEffect(makeCard('red', 'flip'), baseState);
    expect(effect.currentSide).toBe('dark');
  });
});
