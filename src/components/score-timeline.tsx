import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Evaluation {
  id: string;
  overallScore: number;
  createdAt: Date;
  feedback?: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
  } | null;
}

interface ScoreTimelineProps {
  history: Evaluation[];
  activeEvalId: string;
  tab?: string;
}

// ── Pure SVG Sparkline ─────────────────────────────────────────────────────────
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;

  const W = 280;
  const H = 52;
  const PAD = 6;

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores.map((s, i) => {
    const x = PAD + (i / (scores.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((s - min) / range) * (H - PAD * 2);
    return { x, y, score: s };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${H} L ${points[0].x.toFixed(1)} ${H} Z`;

  const isUp = scores[scores.length - 1] >= scores[0];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isUp ? '#8b5cf6' : '#f87171'} stopOpacity="0.2" />
          <stop offset="100%" stopColor={isUp ? '#8b5cf6' : '#f87171'} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaD} fill="url(#sparkGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke={isUp ? '#8b5cf6' : '#f87171'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4 : 2.5}
          fill={i === points.length - 1 ? (isUp ? '#a78bfa' : '#f87171') : '#3f3f46'}
          stroke={i === points.length - 1 ? (isUp ? '#7c3aed' : '#dc2626') : 'none'}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

// ── Score badge ────────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : score >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  return (
    <span className={cn('text-sm font-black font-mono px-2.5 py-0.5 rounded-lg border', color)}>
      {score}
    </span>
  );
}

// ── Delta chip ─────────────────────────────────────────────────────────────────
function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-[10px] text-zinc-600 font-mono">baseline</span>;
  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-zinc-500 font-mono">
      <Minus className="h-2.5 w-2.5" />0
    </span>
  );
  const up = delta > 0;
  return (
    <span className={cn(
      'flex items-center gap-0.5 text-[10px] font-mono font-bold',
      up ? 'text-emerald-400' : 'text-rose-400'
    )}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? '+' : ''}{delta}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ScoreTimeline({ history, activeEvalId, tab }: ScoreTimelineProps) {
  // history is newest-first; reverse for chronological order in chart
  const chronological = [...history].reverse();
  const scores = chronological.map(e => e.overallScore);

  const latestScore = chronological[chronological.length - 1]?.overallScore ?? 0;
  const firstScore = chronological[0]?.overallScore ?? 0;
  const totalDelta = latestScore - firstScore;

  return (
    <div className="space-y-4">
      {/* Sparkline header */}
      {history.length >= 2 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Score Trend</span>
            <DeltaChip delta={totalDelta} />
          </div>
          <Sparkline scores={scores} />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Earliest</span>
            <span>{history.length} evaluations</span>
            <span>Latest</span>
          </div>
        </div>
      )}

      {/* Timeline list — newest first */}
      <div className="relative">
        {/* Vertical line */}
        {history.length > 1 && (
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-zinc-800" />
        )}

        <div className="space-y-2">
          {history.map((ev, i) => {
            const prevScore = history[i + 1]?.overallScore ?? null; // i+1 because history is newest-first
            const delta = prevScore !== null ? ev.overallScore - prevScore : null;
            const isActive = ev.id === activeEvalId;
            const date = new Date(ev.createdAt);

            return (
              <Link
                key={ev.id}
                href={`?evalId=${ev.id}${tab ? `&tab=${tab}` : ''}`}
                scroll={false}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 group',
                  isActive
                    ? 'border-violet-500/40 bg-violet-500/8'
                    : 'border-zinc-800/60 bg-zinc-950/30 hover:border-zinc-700 hover:bg-zinc-900/40'
                )}
              >
                {/* Dot on timeline */}
                <div className={cn(
                  'h-5 w-5 rounded-full border-2 flex-shrink-0 mt-0.5 z-10',
                  isActive ? 'border-violet-500 bg-violet-500' : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500'
                )} />

                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={ev.overallScore} />
                      <DeltaChip delta={delta} />
                      {i === 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <Calendar className="h-2.5 w-2.5" />
                    <span className="font-mono">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {ev.feedback?.summary && (
                    <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2 mt-1">
                      {ev.feedback.summary}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
