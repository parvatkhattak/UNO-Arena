/**
 * UNO Arena — Game Store (Zustand)
 * Central state management for the game
 */

import { create } from 'zustand';
import {
  GameState, GameSettings, Player, Card, CardColor,
  DEFAULT_GAME_SETTINGS, GamePhase,
} from '../types/game';
import {
  createInitialGameState, playCard, drawCard,
  callUno, challengeUno, passTurn, checkGameOver,
} from '../game/engine';

interface GameStore {
  // State
  gameState: GameState | null;
  isMyTurn: boolean;
  selectedCard: Card | null;
  showColorPicker: boolean;

  // Actions
  initGame: (players: Player[], settings?: GameSettings) => void;
  playCardAction: (playerId: string, cardId: string, chosenColor?: CardColor) => void;
  drawCardAction: (playerId: string) => void;
  callUnoAction: (playerId: string) => void;
  challengeUnoAction: (challengerId: string, targetId: string) => void;
  passTurnAction: (playerId: string) => void;
  setSelectedCard: (card: Card | null) => void;
  setShowColorPicker: (show: boolean) => void;
  resetGame: () => void;
  updateGameState: (state: GameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isMyTurn: false,
  selectedCard: null,
  showColorPicker: false,

  initGame: (players, settings = DEFAULT_GAME_SETTINGS) => {
    const gameState = createInitialGameState(players, settings);
    set({ gameState, isMyTurn: gameState.currentPlayerIndex === 0 });
  },

  playCardAction: (playerId, cardId, chosenColor) => {
    const { gameState } = get();
    if (!gameState) return;
    let newState = playCard(gameState, playerId, cardId, chosenColor);
    newState = checkGameOver(newState);
    set({
      gameState: newState,
      isMyTurn: newState.players[newState.currentPlayerIndex]?.id === playerId,
      selectedCard: null,
      showColorPicker: false,
    });
  },

  drawCardAction: (playerId) => {
    const { gameState } = get();
    if (!gameState) return;
    const newState = drawCard(gameState, playerId);
    set({
      gameState: newState,
      isMyTurn: newState.players[newState.currentPlayerIndex]?.id === playerId,
    });
  },

  callUnoAction: (playerId) => {
    const { gameState } = get();
    if (!gameState) return;
    set({ gameState: callUno(gameState, playerId) });
  },

  challengeUnoAction: (challengerId, targetId) => {
    const { gameState } = get();
    if (!gameState) return;
    set({ gameState: challengeUno(gameState, challengerId, targetId) });
  },

  passTurnAction: (playerId) => {
    const { gameState } = get();
    if (!gameState) return;
    const newState = passTurn(gameState, playerId);
    set({
      gameState: newState,
      isMyTurn: newState.players[newState.currentPlayerIndex]?.id === playerId,
    });
  },

  setSelectedCard: (card) => set({ selectedCard: card }),
  setShowColorPicker: (show) => set({ showColorPicker: show }),
  resetGame: () => set({ gameState: null, isMyTurn: false, selectedCard: null }),
  updateGameState: (state) => set({ gameState: state }),
}));
