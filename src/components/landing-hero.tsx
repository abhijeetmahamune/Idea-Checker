'use client';

import { useState } from 'react';
import { QuickEvalForm } from '@/components/quick-eval-form';
import { GuidedEvalForm } from '@/components/guided-eval-form';
import { JourneySection } from '@/components/journey-section';
import {
  Sparkles,
  ListChecks,
  PenLine,
  Cpu,
  Eye,
  ShieldAlert,
  TrendingUp,
  Zap,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

type Mode = 'choose' | 'guided' | 'unguided';

// Feature items for the feature strip
const FEATURES = [
  {
    icon: Cpu,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    title: 'Multi-Model Consensus',
    desc: 'Llama 3, Gemma 2, and Qwen 2 evaluated in parallel. Results averaged to eliminate single-model bias.',
  },
  {
    icon: Zap,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-400',
    title: 'Nemetron Fallback Engine',
    desc: 'If any OpenRouter model fails, Nvidia Nemetron 120B steps in automatically via OpenRouter. Zero downtime.',
  },
  {
    icon: Eye,
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    title: '5-Dimension Scoring',
    desc: 'Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation — all scored separately.',
  },
  {
    icon: ShieldAlert,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    title: 'Strength & Weakness Report',
    desc: 'Specific, actionable strengths and weaknesses — not generic advice.',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    title: 'Pivot Suggestions',
    desc: 'Score below 60? Get 3 strategic pivot directions automatically generated.',
  },
  {
    icon: MessageSquare,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    title: "Devil's Advocate Mode",
    desc: 'Hear the harshest critique of your idea from a skeptical VC persona.',
  },
];

const GUIDED_BULLETS = [
  'Domain-specific questions',
  'Structured solution building',
  'Deeper AI context',
  'Best for first-timers',
];

const MANUAL_BULLETS = [
  'Free-form writing',
  'Quick submission',
  'Total creative control',
  'Best if you know what to write',
];

export function LandingHero() {
  const [mode, setMode] = useState<Mode>('choose');

  return (
    <>
      {/* ── Ambient background glows ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-violet-500/10 dark:bg-violet-900/15 filter blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 dark:bg-indigo-900/15 filter blur-[140px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-cyan-500/10 dark:bg-cyan-900/10 filter blur-[100px]" />
      </div>

      {/* ── Hero section ── */}
      <section className="flex-grow flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 dark:bg-violet-950/40 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-300 backdrop-blur-sm shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Validate Before You Build. Ship What Survives.</span>
            </div>
          </div>

          {/* ── Mode selector + form area ── */}
          <div className="max-w-2xl mx-auto mb-12">

            {/* CHOOSE MODE */}
            {mode === 'choose' && (
              <div className="space-y-4">
                <p className="text-center text-[11px] text-muted-foreground uppercase tracking-widest font-bold mb-6">
                  How would you like to evaluate your idea?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Guided */}
                  <button
                    onClick={() => setMode('guided')}
                    className="group relative text-left p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-card/80 dark:bg-zinc-950/60 hover:border-violet-500/50 hover:bg-card dark:hover:bg-zinc-900/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden backdrop-blur-sm cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none group-hover:bg-violet-600/10 transition-colors" />
                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                          <ListChecks className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
                          Recommended
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors mb-1">
                          Guided Mode
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Answer structured questions tailored to your domain. We build a complete evaluation from your answers.
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {GUIDED_BULLETS.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-violet-500/70 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors pt-1">
                        Start guided evaluation
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                      </div>
                    </div>
                  </button>

                  {/* Manual */}
                  <button
                    onClick={() => setMode('unguided')}
                    className="group relative text-left p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-card/80 dark:bg-zinc-950/60 hover:border-border dark:hover:border-zinc-600/60 hover:bg-card dark:hover:bg-zinc-900/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden backdrop-blur-sm cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
                    <div className="relative space-y-4">
                      <div className="h-11 w-11 rounded-xl bg-muted dark:bg-zinc-800 border border-border dark:border-zinc-700 flex items-center justify-center group-hover:bg-muted/80 dark:group-hover:bg-zinc-700 transition-colors">
                        <PenLine className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                          Manual Mode
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Write your problem and solution in your own words, directly in free-form text fields.
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {MANUAL_BULLETS.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors pt-1">
                        Start manual evaluation
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                      </div>
                    </div>
                  </button>
                </div>

                <p className="text-center text-[11px] text-muted-foreground pt-2">
                  No account required to try ·{' '}
                  <Link href="/register" className="text-violet-600 dark:text-violet-400 hover:underline transition-colors">
                    Create free account
                  </Link>{' '}
                  to save reports
                </p>
              </div>
            )}

            {/* GUIDED FORM */}
            {mode === 'guided' && (
              <div className="rounded-2xl border border-border dark:border-zinc-800 bg-card/90 dark:bg-zinc-950/70 backdrop-blur-sm p-6 shadow-xl dark:shadow-2xl shadow-violet-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 rounded-full filter blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <div className="relative">
                  <GuidedEvalForm onCancel={() => setMode('choose')} />
                </div>
              </div>
            )}

            {/* MANUAL FORM */}
            {mode === 'unguided' && (
              <div className="space-y-3">
                <button
                  onClick={() => setMode('choose')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  ← Choose a different mode
                </button>
                <QuickEvalForm />
              </div>
            )}
          </div>

          {/* Headline */}
          <div className="text-center space-y-4 mb-6">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-foreground">
              Stop Guessing.{' '}
              <span className="gradient-heading">
                Start Validating.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get an unbiased AI evaluation of your startup idea — scored across 5 dimensions by 3 independent models simultaneously.
            </p>
          </div>

          {/* Auth links */}
          <div className="flex justify-center gap-3 text-sm">
            <Link href="/register" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors font-medium">
              Create free account →
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Journey section (only on choose screen) ── */}
      {mode === 'choose' && (
        <JourneySection />
      )}

      {/* ── Compact feature strip ── */}
      {mode === 'choose' && (
        <section className="border-t border-border bg-muted/40 dark:bg-black/60 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8">
              Also included with every evaluation
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {FEATURES.map(({ icon: Icon, iconColor, title }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border/80 dark:border-zinc-900 bg-card dark:bg-zinc-950 p-4 flex flex-col items-center gap-2 text-center group hover:border-primary/40 dark:hover:border-zinc-800 hover:scale-[1.03] shadow-xs hover:shadow-sm transition-all duration-200"
                >
                  <Icon className={`h-4 w-4 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
                  <span className="text-[10px] font-semibold text-muted-foreground leading-tight group-hover:text-foreground transition-colors">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
