import { writable, derived } from 'svelte/store';
import type { Card, Player, GameAction, StatePatch, Acknowledgment } from '@mythosplanes/types';

/**
 * Local store state
 */
interface LocalState {
  players: Map<string, Player>;
  cards: Map<string, Card>;
  zones: Map<string, string[]>; // zone name -> card IDs
  clientSeq: number;
  serverSeq: number;
  pendingActions: Map<number, GameAction>; // clientSeq -> action
}

/**
 * Create initial empty state
 */
function createInitialState(): LocalState {
  return {
    players: new Map(),
    cards: new Map(),
    zones: new Map([
      ['hand', []],
      ['battlefield', []],
      ['graveyard', []],
      ['library', []],
      ['exile', []]
    ]),
    clientSeq: 0,
    serverSeq: 0,
    pendingActions: new Map()
  };
}

/**
 * Create the game store
 */
function createGameStore() {
  const { subscribe, set, update } = writable<LocalState>(createInitialState());

  return {
    subscribe,
    
    /**
     * Initialize cards (for demo purposes)
     */
    initializeCards: (cards: Card[]) => {
      update(state => {
        cards.forEach(card => {
          state.cards.set(card.id, card);
          const zoneCards = state.zones.get(card.zone) || [];
          if (!zoneCards.includes(card.id)) {
            zoneCards.push(card.id);
            state.zones.set(card.zone, zoneCards);
          }
        });
        return state;
      });
    },

    /**
     * Apply an optimistic action locally
     */
    applyOptimisticAction: (action: GameAction): number => {
      let seq = 0;
      update(state => {
        seq = ++state.clientSeq;
        const actionWithSeq = { ...action, clientSeq: seq };
        state.pendingActions.set(seq, actionWithSeq);
        
        // Apply optimistically to local state
        const card = state.cards.get(action.cardId);
        if (card) {
          const updatedCard = applyActionToCard(card, action);
          state.cards.set(card.id, updatedCard);
          
          // Update zone tracking if zone changed
          if (action.type === 'ZONE') {
            const oldZone = card.zone;
            const newZone = (action as any).zone;
            
            // Remove from old zone
            const oldZoneCards = state.zones.get(oldZone) || [];
            state.zones.set(oldZone, oldZoneCards.filter(id => id !== card.id));
            
            // Add to new zone
            const newZoneCards = state.zones.get(newZone) || [];
            if (!newZoneCards.includes(card.id)) {
              newZoneCards.push(card.id);
              state.zones.set(newZone, newZoneCards);
            }
          }
        }
        
        return state;
      });
      return seq;
    },

    /**
     * Apply server state patch
     */
    applyStatePatch: (patch: StatePatch) => {
      update(state => {
        // Update server sequence
        state.serverSeq = patch.serverSeq;
        
        // Remove acknowledged pending actions
        if (patch.clientSeq > 0) {
          state.pendingActions.delete(patch.clientSeq);
        }
        
        // Apply changes from server
        patch.changes.forEach(change => {
          if (change.id) {
            const existingCard = state.cards.get(change.id);
            if (existingCard) {
              const updatedCard = { ...existingCard, ...change };
              state.cards.set(change.id, updatedCard);
              
              // Update zone tracking if zone changed
              if (change.zone && change.zone !== existingCard.zone) {
                // Remove from old zone
                const oldZoneCards = state.zones.get(existingCard.zone) || [];
                state.zones.set(existingCard.zone, oldZoneCards.filter(id => id !== change.id));
                
                // Add to new zone
                const newZoneCards = state.zones.get(change.zone) || [];
                if (!newZoneCards.includes(change.id!)) {
                  newZoneCards.push(change.id!);
                  state.zones.set(change.zone, newZoneCards);
                }
              }
            } else {
              // New card from server
              state.cards.set(change.id, change as Card);
              if (change.zone) {
                const zoneCards = state.zones.get(change.zone) || [];
                if (!zoneCards.includes(change.id)) {
                  zoneCards.push(change.id);
                  state.zones.set(change.zone, zoneCards);
                }
              }
            }
          }
        });
        
        return state;
      });
    },

    /**
     * Handle acknowledgment from server
     */
    handleAcknowledgment: (ack: Acknowledgment) => {
      update(state => {
        if (ack.success) {
          // Remove acknowledged action
          state.pendingActions.delete(ack.clientSeq);
        } else {
          // Handle failed action - could revert or retry
          console.error(`Action ${ack.clientSeq} failed:`, ack.error);
          state.pendingActions.delete(ack.clientSeq);
        }
        state.serverSeq = ack.serverSeq;
        return state;
      });
    },

    /**
     * Add or update a player
     */
    updatePlayer: (player: Player) => {
      update(state => {
        state.players.set(player.id, player);
        return state;
      });
    },

    /**
     * Remove a player
     */
    removePlayer: (playerId: string) => {
      update(state => {
        state.players.delete(playerId);
        return state;
      });
    },

    /**
     * Reset the store
     */
    reset: () => {
      set(createInitialState());
    }
  };
}

/**
 * Apply an action to a card and return the updated card
 */
function applyActionToCard(card: Card, action: GameAction): Card {
  switch (action.type) {
    case 'MOVE':
      return { ...card, x: action.x, y: action.y };
    case 'ROTATE':
      return { ...card, rotation: action.rotation };
    case 'TAP':
      return { ...card, tapped: action.tapped };
    case 'FLIP':
      return { ...card, flipped: action.flipped };
    case 'ZONE':
      return { ...card, zone: action.zone };
    default:
      return card;
  }
}

/**
 * Export the singleton store
 */
export const gameStore = createGameStore();

/**
 * Derived stores for convenience
 */
export const cards = derived(gameStore, $state => Array.from($state.cards.values()));
export const players = derived(gameStore, $state => Array.from($state.players.values()));
export const zones = derived(gameStore, $state => $state.zones);
export const pendingActionCount = derived(gameStore, $state => $state.pendingActions.size);
