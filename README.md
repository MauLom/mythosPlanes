# mythosPlanes

Interactive web-based card game with Svelte + PixiJS.

## Project Structure

```
mythosPlanes/
├── apps/
│   └── client/          # Svelte + PixiJS web client
└── README.md
```

## Getting Started

### Client Application

The client application is an interactive board built with Svelte and PixiJS.

```bash
cd apps/client
npm install
npm run dev
```

See [apps/client/README.md](apps/client/README.md) for more details.

## Features

- **Interactive Board**: Drag-and-drop cards rendered with PixiJS
- **60 FPS Performance**: Smooth WebGL-accelerated rendering
- **Zoom & Pan**: Ctrl + Wheel to zoom, keyboard shortcuts for controls
- **Responsive**: Automatically adapts to window size
- **Client-Side**: Runs entirely in the browser, no server required
