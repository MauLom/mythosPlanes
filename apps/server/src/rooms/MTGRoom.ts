import { Room, Client } from "@colyseus/core";
import type { Player, Card, Message } from "@mythosplanes/types";

export interface MTGRoomState {
  players: { [sessionId: string]: Player };
  cards: { [id: string]: Card };
}

export class MTGRoom extends Room<MTGRoomState> {
  maxClients = 4;

  onCreate(options: any) {
    console.log("MTGRoom created!", options);
    
    // Initialize room state
    this.setState({
      players: {},
      cards: {}
    });

    // Handle messages from clients
    this.onMessage("*", (client: Client, type: string | number, message: any) => {
      console.log(`Message from ${client.sessionId}:`, type, message);
      
      // Echo ping messages to all clients
      if (message?.op === "ping") {
        console.log("Ping received, broadcasting to all clients");
        this.broadcast("message", { op: "ping", data: { from: client.sessionId } });
      }
    });
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
