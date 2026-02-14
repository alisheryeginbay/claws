'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { XPIcon } from '@/components/ui/XPIcon';

const HOME_URL = 'https://www.msn.com';

// Proxy through our API route which fetches sites directly
// and strips X-Frame-Options/CSP headers so pages load in the iframe
function browseUrl(url: string): string {
  return '/api/browse?url=' + encodeURIComponent(url);
}

interface HistoryEntry {
  url: string;
  title: string;
}

export function WebSearch() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([{ url: '', title: 'about:blank' }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('Done');
  const [loadProgress, setLoadProgress] = useState(100);

  const currentUrl = history[historyIndex]?.url ?? '';

  const navigateTo = useCallback((rawUrl: string) => {
    let url = rawUrl.trim();
    if (!url) return;

    // Auto-add protocol
    if (!/^https?:\/\//i.test(url)) {
      // If it looks like a domain, add https
      if (/^[\w-]+(\.[\w-]+)+/.test(url)) {
        url = 'https://' + url;
      } else {
        // Treat as search query
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      }
    }

    setIsLoading(true);
    setStatusText('Opening page ' + url + '...');
    setLoadProgress(0);

    // Simulate chunked progress
    const interval = setInterval(() => {
      setLoadProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 20;
      });
    }, 200);

    // Add to history (trim forward history if we navigated back)
    const newHistory = [...history.slice(0, historyIndex + 1), { url, title: url }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setInputUrl(url);

    // Cleanup interval after timeout as fallback
    setTimeout(() => clearInterval(interval), 8000);
  }, [history, historyIndex]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setStatusText('Done');
    setLoadProgress(100);
  }, []);

  // Listen for postMessage from the injected proxy script inside the iframe.
  // When user clicks a link or submits a form inside a proxied page,
  // the iframe sends { type: 'ie-navigate', url } and we handle it here.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'ie-navigate' && typeof e.data.url === 'string') {
        navigateTo(e.data.url);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigateTo]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setInputUrl(history[newIndex].url);
      setIsLoading(true);
      setStatusText('Opening page...');
    }
  }, [historyIndex, history]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setInputUrl(history[newIndex].url);
      setIsLoading(true);
      setStatusText('Opening page...');
    }
  }, [historyIndex, history]);

  const handleRefresh = useCallback(() => {
    if (iframeRef.current && currentUrl) {
      setIsLoading(true);
      setStatusText('Refreshing...');
      setLoadProgress(0);
      // Force reload by toggling src
      const src = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => { if (iframeRef.current) iframeRef.current.src = src; }, 50);
    }
  }, [currentUrl]);

  const handleStop = useCallback(() => {
    if (iframeRef.current) {
      // Can't actually stop cross-origin iframe, but update UI
      setIsLoading(false);
      setStatusText('Stopped');
      setLoadProgress(100);
    }
  }, []);

  const handleHome = useCallback(() => {
    setInputUrl(HOME_URL);
    navigateTo(HOME_URL);
  }, [navigateTo]);

  const handleGo = useCallback(() => {
    navigateTo(inputUrl);
  }, [inputUrl, navigateTo]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigateTo(inputUrl);
    }
  }, [inputUrl, navigateTo]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  return (
    <div className="h-full flex flex-col bg-[#ECE9D8]" style={{ fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif' }}>
      {/* Menu Bar */}
      <div className="flex items-center bg-[#ECE9D8] border-b border-[#ACA899] px-1 py-[1px] select-none">
        {['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].map((item) => (
          <button
            key={item}
            className="px-2 py-[1px] text-[11px] text-black hover:bg-[#316AC5] hover:text-white rounded-[2px] transition-colors"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Navigation Toolbar */}
      <div className="flex items-center gap-[2px] bg-[#ECE9D8] border-b border-[#ACA899] px-1 py-[3px] select-none">
        {/* Back */}
        <ToolbarButton
          icon="back"
          label="Back"
          onClick={goBack}
          disabled={!canGoBack}
          primary
        />
        {/* Forward */}
        <ToolbarButton
          icon="forward"
          label=""
          onClick={goForward}
          disabled={!canGoForward}
          small
        />

        <ToolbarSeparator />

        {/* Stop */}
        <ToolbarButton
          icon="ie-stop"
          label="Stop"
          onClick={handleStop}
          disabled={!isLoading}
        />
        {/* Refresh */}
        <ToolbarButton
          icon="ie-refresh"
          label="Refresh"
          onClick={handleRefresh}
          disabled={!currentUrl}
        />
        {/* Home */}
        <ToolbarButton
          icon="ie-home"
          label="Home"
          onClick={handleHome}
        />

        <ToolbarSeparator />

        {/* Search */}
        <ToolbarButton icon="search" label="Search" onClick={() => {
          setInputUrl('https://www.google.com');
          navigateTo('https://www.google.com');
        }} />
        {/* Favorites */}
        <ToolbarButton icon="favorites" label="Favorites" onClick={() => {}} />
        {/* History */}
        <ToolbarButton icon="ie-history" label="History" onClick={() => {}} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* IE Logo */}
        <div className={`w-[38px] h-[38px] flex items-center justify-center ${isLoading ? 'animate-spin' : ''}`}
             style={{ animationDuration: '2s' }}>
          <XPIcon name="internet-explorer-6" size={16} />
        </div>
      </div>

      {/* Address Bar */}
      <div className="flex items-center gap-1 bg-[#ECE9D8] border-b border-[#ACA899] px-2 py-[3px] select-none">
        <span className="text-[11px] text-black whitespace-nowrap">Address</span>
        <div className="flex-1 flex items-center bg-white border border-[#7F9DB9] rounded-[1px]">
          <div className="pl-1 flex items-center">
            <XPIcon name="internet-explorer-6" size={16} />
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="about:blank"
            className="flex-1 px-1 py-[2px] text-[11px] text-black bg-transparent border-none outline-none"
            spellCheck={false}
          />
        </div>
        <button
          onClick={handleGo}
          className="flex items-center gap-1 px-2 py-[2px] text-[11px] bg-[#ECE9D8] border border-[#ACA899] hover:border-[#316AC5] active:border-[#003C74] rounded-[2px]"
        >
          <XPIcon name="go" size={16} />
          <span className="text-[11px]">Go</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {currentUrl ? (
          <iframe
            ref={iframeRef}
            src={browseUrl(currentUrl)}
            onLoad={handleIframeLoad}
            onError={handleIframeLoad}
            className="w-full h-full border-none"
            title="Internet Explorer"
          />
        ) : (
          /* Homepage / about:blank */
          <div className="h-full flex flex-col items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4 text-center">
              <XPIcon name="internet-explorer-6" size={48} />
              <div>
                <h2 className="text-[18px] font-bold text-[#003399] mb-1" style={{ fontFamily: 'Trebuchet MS, Tahoma, sans-serif' }}>
                  Internet Explorer 6
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Type an address in the address bar above to get started.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <QuickLink label="MSN" url="https://www.msn.com" onNavigate={navigateTo} setInputUrl={setInputUrl} />
                <QuickLink label="Google" url="https://www.google.com" onNavigate={navigateTo} setInputUrl={setInputUrl} />
                <QuickLink label="Wikipedia" url="https://en.wikipedia.org" onNavigate={navigateTo} setInputUrl={setInputUrl} />
                <QuickLink label="Yahoo!" url="https://www.yahoo.com" onNavigate={navigateTo} setInputUrl={setInputUrl} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center bg-[#ECE9D8] border-t border-[#ACA899] select-none">
        {/* Status text */}
        <div className="flex-1 flex items-center px-2 py-[1px] border-r border-[#D5D2C8]">
          {isLoading && (
            <div className="w-[100px] h-[12px] bg-white border border-[#ACA899] mr-2 overflow-hidden">
              <div
                className="h-full bg-[#3169C6] transition-all duration-200"
                style={{ width: `${Math.min(loadProgress, 100)}%` }}
              />
            </div>
          )}
          <span className="text-[11px] text-black truncate">{statusText}</span>
        </div>
        {/* Zone indicator */}
        <div className="flex items-center gap-1 px-2 py-[1px]">
          <XPIcon name="internet-explorer-6" size={16} />
          <span className="text-[11px] text-black">Internet</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function ToolbarButton({ icon, label, onClick, disabled, primary, small }: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-[3px] rounded-[2px] select-none
        ${small ? 'px-1 py-[3px]' : 'px-[6px] py-[3px]'}
        ${disabled
          ? 'opacity-40 cursor-default'
          : 'hover:bg-[#C1D2EE] hover:border-[#316AC5] active:bg-[#98B5E2] border border-transparent'
        }
        ${primary ? 'pr-[6px]' : ''}
      `}
    >
      <XPIcon name={icon} size={16} />
      {label && (
        <span className={`text-[11px] text-black ${disabled ? 'text-[#ACA899]' : ''}`}>
          {label}
        </span>
      )}
    </button>
  );
}

function ToolbarSeparator() {
  return (
    <div className="w-[1px] h-[24px] bg-[#ACA899] mx-[3px]" />
  );
}

function QuickLink({ label, url, onNavigate, setInputUrl }: {
  label: string;
  url: string;
  onNavigate: (url: string) => void;
  setInputUrl: (url: string) => void;
}) {
  return (
    <button
      onClick={() => { setInputUrl(url); onNavigate(url); }}
      className="px-3 py-1 text-[11px] text-[#003399] bg-[#E8F0FE] border border-[#BACDF8] hover:bg-[#D0E0FC] hover:border-[#7BA2E0] rounded-[2px]"
    >
      {label}
    </button>
  );
}
