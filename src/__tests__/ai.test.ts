/**
 * UNO Arena — AI Bot Unit Tests
 * Tests bot decision-making across all difficulty levels
 */

import { botDecide, shouldBotCallUno, getBotDelay } from '../game/ai';
import { Card, GameState, Player, DEFAULT_GAME_SETTINGS, DEFAULT_HOUSE_RULES, CardColor } from '../types/game';

// ── Helpers ──────────────────────────────────────────────

function makeCard(color: Card['color'], value: Card['value'], id?: string): Card {
  return { id: id || `${color}-${value}-${Math.random()}`, color, value };
}

function makePlayer(id: string, hand: Card[], opts: Partial<Player> = {}): Player {
  return {
    id, name: id, avatar: '🦊', type: 'bot', botDifficulty: 'medium',
    hand, score: 0, isReady: true, isConnected: true, hasCalledUno: false,
    ...opts,
  };
}

function createTestState(players: Player[], topDiscard: Card, currentColor: CardColor): GameState {
  return {
    id: 'test', phase: 'playing', settings: DEFAULT_GAME_SETTINGS,
    players, currentPlayerIndex: 0, direction: 'clockwise',
    drawPile: [], discardPile: [topDiscard], currentColor,
    stackCount: 0, currentSide: 'light', roundNumber: 1,
  };
}

// ── botDecide — General ──────────────────────────────────

describe('botDecide', () => {
  test('returns draw when no playable cards exist', () => {
    const bot = makePlayer('bot', [
      makeCard('blue', 3),
      makeCard('green', 7),
    ], { botDifficulty: 'easy' });

    const state = createTestState(
      [bot, makePlayer('p1', [])],
      makeCard('red', 5, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.action).toBe('draw');
  });

  test('returns play with a valid cardId when cards are playable', () => {
    const playable = makeCard('red', 3, 'red3');
    const bot = makePlayer('bot', [
      playable,
      makeCard('blue', 7),
    ], { botDifficulty: 'easy' });

    const state = createTestState(
      [bot, makePlayer('p1', [])],
      makeCard('red', 5, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.action).toBe('play');
    expect(decision.cardId).toBeDefined();
  });
});

// ── Easy Bot ─────────────────────────────────────────────

describe('Easy bot', () => {
  test('plays the first playable card', () => {
    const card1 = makeCard('red', 1, 'r1');
    const card2 = makeCard('red', 9, 'r9');
    const bot = makePlayer('bot', [card1, card2], { botDifficulty: 'easy' });

    const state = createTestState(
      [bot, makePlayer('p1', [])],
      makeCard('red', 5, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.action).toBe('play');
    expect(decision.cardId).toBe('r1'); // first playable
  });

  test('chooses a color when playing wild', () => {
    const wild = makeCard('wild', 'wild', 'w1');
    const bot = makePlayer('bot', [wild], { botDifficulty: 'easy' });

    const state = createTestState(
      [bot, makePlayer('p1', [])],
      makeCard('red', 5, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.action).toBe('play');
    expect(decision.chosenColor).toBeDefined();
    expect(['red', 'blue', 'green', 'yellow']).toContain(decision.chosenColor);
  });
});

// ── Medium Bot ───────────────────────────────────────────

describe('Medium bot', () => {
  test('prefers high-value number cards over low ones', () => {
    const low = makeCard('red', 1, 'r1');
    const high = makeCard('red', 9, 'r9');
    const bot = makePlayer('bot', [low, high], { botDifficulty: 'medium' });

    const state = createTestState(
      [bot, makePlayer('p1', [])],
      makeCard('red', 5, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.cardId).toBe('r9'); // higher value first
  });

  test('saves wild cards when non-wilds are available', () => {
    const wild = makeCard('wild', 'wild', 'w1');
    const normal = makeCard('red', 5, 'r5');
    const bot = makePlayer('bot', [wild, normal], { botDifficulty: 'medium' });

    const state = createTestState(
      [bot, makePlayer('p1', [])],
      makeCard('red', 3, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.cardId).toBe('r5'); // prefers non-wild
  });

  test('picks best color for wild based on hand composition', () => {
    const wild = makeCard('wild', 'wild', 'w1');
    const bot = makePlayer('bot', [
      wild,
      makeCard('blue', 1), makeCard('blue', 2), makeCard('blue', 3),
      makeCard('red', 1),
    ], { botDifficulty: 'medium' });

    // Only wild is playable (green top, no greens in hand)
    const state = createTestState(
      [bot, makePlayer('p1', [])],
      makeCard('green', 9, 'top'),
      'green',
    );

    const decision = botDecide(state, bot);
    expect(decision.chosenColor).toBe('blue'); // most cards in hand
  });
});

// ── Hard Bot ─────────────────────────────────────────────

describe('Hard bot', () => {
  test('uses action cards against danger player who is next', () => {
    const skip = makeCard('red', 'skip', 'skip1');
    const num = makeCard('red', 5, 'r5');
    const bot = makePlayer('bot', [skip, num], { botDifficulty: 'hard' });
    const danger = makePlayer('danger', [makeCard('blue', 1)], { type: 'human' }); // 1 card!

    // bot is index 0 (current), danger is index 1 (next in clockwise)
    const state = createTestState(
      [bot, danger, makePlayer('p2', [makeCard('red', 1), makeCard('red', 2), makeCard('red', 3)])],
      makeCard('red', 3, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.cardId).toBe('skip1'); // targets danger player
  });

  test('saves wilds when down to 2 cards', () => {
    const wild = makeCard('wild', 'wild', 'w1');
    const normal = makeCard('red', 5, 'r5');
    const bot = makePlayer('bot', [wild, normal], { botDifficulty: 'hard' });

    const state = createTestState(
      [bot, makePlayer('p1', [makeCard('blue', 1), makeCard('blue', 2)])],
      makeCard('red', 3, 'top'),
      'red',
    );

    const decision = botDecide(state, bot);
    expect(decision.cardId).toBe('r5'); // saves wild for last card
  });
});

// ── shouldBotCallUno ─────────────────────────────────────

describe('shouldBotCallUno', () => {
  test('hard bot always calls UNO', () => {
    // Run multiple times to confirm deterministic
    for (let i = 0; i < 20; i++) {
      expect(shouldBotCallUno('hard')).toBe(true);
    }
  });

  test('easy/medium bot sometimes forgets (probabilistic)', () => {
    // With enough iterations, easy bot should forget at least once
    let forgotCount = 0;
    for (let i = 0; i < 100; i++) {
      if (!shouldBotCallUno('easy')) forgotCount++;
    }
    expect(forgotCount).toBeGreaterThan(0);
  });
});

// ── getBotDelay ──────────────────────────────────────────

describe('getBotDelay', () => {
  test('easy bot delay is in range 1000-2500ms', () => {
    for (let i = 0; i < 20; i++) {
      const delay = getBotDelay('easy');
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(2500);
    }
  });

  test('hard bot delay is faster (400-1000ms)', () => {
    for (let i = 0; i < 20; i++) {
      const delay = getBotDelay('hard');
      expect(delay).toBeGreaterThanOrEqual(400);
      expect(delay).toBeLessThanOrEqual(1000);
    }
  });

  test('hard bot is generally faster than easy bot', () => {
    const hardDelays = Array.from({ length: 50 }, () => getBotDelay('hard'));
    const easyDelays = Array.from({ length: 50 }, () => getBotDelay('easy'));
    const avgHard = hardDelays.reduce((s, d) => s + d, 0) / 50;
    const avgEasy = easyDelays.reduce((s, d) => s + d, 0) / 50;
    expect(avgHard).toBeLessThan(avgEasy);
  });
});
