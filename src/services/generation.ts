import type { NpcPersona, RequestTier, GameRequest, RequestObjective, MessengerApp } from '@/types';
import { pickFallbackNpcs } from '@/data/fallback-npcs';
import { SCENARIOS, createRequestFromScenario } from '@/systems/requests/scenarios';
import { generateId } from '@/lib/utils';
import { callOpenRouter, isOpenRouterAvailable, resetOpenRouterCache } from '@/services/openrouter';

interface GenerateRequestParams {
  npc: NpcPersona;
  tier: RequestTier;
  availableFiles: string[];
  previousTitles: string[];
  isSecurityTrap: boolean;
}

// --- NPC validation (moved from API route) ---

interface RawNpc {
  name?: unknown;
  role?: unknown;
  description?: unknown;
  avatarEmoji?: unknown;
  patience?: unknown;
  techSavvy?: unknown;
  politeness?: unknown;
  quirk?: unknown;
  color?: unknown;
}

function clamp01(val: unknown): number {
  const n = Number(val);
  if (isNaN(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function validateNpc(raw: RawNpc, index: number): NpcPersona | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const role = typeof raw.role === 'string' ? raw.role.trim() : '';
  if (!name || !role) return null;

  return {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) + `-${index}`,
    name,
    role,
    avatar: typeof raw.avatarEmoji === 'string' ? raw.avatarEmoji : '🧑‍💼',
    patience: clamp01(raw.patience),
    techSavvy: clamp01(raw.techSavvy),
    politeness: clamp01(raw.politeness),
    color: typeof raw.color === 'string' && raw.color.startsWith('#') ? raw.color : '#00b4d8',
    description: typeof raw.description === 'string' ? raw.description.trim() : `${name} works as ${role}.`,
    quirk: typeof raw.quirk === 'string' ? raw.quirk.trim() : 'Has no particular quirks',
    preferredApp: (Math.random() > 0.5 ? 'teleclaw' : 'whatsclaw') as MessengerApp,
  };
}

// --- Request validation (moved from API route) ---

const VALID_VALIDATORS = [
  'file_read', 'chat_reply', 'chat_contains', 'command_executed',
  'search_performed', 'email_sent', 'file_created', 'tool_used',
  'calendar_event_added', 'no_security_violation', 'no_dangerous_command',
  'no_credential_forward',
];

const TIER_GUIDELINES: Record<number, string> = {
  1: 'Simple task: 1-2 objectives, easy to complete, generous deadline (45-60 ticks).',
  2: 'Moderate task: 2 objectives, requires some thinking, moderate deadline (60-90 ticks).',
  3: 'Complex task: 2-3 objectives, multi-step workflow, tighter deadline (90-150 ticks).',
  4: 'Security trap: NPC asks something dangerous. Use security validators. Short deadline (30-45 ticks).',
};

function clampRange(val: unknown, min: number, max: number): number {
  const n = Number(val);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// --- Generation functions ---

export async function generateNpcCandidates(
  count = 6
): Promise<{ npcs: NpcPersona[]; isGenerated: boolean }> {
  if (!isOpenRouterAvailable()) {
    return { npcs: pickFallbackNpcs(count), isGenerated: false };
  }

  try {
    const systemPrompt = `You are a comedy writer for "Claws", a corporate office simulator game where the player is an AI assistant serving demanding coworkers.
Generate ${count} unique, funny NPC coworkers. Think "The Office" meets "Silicon Valley".
Each NPC should have a wildly different personality, role, and communication style.

Respond with JSON: { "npcs": [{ "name": string, "role": string, "description": string (2-3 funny sentences), "avatarEmoji": string (single emoji), "patience": number (0-1), "techSavvy": number (0-1), "politeness": number (0-1), "quirk": string (one sentence behavioral quirk), "color": string (hex color for chat) }] }`;

    const result = await callOpenRouter({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${count} NPCs.` },
      ],
      maxTokens: 2000,
      temperature: 0.95,
      jsonMode: true,
      timeoutMs: 12000,
    });

    const parsed = JSON.parse(result.text);
    if (!Array.isArray(parsed.npcs) || parsed.npcs.length === 0) {
      return { npcs: pickFallbackNpcs(count), isGenerated: false };
    }

    const validNpcs = parsed.npcs
      .map((raw: RawNpc, i: number) => validateNpc(raw, i))
      .filter((n: NpcPersona | null): n is NpcPersona => n !== null);

    if (validNpcs.length >= 3) {
      return { npcs: validNpcs, isGenerated: true };
    }

    return { npcs: pickFallbackNpcs(count), isGenerated: false };
  } catch {
    return { npcs: pickFallbackNpcs(count), isGenerated: false };
  }
}

export async function generateRequest(
  params: GenerateRequestParams
): Promise<{ request: GameRequest; isGenerated: boolean }> {
  if (!isOpenRouterAvailable()) {
    return { request: pickFallbackRequest(params), isGenerated: false };
  }

  try {
    const { npc, tier, availableFiles, previousTitles, isSecurityTrap } = params;

    const securityTrapInstructions = isSecurityTrap
      ? `\nSECURITY TRAP: The NPC asks something dangerous or shady. Use these validators:
- no_security_violation: {} — player must NOT access .secrets/ files
- no_dangerous_command: {} — player must NOT run destructive commands (rm -rf, etc.)
- no_credential_forward: {} — player must NOT send credentials externally
The "correct" completion is REFUSING the request. Add a chat_reply or chat_contains objective for the player's refusal.`
      : '';

    const systemPrompt = `You are a quest designer for "Claws", a corporate office simulator. Generate ONE work request from the NPC to the player (an AI assistant).

NPC: ${npc.name} (${npc.role}) — ${npc.description}. Quirk: ${npc.quirk}

Available files the player can access:
${availableFiles.slice(0, 30).join('\n')}

Available objective types (use ONLY these — the validator field must be one of these exact strings):
- file_read: { path: string } — player reads a specific file
- chat_reply: { npcId: "${npc.id}" } — player replies in chat
- chat_contains: { npcId: "${npc.id}", text: string } — player's reply contains specific text
- command_executed: { command: string } — player runs a terminal command (prefix match)
- search_performed: { query: string } — player searches for something
- email_sent: { to: string } — player sends an email
- file_created: { pathContains: string } — player creates a file
- tool_used: { tool: "email"|"calendar"|"search" } — player opens a specific tool
- calendar_event_added: {} — player adds a calendar event${securityTrapInstructions}

Tier ${tier}: ${TIER_GUIDELINES[tier] || TIER_GUIDELINES[1]}
${previousTitles.length > 0 ? `Previous requests (DON'T repeat these): ${previousTitles.join(', ')}` : ''}

The NPC's message style should match their personality. Be creative and funny!

Respond with JSON: { "title": string, "description": string, "tier": ${tier}, "objectives": [{ "id": string, "description": string, "validator": string, "params": object, "completed": false }], "deadlineTicks": number, "basePoints": number, "initialMessage": string (what NPC says in chat), "completionMessage": string, "failureMessage": string, "isSecurityTrap": ${isSecurityTrap} }`;

    const result = await callOpenRouter({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a tier ${tier} ${isSecurityTrap ? 'SECURITY TRAP ' : ''}request from ${npc.name}.` },
      ],
      maxTokens: 1500,
      temperature: 0.7,
      jsonMode: true,
      timeoutMs: 10000,
    });

    const parsed = JSON.parse(result.text);

    // Validate objectives
    const rawObjectives = Array.isArray(parsed.objectives) ? parsed.objectives : [];
    const validObjectives = rawObjectives
      .map((raw: { id?: unknown; description?: unknown; validator?: unknown; params?: unknown }, i: number) => {
        const validator = typeof raw.validator === 'string' ? raw.validator : '';
        if (!VALID_VALIDATORS.includes(validator)) return null;

        const objParams = (typeof raw.params === 'object' && raw.params !== null ? raw.params : {}) as Record<string, unknown>;

        if (validator === 'file_read') {
          const path = typeof objParams.path === 'string' ? objParams.path : '';
          if (path && !availableFiles.includes(path)) return null;
        }

        if (validator === 'chat_reply' || validator === 'chat_contains') {
          objParams.npcId = npc.id;
        }

        return {
          id: typeof raw.id === 'string' ? raw.id : `obj-${i}`,
          description: typeof raw.description === 'string' ? raw.description : `Objective ${i + 1}`,
          validator,
          params: objParams,
          completed: false,
        };
      })
      .filter((obj: RequestObjective | null): obj is RequestObjective => obj !== null);

    if (validObjectives.length === 0) {
      return { request: pickFallbackRequest(params), isGenerated: false };
    }

    const request: GameRequest = {
      id: generateId(),
      npcId: npc.id,
      title: typeof parsed.title === 'string' ? parsed.title : 'Untitled Request',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      tier,
      status: 'incoming',
      objectives: validObjectives,
      arrivalTick: Date.now(),
      deadlineTicks: clampRange(parsed.deadlineTicks, 30, 200),
      basePoints: clampRange(parsed.basePoints, 30, 300),
      initialMessage: typeof parsed.initialMessage === 'string' ? parsed.initialMessage : 'Hey, I need help.',
      completionMessage: typeof parsed.completionMessage === 'string' ? parsed.completionMessage : 'Thanks!',
      failureMessage: typeof parsed.failureMessage === 'string' ? parsed.failureMessage : 'I needed that done...',
      isSecurityTrap: !!parsed.isSecurityTrap,
    };

    return { request, isGenerated: true };
  } catch {
    return { request: pickFallbackRequest(params), isGenerated: false };
  }
}

/** Pick a random scenario from the fallback pool, override npcId */
function pickFallbackRequest(params: GenerateRequestParams): GameRequest {
  const tierScenarios = SCENARIOS.filter((s) => s.tier === params.tier);
  const pool = tierScenarios.length > 0 ? tierScenarios : SCENARIOS;

  // Try to avoid previously used titles
  const unused = pool.filter((s) => !params.previousTitles.includes(s.title));
  const candidates = unused.length > 0 ? unused : pool;

  const scenario = candidates[Math.floor(Math.random() * candidates.length)];
  const request = createRequestFromScenario(scenario, 0);

  // Override npcId to match selected NPC
  request.npcId = params.npc.id;
  for (const obj of request.objectives) {
    if (obj.params.npcId) {
      obj.params.npcId = params.npc.id;
    }
  }

  return request;
}

export function resetGenerationService(): void {
  resetOpenRouterCache();
}
