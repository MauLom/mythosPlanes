# Mythos Planes - Web Client

Interactive web client for Mythos Planes built with Svelte, TypeScript, and PixiJS.

## Features

- **Interactive Board**: 20 draggable card sprites rendered with PixiJS
- **60 FPS Performance**: Real-time FPS counter in top-right corner
- **Drag & Drop**: Click and drag cards to reposition them
- **Zoom Control**: Ctrl + Mouse Wheel to zoom in/out (0.1x to 5x)
- **Window Resize**: Automatically adjusts canvas to viewport size
- **Keyboard Hotkeys**:
  - `R` - Reset view (zoom and position)
  - `F` - Fit to screen (auto-scale all cards)
  - `G` - Toggle grid (placeholder)
  - `Z` - Zoom to 100%

## Tech Stack

- **Svelte 5.39.6** - Reactive UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite 7.2.2** - Fast build tool with HMR
- **PixiJS 8.14.0** - WebGL rendering engine
- **tinykeys 3.0.0** - Keyboard shortcuts
- **idb-keyval 6.2.2** - IndexedDB storage

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run check
```

## Project Structure

```
apps/client/
├── src/
│   ├── routes/
│   │   └── Play.svelte      # Main /play view with PixiJS
│   ├── types/
│   │   └── tinykeys.d.ts    # Type definitions for tinykeys
│   ├── App.svelte           # Root component with routing
│   ├── app.css              # Global styles
│   └── main.ts              # Application entry point
├── public/                  # Static assets
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
└── tsconfig.*.json          # TypeScript configuration
```

## Usage

1. Navigate to the home page
2. Click "Go to Play View" to enter the interactive board
3. Drag cards around to reposition them
4. Use Ctrl + Mouse Wheel to zoom
5. Press hotkeys (R, F, G, Z) for view controls

## Development

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Svelte Extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

### Why Vite instead of SvelteKit?

This project uses Vite for maximum flexibility and minimal overhead. The goal is an interactive local board running entirely client-side without server-side routing or API requirements.

