<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
  import { tinykeys } from 'tinykeys';

  let canvasContainer: HTMLDivElement;
  let app: Application | null = null;
  let fps = 0;
  let boardContainer: Container | null = null;
  let cards: Sprite[] = [];
  let isDragging = false;
  let dragTarget: Sprite | null = null;
  let dragOffset = { x: 0, y: 0 };
  let scale = 1;
  let panOffset = { x: 0, y: 0 };
  let unsubscribeKeys: (() => void) | null = null;

  onMount(async () => {
    // Initialize Pixi Application
    app = new Application();
    await app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    canvasContainer.appendChild(app.canvas);

    // Create board container for zoom and pan
    boardContainer = new Container();
    app.stage.addChild(boardContainer);

    // Create 20 dummy cards
    createCards();

    // Setup interaction
    setupInteraction();

    // FPS counter
    app.ticker.add(() => {
      fps = Math.round(app!.ticker.FPS);
    });

    // Window resize handler
    window.addEventListener('resize', handleResize);

    // Setup hotkeys
    setupHotkeys();
  });

  function createCards() {
    if (!boardContainer) return;

    // Create a simple card texture (colored rectangle)
    const cardWidth = 80;
    const cardHeight = 120;
    const cardsPerRow = 5;
    const spacing = 20;

    for (let i = 0; i < 20; i++) {
      // Create a graphics object to draw the card
      const graphics = new Graphics();
      
      // Different colors for variety
      const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7b731, 0x5f27cd];
      const color = colors[i % colors.length];
      
      graphics.rect(0, 0, cardWidth, cardHeight);
      graphics.fill(color);
      graphics.stroke({ width: 2, color: 0xffffff });

      // Convert graphics to texture and create sprite
      const texture = app!.renderer.generateTexture(graphics);
      const card = new Sprite(texture);

      // Position cards in a grid
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      card.x = 100 + col * (cardWidth + spacing);
      card.y = 100 + row * (cardHeight + spacing);

      // Enable interaction
      card.eventMode = 'static';
      card.cursor = 'pointer';

      // Store reference
      cards.push(card);
      boardContainer!.addChild(card);
    }
  }

  function setupInteraction() {
    if (!app || !boardContainer) return;

    // Drag and drop for cards
    cards.forEach(card => {
      card.on('pointerdown', (event) => {
        isDragging = true;
        dragTarget = card;
        
        // Calculate offset relative to the card's position
        const localPos = boardContainer!.toLocal(event.global);
        dragOffset.x = localPos.x - card.x;
        dragOffset.y = localPos.y - card.y;

        // Bring card to front
        boardContainer!.removeChild(card);
        boardContainer!.addChild(card);
        
        event.stopPropagation();
      });
    });

    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    app.stage.on('pointermove', (event) => {
      if (isDragging && dragTarget && boardContainer) {
        const localPos = boardContainer.toLocal(event.global);
        dragTarget.x = localPos.x - dragOffset.x;
        dragTarget.y = localPos.y - dragOffset.y;
      }
    });

    app.stage.on('pointerup', () => {
      isDragging = false;
      dragTarget = null;
    });

    app.stage.on('pointerupoutside', () => {
      isDragging = false;
      dragTarget = null;
    });

    // Zoom with Ctrl + Wheel
    app.canvas.addEventListener('wheel', (event) => {
      if (event.ctrlKey && boardContainer) {
        event.preventDefault();
        
        const delta = event.deltaY;
        const zoomFactor = delta > 0 ? 0.95 : 1.05;
        
        scale *= zoomFactor;
        scale = Math.max(0.1, Math.min(5, scale));
        
        boardContainer.scale.set(scale);
      }
    });
  }

  function setupHotkeys() {
    unsubscribeKeys = tinykeys(window, {
      'r': () => {
        console.log('R key pressed - Reset view');
        resetView();
      },
      'f': () => {
        console.log('F key pressed - Fit to screen');
        fitToScreen();
      },
      'g': () => {
        console.log('G key pressed - Toggle grid (not implemented)');
        // Placeholder for grid toggle
      },
      'z': () => {
        console.log('Z key pressed - Zoom to 100%');
        zoomToDefault();
      }
    });
  }

  function resetView() {
    if (boardContainer) {
      scale = 1;
      boardContainer.scale.set(scale);
      boardContainer.position.set(0, 0);
      panOffset = { x: 0, y: 0 };
    }
  }

  function fitToScreen() {
    if (!boardContainer || !app) return;
    
    // Calculate bounds of all cards
    const bounds = boardContainer.getBounds();
    const scaleX = app.screen.width / bounds.width;
    const scaleY = app.screen.height / bounds.height;
    scale = Math.min(scaleX, scaleY) * 0.9;
    
    boardContainer.scale.set(scale);
    
    // Center the content
    const scaledBounds = boardContainer.getBounds();
    boardContainer.x = (app.screen.width - scaledBounds.width) / 2 - scaledBounds.x;
    boardContainer.y = (app.screen.height - scaledBounds.height) / 2 - scaledBounds.y;
  }

  function zoomToDefault() {
    if (boardContainer) {
      scale = 1;
      boardContainer.scale.set(scale);
    }
  }

  function handleResize() {
    if (app) {
      app.renderer.resize(window.innerWidth, window.innerHeight);
    }
  }

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    if (unsubscribeKeys) {
      unsubscribeKeys();
    }
    if (app) {
      app.destroy(true, { children: true });
    }
  });
</script>

<div class="play-container">
  <div bind:this={canvasContainer} class="canvas-container"></div>
  <div class="fps-counter">FPS: {fps}</div>
  <div class="controls-info">
    <div>Drag cards to move</div>
    <div>Ctrl + Wheel to zoom</div>
    <div>Hotkeys: R (reset), F (fit), G (grid), Z (zoom 100%)</div>
  </div>
</div>

<style>
  .play-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }

  .canvas-container {
    width: 100%;
    height: 100%;
  }

  .fps-counter {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #00ff00;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 16px;
    font-weight: bold;
    z-index: 1000;
  }

  .controls-info {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 12px;
    border-radius: 4px;
    font-family: sans-serif;
    font-size: 12px;
    z-index: 1000;
  }

  .controls-info div {
    margin: 4px 0;
  }
</style>
