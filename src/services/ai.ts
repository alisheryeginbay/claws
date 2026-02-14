import { useGameStore } from '@/store/gameStore';
import { getRandomDialogue, getReplyDialogue } from '@/systems/npc/dialogues';
import type { NpcMood, GameRequest, NpcPersona } from '@/types';
import { callOpenRouter, isOpenRouterAvailable, resetOpenRouterCache } from '@/services/openrouter';

type MessageType = 'mood' | 'initial' | 'completion' | 'failure' | 'reply';

interface GenerateParams {
  npcId: string;
  messageType: MessageType;
  mood?: NpcMood;
  patiencePercent?: number;
  request?: GameRequest;
  recentMessages?: string[];
}

let lastCallTime = 0;
const pendingRequests = new Set<string>();

const RATE_LIMIT_MS = 2000;

function getActivePersona(): NpcPersona | null {
  return useGameStore.getState().selectedNpc;
}

function buildSystemPrompt(npcId: string): string {
  const persona = getActivePersona();
  if (!persona || persona.id !== npcId) return 'You are an NPC in a game.';

  return [
    `You are ${persona.name}, a ${persona.role} in an office chat app.`,
    `Personality: patience=${persona.patience}, techSavvy=${persona.techSavvy}, politeness=${persona.politeness}.`,
    persona.description ? `Background: ${persona.description}` : '',
    persona.quirk ? `Quirk: ${persona.quirk}` : '',
    'Write a single short chat message (1-2 sentences max). No quotes around the message.',
    'Stay in character. Never break the fourth wall or mention being AI-generated.',
  ].filter(Boolean).join(' ');
}

function buildUserMessage(params: GenerateParams): string {
  const { messageType, mood, patiencePercent, request, recentMessages } = params;
  const parts: string[] = [];

  switch (messageType) {
    case 'mood':
      parts.push(`Current mood: ${mood}. Patience: ${patiencePercent?.toFixed(0)}%.`);
      parts.push('Send a mood-appropriate ping message to the AI assistant you\'re waiting on.');
      break;
    case 'initial':
      if (request) {
        parts.push(`You need help with: "${request.title}" - ${request.description}`);
        parts.push('Write your opening message asking the AI assistant for help with this task.');
      }
      break;
    case 'completion':
      if (request) {
        parts.push(`The AI assistant just completed your task: "${request.title}".`);
        parts.push('Write a reaction message. You\'re satisfied with the result.');
      }
      break;
    case 'failure':
      if (request) {
        parts.push(`The AI assistant failed to complete your task: "${request.title}" before the deadline.`);
        parts.push('Write a disappointed/frustrated reaction.');
      }
      break;
    case 'reply':
      parts.push(`Current mood: ${mood}. Patience: ${patiencePercent?.toFixed(0)}%.`);
      if (request) {
        parts.push(`You asked the AI assistant for help with: "${request.title}".`);
      }
      parts.push('The AI assistant just sent you a chat message. Write a short reply acknowledging it.');
      parts.push('Keep it natural and conversational - 1 sentence max.');
      break;
  }

  if (recentMessages && recentMessages.length > 0) {
    parts.push(`Recent chat context: ${recentMessages.slice(-4).join(' | ')}`);
  }

  return parts.join(' ');
}

function getFallback(params: GenerateParams): string {
  const { npcId, messageType, mood, request } = params;

  switch (messageType) {
    case 'mood':
      return getRandomDialogue(npcId, mood || 'waiting');
    case 'initial':
      return request?.initialMessage || getRandomDialogue(npcId, 'neutral');
    case 'completion':
      return request?.completionMessage || getRandomDialogue(npcId, 'happy');
    case 'failure':
      return request?.failureMessage || getRandomDialogue(npcId, 'angry');
    case 'reply':
      return getReplyDialogue(npcId, mood || 'neutral');
    default:
      return getRandomDialogue(npcId, 'neutral');
  }
}

export async function generateNpcMessage(params: GenerateParams): Promise<string> {
  if (!isOpenRouterAvailable()) {
    return getFallback(params);
  }

  // Rate limit: 2s minimum between calls
  const now = Date.now();
  if (now - lastCallTime < RATE_LIMIT_MS) {
    return getFallback(params);
  }

  // Dedup: same NPC + type shouldn't fire concurrently
  const dedupKey = `${params.npcId}:${params.messageType}`;
  if (pendingRequests.has(dedupKey)) {
    return getFallback(params);
  }

  pendingRequests.add(dedupKey);
  lastCallTime = now;

  try {
    const systemPrompt = buildSystemPrompt(params.npcId);
    const userMessage = buildUserMessage(params);

    const result = await callOpenRouter({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      maxTokens: 80,
      temperature: 0.9,
      timeoutMs: 8000,
    });

    return result.text || getFallback(params);
  } catch {
    return getFallback(params);
  } finally {
    pendingRequests.delete(dedupKey);
  }
}

export function resetAiService(): void {
  lastCallTime = 0;
  pendingRequests.clear();
  resetOpenRouterCache();
}
