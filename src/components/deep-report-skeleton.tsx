'use client';

import { useEffect, useState } from 'react';

// ── Rotating status messages ───────────────────────────────────────────────────
const STATUS_MESSAGES = [
  { text: 'Running Consensus...', sub: 'Sending your idea to 3 AI models simultaneously' },
  { text: 'Comparing Models...', sub: 'Averaging scores to eliminate single-model bias' },
  { text: 'Finding Weaknesses...', sub: 'Pressure-testing every assumption in your idea' },
  { text: 'Checking Market...', sub: 'Estimating TAM, SAM and competitive landscape' },
  { text: 'Building Report...', sub: 'Assembling 10-section deep analysis report' },
  { text: 'Validating Business Model...', sub: 'Reviewing revenue model and unit economics' },
  { text: 'Assessing Tech Risk...', sub: 'Evaluating technical feasibility and complexity' },
  { text: 'Almost There...', sub: 'Finalising verdict and scoring your idea' },
];

// ── Skeleton shimmer row ───────────────────────────────────────────────────────
function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2.5">
          {/* Icon placeholder */}
          <div className="h-7 w-7 rounded-lg bg-muted skeleton-shimmer" />
          {/* Title placeholder */}
          <div className="h-4 rounded-md bg-muted skeleton-shimmer" style={{ width: `${100 + delay * 0.3}px` }} />
        </div>
        {/* Chevron placeholder */}
        <div className="h-4 w-4 rounded bg-muted/60 skeleton-shimmer" />
      </div>
    </div>
  );
}

// ── Main skeleton component ────────────────────────────────────────────────────
export function DeepReportSkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Cycle through status messages with a fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setMsgIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
        setVisible(true);
      }, 350); // wait for fade-out, then swap text
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const current = STATUS_MESSAGES[msgIndex];

  return (
    <div className="space-y-3">
      {/* ── Status message banner ── */}
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 dark:bg-violet-950/30 p-5 mb-6 relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-indigo-600/8 to-violet-600/5 animate-pulse" />

        <div className="relative flex flex-col items-center gap-3 text-center">
          {/* Spinning indicator */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500 dark:bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>

          {/* Rotating status text */}
          <div
            className="transition-all duration-300 ease-in-out"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-6px)' }}
          >
            <p className="text-base font-bold text-foreground tracking-tight">{current.text}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{current.sub}</p>
          </div>

          {/* Progress hint */}
          <p className="text-[10px] text-muted-foreground/80 font-mono">
            This usually takes 30–60 seconds · Please don&apos;t close this tab
          </p>
        </div>
      </div>

      {/* ── Skeleton section rows ── */}
      {/* Verdict banner skeleton */}
      <div className="rounded-xl border border-border bg-card/60 p-4 mb-2 flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-muted skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-muted skeleton-shimmer" />
          <div className="h-4 w-3/4 rounded bg-muted skeleton-shimmer" />
        </div>
      </div>

      {/* Section accordion skeletons */}
      <SkeletonRow delay={0} />
      <SkeletonRow delay={60} />
      <SkeletonRow delay={120} />
      <SkeletonRow delay={180} />
      <SkeletonRow delay={240} />
      <SkeletonRow delay={300} />
      <SkeletonRow delay={360} />
      <SkeletonRow delay={420} />
      <SkeletonRow delay={480} />
    </div>
  );
}
