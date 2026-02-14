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

interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let lastCallTime = 0;
const pendingRequests = new Set<string>();

const RATE_LIMIT_MS = 2000;

function getActivePersona(): NpcPersona | null {
  return useGameStore.getState().selectedNpc;
}

function buildSystemPrompt(npcId: string, request?: GameRequest): string {
  const persona = getActivePersona();
  if (!persona || persona.id !== npcId) return 'You are an NPC in a game. Reply with ONE short casual sentence.';

  const lines = [
    `You are ${persona.name}, a ${persona.role} chatting on a work messenger app.`,
    `Personality: patience=${persona.patience}, techSavvy=${persona.techSavvy}, politeness=${persona.politeness}.`,
    persona.quirk ? `Quirk: ${persona.quirk}` : '',
  ];

  if (request) {
    lines.push('');
    lines.push(`YOUR CURRENT REQUEST: "${request.title}"`);
    if (request.description) lines.push(`Details: ${request.description}`);
    const objectives = request.objectives.filter(o => !o.completed).map(o => o.description);
    if (objectives.length > 0) lines.push(`What you need done: ${objectives.join('; ')}`);
  }

  lines.push('');
  lines.push('RULES:');
  lines.push('- Write ONLY 1 short sentence. Maximum 15 words.');
  lines.push('- Sound like a real person texting casually — use lowercase, abbreviations, emoji sometimes.');
  lines.push('- Do NOT repeat yourself or re-ask what you already asked.');
  lines.push('- Do NOT include quotes around your message.');
  lines.push('- Never mention being AI or break character.');

  return lines.filter(Boolean).join('\n');
}

/** Build messages for conversational types (reply, mood) — context in system prompt, not multi-turn */
function buildConversationMessages(params: GenerateParams): ChatMsg[] {
  const { npcId, messageType, mood, patiencePercent, request, recentMessages } = params;

  // Build system prompt with conversation log embedded
  let systemPrompt = buildSystemPrompt(npcId, request);

  if (recentMessages && recentMessages.length > 0) {
    const chatLog = recentMessages.slice(-6).map(msg => {
      if (msg.startsWith('Player:')) return `Assistant: ${msg.replace('Player: ', '')}`;
      if (msg.startsWith('NPC:')) return `You: ${msg.replace('NPC: ', '')}`;
      return msg;
    }).join('\n');
    systemPrompt += `\n\nCHAT LOG (do NOT repeat what you already said):\n${chatLog}`;
  }

  const instruction =
    messageType === 'reply'
      ? 'Write your next reply to the assistant. Be specific about your request. One casual sentence, max 10 words. Do NOT repeat anything from the chat log.'
      : `[Mood: ${mood}, patience: ${patiencePercent?.toFixed(0)}%] The assistant hasn't replied. Send a brief follow-up. Do NOT repeat what you already said.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: instruction },
  ];
}

/** Build simple system+user pair for one-shot types (initial, completion, failure) */
function buildSimpleMessages(params: GenerateParams): ChatMsg[] {
  const { npcId, messageType, request } = params;
  const systemPrompt = buildSystemPrompt(npcId, request);
  let userMsg = '';

  switch (messageType) {
    case 'initial':
      userMsg = request
        ? `You need help with: "${request.title}". Ask the AI assistant for help. Be casual and brief — one sentence.`
        : 'Say hi to the AI assistant.';
      break;
    case 'completion':
      userMsg = request
        ? `Your task "${request.title}" was just completed. React briefly — you're happy. One sentence.`
        : 'Your request was completed. React briefly.';
      break;
    case 'failure':
      userMsg = request
        ? `Your task "${request.title}" wasn't finished in time. React briefly — you're disappointed. One sentence.`
        : 'Your request expired. React briefly.';
      break;
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMsg },
  ];
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

  // Reply messages (player-initiated) always go through — never rate-limited
  const isPlayerReply = params.messageType === 'reply';

  if (!isPlayerReply) {
    // Rate limit NPC-initiated messages: 2s minimum between calls
    const now = Date.now();
    if (now - lastCallTime < RATE_LIMIT_MS) {
      return getFallback(params);
    }
  }

  // Dedup: same NPC + type shouldn't fire concurrently
  const dedupKey = `${params.npcId}:${params.messageType}`;
  if (pendingRequests.has(dedupKey)) {
    return getFallback(params);
  }

  pendingRequests.add(dedupKey);
  lastCallTime = Date.now();

  try {
    // Conversational types use multi-turn chat; others use simple prompt
    const messages =
      params.messageType === 'reply' || params.messageType === 'mood'
        ? buildConversationMessages(params)
        : buildSimpleMessages(params);

    const result = await callOpenRouter({
      messages,
      maxTokens: 40,
      temperature: 0.8,
      timeoutMs: 8000,
    });

    const text = (result.text || '').replace(/^["']|["']$/g, '').trim();
    return text || getFallback(params);
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
