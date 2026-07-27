'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CommunityScoreWidgetProps {
  solutionId: string;
  initialAverage: number;
  initialTotal: number;
  initialUserRating: number; // 0 = not rated
  isOwner: boolean;
  isGuest: boolean;
}

export function CommunityScoreWidget({
  solutionId,
  initialAverage,
  initialTotal,
  initialUserRating,
  isOwner,
  isGuest,
}: CommunityScoreWidgetProps) {
  const [hovered, setHovered] = useState(0);
  const [userRating, setUserRating] = useState(initialUserRating);
  const [average, setAverage] = useState(Number(initialAverage) || 0);
  const [total, setTotal] = useState(Number(initialTotal) || 0);
  const [isPending, startTransition] = useTransition();

  const displayRating = hovered > 0 ? hovered : userRating;

  const handleRate = (star: number) => {
    if (isOwner || isGuest || isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/rate-solution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ solutionId, rating: star }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Rating failed');
        setUserRating(star);
        setAverage(Number(data.averageRating) || star);
        setTotal(Number(data.totalRatings) || 1);
        toast.success(userRating === 0 ? 'Rating submitted!' : 'Rating updated!');
      } catch (err: any) {
        toast.error(err.message || 'Failed to submit rating');
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card/80 dark:bg-zinc-950/60 p-4 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Star className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-display text-sm font-bold text-foreground">Community Score</span>
        </div>

        {total > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{average.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 5</span>
            <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5 font-mono">
              {total} {total === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">No ratings yet</span>
        )}
      </div>

      {/* Average stars display */}
      {total > 0 && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= Math.round(average);
            const partial = !filled && star - 1 < average;
            return (
              <Star
                key={star}
                className={cn(
                  'h-4 w-4 transition-colors',
                  filled ? 'fill-amber-400 text-amber-500' : partial ? 'fill-amber-400/40 text-amber-500/40' : 'text-muted-foreground/40'
                )}
              />
            );
          })}
          <span className="text-xs text-muted-foreground ml-1">community average</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Rating interaction area */}
      {isGuest ? (
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">Sign in to rate this solution</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 px-3 py-1.5 rounded-lg transition-all"
          >
            Sign In to Rate
          </Link>
        </div>
      ) : isOwner ? (
        <p className="text-xs text-muted-foreground text-center italic">You can&apos;t rate your own solution</p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground text-center">
            {userRating > 0 ? `Your rating: ${userRating}/5 — click to update` : 'Rate this solution'}
          </p>
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={isPending}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => handleRate(star)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                className={cn(
                  'rounded-md p-1.5 transition-all duration-100 hover:scale-110 active:scale-95',
                  isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                )}
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors duration-100',
                    star <= displayRating
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-muted-foreground/40 hover:text-amber-500/50'
                  )}
                />
              </button>
            ))}
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-1" />}
          </div>
        </div>
      )}
    </div>
  );
}
