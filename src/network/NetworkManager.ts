/**
 * UNO Arena — Network Manager
 * Handles raw TCP sockets using react-native-tcp-socket
 */

import TcpSocket from 'react-native-tcp-socket';
import * as Network from 'expo-network';
import { NetworkMessage, MessageType } from '../types/network';
import { useNetworkStore } from '../store/networkStore';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';

type Socket = any;
type Server = any;

class NetworkManager {
  private server: Server | null = null;
  private client: Socket | null = null;
  
  // Host keeps track of connected clients
  private hostClients: Map<string, Socket> = new Map();
  
  // Basic message framing since TCP is a stream protocol
  private buffer: string = '';

  // Listeners for UI notification
  private listeners: Set<(message: NetworkMessage) => void> = new Set();

  /**
   * Start a TCP server on the host device
   */
  async startHosting() {
    try {
      const ip = await Network.getIpAddressAsync();
      useNetworkStore.getState().setLocalIpAddress(ip);

      this.server = TcpSocket.createServer((socket) => {
        const clientId = socket.remoteAddress + ':' + socket.remotePort;
        this.hostClients.set(clientId, socket);

        socket.on('data', (data) => {
          this.handleIncomingData(data.toString(), clientId);
        });

        socket.on('error', (error: any) => {
          console.warn(`[Network] Socket error from ${clientId}:`, error);
        });

        socket.on('close', () => {
          this.hostClients.delete(clientId);
          console.log(`[Network] Client disconnected: ${clientId}`);
          // TODO: Notify GameStore of player disconnect
        });
      });

      const port = useNetworkStore.getState().serverPort;
      this.server.listen({ port, host: '0.0.0.0' }, () => {
        console.log(`[Network] Server listening on ${ip}:${port}`);
        useNetworkStore.getState().setHostMode(true);
        useNetworkStore.getState().setConnected(true);
      });

      this.server.on('error', (error: any) => {
        console.error('[Network] Server error:', error);
        useNetworkStore.getState().setError(error.message);
      });

    } catch (error: any) {
      console.error('[Network] Failed to start host:', error);
      useNetworkStore.getState().setError(error.message);
    }
  }

  /**
   * Connect to a Host device as a client
   */
  joinGame(ipAddress: string) {
    const port = useNetworkStore.getState().serverPort;

    this.client = TcpSocket.createConnection(
      { port, host: ipAddress },
      () => {
        console.log(`[Network] Connected to host ${ipAddress}:${port}`);
        useNetworkStore.getState().setHostMode(false);
        useNetworkStore.getState().setConnected(true, ipAddress);
        useNetworkStore.getState().setError(null);

        // Send JOIN_REQUEST automatically
        const { profile } = usePlayerStore.getState();
        this.sendMessage({
          type: 'JOIN_REQUEST',
          timestamp: Date.now(),
          payload: { player: { ...profile, type: 'human' } }
        });
      }
    );

    this.client.on('data', (data: any) => {
      this.handleIncomingData(data.toString());
    });

    this.client.on('error', (error: any) => {
      console.error('[Network] Client error:', error);
      useNetworkStore.getState().setError('Connection failed: ' + error.message);
    });

    this.client.on('close', () => {
      console.log('[Network] Client disconnected from server');
      useNetworkStore.getState().setConnected(false);
      // If we didn't deliberately close, we lost connection
      if (useGameStore.getState().gameState) {
         useNetworkStore.getState().setError('Lost connection to host');
      }
    });
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    if (this.server) {
      this.hostClients.forEach(c => c.destroy());
      this.hostClients.clear();
      this.server.close();
      this.server = null;
    }
    this.buffer = '';
    this.listeners.clear();
    useNetworkStore.getState().resetNetwork();
  }

  /**
   * Subscribe to network messages
   */
  subscribe(listener: (message: NetworkMessage) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Send a message.
   * If Host, sends to all connected clients.
   * If Client, sends to Host.
   */
  sendMessage(message: NetworkMessage, specificClientId?: string) {
    // Add newline delimiter for simple framing
    const msgString = JSON.stringify(message) + '\n';

    if (useNetworkStore.getState().isHost) {
      if (specificClientId) {
        const client = this.hostClients.get(specificClientId);
        if (client) client.write(msgString);
      } else {
        // Broadcast to all
        this.hostClients.forEach(client => {
          client.write(msgString);
        });
      }
    } else {
      if (this.client) {
        this.client.write(msgString);
      }
    }
  }

  /**
   * Handle incoming raw string data. Buffer it and parse by newlines.
   */
  private handleIncomingData(data: string, sourceId?: string) {
    this.buffer += data;
    let newlineIndex: number;

    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const messageString = this.buffer.substring(0, newlineIndex);
      this.buffer = this.buffer.substring(newlineIndex + 1);

      if (messageString.trim().length > 0) {
        try {
          const message: NetworkMessage = JSON.parse(messageString);
          this.routeMessage(message, sourceId);
        } catch (e) {
          console.warn('[Network] Failed to parse message:', messageString, e);
        }
      }
    }
  }

  /**
   * Route valid parsed messages to the appropriate Store
   */
  private routeMessage(message: NetworkMessage, sourceId?: string) {
    const isHost = useNetworkStore.getState().isHost;
    
    // The Host processes incoming requests, the Client processes state updates
    if (isHost) {
      this.handleMessageAsHost(message, sourceId);
    } else {
      this.handleMessageAsClient(message);
    }

    // Always notify local listeners
    this.listeners.forEach(l => l(message));
  }

  private handleMessageAsHost(message: NetworkMessage, sourceId?: string) {
    const { gameState, playCardAction, drawCardAction, callUnoAction, passTurnAction } = useGameStore.getState();

    switch (message.type) {
      case 'PLAYER_ACTION':
        const { actionType, cardId, chosenColor, targetId } = message.payload;
        // In Host mode, executing these actions automatically updates the state
        // We will broadcast the new state right after (this logic can be placed in GameStore itself, but here is a simple mapping for now)
        if (actionType === 'PLAY_CARD' && cardId) {
          playCardAction(message.senderId!, cardId, chosenColor as any);
        } else if (actionType === 'DRAW_CARD') {
          drawCardAction(message.senderId!);
        } else if (actionType === 'CALL_UNO') {
          callUnoAction(message.senderId!);
        } else if (actionType === 'PASS') {
          passTurnAction(message.senderId!);
        }
        
        // Host broadcasts the updated state after any action
        this.broadcastGameState();
        break;

      case 'JOIN_REQUEST':
        // Handle join request (could add player to a lobby state, but for now we log it)
        console.log(`[Network] JOIN_REQUEST from ${sourceId}`);
        // Send ACK
        if (sourceId) {
           this.sendMessage({ type: 'JOIN_ACK', timestamp: Date.now(), payload: { assignedId: message.senderId } }, sourceId);
        }
        break;

      case 'CHAT_MESSAGE':
        // Host forwards chat messages to all other clients
        this.sendMessage(message);
        break;
    }
  }

  /**
   * Helper to broadcast current GameState to all clients
   */
  broadcastGameState() {
    const { gameState } = useGameStore.getState();
    if (gameState) {
      this.sendMessage({
        type: 'GAME_STATE',
        timestamp: Date.now(),
        payload: { gameState }
      });
    }
  }

  private handleMessageAsClient(message: NetworkMessage) {
    console.log('[Network] Client received:', message.type);
    
    const { updateGameState } = useGameStore.getState();

    switch (message.type) {
      case 'GAME_STATE':
        if (message.payload?.gameState) {
          updateGameState(message.payload.gameState);
        }
        break;
      case 'JOIN_ACK':
        console.log('Successfully joined lobby with ID:', message.payload?.assignedId);
        // We could update profile ID here if we want to ensure uniqueness
        break;
      // Handle other client messages like LOBBY_UPDATE
    }
  }
}

export const networkManager = new NetworkManager();
