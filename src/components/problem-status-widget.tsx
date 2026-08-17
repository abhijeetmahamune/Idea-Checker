'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROBLEM_STAGES,
  SEEKING_OPTIONS,
  getStageInfo,
  type ProblemStage,
  type SeekingOption,
} from '@/lib/problem-constants';
import { updateProblemStatusAction } from '@/app/problem-actions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProblemStatusWidgetProps {
  problemId: string;
  stage: ProblemStage;
  seeking: SeekingOption[];
  isOwner: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProblemStatusWidget({
  problemId,
  stage,
  seeking,
  isOwner,
}: ProblemStatusWidgetProps) {
  const [currentStage, setCurrentStage] = useState<ProblemStage>(stage);
  const [isPending, startTransition] = useTransition();

  const stageInfo = getStageInfo(currentStage);
  const currentIndex = PROBLEM_STAGES.findIndex((s) => s.value === currentStage);

  const handleStageClick = (newStage: ProblemStage) => {
    if (!isOwner || isPending || newStage === currentStage) return;
    const previous = currentStage;
    setCurrentStage(newStage); // optimistic
    startTransition(async () => {
      const result = await updateProblemStatusAction(problemId, newStage);
      if (result?.error) {
        setCurrentStage(previous); // revert
        toast.error(result.error);
      } else {
        toast.success(`Stage updated to ${getStageInfo(newStage).label}`);
      }
    });
  };

  return (
    <div
      className="rounded-xl border border-border/70 bg-card/60 dark:bg-zinc-950/40 p-5 space-y-4"
      aria-label="Problem status"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">{stageInfo.emoji}</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Problem Stage
            </span>
            <span className={cn('text-sm font-bold', stageInfo.colorClass)}>
              {stageInfo.label}
            </span>
          </div>
        </div>
        {isOwner && (
          <span className="text-[9px] text-muted-foreground italic">
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
            ) : (
              'Click a step to change'
            )}
          </span>
        )}
      </div>

      {/* Stage lifecycle stepper */}
      <div
        className="flex items-start gap-0 overflow-x-auto pb-1"
        role="list"
        aria-label="Lifecycle stages"
      >
        {PROBLEM_STAGES.map((s, i) => {
          const isActive = s.value === currentStage;
          const isPast = i < currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div
              key={s.value}
              role="listitem"
              className="flex items-center"
            >
              {/* Step button */}
              <button
                type="button"
                onClick={() => handleStageClick(s.value as ProblemStage)}
                disabled={isPending || !isOwner}
                aria-label={`Set stage to ${s.label}`}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-center transition-all duration-150 min-w-[56px]',
                  isOwner && !isPending
                    ? 'cursor-pointer hover:bg-muted/60'
                    : 'cursor-default',
                  isActive
                    ? cn('border', s.bgClass)
                    : isPast
                      ? 'opacity-60'
                      : isFuture
                        ? 'opacity-35'
                        : ''
                )}
              >
                <span className="text-base leading-none" aria-hidden="true">{s.emoji}</span>
                <span
                  className={cn(
                    'text-[8px] font-semibold leading-tight whitespace-nowrap',
                    isActive ? s.colorClass : 'text-muted-foreground'
                  )}
                >
                  {s.label}
                </span>
                {/* Active dot */}
                {isActive && (
                  <span
                    className={cn('w-1 h-1 rounded-full', s.colorClass.includes('violet') ? 'bg-violet-500' : s.colorClass.includes('blue') ? 'bg-blue-500' : s.colorClass.includes('amber') ? 'bg-amber-500' : s.colorClass.includes('orange') ? 'bg-orange-500' : s.colorClass.includes('emerald') ? 'bg-emerald-500' : 'bg-green-500')}
                    aria-hidden="true"
                  />
                )}
              </button>

              {/* Connector line between steps */}
              {i < PROBLEM_STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 w-4 min-w-[8px] mx-0.5 transition-colors duration-150',
                    i < currentIndex ? 'bg-muted-foreground/40' : 'bg-border/50'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Seeking section — only shown when non-empty */}
      {seeking.length > 0 && (
        <div className="border-t border-border/60 pt-3 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Currently Seeking
          </span>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Seeking">
            {seeking.map((val) => {
              const info = SEEKING_OPTIONS.find((o) => o.value === val);
              if (!info) return null;
              return (
                <span
                  key={val}
                  role="listitem"
                  title={info.description}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-border bg-muted/50 text-foreground"
                >
                  <span aria-hidden="true">{info.emoji}</span>
                  {info.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
