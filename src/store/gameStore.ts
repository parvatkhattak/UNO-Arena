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
import { networkManager } from '../network/NetworkManager';
import { useNetworkStore } from './networkStore';
import { usePlayerStore } from './playerStore';

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
    const { isHost, isConnected } = useNetworkStore.getState();
    if (!isHost && isConnected) {
      // Client sends action to Host
      networkManager.sendMessage({
        type: 'PLAYER_ACTION',
        timestamp: Date.now(),
        payload: { actionType: 'PLAY_CARD', cardId, chosenColor }
      });
      set({ selectedCard: null, showColorPicker: false });
      return;
    }

    // Local / Host logic
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

    if (isHost && isConnected) {
      networkManager.broadcastGameState();
    }
  },

  drawCardAction: (playerId) => {
    const { isHost, isConnected } = useNetworkStore.getState();
    if (!isHost && isConnected) {
      networkManager.sendMessage({
        type: 'PLAYER_ACTION', timestamp: Date.now(),
        payload: { actionType: 'DRAW_CARD' }
      });
      return;
    }

    const { gameState } = get();
    if (!gameState) return;
    const newState = drawCard(gameState, playerId);
    set({
      gameState: newState,
      isMyTurn: newState.players[newState.currentPlayerIndex]?.id === playerId,
    });

    if (isHost && isConnected) {
      networkManager.broadcastGameState();
    }
  },

  callUnoAction: (playerId) => {
    const { isHost, isConnected } = useNetworkStore.getState();
    if (!isHost && isConnected) {
      networkManager.sendMessage({
        type: 'PLAYER_ACTION', timestamp: Date.now(),
        payload: { actionType: 'CALL_UNO' }
      });
      return;
    }

    const { gameState } = get();
    if (!gameState) return;
    set({ gameState: callUno(gameState, playerId) });

    if (isHost && isConnected) {
      networkManager.broadcastGameState();
    }
  },

  challengeUnoAction: (challengerId, targetId) => {
    const { isHost, isConnected } = useNetworkStore.getState();
    if (!isHost && isConnected) {
      networkManager.sendMessage({
        type: 'PLAYER_ACTION', timestamp: Date.now(),
        payload: { actionType: 'CHALLENGE_UNO', targetId }
      });
      return;
    }

    const { gameState } = get();
    if (!gameState) return;
    set({ gameState: challengeUno(gameState, challengerId, targetId) });

    if (isHost && isConnected) {
      networkManager.broadcastGameState();
    }
  },

  passTurnAction: (playerId) => {
    const { isHost, isConnected } = useNetworkStore.getState();
    if (!isHost && isConnected) {
      networkManager.sendMessage({
        type: 'PLAYER_ACTION', timestamp: Date.now(),
        payload: { actionType: 'PASS' }
      });
      return;
    }

    const { gameState } = get();
    if (!gameState) return;
    const newState = passTurn(gameState, playerId);
    set({
      gameState: newState,
      isMyTurn: newState.players[newState.currentPlayerIndex]?.id === playerId,
    });

    if (isHost && isConnected) {
      networkManager.broadcastGameState();
    }
  },

  setSelectedCard: (card) => set({ selectedCard: card }),
  setShowColorPicker: (show) => set({ showColorPicker: show }),
  resetGame: () => set({ gameState: null, isMyTurn: false, selectedCard: null }),
  updateGameState: (state) => {
    const { profile } = usePlayerStore.getState();
    set({ 
      gameState: state,
      isMyTurn: state.players[state.currentPlayerIndex]?.id === profile.id
    });
  },
}));
