'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { searchDatabase } from '@/data/search-results';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { XPIcon } from '@/components/ui/XPIcon';

export function WebSearch() {
  const [query, setQuery] = useState('');
  const searchResults = useGameStore((s) => s.searchResults);
  const setSearchResults = useGameStore((s) => s.setSearchResults);
  const setSearchQuery = useGameStore((s) => s.setSearchQuery);
  const adjustResource = useGameStore((s) => s.adjustResource);
  const addNotification = useGameStore((s) => s.addNotification);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchQuery(query);
    const results = searchDatabase(query);
    setSearchResults(results);
    adjustResource('network', 5);

    if (results.length === 0) {
      addNotification({
        type: 'info',
        title: 'No Results',
        message: `No results found for "${query}"`,
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-4 border-b border-claw-border">
        <div className="flex items-center gap-2 bg-claw-surface border border-claw-border rounded-sm px-3 py-2 focus-within:border-claw-green/50">
          <XPIcon name="search" size={16} className="flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search the web..."
            className="flex-1 bg-transparent text-sm text-claw-text font-mono border-none outline-none placeholder:text-claw-muted/50"
            autoFocus
          />
          <button
            onClick={handleSearch}
            className="px-2 py-0.5 bg-claw-green/10 text-claw-green text-xs border border-claw-green/30 hover:bg-claw-green/20 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {searchResults.length > 0 ? (
          <>
            <div className="text-[10px] text-claw-muted">
              {searchResults.length} results found
            </div>
            {searchResults.map((result) => (
              <div key={result.id} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <XPIcon name="internet-explorer-6" size={16} />
                  <span className="text-[10px] text-claw-dim truncate">{result.url}</span>
                </div>
                <div className="text-sm text-claw-blue hover:underline cursor-pointer flex items-center gap-1">
                  {result.title}
                  <ExternalLink size={10} />
                </div>
                <div className="text-xs text-claw-text/70">{result.snippet}</div>
                <div className="text-[10px] text-claw-dim">
                  Category: {result.category}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-claw-muted text-xs gap-2">
            <XPIcon name="internet-explorer-6" size={48} />
            <div>Search the web for information</div>
            <div className="text-[10px] text-claw-dim">
              Try: "React best practices", "Python CSV", "cron jobs"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
