'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PenLine, Cpu, FileSearch, Globe,
  ArrowRight, Sparkles, CheckCircle2, TrendingUp, Users,
} from 'lucide-react';

// ── Step data ──────────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    icon: PenLine,
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    numberColor: 'text-violet-500',
    borderColor: 'border-violet-500/30',
    glowColor: 'bg-violet-500/8',
    connectorColor: 'from-violet-500/40 to-indigo-500/40',
    title: 'Describe Your Idea',
    subtitle: 'Submit Problem + Solution',
    description:
      'Tell us what problem you\'re solving and how. Use Guided Mode for structured questions, or Manual Mode to write freely.',
    bullets: ['Problem description', 'Your proposed solution', 'Domain & industry tags'],
  },
  {
    number: '02',
    icon: Cpu,
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
    numberColor: 'text-indigo-500',
    borderColor: 'border-indigo-500/30',
    glowColor: 'bg-indigo-500/8',
    connectorColor: 'from-indigo-500/40 to-cyan-500/40',
    title: 'AI Evaluates It',
    subtitle: '3 Models, 5 Dimensions',
    description:
      '3 independent AI models score your idea across Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation — simultaneously.',
    bullets: ['Multi-model consensus', 'Radar chart scoring', 'Strengths & weaknesses'],
  },
  {
    number: '03',
    icon: FileSearch,
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    numberColor: 'text-cyan-500',
    borderColor: 'border-cyan-500/30',
    glowColor: 'bg-cyan-500/8',
    connectorColor: 'from-cyan-500/40 to-emerald-500/40',
    title: 'Get Deep Report',
    subtitle: '10-Section Analysis',
    description:
      'Unlock a comprehensive 10-section report covering market sizing, competitive landscape, business model, go-to-market, and a final verdict.',
    bullets: ['TAM / SAM / SOM sizing', 'Competitor analysis', 'Regulatory & team risk'],
  },
  {
    number: '04',
    icon: Globe,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    numberColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/30',
    glowColor: 'bg-emerald-500/8',
    connectorColor: '',
    title: 'Share & Get Votes',
    subtitle: 'Community Board',
    description:
      'Make your idea public. Other builders upvote, comment, and suggest pivots. The best ideas rise to the top.',
    bullets: ['Public community board', 'Upvotes & comments', 'Collaborate with builders'],
  },
];

// ── Step card ──────────────────────────────────────────────────────────────────
function StepCard({ step, index, isVisible }: {
  step: typeof STEPS[0];
  index: number;
  isVisible: boolean;
}) {
  const Icon = step.icon;
  const delay = index * 120;

  return (
    <div
      className={`relative flex-1 min-w-0 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Card */}
      <div
        className={`group relative h-full rounded-2xl border ${step.borderColor} bg-card/90 dark:bg-zinc-950/70 p-5 backdrop-blur-sm
          hover:bg-card dark:hover:bg-zinc-900/80 hover:scale-[1.02] shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden`}
      >
        {/* Ambient glow */}
        <div className={`absolute top-0 right-0 w-28 h-28 ${step.glowColor} rounded-full filter blur-2xl pointer-events-none group-hover:opacity-150 transition-opacity`} />

        {/* Step number */}
        <div className={`text-[10px] font-black tracking-[0.2em] ${step.numberColor} mb-3 opacity-80`}>
          STEP {step.number}
        </div>

        {/* Icon */}
        <div className={`h-10 w-10 rounded-xl ${step.iconBg} border ${step.borderColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${step.iconColor}`} />
        </div>

        {/* Text */}
        <div className="relative space-y-1 mb-4">
          <h3 className="text-base font-bold text-foreground leading-tight">{step.title}</h3>
          <p className={`text-[11px] font-semibold ${step.iconColor} opacity-90`}>{step.subtitle}</p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

        {/* Bullet list */}
        <ul className="space-y-1.5">
          {step.bullets.map((b) => (
            <li key={b} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <CheckCircle2 className={`h-3 w-3 ${step.iconColor} flex-shrink-0`} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Horizontal connector arrow (desktop only, not after last) */}
      {index < STEPS.length - 1 && (
        <div className="hidden lg:flex absolute top-[72px] -right-5 z-10 items-center">
          <div className={`h-px w-10 bg-gradient-to-r ${step.connectorColor}`} />
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 -ml-1 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

// ── Stats strip ────────────────────────────────────────────────────────────────
const STATS = [
  { icon: Cpu,      value: '3',   label: 'AI Models' },
  { icon: TrendingUp, value: '5', label: 'Score Dimensions' },
  { icon: FileSearch, value: '10', label: 'Report Sections' },
  { icon: Users,    value: '∞',   label: 'Community Ideas' },
];

// ── Main export ────────────────────────────────────────────────────────────────
export function JourneySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animation when section scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="border-t border-border bg-muted/20 dark:bg-zinc-950/30 py-20 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 dark:bg-violet-950/40 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-4">
            <Sparkles className="h-3 w-3" />
            How It Works
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            From Idea to{' '}
            <span className="gradient-heading">
              Validated Report
            </span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Four steps. No fluff. You get an honest AI evaluation, a deep strategic report, and real feedback from other builders.
          </p>
        </div>

        {/* Steps grid */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-3 mb-16">
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} isVisible={isVisible} />
          ))}
        </div>

        {/* Stats strip */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '500ms' }}
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border/80 dark:border-zinc-900 bg-card dark:bg-zinc-950/50 group hover:border-primary/40 dark:hover:border-zinc-800 shadow-xs hover:shadow-sm transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
              <span className="text-2xl font-black text-foreground">{value}</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
