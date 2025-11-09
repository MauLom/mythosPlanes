/**
 * Operation codes for client-server communication
 */
export type Opcode = "mv" | "rt" | "tp" | "fl" | "zn";

/**
 * Card interface representing a game card
 */
export interface Card {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  tapped: boolean;
  flipped: boolean;
  zone: string;
}

/**
 * Player interface representing a game player
 */
export interface Player {
  id: string;
  name: string;
  sessionId: string;
  connected: boolean;
}

/**
 * Room state interface representing the game room state
 */
export interface RoomState {
  players: Map<string, Player>;
  cards: Map<string, Card>;
}

/**
 * Message interface for WebSocket communication
 */
export interface Message {
  op: Opcode | "ping" | "pong";
  data?: any;
}
