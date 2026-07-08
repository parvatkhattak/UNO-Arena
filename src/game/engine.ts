/**
 * UNO Arena — Game Engine
 * Core game loop, turn management, and state transitions
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GameState, GameAction, GamePhase, Player, Card, CardColor,
  GameSettings, DEFAULT_GAME_SETTINGS, Direction,
} from '../types/game';
import { createDeck, dealCards, findStartingCard, recycleDiscardPile } from './deck';
import {
  canPlayCard, getCardEffect, getNextPlayerIndex,
  calculateRoundScores, hasPlayableCard,
} from './actions';

/** Initialize a new game */
export function createInitialGameState(
  players: Player[],
  settings: GameSettings = DEFAULT_GAME_SETTINGS
): GameState {
  const deck = createDeck(settings.mode);
  const [hands, remainingDeck] = dealCards(deck, players.length, settings.initialCards);
  const [startCard, drawPile] = findStartingCard(remainingDeck);

  const playersWithHands = players.map((p, i) => ({ ...p, hand: hands[i], hasCalledUno: false }));

  const startColor: CardColor = startCard.color === 'wild' ? 'red' : startCard.color as CardColor;

  const state: GameState = {
    id: uuidv4(),
    phase: 'playing',
    settings,
    players: playersWithHands,
    currentPlayerIndex: 0,
    direction: 'clockwise',
    drawPile,
    discardPile: [startCard],
    currentColor: startColor,
    stackCount: 0,
    currentSide: 'light',
    roundNumber: 1,
  };

  // Apply starting card effect if it's an action card
  if (typeof startCard.value !== 'number' && startCard.value !== 'wild' && startCard.value !== 'wild_draw4') {
    const effect = getCardEffect(startCard, state);
    return { ...state, ...effect };
  }

  return state;
}

/** Process a PLAY_CARD action */
export function playCard(state: GameState, playerId: string, cardId: string, chosenColor?: CardColor): GameState {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1 || playerIndex !== state.currentPlayerIndex) return state;

  const player = state.players[playerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  if (!canPlayCard(card, topCard, state.currentColor, state.settings.houseRules, state.stackCount)) {
    return state;
  }

  // Remove card from hand
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand, hasCalledUno: false } : p
  );

  // Update discard pile
  const newDiscardPile = [...state.discardPile, card];

  // Determine new color
  let newColor = state.currentColor;
  if (card.color === 'wild') {
    newColor = chosenColor || 'red';
  } else {
    newColor = card.color as CardColor;
  }

  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    discardPile: newDiscardPile,
    currentColor: newColor,
    lastAction: { type: 'PLAY_CARD', playerId, timestamp: Date.now(), payload: { cardId } },
  };

  // Apply card effects
  const effects = getCardEffect(card, newState);
  newState = { ...newState, ...effects };

  // Check for winner
  if (newHand.length === 0) {
    newState.phase = 'round_end';
    newState.winner = playerId;
  }

  return newState;
}

/** Process a DRAW_CARD action */
export function drawCard(state: GameState, playerId: string): GameState {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return state;

  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];

  // Recycle discard if draw pile is empty
  if (drawPile.length === 0) {
    const [recycled, newDiscard] = recycleDiscardPile(discardPile);
    drawPile = recycled;
    discardPile = newDiscard;
  }

  if (drawPile.length === 0) return state; // Edge case: no cards at all

  // Determine how many cards to draw
  let drawCount = 1;
  if (state.stackCount > 0) {
    drawCount = state.stackCount;
  }

  // Draw until can play (house rule) or just draw specified count
  const drawnCards: Card[] = [];
  for (let i = 0; i < drawCount && drawPile.length > 0; i++) {
    drawnCards.push(drawPile.shift()!);
    if (drawPile.length === 0 && i < drawCount - 1) {
      const [recycled, newDiscard] = recycleDiscardPile(discardPile);
      drawPile = recycled;
      discardPile = newDiscard;
    }
  }

  const newHand = [...state.players[playerIndex].hand, ...drawnCards];
  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand, hasCalledUno: false } : p
  );

  // After drawing due to stack, advance to next player
  const nextIndex = state.stackCount > 0
    ? getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length)
    : state.currentPlayerIndex; // Stay on same player if they just drew 1

  return {
    ...state,
    players: updatedPlayers,
    drawPile,
    discardPile,
    stackCount: 0,
    currentPlayerIndex: nextIndex,
    lastAction: { type: 'DRAW_CARD', playerId, timestamp: Date.now() },
  };
}

/** Call UNO — player must call when they have 1 card */
export function callUno(state: GameState, playerId: string): GameState {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return state;

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hasCalledUno: true } : p
  );

  return {
    ...state,
    players: updatedPlayers,
    lastAction: { type: 'CALL_UNO', playerId, timestamp: Date.now() },
  };
}

/** Challenge UNO — catch someone who forgot to call UNO (penalty: draw 2) */
export function challengeUno(state: GameState, challengerId: string, targetId: string): GameState {
  const targetIndex = state.players.findIndex(p => p.id === targetId);
  if (targetIndex === -1) return state;

  const target = state.players[targetIndex];
  if (target.hand.length !== 1 || target.hasCalledUno) return state;

  // Target must draw 2 penalty cards
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];
  const penaltyCards: Card[] = [];

  for (let i = 0; i < 2; i++) {
    if (drawPile.length === 0) {
      const [recycled, newDiscard] = recycleDiscardPile(discardPile);
      drawPile = recycled;
      discardPile = newDiscard;
    }
    if (drawPile.length > 0) penaltyCards.push(drawPile.shift()!);
  }

  const updatedPlayers = state.players.map((p, i) =>
    i === targetIndex ? { ...p, hand: [...p.hand, ...penaltyCards] } : p
  );

  return {
    ...state,
    players: updatedPlayers,
    drawPile,
    discardPile,
    lastAction: { type: 'CHALLENGE_UNO', playerId: challengerId, timestamp: Date.now(), payload: { targetPlayerId: targetId } },
  };
}

/** Pass turn (after drawing, if player chooses not to play) */
export function passTurn(state: GameState, playerId: string): GameState {
  if (state.players[state.currentPlayerIndex]?.id !== playerId) return state;

  return {
    ...state,
    currentPlayerIndex: getNextPlayerIndex(state.currentPlayerIndex, state.direction, state.players.length),
    lastAction: { type: 'PASS', playerId, timestamp: Date.now() },
  };
}

/** Check if the round/game is over */
export function checkGameOver(state: GameState): GameState {
  if (state.phase !== 'round_end' || !state.winner) return state;

  const roundScores = calculateRoundScores(state.players, state.winner);

  // Update cumulative scores
  const updatedPlayers = state.players.map(p => ({
    ...p,
    score: (p.score ?? 0) + (roundScores[p.id] ?? 0),
  }));

  // Check if any player reached target score
  const gameWinner = updatedPlayers.find(p => p.score >= state.settings.targetScore);

  if (gameWinner) {
    return { ...state, players: updatedPlayers, phase: 'game_over', winner: gameWinner.id };
  }

  return { ...state, players: updatedPlayers };
}
