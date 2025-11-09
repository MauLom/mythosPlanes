import express from "express";
import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MTGRoom } from "./rooms/MTGRoom.js";

const app = express();
const port = process.env.PORT || 3000;

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "alive" });
});

// Create HTTP server
const httpServer = createServer(app);

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer
  })
});

// Register MTG room
gameServer.define("mtg", MTGRoom);

// Start server
httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
  console.log(`WebSocket available at ws://localhost:${port}/play`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
