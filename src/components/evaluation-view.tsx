import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, AlertTriangle, Lightbulb, TrendingUp, DollarSign,
  Zap, Scale, HeartCrack, ChevronRight, Cpu, BarChart3, Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PivotSuggestions } from '@/components/pivot-suggestions';

// Per-model raw response shape stored in DB
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

// Human-readable model labels and provider colours
function getModelMeta(modelId: string): { label: string; provider: string; color: string; dot: string } {
  const id = modelId.toLowerCase();
  if (id.includes('llama')) return { label: 'Llama 3.3 70B', provider: 'Meta', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500' };
  if (id.includes('gemini') || id.includes('flash')) return { label: 'Gemini 1.5 Flash', provider: 'Google', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' };
  if (id.includes('claude') || id.includes('haiku')) return { label: 'Claude 3 Haiku', provider: 'Anthropic', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500' };
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

export function EvaluationView({ problem, solution, evaluation, showRegisterCta = false, pivotSuggestions }: EvaluationViewProps) {

  const getScoreRing = (score: number) => {
    if (score >= 80) return 'border-emerald-500 text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'border-amber-500 text-amber-600 dark:text-amber-400';
    return 'border-rose-500 text-rose-600 dark:text-rose-400';
  };

  const getScoreCardGlow = (score: number) => {
    if (score >= 80) return 'shadow-emerald-500/10 dark:shadow-emerald-500/10';
    if (score >= 60) return 'shadow-amber-500/10 dark:shadow-amber-500/10';
    return 'shadow-rose-500/10 dark:shadow-rose-500/10';
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
  };

  const dimensions = [
    { name: 'Feasibility',     score: evaluation.feasibility,    icon: Zap,         color: 'bg-indigo-500',  desc: 'Is it technically and operationally viable?' },
    { name: 'Effectiveness',   score: evaluation.effectiveness,  icon: CheckCircle2, color: 'bg-emerald-500', desc: 'How well does it solve the core problem?' },
    { name: 'Scalability',     score: evaluation.scalability,    icon: Scale,        color: 'bg-blue-500',    desc: 'Can it scale to millions of users?' },
    { name: 'Cost Efficiency', score: evaluation.costEfficiency, icon: DollarSign,   color: 'bg-amber-500',   desc: 'Is it cost-effective to build and run?' },
    { name: 'Innovation',      score: evaluation.innovation,     icon: Lightbulb,    color: 'bg-violet-500',  desc: 'How creative and differentiated is it?' },
  ];

  const totalModels = evaluation.successfulModels.length + evaluation.failedModels.length;
  const successCount = evaluation.successfulModels.length;
  let trustLabel = 'Low Confidence';
  let trustClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
  if (successCount >= 3) {
    trustLabel = 'High Trust Consensus';
    trustClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
  } else if (successCount === 2) {
    trustLabel = 'Medium Trust Consensus';
    trustClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
  }

  const rawResponses = evaluation.rawResponses ?? [];

  // Find max divergence across dimensions
  const divergenceData = rawResponses.length >= 2
    ? DIMENSION_KEYS.map((key) => {
        const scores = rawResponses.map((r) => r.response[key]);
        const max = Math.max(...scores);
        const min = Math.min(...scores);
        return { key, label: DIMENSION_LABELS[key], spread: max - min };
      }).sort((a, b) => b.spread - a.spread)
    : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">

      {/* ── Row 1: Score Ring + Context Card ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

        {/* Score Ring */}
        <Card className={`md:col-span-4 flex flex-col justify-center items-center text-center p-6 border bg-card shadow-xl relative overflow-hidden ${getScoreCardGlow(evaluation.overallScore)}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full filter blur-2xl pointer-events-none" />

          <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${getScoreRing(evaluation.overallScore)} shadow-md`}>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black tracking-tight text-foreground">{evaluation.overallScore}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">IC Score</span>
            </div>
          </div>

          <div className="mt-5 space-y-2 w-full">
            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${trustClass}`}>
              {trustLabel} ({successCount}/{totalModels} models)
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              Averaged across {successCount} AI model{successCount !== 1 ? 's' : ''} in parallel via Mesh API.
            </p>
          </div>

          {/* Mesh API badge */}
          <div className="mt-4 flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 px-3 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-400">
            <MeshIcon className="h-3 w-3" />
            Powered by Mesh API
          </div>
        </Card>

        {/* Problem & Solution Context */}
        <Card className="md:col-span-8 border-border bg-card p-6 flex flex-col justify-between shadow-xl">
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

      {/* ── Row 2: Dimensions + Strengths/Weaknesses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Dimension Bars */}
        <Card className="lg:col-span-5 border-border bg-card shadow-xl p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-border">
            <CardTitle className="text-lg font-bold">Dimension Breakdown</CardTitle>
            <CardDescription>Scored individually out of 10</CardDescription>
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

        {/* Consensus Summary + S&W */}
        <div className="lg:col-span-7 space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Strengths */}
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

            {/* Weaknesses */}
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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 p-1.5 text-white shadow-sm">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Multi-Model Breakdown</h3>
                <p className="text-xs text-muted-foreground">{rawResponses.length} AI models evaluated this idea simultaneously via Mesh API</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 px-3 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-400">
              <MeshIcon className="h-3 w-3" />
              Mesh API
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Per-model score grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rawResponses.map((raw, i) => {
                const meta = getModelMeta(raw.model);
                const avg = Math.round(
                  ((raw.response.feasibility + raw.response.effectiveness + raw.response.scalability +
                    raw.response.costEfficiency + raw.response.innovation) / 5) * 10
                );
                return (
                  <div key={i} className={`rounded-xl border p-4 space-y-3 ${meta.color}`}>
                    {/* Model header */}
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

                    {/* Mini dimension scores */}
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {DIMENSION_KEYS.map((key) => (
                        <div key={key} className="space-y-0.5">
                          <div className="text-xs font-bold">{raw.response[key]}</div>
                          <div className="text-[8px] opacity-60 leading-tight">{DIMENSION_LABELS[key].slice(0, 4)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Latency */}
                    <div className="flex items-center gap-1 text-[10px] opacity-60">
                      <Activity className="h-2.5 w-2.5" />
                      {raw.latencyMs ? `${(raw.latencyMs / 1000).toFixed(1)}s` : '—'}
                      {raw.promptTokens ? ` · ${raw.promptTokens + (raw.completionTokens ?? 0)} tokens` : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divergence highlight — where models disagreed most */}
            {divergenceData.length > 0 && divergenceData[0].spread >= 2 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Model Disagreement Spotlight
                </h4>
                <div className="flex flex-wrap gap-2">
                  {divergenceData.filter(d => d.spread >= 2).map(({ label, spread }) => (
                    <span key={label} className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5 text-amber-700 dark:text-amber-400 font-medium">
                      {label}
                      <span className="opacity-60">±{spread} pts spread</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Models gave notably different scores on the above dimensions. The consensus score averages all perspectives — review each model&apos;s rating above for full transparency.
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
              <span className="font-semibold block text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px] mb-1">Failed/Timed-Out:</span>
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
        <PivotSuggestions
          pivots={pivotSuggestions}
          currentScore={evaluation.overallScore}
        />
      )}
    </div>
  );
}

// ── Local SVG icons ────────────────────────────────────────────────────────────

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
