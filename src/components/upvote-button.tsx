'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpvoteButtonProps {
  problemId: string;
  initialCount: number;
  initialUpvoted: boolean;
}

export function UpvoteButton({ problemId, initialCount, initialUpvoted }: UpvoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Optimistic UI — updates instantly, reverts if request fails
  const [optimistic, addOptimistic] = useOptimistic(
    { count: initialCount, upvoted: initialUpvoted },
    (_state, action: { count: number; upvoted: boolean }) => action
  );

  const handleUpvote = useCallback(async () => {
    // Optimistically toggle before the request
    startTransition(() => {
      addOptimistic({
        count: optimistic.upvoted ? optimistic.count - 1 : optimistic.count + 1,
        upvoted: !optimistic.upvoted,
      });
    });

    try {
      const res = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upvote');
      router.refresh(); // sync server state
    } catch (err: any) {
      toast.error(err.message || 'Failed to upvote');
      // Revert — optimistic state is re-derived from initialCount/initialUpvoted on next render
      router.refresh();
    }
  }, [problemId, optimistic, router, addOptimistic]);

  return (
    <button
      onClick={handleUpvote}
      disabled={isPending}
      aria-label={optimistic.upvoted ? 'Remove upvote' : 'Upvote this idea'}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 select-none',
        optimistic.upvoted
          ? 'bg-violet-500/15 border-violet-500/40 text-violet-300 hover:bg-violet-500/20'
          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300',
        isPending && 'opacity-60 cursor-not-allowed'
      )}
    >
      <ThumbsUp
        className={cn(
          'h-3.5 w-3.5 transition-transform duration-150',
          optimistic.upvoted ? 'fill-violet-400 text-violet-400 scale-110' : '',
          isPending && 'animate-pulse'
        )}
      />
      <span className="font-mono tabular-nums">{optimistic.count}</span>
    </button>
  );
}
