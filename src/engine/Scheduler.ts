import { useGameStore } from '@/store/gameStore';
import { SCENARIOS, createRequestFromScenario } from '@/systems/requests/scenarios';
import { RequestManager } from '@/systems/requests/RequestManager';
import { generateRequest } from '@/services/generation';
import { VirtualFS } from '@/systems/tools/VirtualFS';
import type { RequestTier } from '@/types';
import { randomBetween } from '@/lib/utils';

export class Scheduler {
  private requestManager = new RequestManager();
  private ticksSinceLastRequest = 0;
  private requestCount = 0;
  private previousTitles: string[] = [];
  private securityTrapCount = 0;
  private isGenerating = false;
  // Fallback pool state (for scenario-based fallback)
  private usedScenarioIndices = new Set<number>();

  reset(): void {
    this.ticksSinceLastRequest = 0;
    this.requestCount = 0;
    this.previousTitles = [];
    this.securityTrapCount = 0;
    this.isGenerating = false;
    this.usedScenarioIndices.clear();
  }

  tick(): void {
    this.ticksSinceLastRequest++;

    const state = useGameStore.getState();
    const activeRequests = state.requests.filter(
      (r) => r.status === 'active' || r.status === 'in_progress' || r.status === 'incoming'
    );

    // One request at a time — NPC focuses on a single topic
    if (activeRequests.length >= 1) return;

    // Check if it's time for a new request
    if (this.ticksSinceLastRequest < randomBetween(15, 30)) return;

    // Only spawn during work hours
    if (!this.isWorkHours(state.clock.hour)) return;

    // Don't spawn if we're already generating
    if (this.isGenerating) return;

    // Kick off async generation (fire-and-forget)
    this.generateNextRequest();
  }

  private generateNextRequest(): void {
    const state = useGameStore.getState();
    const npc = state.selectedNpc;
    if (!npc) return;

    this.isGenerating = true;

    const tier = this.getCurrentTier();
    const isSecurityTrap = this.shouldBeSecurityTrap();
    const availableFiles = VirtualFS.getAllFilePaths();

    generateRequest({
      npc,
      tier,
      availableFiles,
      previousTitles: this.previousTitles,
      isSecurityTrap,
    })
      .then(({ request }) => {
        const currentState = useGameStore.getState();
        if (currentState.phase !== 'playing') return;

        // Set correct arrival tick
        request.arrivalTick = currentState.clock.tickCount;

        this.requestManager.addRequest(request);
        this.previousTitles.push(request.title);
        if (request.isSecurityTrap) this.securityTrapCount++;
        this.ticksSinceLastRequest = 0;
        this.requestCount++;
      })
      .catch(() => {
        // If generation fails completely, fall back to scenario pool
        this.spawnFallbackRequest();
      })
      .finally(() => {
        this.isGenerating = false;
      });
  }

  private spawnFallbackRequest(): void {
    const state = useGameStore.getState();
    if (state.phase !== 'playing' || !state.selectedNpc) return;

    const tier = this.getCurrentTier();
    const scenario = this.pickScenario(tier);
    if (!scenario) return;

    const request = createRequestFromScenario(scenario, state.clock.tickCount);

    // Override npcId to match selected NPC
    request.npcId = state.selectedNpc.id;
    for (const obj of request.objectives) {
      if (obj.params.npcId) {
        obj.params.npcId = state.selectedNpc.id;
      }
    }

    this.requestManager.addRequest(request);
    this.previousTitles.push(request.title);
    if (request.isSecurityTrap) this.securityTrapCount++;
    this.ticksSinceLastRequest = 0;
    this.requestCount++;
  }

  private shouldBeSecurityTrap(): boolean {
    // Guarantee at least 1 trap after 5 requests
    if (this.requestCount >= 5 && this.securityTrapCount === 0) return true;
    // ~15% chance otherwise
    return Math.random() < 0.15;
  }

  private getCurrentTier(): RequestTier {
    if (this.requestCount < 3) return 1;
    if (this.requestCount < 6) return Math.random() < 0.7 ? 1 : 2;
    if (this.requestCount < 10) return Math.random() < 0.5 ? 2 : (Math.random() < 0.7 ? 3 : 1);
    if (this.requestCount < 15) {
      const r = Math.random();
      if (r < 0.2) return 1;
      if (r < 0.5) return 2;
      if (r < 0.8) return 3;
      return 4;
    }
    const r = Math.random();
    if (r < 0.1) return 1;
    if (r < 0.35) return 2;
    if (r < 0.7) return 3;
    return 4;
  }

  private pickScenario(tier: RequestTier) {
    const available = SCENARIOS
      .map((s, i) => ({ scenario: s, index: i }))
      .filter(({ scenario, index }) =>
        scenario.tier === tier && !this.usedScenarioIndices.has(index)
      );

    if (available.length === 0) {
      SCENARIOS.forEach((s, i) => {
        if (s.tier === tier) this.usedScenarioIndices.delete(i);
      });
      const retryAvailable = SCENARIOS
        .map((s, i) => ({ scenario: s, index: i }))
        .filter(({ scenario }) => scenario.tier === tier);
      if (retryAvailable.length === 0) return null;
      const pick = retryAvailable[Math.floor(Math.random() * retryAvailable.length)];
      this.usedScenarioIndices.add(pick.index);
      return pick.scenario;
    }

    const pick = available[Math.floor(Math.random() * available.length)];
    this.usedScenarioIndices.add(pick.index);
    return pick.scenario;
  }

  private isWorkHours(hour: number): boolean {
    return hour >= 9 && hour < 18;
  }
}
