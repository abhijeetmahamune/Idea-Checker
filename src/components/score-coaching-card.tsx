'use client';

import { useMemo } from 'react';
import { TrendingUp, Zap, CheckCircle2, Scale, DollarSign, Lightbulb, ArrowUpRight, Target } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DimensionScore {
  key: string;
  name: string;
  score: number;
  icon: React.ElementType;
  color: string;
  textColor: string;
}

interface ScoreCoachingCardProps {
  feasibility: number;
  effectiveness: number;
  scalability: number;
  costEfficiency: number;
  innovation: number;
  overallScore: number;
}

// ── Coaching tips per dimension ────────────────────────────────────────────────
const COACHING_TIPS: Record<string, { tip: string; action: string }> = {
  feasibility: {
    tip: 'Your idea may face technical or operational hurdles.',
    action: 'Break down your MVP into 3 concrete milestones. Show what can be built in 90 days with a team of 2.',
  },
  effectiveness: {
    tip: 'The solution doesn\'t fully address the core pain point.',
    action: 'Sharpen the problem statement. Who exactly suffers, and how does your solution eliminate that suffering specifically?',
  },
  scalability: {
    tip: 'Growth path to millions of users is unclear.',
    action: 'Define your scaling architecture. Does it work at 1K, 100K, and 10M users? What breaks first?',
  },
  costEfficiency: {
    tip: 'Unit economics and pricing model need definition.',
    action: 'Add CAC, LTV, and gross margin estimates. Even rough numbers build credibility with the AI.',
  },
  innovation: {
    tip: 'The differentiation from existing solutions is weak.',
    action: 'Name 3 competitors and explain what only your solution can do that they cannot replicate in 6 months.',
  },
};

// ── Score tier colours ─────────────────────────────────────────────────────────
function getPotentialBadgeClass(score: number) {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (score >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ScoreCoachingCard({
  feasibility, effectiveness, scalability, costEfficiency, innovation, overallScore,
}: ScoreCoachingCardProps) {

  const dimensions: DimensionScore[] = useMemo(() => [
    { key: 'feasibility',     name: 'Feasibility',     score: feasibility,    icon: Zap,        color: 'bg-indigo-500',  textColor: 'text-indigo-400' },
    { key: 'effectiveness',   name: 'Effectiveness',   score: effectiveness,  icon: CheckCircle2, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { key: 'scalability',     name: 'Scalability',     score: scalability,    icon: Scale,      color: 'bg-blue-500',    textColor: 'text-blue-400' },
    { key: 'costEfficiency',  name: 'Cost Efficiency', score: costEfficiency, icon: DollarSign, color: 'bg-amber-500',   textColor: 'text-amber-400' },
    { key: 'innovation',      name: 'Innovation',      score: innovation,     icon: Lightbulb,  color: 'bg-violet-500',  textColor: 'text-violet-400' },
  ], [feasibility, effectiveness, scalability, costEfficiency, innovation]);

  // Sort ascending — lowest scores first (most impactful to fix)
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const focusAreas = sorted.slice(0, 2); // Bottom 2

  // Potential score: if focus areas improved to 7.5/10
  const TARGET_SCORE = 7.5;
  const potentialOverall = Math.min(100, Math.round(
    ((feasibility + effectiveness + scalability + costEfficiency + innovation
      - focusAreas.reduce((s, d) => s + d.score, 0)
      + focusAreas.length * TARGET_SCORE) / 5) * 10
  ));

  const gainPoints = potentialOverall - overallScore;

  // Don't show if already high score or no gain possible
  if (overallScore >= 85 || gainPoints <= 2) return null;

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-indigo-500/10 p-6 relative overflow-hidden animate-fade-slide-up shadow-sm">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
            <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              Score Improvement Guide
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Fix these areas to unlock a stronger evaluation</p>
          </div>
        </div>

        {/* Score potential badge */}
        <div className="flex-shrink-0 text-right">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${getPotentialBadgeClass(potentialOverall)}`}>
            <ArrowUpRight className="h-3.5 w-3.5" />
            {overallScore} → {potentialOverall}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono">+{gainPoints} pts potential</p>
        </div>
      </div>

      {/* Focus area cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        {focusAreas.map((dim, i) => {
          const coaching = COACHING_TIPS[dim.key];
          const DimIcon = dim.icon;
          const dimGain = Math.round((TARGET_SCORE - dim.score) * 10 / 5);

          return (
            <div
              key={dim.key}
              className="rounded-xl border border-border bg-card/90 dark:bg-zinc-950/70 p-4 space-y-3 hover:border-primary/40 transition-colors shadow-xs animate-fade-slide-up"
              style={{ animationDelay: `${i * 100 + 150}ms` }}
            >
              {/* Dim header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DimIcon className={`h-4 w-4 ${dim.textColor}`} />
                  <span className="text-sm font-bold text-foreground">{dim.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black font-mono ${
                    dim.score <= 4 ? 'text-rose-600 dark:text-rose-400' : dim.score <= 6 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>{dim.score}/10</span>
                  <span className="text-[9px] text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5 font-semibold">
                    {dim.score <= 4 ? 'Critical' : 'Weak'}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${dim.color} transition-all duration-1000`}
                  style={{ width: `${(dim.score / 10) * 100}%` }}
                />
                {/* Target marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/30 rounded-full"
                  style={{ left: `${(TARGET_SCORE / 10) * 100}%` }}
                />
              </div>

              {/* Coaching tip */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground italic leading-relaxed">{coaching.tip}</p>
                <div className="flex items-start gap-1.5">
                  <ArrowUpRight className={`h-3 w-3 ${dim.textColor} flex-shrink-0 mt-0.5`} />
                  <p className="text-[11px] text-foreground leading-relaxed">{coaching.action}</p>
                </div>
              </div>

              {/* Potential gain */}
              <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPotentialBadgeClass(potentialOverall)}`}>
                <TrendingUp className="h-2.5 w-2.5" />
                ~+{dimGain} pts if improved
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-muted-foreground/80 text-center mt-4 relative">
        Potential score assumes focus areas improve to 7.5/10 · Resubmit with updated solution to verify
      </p>
    </div>
  );
}
