import { useGameStore } from '@/store/gameStore';
import { generateNpcMessage } from '@/services/ai';
import type { NpcMood, GameRequest } from '@/types';
import { EventBus } from '@/engine/EventBus';

/** Trigger an NPC reply after the player sends a message */
export function triggerNpcReply(npcId: string): void {
  const state = useGameStore.getState();
  const npc = state.npcs[npcId];
  if (!npc || npc.mood === 'gone' || npc.isTyping) return;

  // Find active request for context
  const activeRequest = state.requests.find(
    (r) => r.npcId === npcId && (r.status === 'active' || r.status === 'in_progress')
  );

  // Get recent messages for context
  const conv = state.conversations[npcId];
  const recentMessages = conv?.messages.slice(-6).map((m) =>
    `${m.isFromPlayer ? 'Player' : 'NPC'}: ${m.text}`
  );

  // Show typing indicator
  state.setNpcTyping(npcId, true);

  const aiPromise = generateNpcMessage({
    npcId,
    messageType: 'reply',
    mood: npc.mood,
    patiencePercent: npc.patienceRemaining,
    request: activeRequest,
    recentMessages,
  });
  const typingDelay = new Promise<void>((resolve) =>
    setTimeout(resolve, 600 + Math.random() * 800)
  );

  Promise.all([aiPromise, typingDelay]).then(([dialogue]) => {
    const s = useGameStore.getState();
    if (s.npcs[npcId]?.mood === 'gone') return;
    s.setNpcTyping(npcId, false);
    s.addMessage(npcId, dialogue, false, s.clock.tickCount);
  });
}

// Short delay before NPC introduces a new request (~5s at normal speed)
const INITIAL_DELAY_TICKS = 10;
// Follow-up interval when player hasn't replied (~20s at normal speed)
const CHECKIN_INTERVAL_TICKS = 40;

export class NpcManager {
  // Decay patience for the active NPC when they have requests
  tickAll(): void {
    const state = useGameStore.getState();
    const persona = state.selectedNpc;
    if (!persona) return;

    const activeRequests = state.requests.filter(
      (r) => r.status === 'active' || r.status === 'in_progress'
    );

    // Decay patience for all active requests (deadlines still tick)
    for (const request of activeRequests) {
      const npc = state.npcs[request.npcId];
      if (!npc || npc.mood === 'gone') continue;

      const decayRate = (1 - persona.patience) * 2;
      state.decayPatience(request.npcId, decayRate, state.clock.tickCount);

      const updatedNpc = useGameStore.getState().npcs[request.npcId];
      if (updatedNpc?.mood === 'gone') {
        EventBus.emit('npc_left', { npcId: request.npcId, requestId: request.id });
      }
    }

    // Check-in messaging: focus on ONE request only (the first active)
    const focusRequest = activeRequests[0];
    if (!focusRequest) return;

    const npcId = focusRequest.npcId;
    const npc = state.npcs[npcId];
    if (!npc || npc.mood === 'gone' || npc.isTyping) return;

    const conv = state.conversations[npcId];
    const msgs = conv?.messages;
    const lastMsg = msgs?.[msgs.length - 1];

    // Has the NPC sent any chat message about this request?
    const npcHasMessaged = msgs?.some(
      m => !m.isFromPlayer && !m.isSystem && m.timestamp >= focusRequest.arrivalTick
    );

    if (!npcHasMessaged) {
      // NPC hasn't introduced this request yet — send initial message after short delay
      const ticksSinceRequest = state.clock.tickCount - focusRequest.arrivalTick;
      if (ticksSinceRequest >= INITIAL_DELAY_TICKS) {
        this.sendCheckin(npcId, npc.mood, npc.patienceRemaining, focusRequest);
      }
    } else if (lastMsg && !lastMsg.isFromPlayer && !lastMsg.isSystem) {
      // Standard turn-based: NPC sent last message, waiting for player reply
      const ticksSinceLastMsg = state.clock.tickCount - lastMsg.timestamp;
      if (ticksSinceLastMsg >= CHECKIN_INTERVAL_TICKS) {
        this.sendCheckin(npcId, npc.mood, npc.patienceRemaining, focusRequest);
      }
    }
  }

  private sendCheckin(npcId: string, mood: NpcMood, patiencePercent: number, request: GameRequest): void {
    const state = useGameStore.getState();
    state.setNpcTyping(npcId, true);

    // Pass recent messages so check-in can reference the conversation
    const conv = state.conversations[npcId];
    const recentMessages = conv?.messages.slice(-6).map((m) =>
      `${m.isFromPlayer ? 'Player' : 'NPC'}: ${m.text}`
    );

    const aiPromise = generateNpcMessage({
      npcId,
      messageType: 'mood',
      mood,
      patiencePercent,
      request,
      recentMessages,
    });
    const typingDelay = new Promise<void>((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 600)
    );

    Promise.all([aiPromise, typingDelay]).then(([dialogue]) => {
      const s = useGameStore.getState();
      if (s.npcs[npcId]?.mood === 'gone') return;
      s.setNpcTyping(npcId, false);
      s.addMessage(npcId, dialogue, false, s.clock.tickCount);
    });
  }

  resetMood(npcId: string): void {
    const state = useGameStore.getState();
    state.setNpcMood(npcId, 'neutral');
  }

  boostMood(npcId: string): void {
    const state = useGameStore.getState();
    const npc = state.npcs[npcId];
    if (npc && npc.mood !== 'gone') {
      state.setNpcMood(npcId, 'happy');
      state.changeReputation(npcId, 10);
    }
  }

  setWaiting(npcId: string): void {
    const state = useGameStore.getState();
    const npc = state.npcs[npcId];
    if (npc && npc.mood === 'neutral') {
      state.setNpcMood(npcId, 'waiting');
    }
  }
}
