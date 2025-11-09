import { Client } from "colyseus.js";
import WebSocket from "ws";

async function testWebSocket() {
  console.log("Testing WebSocket connection to MTG room...\n");

  const client = new Client("ws://localhost:3000");
  
  try {
    // Connect to MTG room
    const room = await client.joinOrCreate("mtg", { name: "TestPlayer" });
    console.log("✓ Connected to MTG room");
    console.log(`  Session ID: ${room.sessionId}\n`);

    // Listen for messages
    room.onMessage("message", (message) => {
      console.log("✓ Received message from server:");
      console.log(`  ${JSON.stringify(message)}\n`);
    });

    room.onMessage("playerJoined", (player) => {
      console.log("✓ Player joined:");
      console.log(`  ${JSON.stringify(player)}\n`);
    });

    // Send ping message
    console.log("Sending ping message...");
    room.send("message", { op: "ping" });

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Leave room
    await room.leave();
    console.log("✓ Disconnected from room\n");
    
    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error);
    process.exit(1);
  }
}

testWebSocket();
