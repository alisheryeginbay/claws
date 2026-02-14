import { create } from 'zustand';
import { createClockSlice, type ClockSlice } from './slices/clockSlice';
import { createNpcSlice, type NpcSlice } from './slices/npcSlice';
import { createToolSlice, type ToolSlice } from './slices/toolSlice';
import { createRequestSlice, type RequestSlice } from './slices/requestSlice';
import { createResourceSlice, type ResourceSlice } from './slices/resourceSlice';
import { createScoreSlice, type ScoreSlice } from './slices/scoreSlice';
import { createWindowSlice, type WindowSlice } from './slices/windowSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import type { GamePhase, GameNotification, Email, CalendarEvent, SearchResult, NpcPersona } from '@/types';
import { generateId } from '@/lib/utils';
import { resetGenerationService } from '@/services/generation';

export interface GameSlice {
  // Meta
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // Notifications
  notifications: GameNotification[];
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // Emails
  emails: Email[];
  addEmail: (email: Omit<Email, 'id'>) => void;
  markEmailRead: (id: string) => void;
  toggleEmailStar: (id: string) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  removeCalendarEvent: (id: string) => void;

  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;

  // Reset
  resetGame: () => void;
}

type StoreState = ClockSlice & NpcSlice & ToolSlice & RequestSlice & ResourceSlice & ScoreSlice & WindowSlice & SettingsSlice & GameSlice;

export const useGameStore = create<StoreState>()((...a) => ({
  ...createClockSlice(...a),
  ...createNpcSlice(...a),
  ...createToolSlice(...a),
  ...createRequestSlice(...a),
  ...createResourceSlice(...a),
  ...createScoreSlice(...a),
  ...createWindowSlice(...a),
  ...createSettingsSlice(...a),

  // Meta
  phase: 'generating',
  setPhase: (phase) => a[0]({ phase }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    a[0]((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: generateId(),
          timestamp: state.clock.tickCount,
        },
      ],
    })),
  dismissNotification: (id) =>
    a[0]((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, dismissed: true } : n
      ),
    })),
  clearNotifications: () => a[0]({ notifications: [] }),

  // Emails
  emails: [],
  addEmail: (email) =>
    a[0]((state) => ({
      emails: [...state.emails, { ...email, id: generateId() }],
    })),
  markEmailRead: (id) =>
    a[0]((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isRead: true } : e
      ),
    })),
  toggleEmailStar: (id) =>
    a[0]((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isStarred: !e.isStarred } : e
      ),
    })),

  // Calendar
  calendarEvents: [],
  addCalendarEvent: (event) =>
    a[0]((state) => ({
      calendarEvents: [...state.calendarEvents, { ...event, id: generateId() }],
    })),
  removeCalendarEvent: (id) =>
    a[0]((state) => ({
      calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
    })),

  // Search
  searchQuery: '',
  searchResults: [],
  setSearchQuery: (query) => a[0]({ searchQuery: query }),
  setSearchResults: (results) => a[0]({ searchResults: results }),

  // Reset
  resetGame: () => {
    const [set] = a;
    const store = a[1]() as StoreState;
    store.resetClock();
    store.resetNpcs();
    store.resetTools();
    store.resetRequests();
    store.resetResources();
    store.resetScore();
    store.resetWindows();
    resetGenerationService();
    set({
      phase: 'generating',
      notifications: [],
      emails: [],
      calendarEvents: [],
      searchQuery: '',
      searchResults: [],
    });
  },
}));
