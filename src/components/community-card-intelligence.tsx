'use client';

import { PentagonRadarChart } from '@/components/pentagon-radar-chart';
import { Star, Brain, Clock, Lightbulb } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardIntelligenceState =
  | 'no_solutions'
  | 'no_eval'
  | 'eval_only'
  | 'rated_and_evaluated';

export interface CommunityCardIntelligenceProps {
  state: CardIntelligenceState;
  // AI evaluation dimensions (0–10 each) — only present in eval_only / rated_and_evaluated
  aiScore: number | null;
  feasibility: number | null;
  effectiveness: number | null;
  scalability: number | null;
  costEfficiency: number | null;
  innovation: number | null;
  // Community star rating of the top solution — only present in rated_and_evaluated
  topSolutionAvgRating: number | null;
  topSolutionRatingCount: number;
}

// ── Star Row Helper ───────────────────────────────────────────────────────────

function StarRow({ average }: { average: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${average} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(average);
        const partial = !filled && star - 1 < average;
        return (
          <Star
            key={star}
            className={`h-3 w-3 ${
              filled
                ? 'fill-amber-400 text-amber-500'
                : partial
                  ? 'fill-amber-400/40 text-amber-500/40'
                  : 'text-muted-foreground/30'
            }`}
          />
        );
      })}
    </span>
  );
}

// ── Score Badge Color ─────────────────────────────────────────────────────────

function scoreColorClass(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25';
  return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25';
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CommunityCardIntelligence({
  state,
  aiScore,
  feasibility,
  effectiveness,
  scalability,
  costEfficiency,
  innovation,
  topSolutionAvgRating,
  topSolutionRatingCount,
}: CommunityCardIntelligenceProps) {

  // ── State A: No solutions at all ─────────────────────────────────────────
  if (state === 'no_solutions') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border/70 bg-muted/30">
        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground">No solutions yet</p>
          <p className="text-[9px] text-muted-foreground/70">Be the first to propose one</p>
        </div>
      </div>
    );
  }

  // ── State B: Solutions exist but no AI evaluation ─────────────────────────
  if (state === 'no_eval') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border/70 bg-muted/30">
        <Clock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground">Evaluation pending</p>
          <p className="text-[9px] text-muted-foreground/70">AI analysis not yet available</p>
        </div>
      </div>
    );
  }

  // ── States C & D: Have evaluation data ───────────────────────────────────
  // Both eval_only and rated_and_evaluated use the radar + AI score
  const hasRating = state === 'rated_and_evaluated' && topSolutionAvgRating !== null && topSolutionRatingCount > 0;

  const safeScore = aiScore ?? 0;
  const safeFeasibility = feasibility ?? 0;
  const safeEffectiveness = effectiveness ?? 0;
  const safeScalability = scalability ?? 0;
  const safeCostEfficiency = costEfficiency ?? 0;
  const safeInnovation = innovation ?? 0;

  return (
    <div className="flex items-start gap-3">
      {/* Left column: AI score + top solution rating */}
      <div className="flex-1 space-y-2 min-w-0">
        {/* AI Consensus */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Brain className="h-3 w-3 text-violet-500 dark:text-violet-400 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              AI Consensus
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`inline-flex items-center text-sm font-black font-mono px-2 py-0.5 rounded-md border ${scoreColorClass(safeScore)}`}
            >
              {safeScore}
              <span className="text-[9px] font-normal opacity-70 ml-0.5">/100</span>
            </span>
          </div>
        </div>

        {/* Top Solution Rating */}
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
            Top Solution
          </span>
          {hasRating ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <StarRow average={topSolutionAvgRating!} />
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
                {topSolutionAvgRating!.toFixed(1)}/5
              </span>
              <span className="text-[9px] text-muted-foreground">
                · {topSolutionRatingCount} {topSolutionRatingCount === 1 ? 'rating' : 'ratings'}
              </span>
            </div>
          ) : (
            <span className="text-[9px] text-muted-foreground italic">No ratings yet</span>
          )}
        </div>
      </div>

      {/* Right column: Pentagon Radar Chart */}
      <div
        className="shrink-0 w-[110px] h-[100px]"
        aria-label="AI evaluation radar chart"
      >
        <PentagonRadarChart
          feasibility={safeFeasibility}
          effectiveness={safeEffectiveness}
          scalability={safeScalability}
          costEfficiency={safeCostEfficiency}
          innovation={safeInnovation}
          overallScore={safeScore}
        />
      </div>
    </div>
  );
}
