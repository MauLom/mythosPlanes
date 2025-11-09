# Server

Node + TypeScript server using Colyseus for mythosPlanes.

## Features

- **Health Endpoint**: `/health` returns `200 OK` with `{status: "alive"}`
- **MTG Room**: WebSocket room for multiplayer game sessions
- **Type Safety**: Shared types with client via `@mythosplanes/types`

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the server with hot reload:

```bash
npm run dev
```

Server will start on `http://localhost:3000` (or `PORT` environment variable).

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Endpoints

### Health Check

```
GET /health
```

Returns:
```json
{
  "status": "alive"
}
```

### WebSocket Connection

Connect to the MTG room:

```
ws://localhost:3000/mtg
```

## Room Handlers

The MTG room includes:

- **onJoin**: Adds player to room state, broadcasts to all clients
- **onLeave**: Marks player as disconnected, with 10s grace period
- **Message Handling**: Echoes `{op: "ping"}` messages to all clients

## Type Safety

Shared types are imported from `@mythosplanes/types`:
- `Card`: Card interface
- `Player`: Player interface  
- `RoomState`: Room state interface
- `Opcode`: Operation codes ("mv", "rt", "tp", "fl", "zn")
- `Message`: WebSocket message interface
