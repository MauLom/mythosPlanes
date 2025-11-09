import { Room, Client } from "@colyseus/core";
import type { Player, Card, Message, GameAction, StatePatch, Acknowledgment } from "@mythosplanes/types";

export interface MTGRoomState {
  players: { [sessionId: string]: Player };
  cards: { [id: string]: Card };
}

export class MTGRoom extends Room<MTGRoomState> {
  maxClients = 4;
  private serverSeq = 0;

  onCreate(options: any) {
    console.log("MTGRoom created!", options);
    
    // Initialize room state with some demo cards
    this.setState({
      players: {},
      cards: this.createDemoCards()
    });

    // Handle action messages from clients
    this.onMessage("action", (client: Client, action: GameAction) => {
      console.log(`Action from ${client.sessionId}:`, action);
      this.handleAction(client, action);
    });

    // Handle ping messages for backward compatibility
    this.onMessage("*", (client: Client, type: string | number, message: any) => {
      if (message?.op === "ping") {
        console.log("Ping received, broadcasting to all clients");
        this.broadcast("message", { op: "ping", data: { from: client.sessionId } });
      }
    });
  }

  /**
   * Create demo cards for testing
   */
  private createDemoCards(): { [id: string]: Card } {
    const cards: { [id: string]: Card } = {};
    const cardWidth = 80;
    const cardHeight = 120;
    const cardsPerRow = 5;
    const spacing = 20;

    for (let i = 0; i < 20; i++) {
      const id = `card-${i}`;
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      
      cards[id] = {
        id,
        name: `Card ${i + 1}`,
        type: 'creature',
        x: 100 + col * (cardWidth + spacing),
        y: 100 + row * (cardHeight + spacing),
        rotation: 0,
        tapped: false,
        flipped: false,
        zone: 'battlefield'
      };
    }

    return cards;
  }

  /**
   * Handle and validate an action from a client
   */
  private handleAction(client: Client, action: GameAction) {
    // Validate action
    const card = this.state.cards[action.cardId];
    if (!card) {
      this.sendAck(client, action.clientSeq, false, 'Card not found');
      return;
    }

    // Apply action to server state
    const updatedCard = this.applyActionToCard(card, action);
    this.state.cards[action.cardId] = updatedCard;

    // Increment server sequence
    this.serverSeq++;

    // Create state patch
    const patch: StatePatch = {
      serverSeq: this.serverSeq,
      clientSeq: action.clientSeq,
      timestamp: Date.now(),
      changes: [{ id: action.cardId, ...this.getCardChanges(action, updatedCard) }]
    };

    // Broadcast patch to all clients
    this.broadcast("statePatch", patch);

    // Send acknowledgment to the client who sent the action
    this.sendAck(client, action.clientSeq, true);
  }

  /**
   * Apply an action to a card
   */
  private applyActionToCard(card: Card, action: GameAction): Card {
    const updated = { ...card };
    
    switch (action.type) {
      case 'MOVE':
        updated.x = action.x;
        updated.y = action.y;
        break;
      case 'ROTATE':
        updated.rotation = action.rotation;
        break;
      case 'TAP':
        updated.tapped = action.tapped;
        break;
      case 'FLIP':
        updated.flipped = action.flipped;
        break;
      case 'ZONE':
        updated.zone = action.zone;
        break;
    }
    
    return updated;
  }

  /**
   * Get the changes from an action
   */
  private getCardChanges(action: GameAction, card: Card): Partial<Card> {
    switch (action.type) {
      case 'MOVE':
        return { x: card.x, y: card.y };
      case 'ROTATE':
        return { rotation: card.rotation };
      case 'TAP':
        return { tapped: card.tapped };
      case 'FLIP':
        return { flipped: card.flipped };
      case 'ZONE':
        return { zone: card.zone };
      default:
        return {};
    }
  }

  /**
   * Send an acknowledgment to a client
   */
  private sendAck(client: Client, clientSeq: number, success: boolean, error?: string) {
    const ack: Acknowledgment = {
      clientSeq,
      serverSeq: this.serverSeq,
      success,
      error
    };
    client.send("ack", ack);
  }

  onJoin(client: Client, options: any) {
    console.log(`Client ${client.sessionId} joined!`);
    
    // Add player to room state
    const player: Player = {
      id: client.sessionId,
      name: options.name || `Player ${Object.keys(this.state.players).length + 1}`,
      sessionId: client.sessionId,
      connected: true
    };

    this.state.players[client.sessionId] = player;
    
    // Notify all clients about new player
    this.broadcast("playerJoined", player);

    // Send full state to the newly joined client
    const fullState = {
      players: Object.values(this.state.players),
      cards: Object.values(this.state.cards)
    };
    client.send("fullState", fullState);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left!`);
    
    // Mark player as disconnected
    if (this.state.players[client.sessionId]) {
      this.state.players[client.sessionId].connected = false;
      
      // Notify all clients about player leaving
      this.broadcast("playerLeft", { sessionId: client.sessionId });
      
      // Remove player after some time if not reconnected
      this.clock.setTimeout(() => {
        if (this.state.players[client.sessionId] && !this.state.players[client.sessionId].connected) {
          delete this.state.players[client.sessionId];
        }
      }, 10000); // 10 seconds grace period
    }
  }

  onDispose() {
    console.log("MTGRoom disposed!");
  }
}
