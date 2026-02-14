import { type StateCreator } from 'zustand';
import type { ClockState, GameSpeed } from '@/types';

export interface ClockSlice {
  clock: ClockState;
  advanceClock: () => void;
  setSpeed: (speed: GameSpeed) => void;
  resetClock: () => void;
}

export const createClockSlice: StateCreator<ClockSlice> = (set) => ({
  clock: {
    tickCount: 0,
    hour: 9,
    minute: 0,
    second: 0,
    day: 1,
    speed: 'normal',
  },

  advanceClock: () =>
    set((state) => {
      let { hour, minute, second, day, tickCount } = state.clock;
      tickCount++;
      second++;
      if (second >= 60) {
        second = 0;
        minute++;
        if (minute >= 60) {
          minute = 0;
          hour++;
          if (hour >= 24) {
            hour = 9; // new day starts at 9 AM
            day++;
          }
        }
      }
      return { clock: { ...state.clock, tickCount, hour, minute, second, day } };
    }),

  setSpeed: (speed) =>
    set((state) => ({ clock: { ...state.clock, speed } })),

  resetClock: () =>
    set({
      clock: { tickCount: 0, hour: 9, minute: 0, second: 0, day: 1, speed: 'normal' },
    }),
});
