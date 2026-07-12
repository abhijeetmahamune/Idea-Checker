import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Lightbulb, DollarSign,
  Zap, Scale, HeartCrack, ChevronRight, Cpu, BarChart3, Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PivotSuggestions } from '@/components/pivot-suggestions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawModelResponse {
  model: string;
  response: {
    feasibility: number;
    effectiveness: number;
    scalability: number;
    costEfficiency: number;
    innovation: number;
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

interface EvaluationViewProps {
  problem: {
    title: string;
    description: string;
    tags?: string[] | null;
  };
  solution: {
    content: string;
    createdAt: Date;
  };
  evaluation: {
    feasibility: number;
    effectiveness: number;
    scalability: number;
    costEfficiency: number;
    innovation: number;
    overallScore: number;
    feedback: {
      strengths: string[];
      weaknesses: string[];
      summary: string;
    };
    successfulModels: string[];
    failedModels: string[];
    createdAt: Date;
    rawResponses?: RawModelResponse[] | null;
  };
  showRegisterCta?: boolean;
  pivotSuggestions?: {
    title: string;
    description: string;
    rationale: string;
    estimatedScoreLift: string;
  }[] | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getModelMeta(modelId: string) {
  const id = modelId.toLowerCase();
  if (id.includes('llama'))
    return { label: 'Llama 3.3 70B', provider: 'Meta', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500' };
  if (id.includes('gemini') || id.includes('flash'))
    return { label: 'Gemini 1.5 Flash', provider: 'Google', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' };
  if (id.includes('claude') || id.includes('haiku'))
    return { label: 'Claude 3 Haiku', provider: 'Anthropic', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500' };
  return { label: modelId, provider: 'Unknown', color: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' };
}

const DIMENSION_KEYS = ['feasibility', 'effectiveness', 'scalability', 'costEfficiency', 'innovation'] as const;
const DIMENSION_LABELS: Record<typeof DIMENSION_KEYS[number], string> = {
  feasibility: 'Feasibility',
  effectiveness: 'Effectiveness',
  scalability: 'Scalability',
  costEfficiency: 'Cost Eff.',
  innovation: 'Innovation',
};

// ── Pentagon Radar Chart ──────────────────────────────────────────────────────

interface PentagonProps {
  feasibility: number;
  effectiveness: number;
  scalability: number;
  costEfficiency: number;
  innovation: number;
  overallScore: number;
}

function PentagonRadarChart({ feasibility, effectiveness, scalability, costEfficiency, innovation, overallScore }: PentagonProps) {
  // Geometry constants
  const cx = 150;   // center X
  const cy = 135;   // center Y (slightly above middle for label room at bottom)
  const maxR = 80;  // outer pentagon radius
  const labelR = maxR + 24; // label orbit radius

  const dims = [
    { label: 'Feasibility',  shortLabel: 'Feasibility',  score: feasibility },
    { label: 'Effectiveness',shortLabel: 'Effectiveness', score: effectiveness },
    { label: 'Scalability',  shortLabel: 'Scalability',   score: scalability },
    { label: 'Cost Eff.',    shortLabel: 'Cost Eff.',     score: costEfficiency },
    { label: 'Innovation',   shortLabel: 'Innovation',    score: innovation },
  ];

  const n = 5;
  const step = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // top = 12 o'clock

  /** Cartesian point on circle of radius r at index i */
  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(startAngle + i * step),
    y: cy + r * Math.sin(startAngle + i * step),
  });

  /** SVG polygon points string for a grid ring */
  const ringPts = (fraction: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = pt(i, fraction * maxR);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(' ');

  /** Data polygon points based on actual scores */
  const dataPts = dims
    .map((d, i) => {
      const p = pt(i, (d.score / 10) * maxR);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(' ');

  const color = overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#f43f5e';
  const colorFill = overallScore >= 80 ? '#10b98122' : overallScore >= 60 ? '#f59e0b22' : '#f43f5e22';
  const centerLabel = overallScore >= 80 ? 'Promising' : overallScore >= 60 ? 'Viable' : 'At Risk';

  // Grid level labels (2, 4, 6, 8, 10)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  // Put level numbers on the right axis (index 1 = top-right direction)
  const labelAxis = 1;

  return (
    <svg
      viewBox="0 0 300 280"
      className="w-full h-full"
      style={{ overflow: 'visible' }}
      aria-label="Pentagon radar chart showing 5 evaluation dimensions"
    >
      {/* ── Grid rings ── */}
      {gridLevels.map((f, i) => (
        <polygon
          key={i}
          points={ringPts(f)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={f === 1.0 ? 0.30 : 0.13}
          strokeWidth={f === 1.0 ? 1.5 : 0.75}
          className="text-muted-foreground"
        />
      ))}

      {/* ── Grid level numbers on right-axis ── */}
      {gridLevels.map((f, i) => {
        const p = pt(labelAxis, f * maxR);
        return (
          <text
            key={i}
            x={(p.x + 3).toFixed(1)}
            y={(p.y + 1).toFixed(1)}
            fontSize="6"
            fill="currentColor"
            className="text-muted-foreground"
            opacity={0.5}
          >
            {Math.round(f * 10)}
          </text>
        );
      })}

      {/* ── Axis spokes ── */}
      {dims.map((_, i) => {
        const outer = pt(i, maxR);
        return (
          <line
            key={i}
            x1={cx.toFixed(2)} y1={cy.toFixed(2)}
            x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
            stroke="currentColor"
            strokeOpacity={0.20}
            strokeWidth={0.75}
            className="text-muted-foreground"
          />
        );
      })}

      {/* ── Data filled area ── */}
      <polygon
        points={dataPts}
        fill={colorFill}
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />

      {/* ── Data point dots ── */}
      {dims.map((d, i) => {
        const p = pt(i, (d.score / 10) * maxR);
        return (
          <circle key={i} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={3.8} fill={color} />
        );
      })}

      {/* ── Center: IC Score ── */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize="22"
        fontWeight="900"
        fill={color}
      >
        {overallScore}
      </text>
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontSize="6"
        fontWeight="700"
        letterSpacing="1.2"
        fill="currentColor"
        className="text-muted-foreground"
        opacity={0.7}
      >
        IC SCORE
      </text>
      <text
        x={cx}
        y={cy + 17}
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="600"
        fill={color}
        opacity={0.85}
      >
        {centerLabel}
      </text>

      {/* ── Vertex labels (dimension name + score) ── */}
      {dims.map((d, i) => {
        const lp = pt(i, labelR);
        // Text anchor based on horizontal position relative to center
        let anchor: 'middle' | 'start' | 'end' = 'middle';
        if (lp.x < cx - 12) anchor = 'end';
        else if (lp.x > cx + 12) anchor = 'start';

        // Vertical offset: push label up for top vertex, down for bottom
        const dy = lp.y < cy ? -2 : 2;

        return (
          <g key={i}>
            {/* Dimension name */}
            <text
              x={lp.x.toFixed(2)}
              y={(lp.y + dy - 5).toFixed(2)}
              textAnchor={anchor}
              fontSize="8"
              fontWeight="700"
              fill="currentColor"
              className="text-foreground"
            >
              {d.shortLabel}
            </text>
            {/* Score value */}
            <text
              x={lp.x.toFixed(2)}
              y={(lp.y + dy + 6).toFixed(2)}
              textAnchor={anchor}
              fontSize="7"
              fill="currentColor"
              className="text-muted-foreground"
              opacity={0.8}
            >
              {d.score}/10
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function EvaluationView({ problem, solution, evaluation, showRegisterCta = false, pivotSuggestions }: EvaluationViewProps) {

  const getScoreCardGlow = (score: number) =>
    score >= 80 ? 'border-emerald-500/30 shadow-emerald-500/10'
    : score >= 60 ? 'border-amber-500/30 shadow-amber-500/10'
    : 'border-rose-500/30 shadow-rose-500/10';

  const getScoreBadgeClass = (score: number) =>
    score >= 80 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    : score >= 60 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';

  const dimensions = [
    { name: 'Feasibility',     score: evaluation.feasibility,    icon: Zap,          color: 'bg-indigo-500',  desc: 'Is it technically and operationally viable?' },
    { name: 'Effectiveness',   score: evaluation.effectiveness,  icon: CheckCircle2, color: 'bg-emerald-500', desc: 'How well does it solve the core problem?' },
    { name: 'Scalability',     score: evaluation.scalability,    icon: Scale,         color: 'bg-blue-500',    desc: 'Can it scale to millions of users?' },
    { name: 'Cost Efficiency', score: evaluation.costEfficiency, icon: DollarSign,    color: 'bg-amber-500',   desc: 'Is it cost-effective to build and run?' },
    { name: 'Innovation',      score: evaluation.innovation,     icon: Lightbulb,     color: 'bg-violet-500',  desc: 'How creative and differentiated is it?' },
  ];

  const totalModels = evaluation.successfulModels.length + evaluation.failedModels.length;
  const successCount = evaluation.successfulModels.length;
  let trustLabel = 'Low Confidence';
  let trustClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
  if (successCount >= 3) { trustLabel = 'High Trust Consensus'; trustClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'; }
  else if (successCount === 2) { trustLabel = 'Medium Trust Consensus'; trustClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'; }

  const rawResponses = evaluation.rawResponses ?? [];

  const divergenceData = rawResponses.length >= 2
    ? DIMENSION_KEYS.map((key) => {
        const scores = rawResponses.map((r) => r.response[key]);
        return { key, label: DIMENSION_LABELS[key], spread: Math.max(...scores) - Math.min(...scores) };
      }).sort((a, b) => b.spread - a.spread)
    : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">

      {/* ── Row 1: Pentagon Radar + Context Card ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

        {/* Pentagon Radar Chart Card */}
        <Card className={`md:col-span-5 flex flex-col justify-between items-center text-center p-5 border bg-card shadow-xl relative overflow-hidden ${getScoreCardGlow(evaluation.overallScore)}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full filter blur-3xl pointer-events-none" />

          {/* Chart area */}
          <div className="w-full flex-1 min-h-[220px] flex items-center justify-center">
            <PentagonRadarChart
              feasibility={evaluation.feasibility}
              effectiveness={evaluation.effectiveness}
              scalability={evaluation.scalability}
              costEfficiency={evaluation.costEfficiency}
              innovation={evaluation.innovation}
              overallScore={evaluation.overallScore}
            />
          </div>

          {/* Trust badge + Mesh badge */}
          <div className="flex flex-col items-center gap-2 mt-2 w-full">
            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${trustClass}`}>
              {trustLabel} &middot; {successCount}/{totalModels} models
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 px-3 py-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              <MeshIcon className="h-3 w-3" />
              Powered by Mesh API
            </div>
          </div>
        </Card>

        {/* Problem & Solution Context Card */}
        <Card className="md:col-span-7 border-border bg-card p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {problem.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{problem.title}</h1>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider">Problem Context:</span>
                <p className="text-foreground/80 line-clamp-3 leading-relaxed mt-0.5">{problem.description}</p>
              </div>
              <div className="border-t border-border my-2" />
              <div>
                <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider">Proposed Solution:</span>
                <p className="text-foreground/80 line-clamp-3 leading-relaxed mt-0.5">{solution.content}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground font-mono">
            <span>Checked: {new Date(evaluation.createdAt).toLocaleDateString()}</span>
            <span>{solution.createdAt ? 'Registered' : 'Guest Evaluation'}</span>
          </div>
        </Card>
      </div>

      {/* ── Row 2: Dimension Bars + Strengths / Weaknesses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <Card className="lg:col-span-5 border-border bg-card shadow-xl p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-border">
            <CardTitle className="text-lg font-bold">Dimension Breakdown</CardTitle>
            <CardDescription>Averaged consensus score out of 10</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-5">
            {dimensions.map((dim, index) => {
              const Icon = dim.icon;
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {dim.name}
                    </span>
                    <span className="font-mono font-bold text-foreground">{dim.score} / 10</span>
                  </div>
                  <Progress value={dim.score * 10} className="h-2 bg-muted" indicatorClassName={dim.color} />
                  <p className="text-[11px] text-muted-foreground italic leading-tight">{dim.desc}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="lg:col-span-7 space-y-6">
          {/* Consensus Summary */}
          <Card className="border-border bg-card shadow-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full filter blur-2xl pointer-events-none" />
            <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <BrainCircuitIcon className="h-4 w-4 text-violet-500" />
              Consensus Summary
            </h3>
            <blockquote className="border-l-2 border-violet-500 pl-4 py-1 italic text-foreground/75 text-sm leading-relaxed">
              &ldquo;{evaluation.feedback.summary}&rdquo;
            </blockquote>
          </Card>

          {/* Strengths / Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Key Strengths
              </h3>
              <ul className="space-y-2.5">
                {evaluation.feedback.strengths.map((str, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
                {evaluation.feedback.strengths.length === 0 && (
                  <li className="text-xs text-muted-foreground italic">No significant strengths highlighted.</li>
                )}
              </ul>
            </Card>

            <Card className="border-rose-500/20 bg-rose-500/5 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                <HeartCrack className="h-4 w-4" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2.5">
                {evaluation.feedback.weaknesses.map((weak, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-2 leading-relaxed">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
                {evaluation.feedback.weaknesses.length === 0 && (
                  <li className="text-xs text-muted-foreground italic">No critical weaknesses identified.</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Row 3: Mesh Multi-Model Breakdown ── */}
      {rawResponses.length > 0 && (
        <Card className="border-violet-500/20 bg-card shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 p-1.5 text-white shadow-sm">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Multi-Model Breakdown</h3>
                <p className="text-xs text-muted-foreground">{rawResponses.length} AI models evaluated simultaneously via Mesh API</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 px-3 py-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              <MeshIcon className="h-3 w-3" />
              Mesh API
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Per-model cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rawResponses.map((raw, i) => {
                const meta = getModelMeta(raw.model);
                const avg = Math.round(
                  ((raw.response.feasibility + raw.response.effectiveness + raw.response.scalability +
                    raw.response.costEfficiency + raw.response.innovation) / 5) * 10
                );
                return (
                  <div key={i} className={`rounded-xl border p-4 space-y-3 ${meta.color}`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{meta.label}</p>
                        <p className="text-[10px] opacity-70">{meta.provider}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <span className="text-lg font-black">{avg}</span>
                        <span className="text-[10px] opacity-60">/100</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {DIMENSION_KEYS.map((key) => (
                        <div key={key} className="space-y-0.5">
                          <div className="text-xs font-bold">{raw.response[key]}</div>
                          <div className="text-[8px] opacity-60 leading-tight">{DIMENSION_LABELS[key].slice(0, 4)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] opacity-60">
                      <Activity className="h-2.5 w-2.5" />
                      {raw.latencyMs ? `${(raw.latencyMs / 1000).toFixed(1)}s` : '—'}
                      {raw.promptTokens ? ` · ${raw.promptTokens + (raw.completionTokens ?? 0)} tokens` : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divergence spotlight */}
            {divergenceData.length > 0 && divergenceData[0].spread >= 2 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Model Disagreement Spotlight
                </h4>
                <div className="flex flex-wrap gap-2">
                  {divergenceData.filter(d => d.spread >= 2).map(({ label, spread }) => (
                    <span key={label} className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5 text-amber-700 dark:text-amber-400 font-medium">
                      {label} <span className="opacity-60">±{spread} pts</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Models scored these dimensions differently. The pentagon chart shows the consensus average — review each model&apos;s card above for full transparency.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Row 4: Model Audit Trail ── */}
      <Card className="border-border bg-muted/30 p-4 text-xs text-muted-foreground shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div>
            <span className="font-semibold block text-foreground/60 uppercase tracking-wider text-[10px] mb-1">
              Evaluating Models (via Mesh API):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {evaluation.successfulModels.map((m, i) => (
                <Badge key={i} className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                  ✓ {m}
                </Badge>
              ))}
            </div>
          </div>
          {evaluation.failedModels.length > 0 && (
            <div>
              <span className="font-semibold block text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px] mb-1">Failed / Timed-Out:</span>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.failedModels.map((m, i) => (
                  <Badge key={i} className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-[10px]">
                    ✗ {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Register CTA (guests) ── */}
      {showRegisterCta && (
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-transparent p-8 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
          <h2 className="text-xl font-bold text-foreground mb-2">Save your ideas and compare evaluations</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-6">
            Register a free account to unlock your personal dashboard, track multiple solutions side-by-side, view histories, and invite collaborative inputs.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md">
                Create Free Account
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ── Pivot Suggestions ── */}
      {pivotSuggestions && pivotSuggestions.length > 0 && evaluation.overallScore < 60 && (
        <PivotSuggestions pivots={pivotSuggestions} currentScore={evaluation.overallScore} />
      )}
    </div>
  );
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────

function BrainCircuitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5V3M12 21v-2M19 12h2M3 12h2M19.778 4.222l-1.414 1.414M5.636 18.364l-1.414 1.414M18.364 18.364l1.414 1.414M4.222 4.222l1.414 1.414" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MeshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
      <line x1="7" y1="12" x2="10" y2="12" />
      <line x1="14" y1="12" x2="17" y2="12" />
      <line x1="12" y1="7" x2="12" y2="10" />
      <line x1="12" y1="14" x2="12" y2="17" />
    </svg>
  );
}
