'use client';

import { useState } from 'react';
import { QuickEvalForm } from '@/components/quick-eval-form';
import { GuidedEvalForm } from '@/components/guided-eval-form';
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
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-violet-900/8 filter blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-indigo-900/8 filter blur-[140px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-cyan-900/5 filter blur-[100px]" />
      </div>

      {/* ── Hero section ── */}
      <section className="flex-grow flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-950/25 px-4 py-1.5 text-sm font-medium text-violet-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Startup Idea Validation</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center space-y-4 mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Stop Guessing.{' '}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Start Validating.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Get an unbiased AI evaluation of your startup idea — scored across 5 dimensions by 3 independent models simultaneously.
            </p>
          </div>

          {/* Auth links */}
          <div className="flex justify-center gap-3 mb-12 text-sm">
            <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Create free account →
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/login" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Sign in
            </Link>
          </div>

          {/* ── Mode selector + form area ── */}
          <div className="max-w-2xl mx-auto">

            {/* CHOOSE MODE */}
            {mode === 'choose' && (
              <div className="space-y-4">
                <p className="text-center text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-6">
                  How would you like to evaluate your idea?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Guided */}
                  <button
                    onClick={() => setMode('guided')}
                    className="group relative text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:border-violet-500/50 hover:bg-zinc-900/80 transition-all duration-200 overflow-hidden backdrop-blur-sm"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none group-hover:bg-violet-600/10 transition-colors" />
                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                          <ListChecks className="h-5 w-5 text-violet-400" />
                        </div>
                        <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
                          Recommended
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-violet-200 transition-colors mb-1">
                          Guided Mode
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Answer structured questions tailored to your domain. We build a complete evaluation from your answers.
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {GUIDED_BULLETS.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-violet-500/60 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-1 text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition-colors pt-1">
                        Start guided evaluation
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                      </div>
                    </div>
                  </button>

                  {/* Manual */}
                  <button
                    onClick={() => setMode('unguided')}
                    className="group relative text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-600/60 hover:bg-zinc-900/80 transition-all duration-200 overflow-hidden backdrop-blur-sm"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-600/3 rounded-full filter blur-2xl pointer-events-none group-hover:bg-zinc-500/5 transition-colors" />
                    <div className="relative space-y-4">
                      <div className="h-11 w-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                        <PenLine className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors mb-1">
                          Manual Mode
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Write your problem and solution in your own words, directly in free-form text fields.
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {MANUAL_BULLETS.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors pt-1">
                        Start manual evaluation
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                      </div>
                    </div>
                  </button>
                </div>

                <p className="text-center text-[11px] text-zinc-600 pt-2">
                  No account required to try ·{' '}
                  <Link href="/register" className="text-violet-500/70 hover:text-violet-400 transition-colors">
                    Create free account
                  </Link>{' '}
                  to save reports
                </p>
              </div>
            )}

            {/* GUIDED FORM */}
            {mode === 'guided' && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm p-6 shadow-2xl shadow-violet-950/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/4 rounded-full filter blur-3xl pointer-events-none" />
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
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← Choose a different mode
                </button>
                <QuickEvalForm />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Feature strip (only on choose screen) ── */}
      {mode === 'choose' && (
        <section className="border-t border-zinc-900/60 bg-zinc-950/30 py-16 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-10">
              What you get with every evaluation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 space-y-3 relative overflow-hidden group hover:border-zinc-800/80 transition-all duration-300"
                >
                  <div className={`rounded-lg p-2.5 w-fit ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
