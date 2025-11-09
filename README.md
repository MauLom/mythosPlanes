# mythosPlanes

Interactive web-based card game with Svelte + PixiJS client and Node + Colyseus server.

## Project Structure

```
mythosPlanes/
├── apps/
│   ├── client/          # Svelte + PixiJS web client
│   └── server/          # Node + Colyseus game server
├── packages/
│   └── types/           # Shared TypeScript types
└── README.md
```

## Getting Started

### Shared Types Package

Install and build shared types:

```bash
cd packages/types
npm install
npm run build
```

### Server Application

The server provides WebSocket game rooms and a health check endpoint.

```bash
cd apps/server
npm install
npm run dev
```

Server runs on `http://localhost:3000` with:
- Health endpoint: `GET /health`
- WebSocket room: `ws://localhost:3000/mtg`

See [apps/server/README.md](apps/server/README.md) for more details.

### Client Application

The client application is an interactive board built with Svelte and PixiJS.

```bash
cd apps/client
npm install
npm run dev
```

See [apps/client/README.md](apps/client/README.md) for more details.

## Features

### Client
- **Interactive Board**: Drag-and-drop cards rendered with PixiJS
- **60 FPS Performance**: Smooth WebGL-accelerated rendering
- **Zoom & Pan**: Ctrl + Wheel to zoom, keyboard shortcuts for controls
- **Responsive**: Automatically adapts to window size

### Server
- **Health Check**: `/health` endpoint for monitoring
- **MTG Room**: Multiplayer game room with Colyseus
- **WebSocket**: Real-time communication with ping/echo support
- **Type Safety**: Shared types between client and server

## Shared Types

The `@mythosplanes/types` package provides:
- `Card`: Card interface with position, rotation, state
- `Player`: Player interface with connection status
- `RoomState`: Room state with players and cards
- `Opcode`: Operation codes for game actions
- `Message`: WebSocket message protocol
