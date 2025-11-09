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

/**
 * Action types for game operations
 */
export type ActionType = "MOVE" | "ROTATE" | "TAP" | "FLIP" | "ZONE";

/**
 * Base action interface
 */
export interface Action {
  type: ActionType;
  cardId: string;
  clientSeq: number;
  timestamp: number;
}

/**
 * Move action
 */
export interface MoveAction extends Action {
  type: "MOVE";
  x: number;
  y: number;
}

/**
 * Rotate action
 */
export interface RotateAction extends Action {
  type: "ROTATE";
  rotation: number;
}

/**
 * Tap action
 */
export interface TapAction extends Action {
  type: "TAP";
  tapped: boolean;
}

/**
 * Flip action
 */
export interface FlipAction extends Action {
  type: "FLIP";
  flipped: boolean;
}

/**
 * Zone action
 */
export interface ZoneAction extends Action {
  type: "ZONE";
  zone: string;
}

/**
 * Union type for all actions
 */
export type GameAction = MoveAction | RotateAction | TapAction | FlipAction | ZoneAction;

/**
 * State patch for synchronization
 */
export interface StatePatch {
  serverSeq: number;
  clientSeq: number;
  timestamp: number;
  changes: Partial<Card>[];
}

/**
 * Acknowledgment message
 */
export interface Acknowledgment {
  clientSeq: number;
  serverSeq: number;
  success: boolean;
  error?: string;
}
