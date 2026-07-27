'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ThumbsUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UpvoteButtonProps {
  problemId: string;
  initialCount: number;
  initialUpvoted: boolean;
  isGuest?: boolean;
}

export function UpvoteButton({ problemId, initialCount, initialUpvoted, isGuest = false }: UpvoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Optimistic UI — updates instantly, reverts if request fails
  const [optimistic, addOptimistic] = useOptimistic(
    { count: initialCount, upvoted: initialUpvoted },
    (_state, action: { count: number; upvoted: boolean }) => action
  );

  const handleUpvote = useCallback(async () => {
    // Guests: show login prompt instead
    if (isGuest) {
      toast.info(
        <span>
          <Link href="/register" className="font-bold text-violet-400 underline underline-offset-2">Create a free account</Link>
          {' '}to upvote ideas.
        </span>,
        { duration: 4000 }
      );
      return;
    }

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
  }, [problemId, optimistic, router, addOptimistic, isGuest]);

  return (
    <button
      onClick={handleUpvote}
      disabled={isPending}
      aria-label={optimistic.upvoted ? 'Remove upvote' : 'Upvote this idea'}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ease-out select-none cursor-pointer active:scale-90 hover:scale-105',
        optimistic.upvoted
          ? 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-300 hover:bg-violet-500/20'
          : 'bg-muted/60 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
        isPending && 'opacity-60 cursor-not-allowed'
      )}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
      ) : (
        <ThumbsUp
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-150',
            optimistic.upvoted ? 'fill-violet-500 text-violet-600 dark:text-violet-400 scale-110' : ''
          )}
        />
      )}
      <span className="font-mono tabular-nums">{optimistic.count}</span>
    </button>
  );
}
