'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Star, Send, ArrowLeft, Reply, Forward } from 'lucide-react';
import { XPIcon } from '@/components/ui/XPIcon';

export function EmailClient() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [view, setView] = useState<'inbox' | 'compose'>('inbox');

  const emails = useGameStore((s) => s.emails);
  const markEmailRead = useGameStore((s) => s.markEmailRead);
  const toggleEmailStar = useGameStore((s) => s.toggleEmailStar);
  const addEmail = useGameStore((s) => s.addEmail);
  const addNotification = useGameStore((s) => s.addNotification);
  const tick = useGameStore((s) => s.clock.tickCount);

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);
  const unreadCount = emails.filter((e) => !e.isRead).length;

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    markEmailRead(id);
  };

  const handleSendEmail = () => {
    if (!composeData.to.trim() || !composeData.subject.trim()) return;

    // Check for security violations (forwarding credentials)
    const body = composeData.body.toLowerCase();
    const isForwardingSecrets = body.includes('password') || body.includes('api_key') || body.includes('secret') || body.includes('credential');
    const isExternalRecipient = !composeData.to.includes('@company.com') && !composeData.to.includes('@clawback.dev');

    addEmail({
      from: 'ai@clawback.dev',
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      timestamp: tick,
      isRead: true,
      isStarred: false,
    });

    if (isForwardingSecrets && isExternalRecipient) {
      import('@/engine/EventBus').then(({ EventBus }) => {
        EventBus.emit('security_violation', {
          type: 'credential_forward',
          detail: `Forwarded sensitive data to external address: ${composeData.to}`,
        });
      });
    }

    addNotification({
      type: 'success',
      title: 'Email Sent',
      message: `Email sent to ${composeData.to}`,
    });

    setComposeData({ to: '', subject: '', body: '' });
    setView('inbox');
  };

  if (view === 'compose') {
    return (
      <div className="h-full flex flex-col">
        <div className="h-8 bg-claw-surface border-b border-claw-border flex items-center px-3 gap-2">
          <button onClick={() => setView('inbox')} className="text-claw-muted hover:text-claw-text">
            <ArrowLeft size={14} />
          </button>
          <span className="text-xs text-claw-text">New Email</span>
        </div>
        <div className="flex-1 p-3 space-y-2">
          <input
            type="text"
            placeholder="To..."
            value={composeData.to}
            onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
            className="w-full bg-claw-surface border border-claw-border px-3 py-1.5 text-xs text-claw-text font-mono focus:outline-none focus:border-claw-green/50"
          />
          <input
            type="text"
            placeholder="Subject..."
            value={composeData.subject}
            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
            className="w-full bg-claw-surface border border-claw-border px-3 py-1.5 text-xs text-claw-text font-mono focus:outline-none focus:border-claw-green/50"
          />
          <textarea
            placeholder="Write your email..."
            value={composeData.body}
            onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
            className="w-full flex-1 min-h-[200px] bg-claw-surface border border-claw-border px-3 py-2 text-xs text-claw-text font-mono focus:outline-none focus:border-claw-green/50 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-1 px-3 py-1.5 bg-claw-green/10 border border-claw-green/30 text-claw-green text-xs hover:bg-claw-green/20 transition-colors"
            >
              <Send size={12} /> Send
            </button>
            <button
              onClick={() => setView('inbox')}
              className="px-3 py-1.5 text-xs text-claw-muted hover:text-claw-text"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-claw-border bg-claw-surface">
        <XPIcon name="oe-inbox" size={16} />
        <span className="text-xs text-claw-text">Inbox</span>
        {unreadCount > 0 && (
          <span className="text-[10px] text-claw-blue">({unreadCount} unread)</span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setView('compose')}
          className="flex items-center gap-1 px-2 py-1 text-[10px] bg-claw-green/10 border border-claw-green/30 text-claw-green hover:bg-claw-green/20 transition-colors"
        >
          <XPIcon name="oe-create-mail" size={16} /> Compose
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Email list */}
        <div className={cn('border-r border-claw-border overflow-y-auto', selectedEmail ? 'w-64' : 'flex-1')}>
          {emails.length === 0 ? (
            <div className="text-center text-claw-muted text-xs mt-8">Inbox is empty</div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email.id)}
                className={cn(
                  'px-3 py-2 border-b border-claw-border/50 cursor-pointer transition-colors',
                  selectedEmailId === email.id ? 'bg-claw-surface-alt' : 'hover:bg-claw-surface',
                  !email.isRead && 'border-l-2 border-l-claw-blue'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleEmailStar(email.id); }}
                    className={cn('transition-colors', email.isStarred ? 'text-claw-yellow' : 'text-claw-dim hover:text-claw-yellow')}
                  >
                    <Star size={10} fill={email.isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <span className={cn('text-[10px] truncate flex-1', email.isRead ? 'text-claw-muted' : 'text-claw-text font-bold')}>
                    {email.from.split('@')[0]}
                  </span>
                </div>
                <div className={cn('text-xs truncate mt-0.5', email.isRead ? 'text-claw-muted' : 'text-claw-text')}>
                  {email.subject}
                </div>
                <div className="text-[10px] text-claw-dim truncate mt-0.5">
                  {email.body.slice(0, 60)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Email detail */}
        {selectedEmail && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <h3 className="text-sm text-claw-text font-bold">{selectedEmail.subject}</h3>
              <div className="flex items-center gap-2 text-[10px] text-claw-muted">
                <span>From: <span className="text-claw-text">{selectedEmail.from}</span></span>
                <span>To: <span className="text-claw-text">{selectedEmail.to}</span></span>
              </div>
              <div className="border-t border-claw-border pt-3">
                <pre className="text-xs text-claw-text/80 whitespace-pre-wrap font-mono">
                  {selectedEmail.body}
                </pre>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setComposeData({
                      to: selectedEmail.from,
                      subject: `Re: ${selectedEmail.subject}`,
                      body: `\n\n---\nOn previous email, ${selectedEmail.from} wrote:\n${selectedEmail.body}`,
                    });
                    setView('compose');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-claw-muted hover:text-claw-text border border-claw-border hover:border-claw-green/50"
                >
                  <Reply size={10} /> Reply
                </button>
                <button
                  onClick={() => {
                    setComposeData({
                      to: '',
                      subject: `Fwd: ${selectedEmail.subject}`,
                      body: `\n\n---\nForwarded message from ${selectedEmail.from}:\n${selectedEmail.body}`,
                    });
                    setView('compose');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-claw-muted hover:text-claw-text border border-claw-border hover:border-claw-green/50"
                >
                  <Forward size={10} /> Forward
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
