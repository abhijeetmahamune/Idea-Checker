'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  userId: string;
  authorName: string | null;
  authorEmail: string | null;
}

interface CommentSectionProps {
  problemId: string;
  currentUserId: string;
  isProblemOwner: boolean;
}

function getInitial(name: string | null, email: string | null): string {
  return (name || email || '?')[0].toUpperCase();
}

function getDisplayName(name: string | null, email: string | null): string {
  return name || email?.split('@')[0] || 'Anonymous';
}

export function CommentSection({ problemId, currentUserId, isProblemOwner }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/comments?problemId=${problemId}`)
      .then(r => r.json())
      .then(data => setComments(data.comments ?? []))
      .catch(() => toast.error('Failed to load comments'))
      .finally(() => setLoading(false));
  }, [problemId]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(prev => [...prev, data.comment]);
      setContent('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments?commentId=${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-bold text-white">
          Discussion
          {comments.length > 0 && (
            <span className="ml-2 text-xs font-mono text-zinc-500">({comments.length})</span>
          )}
        </h3>
      </div>

      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share a thought, ask a question, or give feedback..."
          className="bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-600 text-sm min-h-[80px] resize-none focus:border-violet-500/50"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">Ctrl+Enter to post</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs gap-1.5 h-8"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Post
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-zinc-600 text-sm">
          No comments yet. Be the first to share your thoughts.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => {
            const canDelete = comment.userId === currentUserId || isProblemOwner;
            const initial = getInitial(comment.authorName, comment.authorEmail);
            const displayName = getDisplayName(comment.authorName, comment.authorEmail);
            const date = new Date(comment.createdAt);

            return (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 group"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-violet-300">{initial}</span>
                </div>

                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{displayName}</span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        {deletingId === comment.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Trash2 className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed break-words">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
