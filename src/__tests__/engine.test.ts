/**
 * UNO Arena — Engine Integration Tests
 * Tests game initialization, turn flow, action card effects, UNO mechanics, and scoring
 */

import {
  createInitialGameState,
  playCard,
  drawCard,
  callUno,
  challengeUno,
  passTurn,
  checkGameOver,
} from '../game/engine';
import { Card, Player, GameSettings, DEFAULT_GAME_SETTINGS, DEFAULT_HOUSE_RULES } from '../types/game';

// ── Helpers ──────────────────────────────────────────────

function makePlayer(id: string, hand: Card[] = [], score = 0): Player {
  return {
    id, name: id, avatar: '🦊', type: 'human',
    hand, score, isReady: true, isConnected: true, hasCalledUno: false,
  };
}

function makeCard(color: Card['color'], value: Card['value'], id?: string): Card {
  return { id: id || `${color}-${value}-${Math.random()}`, color, value };
}

const testPlayers: Player[] = [
  makePlayer('p0'), makePlayer('p1'),
  makePlayer('p2'), makePlayer('p3'),
];

// ── createInitialGameState ───────────────────────────────

describe('createInitialGameState', () => {
  const state = createInitialGameState(testPlayers);

  test('initializes with correct number of players', () => {
    expect(state.players).toHaveLength(4);
  });

  test('deals 7 cards to each player by default', () => {
    for (const player of state.players) {
      expect(player.hand).toHaveLength(7);
    }
  });

  test('sets phase to playing', () => {
    expect(state.phase).toBe('playing');
  });

  test('starts with 1 card in discard pile', () => {
    expect(state.discardPile).toHaveLength(1);
  });

  test('draw pile has remaining cards (108 - 28 dealt - 1 discard = 79)', () => {
    // Could be 79 or slightly less if starting card was buried
    expect(state.drawPile.length).toBeGreaterThanOrEqual(78);
    expect(state.drawPile.length).toBeLessThanOrEqual(80);
  });

  test('starting card is not a wild_draw4', () => {
    expect(state.discardPile[0].value).not.toBe('wild_draw4');
  });

  test('currentColor is set correctly', () => {
    const startCard = state.discardPile[0];
    if (startCard.color === 'wild') {
      expect(state.currentColor).toBe('red'); // Default wild color
    } else {
      expect(state.currentColor).toBe(startCard.color);
    }
  });

  test('direction defaults to clockwise', () => {
    expect(state.direction).toBe('clockwise');
  });
});

// ── playCard ─────────────────────────────────────────────

describe('playCard', () => {
  test('removes card from player hand and adds to discard', () => {
    const card = makeCard('red', 5, 'card-1');
    const players = [
      makePlayer('p0', [card, makeCard('blue', 3, 'card-2')]),
      makePlayer('p1', [makeCard('green', 7, 'card-3')]),
    ];
    const state = createTestState(players, makeCard('red', 2, 'top'), 'red');

    const newState = playCard(state, 'p0', 'card-1');
    expect(newState.players[0].hand).toHaveLength(1);
    expect(newState.discardPile[newState.discardPile.length - 1].id).toBe('card-1');
  });

  test('does not allow play from wrong player', () => {
    const card = makeCard('red', 5, 'card-1');
    const players = [
      makePlayer('p0', [card]),
      makePlayer('p1', [makeCard('red', 3, 'card-2')]),
    ];
    const state = createTestState(players, makeCard('red', 2, 'top'), 'red');

    // p1 tries to play when it's p0's turn
    const newState = playCard(state, 'p1', 'card-2');
    expect(newState).toBe(state); // unchanged
  });

  test('does not allow unplayable card', () => {
    const card = makeCard('blue', 3, 'card-1');
    const players = [
      makePlayer('p0', [card]),
      makePlayer('p1'),
    ];
    const state = createTestState(players, makeCard('red', 5, 'top'), 'red');

    const newState = playCard(state, 'p0', 'card-1');
    expect(newState).toBe(state); // unchanged
  });

  test('wild card sets chosen color', () => {
    const wild = makeCard('wild', 'wild', 'wild-1');
    const players = [
      makePlayer('p0', [wild, makeCard('red', 3, 'card-2')]),
      makePlayer('p1'),
    ];
    const state = createTestState(players, makeCard('red', 5, 'top'), 'red');

    const newState = playCard(state, 'p0', 'wild-1', 'blue');
    expect(newState.currentColor).toBe('blue');
  });

  test('sets phase to round_end when player empties hand', () => {
    const card = makeCard('red', 5, 'last-card');
    const players = [
      makePlayer('p0', [card]),
      makePlayer('p1', [makeCard('blue', 3)]),
    ];
    const state = createTestState(players, makeCard('red', 2, 'top'), 'red');

    const newState = playCard(state, 'p0', 'last-card');
    expect(newState.phase).toBe('round_end');
    expect(newState.winner).toBe('p0');
  });
});

// ── drawCard ─────────────────────────────────────────────

describe('drawCard', () => {
  test('adds a card to player hand from draw pile', () => {
    const drawnCard = makeCard('green', 8, 'draw-1');
    const players = [
      makePlayer('p0', [makeCard('blue', 3)]),
      makePlayer('p1'),
    ];
    const state = createTestState(players, makeCard('red', 5, 'top'), 'red');
    state.drawPile = [drawnCard, makeCard('yellow', 2)];

    const newState = drawCard(state, 'p0');
    expect(newState.players[0].hand).toHaveLength(2);
    expect(newState.drawPile).toHaveLength(1);
  });

  test('draws stackCount cards when stack is active', () => {
    const players = [
      makePlayer('p0', [makeCard('blue', 3)]),
      makePlayer('p1'),
    ];
    const state = createTestState(players, makeCard('red', 'draw2', 'top'), 'red');
    state.stackCount = 4;
    state.drawPile = [
      makeCard('red', 1), makeCard('red', 2),
      makeCard('red', 3), makeCard('red', 4),
      makeCard('red', 5),
    ];

    const newState = drawCard(state, 'p0');
    expect(newState.players[0].hand).toHaveLength(5); // 1 original + 4 drawn
    expect(newState.stackCount).toBe(0);
  });
});

// ── callUno / challengeUno ───────────────────────────────

describe('callUno', () => {
  test('sets hasCalledUno flag on the player', () => {
    const players = [
      makePlayer('p0', [makeCard('red', 5)]),
      makePlayer('p1'),
    ];
    const state = createTestState(players, makeCard('red', 2, 'top'), 'red');

    const newState = callUno(state, 'p0');
    expect(newState.players[0].hasCalledUno).toBe(true);
  });
});

describe('challengeUno', () => {
  test('target draws 2 penalty cards if they forgot to call UNO', () => {
    const players = [
      makePlayer('p0', [makeCard('red', 5)]),
      makePlayer('p1', [makeCard('blue', 3)]),
    ];
    const state = createTestState(players, makeCard('red', 2, 'top'), 'red');
    state.drawPile = [makeCard('green', 1), makeCard('green', 2), makeCard('green', 3)];
    // p0 has 1 card but hasn't called UNO

    const newState = challengeUno(state, 'p1', 'p0');
    expect(newState.players[0].hand).toHaveLength(3); // 1 + 2 penalty
  });

  test('no penalty if target already called UNO', () => {
    const players = [
      { ...makePlayer('p0', [makeCard('red', 5)]), hasCalledUno: true },
      makePlayer('p1'),
    ];
    const state = createTestState(players, makeCard('red', 2, 'top'), 'red');
    state.drawPile = [makeCard('green', 1), makeCard('green', 2)];

    const newState = challengeUno(state, 'p1', 'p0');
    expect(newState.players[0].hand).toHaveLength(1); // unchanged
  });
});

// ── passTurn ─────────────────────────────────────────────

describe('passTurn', () => {
  test('advances to next player', () => {
    const players = [makePlayer('p0'), makePlayer('p1'), makePlayer('p2')];
    const state = createTestState(players, makeCard('red', 5, 'top'), 'red');

    const newState = passTurn(state, 'p0');
    expect(newState.currentPlayerIndex).toBe(1);
  });

  test('does nothing if wrong player tries to pass', () => {
    const players = [makePlayer('p0'), makePlayer('p1')];
    const state = createTestState(players, makeCard('red', 5, 'top'), 'red');

    const newState = passTurn(state, 'p1'); // p1 tries but it's p0's turn
    expect(newState).toBe(state);
  });
});

// ── checkGameOver ────────────────────────────────────────

describe('checkGameOver', () => {
  test('accumulates round scores for players', () => {
    const players = [
      makePlayer('p0', [], 0),
      makePlayer('p1', [makeCard('wild', 'wild')], 0), // 50 pts left
    ];
    const state = createTestState(players, makeCard('red', 5, 'top'), 'red');
    state.phase = 'round_end';
    state.winner = 'p0';

    const newState = checkGameOver(state);
    expect(newState.players[0].score).toBe(50); // winner gets opponent's hand value
  });

  test('transitions to game_over when target score reached', () => {
    const players = [
      makePlayer('p0', [], 490),
      makePlayer('p1', [makeCard('wild', 'wild')], 0), // 50 pts → winner reaches 540
    ];
    const state = createTestState(players, makeCard('red', 5, 'top'), 'red');
    state.phase = 'round_end';
    state.winner = 'p0';

    const newState = checkGameOver(state);
    expect(newState.phase).toBe('game_over');
    expect(newState.winner).toBe('p0');
  });
});

// ── Test State Factory ───────────────────────────────────

function createTestState(
  players: Player[],
  topDiscard: Card,
  currentColor: Card['color'],
): any {
  return {
    id: 'test-game',
    phase: 'playing' as const,
    settings: DEFAULT_GAME_SETTINGS,
    players,
    currentPlayerIndex: 0,
    direction: 'clockwise' as const,
    drawPile: [] as Card[],
    discardPile: [topDiscard],
    currentColor,
    stackCount: 0,
    currentSide: 'light' as const,
    roundNumber: 1,
  };
}
