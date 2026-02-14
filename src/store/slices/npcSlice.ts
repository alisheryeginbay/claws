import { type StateCreator } from 'zustand';
import type { NpcState, NpcMood, Conversation, ChatMessage, NpcPersona } from '@/types';
import { generateId } from '@/lib/utils';

function createNpcState(id: string): NpcState {
  return {
    id,
    mood: 'neutral',
    patienceRemaining: 100,
    reputation: 0,
    messagesRead: true,
    isTyping: false,
  };
}

function createConversation(npcId: string): Conversation {
  return { npcId, messages: [], unreadCount: 0 };
}

export interface NpcSlice {
  npcs: Record<string, NpcState>;
  conversations: Record<string, Conversation>;
  npcCandidates: NpcPersona[];
  selectedNpc: NpcPersona | null;
  setNpcCandidates: (npcs: NpcPersona[]) => void;
  selectNpc: (id: string) => void;
  clearNpcCandidates: () => void;
  initializeNpc: (npc: NpcPersona) => void;
  setNpcMood: (npcId: string, mood: NpcMood) => void;
  decayPatience: (npcId: string, amount: number, tick: number) => void;
  changeReputation: (npcId: string, delta: number) => void;
  setNpcTyping: (npcId: string, isTyping: boolean) => void;
  addMessage: (npcId: string, text: string, isFromPlayer: boolean, tick: number, isSystem?: boolean) => void;
  markConversationRead: (npcId: string) => void;
  resetNpcs: () => void;
}

export const createNpcSlice: StateCreator<NpcSlice> = (set) => ({
  npcs: {},
  conversations: {},
  npcCandidates: [],
  selectedNpc: null,

  setNpcCandidates: (npcs) => set({ npcCandidates: npcs }),

  selectNpc: (id) =>
    set((state) => ({
      selectedNpc: state.npcCandidates.find((n) => n.id === id) || null,
    })),

  clearNpcCandidates: () => set({ npcCandidates: [] }),

  initializeNpc: (npc) =>
    set({
      selectedNpc: npc,
      npcs: { [npc.id]: createNpcState(npc.id) },
      conversations: { [npc.id]: createConversation(npc.id) },
    }),

  setNpcMood: (npcId, mood) =>
    set((state) => {
      if (!state.npcs[npcId]) return state;
      return {
        npcs: {
          ...state.npcs,
          [npcId]: { ...state.npcs[npcId], mood },
        },
      };
    }),

  decayPatience: (npcId, amount, tick) =>
    set((state) => {
      const npc = state.npcs[npcId];
      if (!npc) return state;
      const newPatience = Math.max(0, npc.patienceRemaining - amount);
      let newMood = npc.mood;
      let goneAtTick = npc.goneAtTick;

      if (newPatience <= 0 && npc.mood !== 'gone') {
        newMood = 'gone';
        goneAtTick = tick;
      } else if (newPatience <= 20 && npc.mood !== 'angry' && npc.mood !== 'gone') {
        newMood = 'angry';
      } else if (newPatience <= 50 && npc.mood === 'waiting') {
        newMood = 'frustrated';
      }

      return {
        npcs: {
          ...state.npcs,
          [npcId]: { ...npc, patienceRemaining: newPatience, mood: newMood, goneAtTick },
        },
      };
    }),

  changeReputation: (npcId, delta) =>
    set((state) => {
      if (!state.npcs[npcId]) return state;
      return {
        npcs: {
          ...state.npcs,
          [npcId]: {
            ...state.npcs[npcId],
            reputation: Math.max(-100, Math.min(100, state.npcs[npcId].reputation + delta)),
          },
        },
      };
    }),

  setNpcTyping: (npcId, isTyping) =>
    set((state) => {
      if (!state.npcs[npcId]) return state;
      return {
        npcs: {
          ...state.npcs,
          [npcId]: { ...state.npcs[npcId], isTyping },
        },
      };
    }),

  addMessage: (npcId, text, isFromPlayer, tick, isSystem) =>
    set((state) => {
      const conv = state.conversations[npcId];
      if (!conv) return state;
      const msg: ChatMessage = {
        id: generateId(),
        npcId,
        text,
        timestamp: tick,
        createdAt: Date.now(),
        isFromPlayer,
        isSystem,
      };
      return {
        conversations: {
          ...state.conversations,
          [npcId]: {
            ...conv,
            messages: [...conv.messages, msg],
            unreadCount: isFromPlayer ? conv.unreadCount : conv.unreadCount + 1,
          },
        },
      };
    }),

  markConversationRead: (npcId) =>
    set((state) => {
      if (!state.conversations[npcId]) return state;
      return {
        conversations: {
          ...state.conversations,
          [npcId]: { ...state.conversations[npcId], unreadCount: 0 },
        },
      };
    }),

  resetNpcs: () =>
    set({
      npcs: {},
      conversations: {},
      npcCandidates: [],
      selectedNpc: null,
    }),
});
