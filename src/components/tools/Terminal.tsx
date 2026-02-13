'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { executeCommand } from '@/systems/tools/CommandParser';
import { EventBus } from '@/engine/EventBus';

export function Terminal() {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const history = useGameStore((s) => s.tools.terminalHistory);
  const cwd = useGameStore((s) => s.tools.terminalCwd);
  const tick = useGameStore((s) => s.clock.tickCount);
  const addTerminalEntry = useGameStore((s) => s.addTerminalEntry);
  const setTerminalCwd = useGameStore((s) => s.setTerminalCwd);
  const clearTerminal = useGameStore((s) => s.clearTerminal);
  const adjustResource = useGameStore((s) => s.adjustResource);

  const commandHistory = useRef<string[]>([]);

  useEffect(() => {
    const unsub = EventBus.on('terminal_clear', () => clearTerminal());
    return unsub;
  }, [clearTerminal]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    commandHistory.current.push(input);
    setHistoryIndex(-1);

    const result = executeCommand(input, cwd);

    addTerminalEntry(input, result.output, cwd, tick, result.isError);

    if (result.newCwd) {
      setTerminalCwd(result.newCwd);
    }

    if (result.sideEffects) {
      if (result.sideEffects.cpuCost) adjustResource('cpu', result.sideEffects.cpuCost);
      if (result.sideEffects.memoryCost) adjustResource('memory', result.sideEffects.memoryCost);
      if (result.sideEffects.networkCost) adjustResource('network', result.sideEffects.networkCost);
      if (result.sideEffects.diskCost) adjustResource('disk', result.sideEffects.diskCost);
    }

    EventBus.emit('command_executed', { command: input, cwd, result });
    setInput('');
  }, [input, cwd, tick, addTerminalEntry, setTerminalCwd, adjustResource]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const cmds = commandHistory.current;
      if (cmds.length === 0) return;
      const newIdx = historyIndex === -1 ? cmds.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIdx);
      setInput(cmds[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const cmds = commandHistory.current;
      if (historyIndex === -1) return;
      const newIdx = historyIndex + 1;
      if (newIdx >= cmds.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIdx);
        setInput(cmds[newIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  const shortCwd = cwd.replace(/^\/home\/user/, '~');

  return (
    <div
      className="h-full flex flex-col bg-[#000000] font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {history.length === 0 && (
          <div className="text-[#808080]">
            <div className="text-[#00FF00]">Clawsoft(R) Claws Command Prompt</div>
            <div className="text-[#C0C0C0]">(C) Clawback Corp. Type <span className="text-[#00CCFF]">help</span> for commands.</div>
            <div className="mt-1" />
          </div>
        )}

        {history.map((entry, idx) => {
          const isLatest = idx === history.length - 1;
          return (
            <div key={entry.id}>
              <div className="flex gap-1">
                <span className="text-[#C0C0C0]">C:\{entry.cwd.replace(/^\/home\/user/, '').replace(/\//g, '\\')}&gt;</span>
                <span className="text-[#C0C0C0] ml-1">{entry.command}</span>
              </div>
              {entry.output && (
                <pre
                  className={`whitespace-pre-wrap break-words text-xs leading-relaxed mt-0.5 ${
                    entry.isError ? 'text-claw-red' : 'text-[#C0C0C0]/80'
                  } ${isLatest ? 'terminal-reveal' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: ansiToHtml(entry.output),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Input line */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-[#333333] p-3">
        <div className="flex items-center gap-1">
          <span className="text-[#C0C0C0] text-xs">C:\{shortCwd.replace(/^~/, '').replace(/\//g, '\\')}&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#C0C0C0] text-sm font-mono border-none outline-none caret-[#C0C0C0] ml-1"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <span className="w-2 h-4 bg-[#C0C0C0] cursor-blink" />
        </div>
      </form>
    </div>
  );
}

function ansiToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\x1b\[31m/g, '<span class="text-claw-red">')
    .replace(/\x1b\[32m/g, '<span class="text-[#00FF00]">')
    .replace(/\x1b\[33m/g, '<span class="text-claw-orange">')
    .replace(/\x1b\[34m/g, '<span class="text-[#00CCFF]">')
    .replace(/\x1b\[35m/g, '<span class="text-[#7B68EE]">')
    .replace(/\x1b\[0m/g, '</span>');
}
