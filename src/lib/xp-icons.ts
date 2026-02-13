export function getIconPath(name: string, size: 16 | 48 = 16): string {
  return `/icons/${size}/${name}.webp`;
}

/** Map from window icon key (used in windowSlice) to XP icon slug */
export const WINDOW_ICON_MAP: Record<string, string> = {
  'command-prompt': 'command-prompt',
  'my-computer': 'my-computer',
  'msn-messenger': 'msn-messenger',
  'outlook-express': 'outlook-express',
  'internet-explorer': 'internet-explorer-6',
  'calendar': 'date-and-time',
  'display-properties': 'display-properties',
};
