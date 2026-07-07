'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  content: string;
  type: string;
  senderName: string;
  userId: string | null;
  createdAt: string;
}

interface WorkspaceChatProps {
  workspaceId: string;
  currentUserId: string;
  currentUserName: string;
  initialMessages: Message[];
}

export function WorkspaceChat({ workspaceId, currentUserId, currentUserName, initialMessages }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`workspace-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const raw = payload.new as any;
          const newMsg: Message = {
            id: raw.id,
            content: raw.content,
            type: raw.type,
            senderName: raw.sender_name ?? 'Unknown',
            userId: raw.user_id ?? null,
            createdAt: raw.created_at ?? new Date().toISOString(),
          };
          setMessages(prev => {
            // Avoid duplicates (e.g. if HTTP API response arrives first)
            if (prev.some(m => m.id === newMsg.id)) return prev;

            // Reconcile our own optimistic message if the realtime event arrives first
            if (newMsg.userId === currentUserId) {
              const optIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.content === newMsg.content);
              if (optIndex !== -1) {
                return prev.map((m, idx) => idx === optIndex ? newMsg : m);
              }
            }

            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, supabase, currentUserId]);

  const handleSend = useCallback(async () => {
    if (!content.trim() || sending) return;
    const text = content.trim();
    setContent('');
    setSending(true);

    // Optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      content: text,
      type: text.toLowerCase().startsWith('@ai') ? 'ai' : 'text',
      senderName: currentUserName,
      userId: currentUserId,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/workspace/${workspaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          type: 'text',
          senderName: currentUserName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Replace optimistic message with real one, or remove it if already reconciled by realtime event
      setMessages(prev => {
        const alreadyHasReal = prev.some(m => m.id === data.message.id);
        const hasTemp = prev.some(m => m.id === optimisticId);
        if (alreadyHasReal && hasTemp) {
          return prev.filter(m => m.id !== optimisticId);
        }
        return prev.map(m => m.id === optimisticId ? { ...m, id: data.message.id } : m);
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  }, [content, sending, workspaceId, currentUserId, currentUserName]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-zinc-600">
            <Bot className="h-8 w-8 text-zinc-700" />
            <div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Start the discussion or type <code className="text-violet-400 bg-violet-500/10 px-1 rounded">@ai</code> to ask the AI assistant</p>
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.userId === currentUserId;
            const isAI = msg.type === 'ai';
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                {/* Avatar */}
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                  isAI ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
                    : isOwn ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                )}>
                  {isAI ? <Bot className="h-3.5 w-3.5" /> : (msg.senderName || 'Unknown')[0]?.toUpperCase()}
                </div>

                <div className={cn('max-w-[75%] space-y-1', isOwn ? 'items-end' : 'items-start')}>
                  <div className="flex items-center gap-1.5">
                    {!isOwn && (
                      <span className="text-[10px] font-bold text-zinc-400">{msg.senderName || 'Unknown'}</span>
                    )}
                    {isAI && <Badge className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20 py-0 h-3.5">AI</Badge>}
                    <span className="text-[9px] text-zinc-700 font-mono">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className={cn(
                    'px-3 py-2 rounded-xl text-sm leading-relaxed',
                    isAI ? 'bg-violet-500/8 border border-violet-500/20 text-violet-100'
                      : isOwn ? 'bg-indigo-600/20 border border-indigo-500/20 text-white'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  )}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3 space-y-2 flex-shrink-0">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Message... (type @ai to ask the AI assistant)"
          className="bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-600 text-sm resize-none min-h-[60px] max-h-[120px]"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-700">Enter to send · Shift+Enter for new line</span>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className="bg-violet-600 hover:bg-violet-500 text-white h-8 gap-1.5 text-xs"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
