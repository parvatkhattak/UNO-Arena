/**
 * UNO Arena — Network Type Definitions
 * Defines the JSON protocol used over TCP sockets
 */

import { GameState, Player } from './game';

export type MessageType =
  | 'JOIN_REQUEST'     // Client -> Host: I want to join
  | 'JOIN_ACK'         // Host -> Client: You're in, here's your ID
  | 'JOIN_REJECT'      // Host -> Client: Lobby full or game started
  | 'LOBBY_UPDATE'     // Host -> All: Lobby players changed
  | 'GAME_START'       // Host -> All: Let's play
  | 'GAME_STATE'       // Host -> All: Authoritative state sync
  | 'PLAYER_ACTION'    // Client -> Host: I did something (play, draw, uno)
  | 'LEAVE'            // Client -> Host: I'm leaving
  | 'CHAT_MESSAGE'       // Client -> Host or Host -> All: Emoji/chat message
  | 'PING'             // Keepalive
  | 'PONG';            // Keepalive response

export interface NetworkMessage {
  type: MessageType;
  senderId?: string;
  payload?: any;
  timestamp: number;
}

// ─── Specific Payloads ─────────────────────────────────────

export interface JoinRequestPayload {
  player: Omit<Player, 'id'>; // Client sends their profile details, Host assigns ID
}

export interface JoinAckPayload {
  assignedId: string;
}

export interface LobbyUpdatePayload {
  players: Player[];
}

export interface GameStatePayload {
  gameState: GameState;
}

export interface PlayerActionPayload {
  actionType: 'PLAY_CARD' | 'DRAW_CARD' | 'CALL_UNO' | 'PASS' | 'CHALLENGE_UNO';
  cardId?: string;
  chosenColor?: string;
  targetId?: string;
}
