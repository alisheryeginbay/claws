import type { ToolId } from '@/types';

interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  shortcut?: string;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Execute commands on the virtual filesystem',
    shortcut: '1',
  },
  {
    id: 'files',
    name: 'File Browser',
    description: 'Browse and view files in the virtual filesystem',
    shortcut: '2',
  },
  {
    id: 'teleclaw',
    name: 'Teleclaw',
    description: 'Telegram-style messaging with NPC users',
    shortcut: '3',
  },
  {
    id: 'whatsclaw',
    name: 'Whatsclaw',
    description: 'WhatsApp-style messaging with NPC users',
    shortcut: '7',
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Read, compose, and forward emails',
    shortcut: '4',
  },
  {
    id: 'search',
    name: 'Web Search',
    description: 'Search the web for information',
    shortcut: '5',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'View and manage calendar events',
    shortcut: '6',
  },
];
