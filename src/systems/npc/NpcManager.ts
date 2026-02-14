import { useGameStore } from '@/store/gameStore';
import { generateNpcMessage } from '@/services/ai';
import type { NpcMood } from '@/types';
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

// Minimum ticks between mood messages per NPC (~30s at normal speed)
const MOOD_COOLDOWN_TICKS = 60;

export class NpcManager {
  private lastMoodMessageTick: Record<string, number> = {};

  // Decay patience for the active NPC when they have requests
  tickAll(): void {
    const state = useGameStore.getState();
    const persona = state.selectedNpc;
    if (!persona) return;

    const activeRequests = state.requests.filter(
      (r) => r.status === 'active' || r.status === 'in_progress'
    );

    for (const request of activeRequests) {
      const npc = state.npcs[request.npcId];
      if (!npc || npc.mood === 'gone') continue;

      // Patience decay: lower patience stat = faster decay
      const decayRate = (1 - persona.patience) * 2;
      state.decayPatience(request.npcId, decayRate, state.clock.tickCount);

      // Mood-based random messages with typing indicator
      const updatedNpc = useGameStore.getState().npcs[request.npcId];
      if (!updatedNpc) continue;
      const ticksSinceLastMsg = state.clock.tickCount - (this.lastMoodMessageTick[request.npcId] ?? -MOOD_COOLDOWN_TICKS);
      if (ticksSinceLastMsg >= MOOD_COOLDOWN_TICKS && this.shouldSendMessage(updatedNpc.mood, updatedNpc.patienceRemaining)) {
        this.lastMoodMessageTick[request.npcId] = state.clock.tickCount;
        const npcId = request.npcId;
        const currentMood = updatedNpc.mood;
        const patiencePercent = updatedNpc.patienceRemaining;

        // Show typing indicator, then deliver AI message
        state.setNpcTyping(npcId, true);

        const aiPromise = generateNpcMessage({
          npcId,
          messageType: 'mood',
          mood: currentMood,
          patiencePercent,
        });
        const typingDelay = new Promise<void>((resolve) =>
          setTimeout(resolve, 800 + Math.random() * 600)
        );

        Promise.all([aiPromise, typingDelay]).then(([dialogue]) => {
          const s = useGameStore.getState();
          // Guard: NPC may have left during async wait
          if (s.npcs[npcId]?.mood === 'gone') return;
          s.setNpcTyping(npcId, false);
          s.addMessage(npcId, dialogue, false, s.clock.tickCount);
        });
      }

      // Handle NPC leaving
      if (updatedNpc.mood === 'gone') {
        EventBus.emit('npc_left', { npcId: request.npcId, requestId: request.id });
      }
    }
  }

  private shouldSendMessage(mood: NpcMood, _patience: number): boolean {
    const chance = mood === 'angry' ? 0.08 :
                   mood === 'frustrated' ? 0.04 :
                   mood === 'waiting' ? 0.02 :
                   0;
    return Math.random() < chance;
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
