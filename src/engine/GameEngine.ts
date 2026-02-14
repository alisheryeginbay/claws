import { useGameStore } from '@/store/gameStore';
import { Clock } from './Clock';
import { Scheduler } from './Scheduler';
import { EventBus } from './EventBus';
import { NpcManager } from '@/systems/npc/NpcManager';
import { RequestManager } from '@/systems/requests/RequestManager';
import { ConsequenceEngine } from '@/systems/consequences/ConsequenceEngine';
import { SecurityModel } from '@/systems/consequences/SecurityModel';
import { ResourceSimulator } from '@/systems/consequences/ResourceSimulator';
import { VirtualFS } from '@/systems/tools/VirtualFS';
import { resetAiService } from '@/services/ai';
import { resetGenerationService } from '@/services/generation';
import { SEED_EMAILS } from '@/data/emails';
import { SEED_CALENDAR_EVENTS } from '@/data/calendar-events';
import type { NpcPersona } from '@/types';

interface StartParams {
  selectedNpc: NpcPersona;
}

export class GameEngine {
  private clock = new Clock();
  private scheduler = new Scheduler();
  private npcManager = new NpcManager();
  private requestManager = new RequestManager();
  private consequenceEngine = new ConsequenceEngine();
  private securityModel = new SecurityModel();
  private resourceSimulator = new ResourceSimulator();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start({ selectedNpc }: StartParams): void {
    const state = useGameStore.getState();

    // Reset everything
    state.resetGame();
    VirtualFS.reset();
    this.scheduler.reset();
    EventBus.clear();
    resetAiService();
    resetGenerationService();

    // Initialize single NPC
    state.initializeNpc(selectedNpc);

    // Seed data
    SEED_EMAILS.forEach((email) => state.addEmail(email));
    SEED_CALENDAR_EVENTS.forEach((event) => state.addCalendarEvent(event));

    // Initialize systems
    this.consequenceEngine.init();
    this.securityModel.init();

    // Set phase to playing
    state.setPhase('playing');

    // Start tick loop
    this.startLoop();
  }

  private startLoop(): void {
    this.stopLoop();

    const tick = () => {
      const state = useGameStore.getState();

      if (state.phase !== 'playing') return;
      if (state.clock.speed === 'paused') return;

      // 1. Advance clock
      this.clock.advance();

      // 2. Run scheduler
      this.scheduler.tick();

      // 3. Update NPC moods
      this.npcManager.tickAll();

      // 4. Process resources
      this.resourceSimulator.tick();

      // 5. Check request deadlines + completions
      this.requestManager.tick();

      // 6. Emit tick event
      EventBus.emit('tick', { tick: state.clock.tickCount + 1 });

      // 7. Check end-of-day
      if (this.clock.isEndOfDay()) {
        // Optional: end-of-day summary
      }
    };

    // Dynamic interval based on speed
    const runLoop = () => {
      const state = useGameStore.getState();
      const interval = state.clock.speed === 'fast' ? 250 : 500;

      tick();

      this.intervalId = setTimeout(runLoop, interval) as unknown as ReturnType<typeof setInterval>;
    };

    runLoop();
  }

  private stopLoop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId as unknown as number);
      this.intervalId = null;
    }
  }

  pause(): void {
    useGameStore.getState().setSpeed('paused');
  }

  resume(): void {
    useGameStore.getState().setSpeed('normal');
  }

  stop(): void {
    this.stopLoop();
    this.consequenceEngine.destroy();
    EventBus.clear();
  }

  destroy(): void {
    this.stop();
  }
}
