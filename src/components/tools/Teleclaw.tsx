'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import type { NpcMood, ChatMessage } from '@/types';
import { Send, Search, CheckCheck } from 'lucide-react';
import { triggerNpcReply } from '@/systems/npc/NpcManager';

type MessagePosition = 'solo' | 'first' | 'middle' | 'last';

interface GroupedMessage {
  message: ChatMessage;
  position: MessagePosition;
  showTimestamp: boolean;
  showTail: boolean;
}

const TIME_GAP_MS = 5 * 60 * 1000;

function getMessageGroups(messages: ChatMessage[]): GroupedMessage[] {
  return messages.map((msg, i) => {
    if (msg.isSystem) {
      return { message: msg, position: 'solo' as const, showTimestamp: false, showTail: false };
    }
    const prev = i > 0 ? messages[i - 1] : null;
    const next = i < messages.length - 1 ? messages[i + 1] : null;

    const sameSenderAsPrev = prev && !prev.isSystem
      && prev.isFromPlayer === msg.isFromPlayer
      && (msg.createdAt - prev.createdAt) < TIME_GAP_MS;
    const sameSenderAsNext = next && !next.isSystem
      && next.isFromPlayer === msg.isFromPlayer
      && (next.createdAt - msg.createdAt) < TIME_GAP_MS;

    const position: MessagePosition =
      !sameSenderAsPrev && !sameSenderAsNext ? 'solo' :
      !sameSenderAsPrev ? 'first' :
      !sameSenderAsNext ? 'last' : 'middle';

    return {
      message: msg,
      position,
      showTail: position === 'first' || position === 'solo',
      showTimestamp: position === 'last' || position === 'solo',
    };
  });
}

const MOOD_LABELS: Record<NpcMood, string> = {
  neutral: 'online',
  waiting: 'online',
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

export function Teleclaw() {
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
  const groupedMessages = useMemo(
    () => getMessageGroups(activeConv?.messages ?? []),
    [activeConv?.messages]
  );
  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex overflow-hidden bg-white" style={{ fontFamily: 'var(--font-xp)' }}>
      {/* Left Sidebar - Telegram style: white bg, chat list */}
      <div className="w-[200px] flex flex-col border-r border-[#E7E7E7] bg-white shrink-0">
        {/* Sidebar hamburger + search area */}
        <div className="h-[46px] flex items-center px-2.5 gap-2 border-b border-[#E7E7E7]">
          <div className="flex-1 flex items-center bg-[#F4F4F5] rounded-full px-2.5 py-1 gap-1.5">
            <Search size={12} className="text-[#A0A0A0] shrink-0" />
            <span className="text-[10px] text-[#A0A0A0]">Search</span>
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {selectedNpc ? (
            <div
              className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer"
              style={{ backgroundColor: '#419FD9', }}
            >
              {/* Circular avatar */}
              <div
                className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: selectedNpc.color }}
              >
                <span className="leading-none">{selectedNpc.avatar}</span>
              </div>
              {/* Chat info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-[12px] font-semibold text-white truncate">
                    {selectedNpc.name}
                  </div>
                  <div className="text-[10px] text-white/70 shrink-0">
                    {lastMessage ? formatTime(lastMessage.createdAt) : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {lastMessage?.isFromPlayer && (
                    <CheckCheck size={12} className="text-white/60 shrink-0" />
                  )}
                  <div className="text-[11px] text-white/80 truncate">
                    {lastMessage ? lastMessage.text.slice(0, 35) : selectedNpc.role}
                  </div>
                </div>
              </div>
              {/* Unread badge */}
              {activeConv && activeConv.unreadCount > 0 && (
                <span className="bg-white text-[#419FD9] text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shrink-0">
                  {activeConv.unreadCount > 99 ? '99+' : activeConv.unreadCount}
                </span>
              )}
            </div>
          ) : (
            <div className="px-3 py-6 text-[11px] text-[#999] text-center">
              No chats yet
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {selectedNpc ? (
          <>
            {/* Chat header - white/light like real Telegram */}
            <div className="h-[46px] bg-white flex items-center px-3 gap-2.5 border-b border-[#E7E7E7]">
              <div
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: selectedNpc.color }}
              >
                {selectedNpc.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-[#000] truncate">
                  {selectedNpc.name}
                </div>
                <div className={cn(
                  'text-[11px]',
                  activeNpcState?.mood === 'gone' ? 'text-[#999]' : 'text-[#168ACD]'
                )}>
                  {activeNpcState?.isTyping
                    ? 'typing...'
                    : activeNpcState?.mood === 'gone'
                      ? formatLastSeen(activeNpcState.goneAtTick, tick)
                      : activeNpcState ? MOOD_LABELS[activeNpcState.mood] : 'online'}
                </div>
              </div>
            </div>

            {/* Messages area - Telegram wallpaper style */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-[10%] py-3"
              style={{
                backgroundColor: '#8EAFBF',
                backgroundImage: `
                  url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                `,
              }}
            >
              {groupedMessages.length > 0 ? (
                groupedMessages.map(({ message: msg, position, showTimestamp, showTail }, idx) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'max-w-[85%]',
                      msg.isFromPlayer ? 'ml-auto' : 'mr-auto'
                    )}
                    style={{
                      marginTop: idx === 0 ? 0
                        : (position === 'first' || position === 'solo') ? 8
                        : 2,
                    }}
                  >
                    {msg.isSystem ? (
                      <div className="text-center py-1">
                        <span className="bg-[#3A7CA5]/40 text-white text-[10px] px-3 py-0.5 rounded-full shadow-sm">
                          {msg.text}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-md relative',
                          msg.isFromPlayer ? 'bg-[#EFFDDE]' : 'bg-white',
                          msg.isFromPlayer
                            ? showTail && 'rounded-tr-none'
                            : showTail && 'rounded-tl-none'
                        )}
                        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                      >
                        <div className="whitespace-pre-wrap text-[#000] leading-[1.4]">{msg.text}</div>
                        {showTimestamp && (
                          <div className="flex items-center justify-end gap-0.5 -mb-0.5">
                            <span className={cn(
                              'text-[9px]',
                              msg.isFromPlayer ? 'text-[#5DC452]' : 'text-[#AAAAAA]'
                            )}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.isFromPlayer && (
                              <CheckCheck size={12} className="text-[#5DC452]" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center bg-[#3A7CA5]/30 px-4 py-2 rounded-lg">
                    <div className="text-white/90 text-[11px]">
                      {selectedNpc
                        ? 'No messages yet. Requests will appear here!'
                        : 'Select a chat to start messaging'}
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {npcId && activeNpcState?.isTyping && (
                <div className="mr-auto max-w-[85%]" style={{ marginTop: 8 }}>
                  <div
                    className="px-2.5 py-1.5 text-xs rounded-md rounded-tl-none bg-white"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                  >
                    <div className="flex gap-1 items-center h-4">
                      <span className="typing-bounce-1 w-1.5 h-1.5 rounded-full bg-[#70BDE0] inline-block" />
                      <span className="typing-bounce-2 w-1.5 h-1.5 rounded-full bg-[#70BDE0] inline-block" />
                      <span className="typing-bounce-3 w-1.5 h-1.5 rounded-full bg-[#70BDE0] inline-block" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reply input - Telegram style: flat white bar */}
            {activeNpcState?.mood !== 'gone' && (
              <div className="border-t border-[#E7E7E7] px-3 py-1.5 bg-white shrink-0">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Write a message..."
                    className="flex-1 bg-transparent px-1 py-1 text-xs outline-none text-[#000] placeholder-[#999]"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center transition-colors rounded',
                      replyText.trim()
                        ? 'text-[#4FAE4E] hover:text-[#3D9040]'
                        : 'text-[#BBBBBB]'
                    )}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

          </>
        ) : (
          /* Empty state - Telegram style: subtle branding */
          <div className="flex-1 flex items-center justify-center bg-[#8EAFBF]">
            <div className="text-center">
              <div className="w-[80px] h-[80px] rounded-full bg-white/15 flex items-center justify-center mx-auto mb-3">
                <Send size={32} className="text-white/50" />
              </div>
              <div className="text-white/80 text-sm font-light">Teleclaw Desktop</div>
              <div className="text-white/50 text-[10px] mt-1">
                Select a chat to start messaging
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
