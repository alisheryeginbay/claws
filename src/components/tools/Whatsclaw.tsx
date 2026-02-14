'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import type { NpcMood } from '@/types';
import { Send, CheckCheck, Lock } from 'lucide-react';
import { triggerNpcReply } from '@/systems/npc/NpcManager';

const MOOD_LABELS: Record<NpcMood, string> = {
  neutral: 'online',
  waiting: 'typing...',
  frustrated: 'online',
  angry: 'online',
  gone: '',
  happy: 'online',
};

function formatLastSeen(goneAtTick: number | undefined, currentTick: number): string {
  if (goneAtTick === undefined) return 'last seen recently';
  const elapsed = currentTick - goneAtTick;
  if (elapsed < 1) return 'last seen just now';
  if (elapsed === 1) return 'last seen 1 minute ago';
  if (elapsed < 60) return `last seen ${elapsed} minutes ago`;
  const hours = Math.floor(elapsed / 60);
  if (hours === 1) return 'last seen 1 hour ago';
  if (hours < 24) return `last seen ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'last seen 1 day ago';
  return `last seen ${days} days ago`;
}

export function Whatsclaw() {
  const [replyText, setReplyText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedNpc = useGameStore((s) => s.selectedNpc);
  const conversations = useGameStore((s) => s.conversations);
  const npcs = useGameStore((s) => s.npcs);
  const addMessage = useGameStore((s) => s.addMessage);
  const markConversationRead = useGameStore((s) => s.markConversationRead);
  const tick = useGameStore((s) => s.clock.tickCount);

  const npcId = selectedNpc?.id;
  const activeConv = npcId ? conversations[npcId] : null;
  const activeNpcState = npcId ? npcs[npcId] : null;

  useEffect(() => {
    if (npcId && activeConv && activeConv.unreadCount > 0) {
      markConversationRead(npcId);
    }
  }, [npcId, activeConv, markConversationRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [activeConv]);

  const handleSendReply = () => {
    if (!replyText.trim() || !npcId) return;
    addMessage(npcId, replyText.trim(), true, tick);
    setReplyText('');
    triggerNpcReply(npcId);
  };

  const lastMessage = activeConv?.messages[activeConv.messages.length - 1];

  return (
    <div className="h-full flex overflow-hidden bg-white" style={{ fontFamily: 'var(--font-xp)' }}>
      {/* Left Sidebar - WhatsApp style */}
      <div className="w-[160px] flex flex-col border-r border-[#D1D7DB] bg-white shrink-0">
        {/* Sidebar header */}
        <div className="h-[42px] bg-gradient-to-r from-[#075E54] to-[#128C7E] flex items-center px-3 border-b border-[#054D44]">
          <span className="text-white text-[11px] font-bold">Whatsclaw</span>
        </div>

        {/* Search bar area */}
        <div className="px-2 py-1.5 bg-[#F6F6F6] border-b border-[#E6E6E6]">
          <div className="bg-white rounded-full px-2.5 py-1 text-[10px] text-[#999] border border-[#E6E6E6]">
            Search or start new chat
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {selectedNpc ? (
            <div className="flex items-center gap-2 px-2 py-2 bg-[#F0F2F5] border-l-2 border-[#25D366] cursor-pointer">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 border border-[#D1D7DB]"
                style={{ backgroundColor: `${selectedNpc.color}20` }}
              >
                {selectedNpc.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-[11px] font-bold text-[#111B21] truncate">
                    {selectedNpc.name}
                  </div>
                  <div className="text-[8px] text-[#667781] shrink-0">
                    {lastMessage
                      ? `${String(new Date(lastMessage.createdAt).getHours()).padStart(2, '0')}:${String(new Date(lastMessage.createdAt).getMinutes()).padStart(2, '0')}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {lastMessage?.isFromPlayer && (
                    <CheckCheck size={10} className="text-[#53BDEB] shrink-0" />
                  )}
                  <div className="text-[9px] text-[#667781] truncate">
                    {lastMessage ? lastMessage.text.slice(0, 25) : selectedNpc.role}
                  </div>
                </div>
              </div>
              {activeConv && activeConv.unreadCount > 0 && (
                <span className="bg-[#25D366] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                  {activeConv.unreadCount > 9 ? '9+' : activeConv.unreadCount}
                </span>
              )}
            </div>
          ) : (
            <div className="px-3 py-4 text-[10px] text-[#667781] text-center">
              No chats
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {selectedNpc ? (
          <>
            {/* Chat header - WhatsApp dark teal */}
            <div className="h-[42px] bg-gradient-to-r from-[#075E54] to-[#128C7E] flex items-center px-3 gap-2 border-b border-[#054D44]">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm border border-white/20"
                style={{ backgroundColor: `${selectedNpc.color}30` }}
              >
                {selectedNpc.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[11px] font-bold truncate">
                  {selectedNpc.name}
                </div>
                <div className="text-white/70 text-[9px]">
                  {activeNpcState?.isTyping
                    ? 'typing...'
                    : activeNpcState?.mood === 'gone'
                      ? formatLastSeen(activeNpcState.goneAtTick, tick)
                      : activeNpcState ? MOOD_LABELS[activeNpcState.mood] : 'online'}
                </div>
              </div>
            </div>

            {/* Messages area - WhatsApp wallpaper */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-1.5"
              style={{
                backgroundColor: '#ECE5DD',
                backgroundImage: `
                  radial-gradient(circle at 10px 10px, rgba(0,0,0,0.02) 1px, transparent 1px),
                  radial-gradient(circle at 30px 30px, rgba(0,0,0,0.015) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px, 60px 60px',
              }}
            >
              {/* Encryption notice */}
              <div className="text-center mb-2">
                <span className="bg-[#FFF3C4] text-[#54656F] text-[9px] px-3 py-1 rounded-md inline-flex items-center gap-1">
                  <Lock size={8} />
                  Messages are end-to-end encrypted
                </span>
              </div>

              {activeConv && activeConv.messages.length > 0 ? (
                activeConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'max-w-[80%]',
                      msg.isFromPlayer ? 'ml-auto' : 'mr-auto'
                    )}
                  >
                    {msg.isSystem ? (
                      <div className="text-center">
                        <span className="bg-[#E2F7CB] text-[#54656F] text-[9px] px-2 py-0.5 rounded-md">
                          {msg.text}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'px-2 py-1.5 text-xs rounded-lg relative',
                          msg.isFromPlayer
                            ? 'bg-[#DCF8C6] rounded-tr-none'
                            : 'bg-white rounded-tl-none'
                        )}
                        style={{ boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}
                      >
                        {!msg.isFromPlayer && selectedNpc && (
                          <div className="text-[10px] font-bold mb-0.5" style={{ color: selectedNpc.color }}>
                            {selectedNpc.name}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap text-[#111B21]">{msg.text}</div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[8px] text-[#667781]">
                            {String(new Date(msg.createdAt).getHours()).padStart(2, '0')}:
                            {String(new Date(msg.createdAt).getMinutes()).padStart(2, '0')}
                          </span>
                          {msg.isFromPlayer && (
                            <CheckCheck size={10} className="text-[#53BDEB]" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-[#667781] text-xs text-center">
                    No messages yet. Requests will appear here!
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {npcId && activeNpcState?.isTyping && (
                <div className="mr-auto max-w-[80%]">
                  <div className="px-2 py-1.5 text-xs rounded-lg rounded-tl-none bg-white"
                    style={{ boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
                    {selectedNpc && (
                      <div className="text-[10px] font-bold mb-0.5" style={{ color: selectedNpc.color }}>
                        {selectedNpc.name}
                      </div>
                    )}
                    <div className="flex gap-1 items-center h-4">
                      <span className="typing-bounce-1 w-1.5 h-1.5 rounded-full bg-[#667781] inline-block" />
                      <span className="typing-bounce-2 w-1.5 h-1.5 rounded-full bg-[#667781] inline-block" />
                      <span className="typing-bounce-3 w-1.5 h-1.5 rounded-full bg-[#667781] inline-block" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reply input - WhatsApp style */}
            {activeNpcState?.mood !== 'gone' && (
              <div className="border-t border-[#D1D7DB] px-2 py-1.5 bg-[#F0F2F5] shrink-0">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type a message"
                    className="flex-1 bg-white border border-[#D1D7DB] rounded-full px-3 py-1.5 text-xs outline-none focus:border-[#128C7E]"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                      replyText.trim()
                        ? 'bg-[#25D366] text-white hover:bg-[#128C7E]'
                        : 'bg-[#D1D7DB] text-white'
                    )}
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            )}

          </>
        ) : (
          /* Empty state - WhatsApp style */
          <div className="flex-1 flex items-center justify-center bg-[#F0F2F5]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#D9FDD3] flex items-center justify-center mx-auto mb-3">
                <Lock size={24} className="text-[#128C7E]" />
              </div>
              <div className="text-[#41525D] text-sm font-light mb-1">Whatsclaw Desktop</div>
              <div className="text-[#667781] text-[10px] flex items-center gap-1 justify-center">
                <Lock size={8} />
                End-to-end encrypted
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
