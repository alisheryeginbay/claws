'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { VirtualFS } from '@/systems/tools/VirtualFS';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { XPIcon } from '@/components/ui/XPIcon';
import type { VFSNode } from '@/types';

export function FileBrowser() {
  const openFile = useGameStore((s) => s.openFile);

  // Navigation state
  const [currentDirectory, setCurrentDirectory] = useState('/home/user');
  const [history, setHistory] = useState<string[]>(['/home/user']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // View state
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<'tasks' | 'folders'>('tasks');
  const [viewMode, setViewMode] = useState<'icons' | 'details'>('icons');
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>({});

  // Address bar
  const [addressValue, setAddressValue] = useState('/home/user');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const canGoUp = currentDirectory !== '/';

  const navigateTo = useCallback((path: string) => {
    const node = VirtualFS.getNode(path, '/');
    if (!node) return;

    if (node.type === 'directory') {
      setViewingFile(null);
      setSelectedItem(null);
      setCurrentDirectory(path);
      setAddressValue(path);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), path]);
      setHistoryIndex(prev => prev + 1);
    } else {
      openFile(path);
      setViewingFile(path);
      setAddressValue(path);
    }
  }, [historyIndex, openFile]);

  const goBack = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const path = history[newIndex];
    setCurrentDirectory(path);
    setAddressValue(path);
    setViewingFile(null);
    setSelectedItem(null);
  }, [historyIndex, history]);

  const goForward = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const path = history[newIndex];
    setCurrentDirectory(path);
    setAddressValue(path);
    setViewingFile(null);
    setSelectedItem(null);
  }, [historyIndex, history]);

  const goUp = useCallback(() => {
    if (currentDirectory === '/') return;
    const parent = currentDirectory.substring(0, currentDirectory.lastIndexOf('/')) || '/';
    navigateTo(parent);
  }, [currentDirectory, navigateTo]);

  const items = VirtualFS.listDir(currentDirectory, '/');
  const dirName = currentDirectory.split('/').pop() || currentDirectory;

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: 'var(--font-xp)', fontSize: '11px' }}>
      {/* Toolbar */}
      <ExplorerToolbar
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        canGoUp={canGoUp}
        onBack={goBack}
        onForward={goForward}
        onUp={goUp}
        sidebarMode={sidebarMode}
        onToggleSidebar={() => setSidebarMode(m => m === 'tasks' ? 'folders' : 'tasks')}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        showViewsDropdown={showViewsDropdown}
        onToggleViewsDropdown={() => setShowViewsDropdown(v => !v)}
      />

      {/* Address Bar */}
      <ExplorerAddressBar
        value={addressValue}
        isEditing={isEditingAddress}
        onStartEditing={() => setIsEditingAddress(true)}
        onChange={setAddressValue}
        onSubmit={(path) => {
          setIsEditingAddress(false);
          navigateTo(path);
        }}
        onCancel={() => {
          setIsEditingAddress(false);
          setAddressValue(viewingFile || currentDirectory);
        }}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarMode === 'tasks' ? (
          <ExplorerTaskPane
            currentDirectory={currentDirectory}
            dirName={dirName}
            itemCount={items.length}
            collapsedPanels={collapsedPanels}
            onTogglePanel={(id) => setCollapsedPanels(p => ({ ...p, [id]: !p[id] }))}
            onNavigate={navigateTo}
          />
        ) : (
          <ExplorerFolderTree
            currentDirectory={currentDirectory}
            onNavigate={navigateTo}
          />
        )}

        {/* Content */}
        {viewingFile ? (
          <div className="xp-explorer-content">
            <FileContent path={viewingFile} />
          </div>
        ) : (
          <ExplorerContentArea
            items={items}
            viewMode={viewMode}
            selectedItem={selectedItem}
            onSelect={setSelectedItem}
            onOpen={navigateTo}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="xp-explorer-statusbar">
        {viewingFile
          ? viewingFile.split('/').pop()
          : `${items.length} object(s)`}
      </div>
    </div>
  );
}

/* ===== TOOLBAR ===== */

function ExplorerToolbar({
  canGoBack, canGoForward, canGoUp,
  onBack, onForward, onUp,
  sidebarMode, onToggleSidebar,
  viewMode, onSetViewMode,
  showViewsDropdown, onToggleViewsDropdown,
}: {
  canGoBack: boolean; canGoForward: boolean; canGoUp: boolean;
  onBack: () => void; onForward: () => void; onUp: () => void;
  sidebarMode: 'tasks' | 'folders'; onToggleSidebar: () => void;
  viewMode: 'icons' | 'details'; onSetViewMode: (m: 'icons' | 'details') => void;
  showViewsDropdown: boolean; onToggleViewsDropdown: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showViewsDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onToggleViewsDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showViewsDropdown, onToggleViewsDropdown]);

  return (
    <div className="xp-toolbar">
      <button className="xp-toolbar-button" disabled={!canGoBack} onClick={onBack}>
        <XPIcon name="back" size={16} />
        <span>Back</span>
      </button>
      <button className="xp-toolbar-button" disabled={!canGoForward} onClick={onForward}>
        <XPIcon name="forward" size={16} />
      </button>
      <button className="xp-toolbar-button" disabled={!canGoUp} onClick={onUp}>
        <XPIcon name="up" size={16} />
      </button>

      <div className="xp-toolbar-separator" />

      <button className="xp-toolbar-button">
        <XPIcon name="search" size={16} />
        <span>Search</span>
      </button>
      <button
        className={`xp-toolbar-button ${sidebarMode === 'folders' ? 'xp-toolbar-button-active' : ''}`}
        onClick={onToggleSidebar}
      >
        <XPIcon name="folder-view" size={16} />
        <span>Folders</span>
      </button>

      <div className="xp-toolbar-separator" />

      <div className="relative" ref={dropdownRef}>
        <button className="xp-toolbar-button" onClick={onToggleViewsDropdown}>
          <XPIcon name={viewMode === 'icons' ? 'icon-view' : 'detail-view'} size={16} />
          <span>▾</span>
        </button>
        {showViewsDropdown && (
          <div className="xp-dropdown" style={{ left: 0 }}>
            <div
              className={`xp-dropdown-item ${viewMode === 'icons' ? 'xp-dropdown-item-active' : ''}`}
              onClick={() => { onSetViewMode('icons'); onToggleViewsDropdown(); }}
            >
              <XPIcon name="icon-view" size={16} />
              Icons
            </div>
            <div
              className={`xp-dropdown-item ${viewMode === 'details' ? 'xp-dropdown-item-active' : ''}`}
              onClick={() => { onSetViewMode('details'); onToggleViewsDropdown(); }}
            >
              <XPIcon name="detail-view" size={16} />
              Details
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== ADDRESS BAR ===== */

function ExplorerAddressBar({
  value, isEditing, onStartEditing, onChange, onSubmit, onCancel,
}: {
  value: string; isEditing: boolean;
  onStartEditing: () => void;
  onChange: (v: string) => void;
  onSubmit: (path: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="xp-address-bar">
      <span className="xp-address-bar-label">Address</span>
      <XPIcon name="folder-closed" size={16} />
      <input
        className="xp-address-bar-input"
        value={value}
        readOnly={!isEditing}
        onClick={() => { if (!isEditing) onStartEditing(); }}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit(value);
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => { if (isEditing) onCancel(); }}
      />
      <button
        className="xp-button"
        style={{ padding: '1px 4px', display: 'flex', alignItems: 'center', gap: '2px' }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSubmit(value)}
      >
        <XPIcon name="go" size={16} />
        Go
      </button>
    </div>
  );
}

/* ===== TASK PANE (Left sidebar — tasks mode) ===== */

function ExplorerTaskPane({
  currentDirectory, dirName, itemCount,
  collapsedPanels, onTogglePanel, onNavigate,
}: {
  currentDirectory: string; dirName: string; itemCount: number;
  collapsedPanels: Record<string, boolean>;
  onTogglePanel: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="xp-task-pane">
      {/* File and Folder Tasks */}
      <TaskPanel
        id="tasks"
        title="File and Folder Tasks"
        collapsed={!!collapsedPanels['tasks']}
        onToggle={() => onTogglePanel('tasks')}
      >
        <button className="xp-task-link" onClick={() => onNavigate(currentDirectory)}>
          <XPIcon name="new-folder" size={16} />
          Make a new folder
        </button>
      </TaskPanel>

      {/* Other Places */}
      <TaskPanel
        id="places"
        title="Other Places"
        collapsed={!!collapsedPanels['places']}
        onToggle={() => onTogglePanel('places')}
      >
        <button className="xp-task-link" onClick={() => onNavigate('/home/user/documents')}>
          <XPIcon name="my-documents" size={16} />
          My Documents
        </button>
        <button className="xp-task-link" onClick={() => onNavigate('/home/user')}>
          <XPIcon name="folder-closed" size={16} />
          Home
        </button>
        <button className="xp-task-link" onClick={() => onNavigate('/')}>
          <XPIcon name="my-computer" size={16} />
          My Computer
        </button>
        <button className="xp-task-link" onClick={() => onNavigate('/')}>
          <XPIcon name="my-network-places" size={16} />
          My Network Places
        </button>
      </TaskPanel>

      {/* Details */}
      <TaskPanel
        id="details"
        title="Details"
        collapsed={!!collapsedPanels['details']}
        onToggle={() => onTogglePanel('details')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <XPIcon name="folder-closed" size={48} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{dirName}</div>
            <div style={{ color: '#808080' }}>File Folder</div>
          </div>
        </div>
        <div style={{ color: '#808080', fontSize: '11px' }}>
          {itemCount} object(s)
        </div>
      </TaskPanel>
    </div>
  );
}

function TaskPanel({
  id, title, collapsed, onToggle, children,
}: {
  id: string; title: string; collapsed: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: collapsed ? '8px' : '0' }}>
      <div
        className={`xp-task-panel-header ${collapsed ? 'xp-task-panel-header-collapsed' : ''}`}
        onClick={onToggle}
      >
        <span>{title}</span>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </div>
      {!collapsed && (
        <div className="xp-task-panel-body">
          {children}
        </div>
      )}
    </div>
  );
}

/* ===== FOLDER TREE (Left sidebar — folders mode) ===== */

function ExplorerFolderTree({
  currentDirectory, onNavigate,
}: {
  currentDirectory: string; onNavigate: (path: string) => void;
}) {
  return (
    <div className="xp-folder-tree">
      <FolderTreeNode path="/" depth={0} currentDirectory={currentDirectory} onNavigate={onNavigate} />
    </div>
  );
}

function FolderTreeNode({
  path, depth, currentDirectory, onNavigate,
}: {
  path: string; depth: number; currentDirectory: string; onNavigate: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const node = VirtualFS.getNode(path, '/');
  if (!node || node.type !== 'directory') return null;

  const items = VirtualFS.listDir(path, '/').filter(n => n.type === 'directory');
  const isSelected = currentDirectory === path;

  return (
    <div>
      <div
        className={`xp-tree-item ${isSelected ? 'xp-tree-item-selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => {
          setExpanded(!expanded);
          onNavigate(path);
        }}
      >
        {items.length > 0 ? (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <span style={{ width: 12 }} />
        )}
        <XPIcon name={expanded ? 'folder-opened' : 'folder-closed'} size={16} />
        <span className="truncate">{node.name === '/' ? 'My Computer' : node.name}</span>
      </div>
      {expanded && items.map((child) => (
        <FolderTreeNode
          key={child.path}
          path={child.path}
          depth={depth + 1}
          currentDirectory={currentDirectory}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

/* ===== CONTENT AREA ===== */

function ExplorerContentArea({
  items, viewMode, selectedItem, onSelect, onOpen,
}: {
  items: VFSNode[];
  viewMode: 'icons' | 'details';
  selectedItem: string | null;
  onSelect: (path: string | null) => void;
  onOpen: (path: string) => void;
}) {
  if (viewMode === 'details') {
    return (
      <div className="xp-explorer-content">
        <table className="xp-details-table">
          <thead className="xp-details-header">
            <tr>
              <th style={{ width: '45%' }}>Name</th>
              <th style={{ width: '20%' }}>Size</th>
              <th style={{ width: '35%' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.path}
                className={`xp-details-row ${selectedItem === item.path ? 'xp-details-row-selected' : ''}`}
                onClick={() => onSelect(item.path)}
                onDoubleClick={() => onOpen(item.path)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.type === 'directory'
                      ? <XPIcon name="folder-closed" size={16} />
                      : <FileIcon name={item.name} />}
                    <span>{item.name}</span>
                  </div>
                </td>
                <td>{item.type === 'file' ? formatSize(item.size) : ''}</td>
                <td>{item.type === 'directory' ? 'File Folder' : getFileType(item.name)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Icons view
  return (
    <div className="xp-explorer-content" onClick={() => onSelect(null)}>
      <div className="xp-icon-grid">
        {items.map((item) => (
          <div
            key={item.path}
            className={`xp-icon-item ${selectedItem === item.path ? 'xp-icon-item-selected' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelect(item.path); }}
            onDoubleClick={() => onOpen(item.path)}
          >
            {item.type === 'directory'
              ? <XPIcon name="folder-closed" size={48} />
              : <FileIcon48 name={item.name} />}
            <span className="xp-icon-label">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== FILE CONTENT VIEWER ===== */

function FileContent({ path }: { path: string }) {
  const content = VirtualFS.readFile(path, '/');
  if (content === null) {
    return <div style={{ color: '#E04040', padding: '12px', fontSize: '11px' }}>File not found: {path}</div>;
  }

  const ext = path.split('.').pop() || '';
  const lines = content.split('\n');

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '8px' }}>
      <div style={{ color: '#808080', fontSize: '10px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #D0D0D0' }}>
        {path}
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ paddingRight: '12px', textAlign: 'right', userSelect: 'none', borderRight: '1px solid #E0E0E0', marginRight: '12px', color: '#A0A0A0' }}>
          {lines.map((_, i) => (
            <div key={i} style={{ lineHeight: '20px' }}>{i + 1}</div>
          ))}
        </div>
        <pre style={{ flex: 1, overflowX: 'auto', margin: 0 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ lineHeight: '20px', color: getLineColor(line, ext) }}>
              {line || ' '}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/* ===== HELPERS ===== */

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    js: 'java-script', ts: 'java-script', tsx: 'java-script', jsx: 'java-script',
    py: 'generic-document', html: 'html', css: 'css',
    md: 'generic-text-document', json: 'generic-document',
    txt: 'generic-text-document', csv: 'generic-document',
    env: 'generic-document', log: 'generic-document', xml: 'xml',
  };
  return <XPIcon name={iconMap[ext] || 'generic-document'} size={16} />;
}

function FileIcon48({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    js: 'java-script', ts: 'java-script', tsx: 'java-script', jsx: 'java-script',
    py: 'generic-document', html: 'html', css: 'css',
    md: 'generic-text-document', json: 'generic-document',
    txt: 'generic-text-document', csv: 'generic-document',
    env: 'generic-document', log: 'generic-document', xml: 'xml',
  };
  return <XPIcon name={iconMap[ext] || 'generic-document'} size={48} />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    js: 'JavaScript File', ts: 'TypeScript File', py: 'Python File',
    html: 'HTML Document', css: 'CSS Stylesheet', md: 'Markdown Document',
    json: 'JSON File', txt: 'Text Document', csv: 'CSV File',
    env: 'Environment File', log: 'Log File', xml: 'XML Document',
  };
  return types[ext] || 'File';
}

function getLineColor(line: string, ext: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('*')) return '#808080';
  if (trimmed.startsWith('import ') || trimmed.startsWith('from ') || trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var ')) return '#0054E3';
  if (trimmed.startsWith('def ') || trimmed.startsWith('class ') || trimmed.startsWith('function')) return '#7B68EE';
  if (trimmed.startsWith('return ') || trimmed.startsWith('if ') || trimmed.startsWith('else') || trimmed.startsWith('for ') || trimmed.startsWith('while ')) return '#FF8C00';
  return '#000000';
}
