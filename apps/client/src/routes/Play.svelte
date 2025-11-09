<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application, Container, Graphics, Sprite } from 'pixi.js';
  import { tinykeys } from 'tinykeys';
  import { gameStore, cards as cardsStore, pendingActionCount } from '../lib/store';
  import { gameClient } from '../lib/client';
  import type { Card, MoveAction, RotateAction, TapAction, FlipAction } from '@mythosplanes/types';

  let canvasContainer: HTMLDivElement;
  let app: Application | null = null;
  let fps = 0;
  let boardContainer: Container | null = null;
  let cardSprites: Map<string, Sprite> = new Map();
  let isDragging = false;
  let dragTarget: { sprite: Sprite; cardId: string } | null = null;
  let dragOffset = { x: 0, y: 0 };
  let scale = 1;
  let unsubscribeKeys: (() => void) | null = null;
  let unsubscribeStore: (() => void) | null = null;
  let connected = false;
  let connectionError = '';
  let pendingActions = 0;

  // Subscribe to pending actions count
  $: pendingActions = $pendingActionCount;

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

    // Subscribe to store changes to update card sprites
    unsubscribeStore = cardsStore.subscribe(cards => {
      updateCardSprites(cards);
    });

    // Connect to server
    await connectToServer();
  });

  async function connectToServer() {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3000';
      await gameClient.connect(serverUrl, 'mtg', { name: 'Player' });
      connected = true;
      connectionError = '';
      console.log('Connected to server');
    } catch (error) {
      console.error('Failed to connect to server:', error);
      connectionError = 'Failed to connect to server. Retrying...';
      connected = false;
    }
  }

  function updateCardSprites(cards: Card[]) {
    if (!boardContainer || !app) return;

    // Update or create sprites for each card
    cards.forEach(card => {
      let sprite = cardSprites.get(card.id);
      
      if (!sprite) {
        // Create new sprite
        sprite = createCardSprite(card);
        cardSprites.set(card.id, sprite);
        boardContainer!.addChild(sprite);
      } else {
        // Update existing sprite position and state
        sprite.x = card.x;
        sprite.y = card.y;
        sprite.rotation = card.rotation;
        sprite.alpha = card.flipped ? 0.5 : 1;
        
        // Visual indication of tapped state
        if (card.tapped) {
          sprite.tint = 0xcccccc;
        } else {
          sprite.tint = 0xffffff;
        }
      }
    });

    // Remove sprites for cards that no longer exist
    const currentCardIds = new Set(cards.map(c => c.id));
    cardSprites.forEach((sprite, cardId) => {
      if (!currentCardIds.has(cardId)) {
        boardContainer!.removeChild(sprite);
        cardSprites.delete(cardId);
      }
    });
  }

  function createCardSprite(card: Card): Sprite {
    // Create a graphics object to draw the card
    const graphics = new Graphics();
    const cardWidth = 80;
    const cardHeight = 120;
    
    // Different colors based on card ID for variety
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7b731, 0x5f27cd];
    const colorIndex = parseInt(card.id.split('-')[1] || '0') % colors.length;
    const color = colors[colorIndex];
    
    graphics.rect(0, 0, cardWidth, cardHeight);
    graphics.fill(color);
    graphics.stroke({ width: 2, color: 0xffffff });

    // Convert graphics to texture and create sprite
    const texture = app!.renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);

    sprite.x = card.x;
    sprite.y = card.y;
    sprite.rotation = card.rotation;

    // Enable interaction
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    return sprite;
  }

  function setupInteraction() {
    if (!app || !boardContainer) return;

    // Global pointer down handler for cards
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    app.stage.on('pointerdown', (event) => {
      // Check if we clicked on a card
      cardSprites.forEach((sprite, cardId) => {
        if (sprite.containsPoint(event.global)) {
          isDragging = true;
          dragTarget = { sprite, cardId };
          
          // Calculate offset relative to the card's position
          const localPos = boardContainer!.toLocal(event.global);
          dragOffset.x = localPos.x - sprite.x;
          dragOffset.y = localPos.y - sprite.y;

          // Bring card to front
          boardContainer!.removeChild(sprite);
          boardContainer!.addChild(sprite);
          
          event.stopPropagation();
        }
      });
    });

    app.stage.on('pointermove', (event) => {
      if (isDragging && dragTarget && boardContainer) {
        const localPos = boardContainer.toLocal(event.global);
        const newX = localPos.x - dragOffset.x;
        const newY = localPos.y - dragOffset.y;
        
        // Update sprite position immediately (optimistic)
        dragTarget.sprite.x = newX;
        dragTarget.sprite.y = newY;
      }
    });

    app.stage.on('pointerup', () => {
      if (isDragging && dragTarget) {
        // Send MOVE action to server
        const moveAction: MoveAction = {
          type: 'MOVE',
          cardId: dragTarget.cardId,
          x: dragTarget.sprite.x,
          y: dragTarget.sprite.y,
          clientSeq: 0, // Will be set by store
          timestamp: Date.now()
        };
        
        const seq = gameStore.applyOptimisticAction(moveAction);
        gameClient.sendAction({ ...moveAction, clientSeq: seq });
        
        isDragging = false;
        dragTarget = null;
      }
    });

    app.stage.on('pointerupoutside', () => {
      isDragging = false;
      dragTarget = null;
    });

    // Right-click to tap/untap
    app.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      
      const point = { x: event.clientX, y: event.clientY };
      cardSprites.forEach((sprite, cardId) => {
        if (sprite.containsPoint(point as any)) {
          // Get current card state from store
          let card: Card | undefined;
          const unsubscribe = cardsStore.subscribe(cards => {
            card = cards.find(c => c.id === cardId);
          });
          unsubscribe();
          
          if (card) {
            const tapAction: TapAction = {
              type: 'TAP',
              cardId,
              tapped: !card.tapped,
              clientSeq: 0,
              timestamp: Date.now()
            };
            
            const seq = gameStore.applyOptimisticAction(tapAction);
            gameClient.sendAction({ ...tapAction, clientSeq: seq });
          }
        }
      });
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
      't': () => {
        console.log('T key pressed - Test rotation');
        testRotation();
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
    }
  }

  function fitToScreen() {
    if (!boardContainer || !app) return;
    
    // Calculate bounds of all cards
    const bounds = boardContainer.getBounds();
    if (bounds.width === 0 || bounds.height === 0) return;
    
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

  function testRotation() {
    // Rotate the first card as a test
    const firstCardId = Array.from(cardSprites.keys())[0];
    if (firstCardId) {
      let card: Card | undefined;
      const unsubscribe = cardsStore.subscribe(cards => {
        card = cards.find(c => c.id === firstCardId);
      });
      unsubscribe();
      
      if (card) {
        const newRotation = (card.rotation + Math.PI / 2) % (Math.PI * 2);
        const rotateAction: RotateAction = {
          type: 'ROTATE',
          cardId: firstCardId,
          rotation: newRotation,
          clientSeq: 0,
          timestamp: Date.now()
        };
        
        const seq = gameStore.applyOptimisticAction(rotateAction);
        gameClient.sendAction({ ...rotateAction, clientSeq: seq });
      }
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
    if (unsubscribeStore) {
      unsubscribeStore();
    }
    if (app) {
      app.destroy(true, { children: true });
    }
    gameClient.disconnect();
  });
</script>

<div class="play-container">
  <div bind:this={canvasContainer} class="canvas-container"></div>
  <div class="fps-counter">FPS: {fps}</div>
  <div class="connection-status" class:connected={connected} class:error={!!connectionError}>
    {#if connected}
      ✓ Connected
    {:else if connectionError}
      ⚠ {connectionError}
    {:else}
      ○ Connecting...
    {/if}
  </div>
  {#if pendingActions > 0}
    <div class="sync-status">
      ⏳ Syncing {pendingActions} action{pendingActions > 1 ? 's' : ''}...
    </div>
  {/if}
  <div class="controls-info">
    <div><strong>Controls:</strong></div>
    <div>• Drag cards to move</div>
    <div>• Right-click to tap/untap</div>
    <div>• Ctrl + Wheel to zoom</div>
    <div><strong>Hotkeys:</strong></div>
    <div>• R: Reset view</div>
    <div>• F: Fit to screen</div>
    <div>• T: Test rotation</div>
    <div>• Z: Zoom 100%</div>
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

  .connection-status {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: #ffaa00;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 1000;
    transition: color 0.3s;
  }

  .connection-status.connected {
    color: #00ff00;
  }

  .connection-status.error {
    color: #ff4444;
  }

  .sync-status {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 170, 0, 0.9);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-family: sans-serif;
    font-size: 12px;
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
    margin: 3px 0;
  }

  .controls-info strong {
    color: #ffaa00;
  }
</style>
