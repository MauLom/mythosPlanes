import { Client, Room } from 'colyseus.js';
import type { GameAction, StatePatch, Acknowledgment, Player, Card } from '@mythosplanes/types';
import { gameStore } from './store';

/**
 * WebSocket client service for communicating with the game server
 */
class GameClient {
  private client: Client | null = null;
  private room: Room | null = null;
  private serverUrl = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  
  /**
   * Connect to the game server and join a room
   */
  async connect(serverUrl: string, roomName: string = 'mtg', options: any = {}): Promise<void> {
    try {
      console.log(`Connecting to ${serverUrl}...`);
      
      this.serverUrl = serverUrl;
      this.client = new Client(serverUrl);
      this.room = await this.client.joinOrCreate(roomName, options);
      
      console.log('Connected to room:', this.room.roomId);
      this.reconnectAttempts = 0;
      
      this.setupListeners();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.handleReconnect(serverUrl, roomName, options);
    }
  }

  /**
   * Set up room event listeners
   */
  private setupListeners() {
    if (!this.room) return;

    // Listen for state changes from server
    this.room.onMessage('statePatch', (patch: StatePatch) => {
      console.log('Received state patch:', patch);
      gameStore.applyStatePatch(patch);
    });

    // Listen for acknowledgments
    this.room.onMessage('ack', (ack: Acknowledgment) => {
      console.log('Received acknowledgment:', ack);
      gameStore.handleAcknowledgment(ack);
    });

    // Listen for player joined
    this.room.onMessage('playerJoined', (player: Player) => {
      console.log('Player joined:', player);
      gameStore.updatePlayer(player);
    });

    // Listen for player left
    this.room.onMessage('playerLeft', (data: { sessionId: string }) => {
      console.log('Player left:', data);
      gameStore.removePlayer(data.sessionId);
    });

    // Listen for full state sync
    this.room.onMessage('fullState', (data: { players: Player[], cards: Card[] }) => {
      console.log('Received full state:', data);
      
      // Update players
      data.players.forEach(player => gameStore.updatePlayer(player));
      
      // Initialize cards
      if (data.cards && data.cards.length > 0) {
        gameStore.initializeCards(data.cards);
      }
    });

    // Handle state change (Colyseus built-in)
    this.room.onStateChange((state) => {
      console.log('Room state changed:', state);
      
      // Sync players from Colyseus state
      if (state.players) {
        Object.values(state.players).forEach((player: any) => {
          gameStore.updatePlayer(player);
        });
      }

      // Sync cards from Colyseus state
      if (state.cards) {
        const cards = Object.values(state.cards) as Card[];
        if (cards.length > 0) {
          gameStore.initializeCards(cards);
        }
      }
    });

    // Handle errors
    this.room.onError((code, message) => {
      console.error('Room error:', code, message);
    });

    // Handle room leave
    this.room.onLeave((code) => {
      console.log('Left room with code:', code);
      if (code > 1000) {
        // Abnormal closure, attempt reconnect
        this.handleReconnect(this.serverUrl, 'mtg', {});
      }
    });
  }

  /**
   * Handle reconnection attempts
   */
  private handleReconnect(serverUrl: string, roomName: string, options: any) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      this.connect(serverUrl, roomName, options);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Send an action to the server
   */
  sendAction(action: GameAction) {
    if (!this.room) {
      console.error('Cannot send action: not connected to room');
      return;
    }

    console.log('Sending action:', action);
    this.room.send('action', action);
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.client = null;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.room?.sessionId || null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.room !== null;
  }
}

/**
 * Export singleton instance
 */
export const gameClient = new GameClient();
