// ===========================
// Clawback - Type Definitions
// ===========================

// --- Game State ---

export type GameSpeed = 'paused' | 'normal' | 'fast';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GamePhase = 'start' | 'generating' | 'selecting' | 'playing' | 'paused' | 'gameover';

// --- Clock ---

export interface ClockState {
  tickCount: number;
  hour: number;       // 0-23
  minute: number;     // 0-59
  day: number;        // day counter starting at 1
  speed: GameSpeed;
}

// --- NPCs ---

export type NpcId = string;
export type NpcMood = 'neutral' | 'waiting' | 'frustrated' | 'angry' | 'gone' | 'happy';

export interface NpcPersona {
  id: NpcId;
  name: string;
  role: string;
  avatar: string;       // emoji fallback
  patience: number;     // 0-1, higher = more patient
  techSavvy: number;    // 0-1
  politeness: number;   // 0-1
  color: string;        // accent color for chat bubbles
  description: string;  // funny bio for NPC selection screen
  quirk: string;        // behavioral quirk shown on card
}

export interface NpcState {
  id: NpcId;
  mood: NpcMood;
  patienceRemaining: number;  // 0-100, decays per tick
  reputation: number;         // -100 to 100
  messagesRead: boolean;
  isTyping: boolean;
}

// --- Chat ---

export interface ChatMessage {
  id: string;
  npcId: NpcId;
  text: string;
  timestamp: number;    // tick count
  isFromPlayer: boolean;
  isSystem?: boolean;
}

export interface Conversation {
  npcId: NpcId;
  messages: ChatMessage[];
  unreadCount: number;
}

// --- Tools ---

export type ToolId = 'terminal' | 'files' | 'chat' | 'email' | 'search' | 'calendar' | 'settings';

export interface ToolState {
  activeTool: ToolId;
  terminalHistory: TerminalEntry[];
  terminalCwd: string;
  openFiles: string[];          // paths currently open in file browser
  activeFile: string | null;    // currently viewing
}

export interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  cwd: string;
  timestamp: number;
  isError?: boolean;
}

// --- Virtual Filesystem ---

export type FileType = 'file' | 'directory';

export interface VFSNode {
  name: string;
  type: FileType;
  path: string;
  content?: string;           // for files
  children?: VFSNode[];       // for directories
  permissions: string;        // e.g., 'rwxr-xr-x'
  size: number;               // bytes
  modifiedAt: number;         // tick count
  isHidden?: boolean;
  isTrap?: boolean;           // accessing triggers security event
}

// --- Email ---

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  isStarred: boolean;
  attachments?: string[];     // VFS paths
  replyTo?: string;           // email id
}

// --- Search ---

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  category: string;
  relevantTo?: string[];      // keywords this result matches
}

// --- Calendar ---

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  day: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color?: string;
  npcId?: NpcId;
}

// --- Requests ---

export type RequestTier = 1 | 2 | 3 | 4;
export type RequestStatus = 'incoming' | 'active' | 'in_progress' | 'completed' | 'failed' | 'expired';

export interface RequestObjective {
  id: string;
  description: string;
  validator: string;        // validator function name
  params: Record<string, unknown>;
  completed: boolean;
}

export interface GameRequest {
  id: string;
  npcId: NpcId;
  title: string;
  description: string;
  tier: RequestTier;
  status: RequestStatus;
  objectives: RequestObjective[];
  arrivalTick: number;
  deadlineTicks: number;    // ticks from arrival until expiry
  basePoints: number;
  initialMessage: string;   // what the NPC says when requesting
  completionMessage: string;
  failureMessage: string;
  isSecurityTrap?: boolean;
  requiredTools?: ToolId[];
}

// --- Resources ---

export interface ResourceState {
  cpu: number;          // 0-100
  memory: number;       // 0-100
  disk: number;         // 0-100 (used percentage)
  diskTotal: number;    // total disk in MB
  diskUsed: number;     // used disk in MB
  network: number;      // 0-100 (load)
}

// --- Score ---

export interface ScoreState {
  total: number;
  streak: number;
  maxStreak: number;
  securityScore: number;    // 0-100, starts at 100
  requestsCompleted: number;
  requestsFailed: number;
  requestsExpired: number;
}

// --- Notifications ---

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'security';

export interface GameNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration?: number;   // ms to show, default 3000
  dismissed?: boolean;
}

// --- Consequences ---

export type ConsequenceTrigger =
  | 'request_completed'
  | 'request_completed_late'
  | 'request_expired'
  | 'request_failed'
  | 'security_violation'
  | 'dangerous_command'
  | 'credential_access'
  | 'credential_forward'
  | 'polite_response'
  | 'ignore_npc'
  | 'resource_overload';

export interface ConsequenceEffect {
  scoreChange?: number;
  securityChange?: number;
  npcMoodChange?: Partial<Record<NpcId, NpcMood>>;
  npcReputationChange?: Partial<Record<NpcId, number>>;
  resourceChange?: Partial<ResourceState>;
  notification?: Omit<GameNotification, 'id' | 'timestamp'>;
  sound?: string;
}

// --- Window Manager ---

export type WindowId = string;

export interface WindowState {
  id: WindowId;
  toolId: ToolId;
  title: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minSize: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  preMaximize?: { position: { x: number; y: number }; size: { width: number; height: number } };
}

export interface DesktopIcon {
  id: string;
  toolId: ToolId;
  label: string;
  icon: string;
}

// --- Store ---

export interface GameState {
  // Meta
  phase: GamePhase;
  difficulty: Difficulty;

  // Clock
  clock: ClockState;

  // NPCs
  npcs: Record<string, NpcState>;
  conversations: Record<string, Conversation>;
  npcCandidates: NpcPersona[];
  selectedNpc: NpcPersona | null;

  // Tools
  tools: ToolState;

  // Requests
  requests: GameRequest[];
  activeRequestId: string | null;

  // Resources
  resources: ResourceState;

  // Score
  score: ScoreState;

  // Notifications
  notifications: GameNotification[];

  // Emails
  emails: Email[];

  // Calendar
  calendarEvents: CalendarEvent[];

  // Search
  searchQuery: string;
  searchResults: SearchResult[];

  // Window Manager
  windows: Record<WindowId, WindowState>;
  windowOrder: WindowId[];
  nextZIndex: number;
  startMenuOpen: boolean;
}
