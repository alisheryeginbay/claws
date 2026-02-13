'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { VirtualFS } from '@/systems/tools/VirtualFS';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import { XPIcon } from '@/components/ui/XPIcon';
import type { VFSNode } from '@/types';

export function FileBrowser() {
  const openFiles = useGameStore((s) => s.tools.openFiles);
  const activeFile = useGameStore((s) => s.tools.activeFile);
  const openFile = useGameStore((s) => s.openFile);
  const closeFile = useGameStore((s) => s.closeFile);
  const setActiveFile = useGameStore((s) => s.setActiveFile);

  return (
    <div className="h-full flex">
      {/* File tree sidebar */}
      <div className="w-56 border-r border-claw-border overflow-y-auto bg-claw-surface">
        <div className="px-3 py-2 text-[10px] text-claw-muted uppercase tracking-wider">
          Explorer
        </div>
        <FileTree path="/home/user" depth={0} onSelect={(path) => openFile(path)} />
      </div>

      {/* File content */}
      <div className="flex-1 flex flex-col">
        {/* Open file tabs */}
        {openFiles.length > 0 && (
          <div className="flex border-b border-claw-border bg-claw-surface overflow-x-auto">
            {openFiles.map((path) => {
              const name = path.split('/').pop() || path;
              return (
                <div
                  key={path}
                  onClick={() => setActiveFile(path)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 text-xs cursor-pointer border-r border-claw-border group',
                    activeFile === path
                      ? 'bg-claw-bg text-claw-text border-b border-claw-green'
                      : 'text-claw-muted hover:text-claw-text'
                  )}
                >
                  <FileIcon name={name} size={12} />
                  <span className="truncate max-w-[120px]">{name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeFile(path); }}
                    className="opacity-0 group-hover:opacity-100 text-claw-muted hover:text-claw-text ml-1"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* File content area */}
        <div className="flex-1 overflow-auto p-4">
          {activeFile ? (
            <FileContent path={activeFile} />
          ) : (
            <div className="flex items-center justify-center h-full text-claw-muted text-xs">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileTree({ path, depth, onSelect }: { path: string; depth: number; onSelect: (path: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const node = VirtualFS.getNode(path, '/');
  if (!node) return null;

  const items = VirtualFS.listDir(path, '/');

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onSelect(path)}
        className="flex items-center gap-1 px-2 py-0.5 text-xs text-claw-text hover:bg-claw-surface-alt w-full text-left"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileIcon name={node.name} size={12} />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 px-2 py-0.5 text-xs text-claw-text hover:bg-claw-surface-alt w-full text-left"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {expanded ? <ChevronDown size={12} className="text-claw-muted" /> : <ChevronRight size={12} className="text-claw-muted" />}
        <XPIcon name={expanded ? 'folder-opened' : 'folder-closed'} size={16} />
        <span className="truncate">{node.name}</span>
      </button>
      {expanded && items.map((child) => (
        <FileTree key={child.path} path={child.path} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  );
}

function FileContent({ path }: { path: string }) {
  const content = VirtualFS.readFile(path, '/');
  if (content === null) {
    return <div className="text-claw-red text-xs">File not found: {path}</div>;
  }

  const ext = path.split('.').pop() || '';
  const lines = content.split('\n');

  return (
    <div className="font-mono text-xs">
      {/* File path */}
      <div className="text-claw-muted text-[10px] mb-2 pb-1 border-b border-claw-border">
        {path}
      </div>
      {/* Content with line numbers */}
      <div className="flex">
        <div className="pr-3 text-claw-dim text-right select-none border-r border-claw-border/50 mr-3">
          {lines.map((_, i) => (
            <div key={i} className="leading-5">{i + 1}</div>
          ))}
        </div>
        <pre className="flex-1 overflow-x-auto">
          {lines.map((line, i) => (
            <div key={i} className={cn('leading-5', getLineColor(line, ext))}>
              {line || ' '}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function FileIcon({ name }: { name: string; size?: number }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    js: 'java-script',
    ts: 'java-script',
    tsx: 'java-script',
    jsx: 'java-script',
    py: 'generic-document',
    html: 'html',
    css: 'css',
    md: 'generic-text-document',
    json: 'generic-document',
    txt: 'generic-text-document',
    csv: 'generic-document',
    env: 'generic-document',
    log: 'generic-document',
    xml: 'xml',
  };
  return <XPIcon name={iconMap[ext] || 'generic-document'} size={16} />;
}

function getLineColor(line: string, ext: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('*')) return 'text-claw-dim';
  if (trimmed.startsWith('import ') || trimmed.startsWith('from ') || trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var ')) return 'text-claw-blue';
  if (trimmed.startsWith('def ') || trimmed.startsWith('class ') || trimmed.startsWith('function')) return 'text-claw-purple';
  if (trimmed.startsWith('return ') || trimmed.startsWith('if ') || trimmed.startsWith('else') || trimmed.startsWith('for ') || trimmed.startsWith('while ')) return 'text-claw-orange';
  return 'text-claw-text/80';
}
